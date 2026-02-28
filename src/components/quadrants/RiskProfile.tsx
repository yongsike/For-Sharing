import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { generateRiskAnalysis, generateRiskSummary } from '../../lib/riskProfileAI';

interface RiskProfileProps {
    clientId?: string;
    client?: any;
    mode?: 'overview' | 'focused';
    dateRange?: { startDate: string; endDate: string };
    cache?: { overview?: string; focused?: any } | null;
    onCacheUpdate?: (update: { overview?: string; focused?: any }) => void;
}

const RISK_LEVEL_DESCRIPTIONS: Record<string, string> = {
    'Level 1': 'You seek to preserve capital and understand that potential investment returns, when adjusted for inflation, may be very low or even zero. You are willing to accept a very low volatility in your investment(s).',
    'Level 2': 'You seek small capital growth and understand that potential investment income and capital gains come with some short term fluctuations. You are willing to accept low volatility in your investment(s).',
    'Level 3': 'You seek moderate capital growth and understand that potential moderate investment returns over the medium term come with relatively higher risks. You are willing to accept medium volatility in your investment(s) over the short term.',
    'Level 4': 'You seek high capital gains and understand that potential higher investment returns over the long term come with relatively higher risks. You are willing to accept high volatility in your investment(s) over the short to medium term.'
};

const RiskLevelInfoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
            background: 'rgba(0,0,0,0.5)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
            backdropFilter: 'blur(4px)'
        }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                width: '100%', maxWidth: '600px', padding: '2.5rem',
                background: '#fff', borderRadius: '24px', boxShadow: 'var(--shadow-xl)',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', fontSize: '1.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                >&times;</button>

                <h2 style={{ fontSize: '1.5rem', color: 'var(--secondary)', marginBottom: '1.5rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>Risk Level Guide</h2>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {Object.entries(RISK_LEVEL_DESCRIPTIONS).map(([level, desc]) => (
                        <div key={level}>
                            <h4 style={{ color: 'var(--primary)', marginBottom: '6px', fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                {level}
                            </h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', lineHeight: '1.5', opacity: 0.85 }}>{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};

const RiskProfile: React.FC<RiskProfileProps> = ({
    client,
    mode = 'overview',
    dateRange,
    cache,
    onCacheUpdate
}) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<string>(cache?.overview || '');
    const [clientInfo, setClientInfo] = useState<{
        category: string;
        description: string;
        date: string;
    } | null>(null);

    const [isInfoModalOpen, setIsInfoModalOpen] = useState<boolean>(false);
    const [structuredAnalysis, setStructuredAnalysis] = useState<{
        "Key Insights": string;
        "Potential Risks": string;
        "Recommendations": string;
    } | null>(cache?.focused || null);

    useEffect(() => {
        if (!client) return;

        // Reset local states if cache is null (new client/leaves page)
        if (!cache) {
            setSummary('');
            setStructuredAnalysis(null);
        }

        const analyze = async () => {
            // 1. Check if already cached for this mode
            if (mode === 'overview' && cache?.overview) {
                setSummary(cache.overview);
                setClientInfo({
                    category: client.risk_profile || 'Level 2',
                    description: RISK_LEVEL_DESCRIPTIONS[client.risk_profile] || RISK_LEVEL_DESCRIPTIONS['Level 2'],
                    date: client.last_updated || new Date().toISOString()
                });
                return;
            }
            if (mode === 'focused' && cache?.focused) {
                setStructuredAnalysis(cache.focused);
                setClientInfo({
                    category: client.risk_profile || 'Level 2',
                    description: RISK_LEVEL_DESCRIPTIONS[client.risk_profile] || RISK_LEVEL_DESCRIPTIONS['Level 2'],
                    date: client.last_updated || new Date().toISOString()
                });
                return;
            }

            setLoading(true);
            setError(null);
            // Don't clear if potentially switching back? But analyze is called on mount/prop change.
            // If we are here, we need a new analysis.

            try {
                const category = client.risk_profile || 'Level 2';
                const description = RISK_LEVEL_DESCRIPTIONS[category] || RISK_LEVEL_DESCRIPTIONS['Level 2'];

                setClientInfo({
                    category,
                    description,
                    date: client.last_updated || new Date().toISOString()
                });

                // 2. Prepare parameters for AI (EXCLUSIVELY using database data)
                const allocationMap: Record<string, number> = {};
                let totalValue = 0;

                client.client_plans?.forEach((plan: any) => {
                    // Pick the correct valuation source
                    const isInsurance = plan.asset_class.includes('Insurance');
                    const valuations = isInsurance ? plan.insurance_valuations : plan.investment_valuations;
                    const valueKey = isInsurance ? 'cash_value' : 'market_value';

                    const latestVal = valuations?.sort((a: any, b: any) =>
                        new Date(b.as_of_date).getTime() - new Date(a.as_of_date).getTime()
                    )[0];

                    if (latestVal) {
                        const val = parseFloat(latestVal[valueKey]);
                        allocationMap[plan.asset_class] = (allocationMap[plan.asset_class] || 0) + val;
                        totalValue += val;
                    }
                });

                const allocationString = totalValue > 0
                    ? Object.entries(allocationMap)
                        .filter(([_, val]) => val > 0)
                        .map(([category, val]) => `${Math.round((val / totalValue) * 100)}% ${category}`)
                        .join(', ')
                    : 'No allocation data';

                const latestCashflow = client.cashflow?.sort((a: any, b: any) =>
                    new Date(b.as_of_date).getTime() - new Date(a.as_of_date).getTime()
                )[0];

                const cashflowString = latestCashflow
                    ? `Total Inflow: $${latestCashflow.total_inflow}, Total Expense: $${latestCashflow.total_expense}, Wealth Transfers: $${latestCashflow.wealth_transfers}, Net Surplus: $${latestCashflow.net_surplus}, Net Cashflow (post-investment): $${latestCashflow.net_cashflow} (${new Date(latestCashflow.as_of_date).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })})`
                    : 'No cashflow data';

                const plansString = client.client_plans?.length > 0
                    ? client.client_plans.map((p: any) => p.plan_name).join(', ')
                    : 'No active plans';

                const params = {
                    riskProfileCategory: client.risk_profile || 'Unknown',
                    riskProfileDescription: description,
                    investmentAllocation: allocationString,
                    cashflow: cashflowString,
                    plansHeld: plansString,
                };

                // 3. Trigger AI Analysis based on mode
                if (mode === 'focused') {
                    const stream = generateRiskAnalysis(params);
                    let fullText = '';
                    for await (const chunk of stream) {
                        fullText += chunk;
                    }

                    // 4. Parse JSON
                    try {
                        const parsed = JSON.parse(fullText);
                        setStructuredAnalysis(parsed);
                        if (onCacheUpdate) {
                            onCacheUpdate({ focused: parsed });
                        }
                    } catch (parseErr) {
                        console.error('JSON Parse Error:', parseErr, 'Raw text:', fullText);
                        setError('Received invalid data from AI.');
                    }
                } else {
                    const stream = generateRiskSummary(params);
                    let fullText = '';
                    for await (const chunk of stream) {
                        fullText += chunk;
                    }

                    try {
                        const parsed = JSON.parse(fullText);
                        const exSummary = parsed["Executive Summary"] || fullText;
                        setSummary(exSummary);
                        if (onCacheUpdate) {
                            onCacheUpdate({ overview: exSummary });
                        }
                    } catch (parseErr) {
                        console.error('JSON Parse Error for summary:', parseErr);
                        setSummary(fullText);
                        if (onCacheUpdate) {
                            onCacheUpdate({ overview: fullText });
                        }
                    }
                }
            } catch (err: any) {
                console.error('Risk Analysis Error:', err);
                setError('Failed to load risk analysis.');
            } finally {
                setLoading(false);
            }
        };

        analyze();
    }, [client, mode]);

    const renderListItems = (text: string) => {
        if (!text) return null;
        // Split by newlines and handle various bullet formats (*, -, •, or numbers)
        const items = text.split(/\n/).filter(line => line.trim().length > 0);
        return items.map((item, i) => (
            <li key={i}>{item.replace(/^[\s*•\-]+/, '').trim()}</li>
        ));
    };

    return (
        <section className="glass-card quadrant">
            <div className="card-header">
                <h3>Risk Profile</h3>
            </div>

            <div className="risk-indicator">
                {clientInfo && (
                    <div className="risk-header-info animate-fade">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                            <div className="risk-category-display" style={{ alignItems: 'center', textAlign: 'center' }}>
                                <span className="label">Current Category</span>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <span className="value" style={{ fontSize: '2rem' }}>{clientInfo.category}</span>
                                    <button
                                        onClick={() => setIsInfoModalOpen(true)}
                                        style={{
                                            width: '20px',
                                            height: '20px',
                                            borderRadius: '50%',
                                            border: '1px solid var(--border)',
                                            background: 'rgba(0,0,0,0.03)',
                                            fontSize: '0.8rem',
                                            color: 'var(--text-muted)',
                                            cursor: 'pointer',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            transition: 'all 0.2s',
                                            fontWeight: 700,
                                            marginTop: '4px'
                                        }}
                                        title="View Risk Level Guide"
                                        onMouseOver={(e) => {
                                            e.currentTarget.style.background = 'var(--primary)';
                                            e.currentTarget.style.color = '#fff';
                                            e.currentTarget.style.borderColor = 'var(--primary)';
                                        }}
                                        onMouseOut={(e) => {
                                            e.currentTarget.style.background = 'rgba(0,0,0,0.03)';
                                            e.currentTarget.style.color = 'var(--text-muted)';
                                            e.currentTarget.style.borderColor = 'var(--border)';
                                        }}
                                    >
                                        ?
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                <div className="ai-analysis-content">
                    {loading && (
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', padding: '1rem 0' }}>
                            <div className="loading-shimmer">
                                <div className="line" style={{ width: '90%' }}></div>
                                <div className="line" style={{ width: '100%' }}></div>
                                <div className="line short"></div>
                            </div>
                            <div style={{
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                gap: '0.75rem',
                                color: 'var(--text-muted)'
                            }}>
                                <p style={{ fontSize: '0.9rem', fontWeight: 500, letterSpacing: '0.05em' }}>Thinking...</p>
                            </div>
                        </div>
                    )}

                    {error && <p className="error-text">{error}</p>}

                    {mode === 'focused' && structuredAnalysis && (
                        <div className="structured-analysis animate-fade">
                            <div className="analysis-section">
                                <h4>Key Insights</h4>
                                <ul>{renderListItems(structuredAnalysis["Key Insights"])}</ul>
                            </div>

                            {structuredAnalysis["Potential Risks"] && (
                                <div className="analysis-section red-flags">
                                    <h4>Potential Risks</h4>
                                    <ul>{renderListItems(structuredAnalysis["Potential Risks"])}</ul>
                                </div>
                            )}

                            <div className="analysis-section recommendations">
                                <h4>Recommendation</h4>
                                <p>{structuredAnalysis["Recommendations"]}</p>
                            </div>
                        </div>
                    )}

                    {mode === 'overview' && summary && (
                        <div className="analysis-text animate-fade" style={{ fontSize: '0.9rem', opacity: 0.9 }}>
                            {summary}
                        </div>
                    )}

                    {!loading && !structuredAnalysis && !summary && !error && (
                        <p className="risk-description">
                            Select a client to see detailed risk alignment analysis.
                        </p>
                    )}
                </div>
            </div>
            <RiskLevelInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
        </section>
    );
};

export default RiskProfile;

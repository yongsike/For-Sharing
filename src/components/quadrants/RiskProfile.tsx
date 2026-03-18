import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { generateRiskAnalysis, generateRiskSummary, submitAIFeedback } from '../../lib/riskProfileAI';

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
            zIndex: 1000
        }}>
            <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()} style={{
                background: '#fff', borderRadius: '24px', boxShadow: 'var(--shadow-xl)',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', fontSize: '1.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                >&times;</button>

                <div className="modal-header" style={{ padding: '2rem 2rem 0rem 2rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>Risk Level Guide</h2>
                </div>

                <div className="modal-body">
                    {Object.entries(RISK_LEVEL_DESCRIPTIONS).map(([level, desc]) => (
                        <div key={level}>
                            <h4 style={{ color: 'var(--primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', marginTop: '1.5rem', marginBottom: '4px'}}>
                                {level}
                            </h4>
                            <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', lineHeight: '1.5', opacity: 0.85}}>{desc}</p>
                        </div>
                    ))}
                </div>
            </div>
        </div>,
        document.body
    );
};

const AIInfoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
            <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()} style={{
                background: '#fff', borderRadius: '24px', boxShadow: 'var(--shadow-xl)',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', fontSize: '1.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                >&times;</button>

                <div className="modal-header">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                        <h2 style={{ fontSize: '1.5rem', color: 'var(--secondary)', margin: 0 }}>How Does AI Generate This Analysis?</h2>
                    </div>
                </div>

                <div className="modal-body">
                    <section style={{ marginBottom: '1.5rem' }}>
                        <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', lineHeight: '1.5', opacity: 0.85 }}>
                            Our AI synthesizes real-time data from four key pillars:
                        </p>
                        <ol style={{ fontSize: '0.85rem', color: 'var(--secondary)', opacity: 0.85, marginTop: '8px', paddingLeft: '20px' }}>
                            <li><strong>Risk Profile:</strong> Stated risk tolerance levels.</li>
                            <li><strong>Asset Allocation:</strong> Asset distribution across classes.</li>
                            <li><strong>Cashflow:</strong> Inflows, outflows, and net surplus capacity.</li>
                            <li><strong>Plans Held:</strong> Liquidity, lock-in periods, and coverage details.</li>
                        </ol>
                    </section>

                    <section style={{ marginBottom: '1rem' }}>
                        <h4 style={{ color: 'var(--primary)', marginBottom: '8px', fontSize: '1rem' }}>Analysis Logic</h4>
                        <div style={{ background: 'rgba(0,0,0,0.02)', padding: '15px', borderRadius: '12px', borderLeft: '3px solid var(--primary)' }}>
                            <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', lineHeight: '1.6', margin: 0 }}>
                                <strong>Allocation Alignment:</strong> Checks if asset volatility matches expected risk levels.<br />
                                <strong>Capacity vs. Tolerance:</strong> Verifies if cashflow supports risk appetite.<br />
                                <strong>Structural Review:</strong> Identifies conflicts between illiquid assets and flexibility needs.<br />
                                <strong>The Gap:</strong> Pinpoints the exact delta between current reality and profile goals.
                            </p>
                        </div>
                    </section>

                    <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: '1rem'}}>
                        This analysis is supplementary and should be reviewed by a professional advisor before informing any financial decisions.
                    </p>
                </div>
            </div>
        </div>,
        document.body
    );
};

const AIFeedbackModal: React.FC<{
    isOpen: boolean;
    onClose: () => void;
    rating: boolean | null;
    setRating: (rating: boolean | null) => void;
    feedbackComment: string;
    setFeedbackComment: (comment: string) => void;
    isSubmitting: boolean;
    submitted: boolean;
    onSubmit: () => void;
    error: string | null;
}> = ({ isOpen, onClose, rating, setRating, feedbackComment, setFeedbackComment, isSubmitting, submitted, onSubmit, error }) => {
    if (!isOpen) return null;

    return createPortal(
        <div className="modal-overlay" onClick={onClose} style={{ zIndex: 1000 }}>
            <div className="modal-content modal-sm" onClick={(e) => e.stopPropagation()} style={{
                background: '#fff', borderRadius: '24px', boxShadow: 'var(--shadow-xl)',
                position: 'relative'
            }}>
                <button
                    onClick={onClose}
                    style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'transparent', border: 'none', fontSize: '1.75rem', cursor: 'pointer', color: 'var(--text-muted)' }}
                >&times;</button>

                <div className="modal-header">
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem'}}>Was This Analysis Helpful?</h2>
                </div>

                <div className="modal-body">
                    <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0rem', marginBottom: '2rem', lineHeight: '1.5' }}>
                        Your feedback helps us improve the relevance and accuracy of our AI-generated risk insights.
                    </p>

                    {!submitted ? (
                        <>
                            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '20px' }}>
                                <button
                                    onClick={() => setRating(true)}
                                    style={{
                                        background: rating === true ? 'rgba(113, 146, 102, 0.15)' : 'rgba(0,0,0,0.02)',
                                        border: `1px solid ${rating === true ? 'var(--success)' : 'var(--border)'}`,
                                        borderRadius: '12px',
                                        padding: '16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: rating === true ? 'var(--success)' : 'var(--text-muted)'
                                    }}
                                >
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill={rating === true ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M7 10v12"></path>
                                        <path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2h0a3.13 3.13 0 0 1 3 3.88Z"></path>
                                    </svg>
                                </button>
                                <button
                                    onClick={() => setRating(false)}
                                    style={{
                                        background: rating === false ? 'rgba(155, 34, 38, 0.1)' : 'rgba(0,0,0,0.02)',
                                        border: `1px solid ${rating === false ? '#9B2226' : 'var(--border)'}`,
                                        borderRadius: '12px',
                                        padding: '16px',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        flex: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: rating === false ? '#9B2226' : 'var(--text-muted)'
                                    }}
                                >
                                    <svg width="28" height="28" viewBox="0 0 24 24" fill={rating === false ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                        <path d="M17 14V2"></path>
                                        <path d="M9 18.12 10 14H4.17a2 2 0 0 1-1.92-2.56l2.33-8A2 2 0 0 1 6.5 2h13.5a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2.76a2 2 0 0 0-1.79 1.11L12 22h0a3.13 3.13 0 0 1-3-3.88Z"></path>
                                    </svg>
                                </button>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', marginTop: '1rem' }}>
                                <textarea
                                    placeholder="Optional: How can we improve this result?"
                                    value={feedbackComment}
                                    onChange={(e) => setFeedbackComment(e.target.value)}
                                    style={{
                                        width: '100%',
                                        minHeight: '100px',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        border: '1px solid var(--border)',
                                        fontSize: '0.85rem',
                                        fontFamily: 'inherit',
                                        resize: 'none',
                                        outline: 'none',
                                        boxSizing: 'border-box'
                                    }}
                                />

                                {error && (
                                    <p style={{ color: 'var(--danger)', fontSize: '0.8rem', fontWeight: 500, textAlign: 'center', margin: 0 }}>
                                        {error}
                                    </p>
                                )}

                                <button
                                    onClick={onSubmit}
                                    disabled={isSubmitting || rating === null}
                                    style={{
                                        width: '100%',
                                        padding: '12px',
                                        borderRadius: '12px',
                                        background: 'var(--primary)',
                                        color: '#fff',
                                        border: 'none',
                                        fontWeight: 600,
                                        fontSize: '0.9rem',
                                        cursor: (isSubmitting || rating === null) ? 'not-allowed' : 'pointer',
                                        opacity: (isSubmitting || rating === null) ? 0.7 : 1,
                                        transition: 'all 0.2s'
                                    }}
                                >
                                    {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
                                </button>
                            </div>
                        </>
                    ) : (
                        <div style={{
                            textAlign: 'center',
                            minHeight: '235px',
                            background: 'var(--primary-glow)',
                            border: '1px solid rgba(197, 179, 88, 0.15)',
                            borderRadius: '16px',
                            color: 'var(--primary)',
                            fontWeight: 600,
                            fontSize: '1.5rem',
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            justifyContent: 'center'
                        }}>
                            Thank you for your feedback!
                        </div>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
};

const RiskProfile: React.FC<RiskProfileProps> = ({
    client,
    mode = 'overview',
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
    const [isAIModalOpen, setIsAIModalOpen] = useState<boolean>(false);
    const [isFeedbackModalOpen, setIsFeedbackModalOpen] = useState<boolean>(false);
    const [structuredAnalysis, setStructuredAnalysis] = useState<{
        "Key Insights": string;
        "Potential Risks": string;
        "Recommendations": string;
    } | null>(cache?.focused || null);
    const [copied, setCopied] = useState<boolean>(false);

    // AI Feedback State
    const [rating, setRating] = useState<boolean | null>(null);
    const [feedbackComment, setFeedbackComment] = useState<string>('');
    const [isSubmittingFeedback, setIsSubmittingFeedback] = useState<boolean>(false);
    const [feedbackSubmitted, setFeedbackSubmitted] = useState<boolean>(false);
    const [feedbackError, setFeedbackError] = useState<string | null>(null);

    const handleFeedbackSubmit = async () => {
        if (!client || rating === null) return;
        setIsSubmittingFeedback(true);
        setFeedbackError(null);
        try {
            const formattedContent = structuredAnalysis
                ? `Key Insights:\n${structuredAnalysis["Key Insights"]}\n\n` +
                `Potential Risks:\n${structuredAnalysis["Potential Risks"]}\n\n` +
                `Recommendations:\n${structuredAnalysis["Recommendations"]}`
                : '';

            await submitAIFeedback({
                client_id: client.client_id,
                rating,
                comment: feedbackComment || undefined,
                generated_content: formattedContent,
                ai_type: 'risk_analysis'
            });
            setFeedbackSubmitted(true);
        } catch (err: any) {
            console.error('Feedback submission failed:', err);
            const errMsg = err.message === 'Load failed' || err.message === 'Failed to fetch'
                ? 'AI Service is currently unreachable. Please check your connection or try again later.'
                : (err.message || 'Failed to submit feedback. Please try again.');
            setFeedbackError(errMsg);
        } finally {
            setIsSubmittingFeedback(false);
        }
    };

    const handleCloseFeedbackModal = () => {
        setIsFeedbackModalOpen(false);
        // Small delay to reset state after modal animation starts closing
        setTimeout(() => {
            setRating(null);
            setFeedbackComment('');
            setFeedbackSubmitted(false);
            setFeedbackError(null);
        }, 200);
    };

    const aiDisclaimerPill = mode === 'focused' ? (
        <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            padding: '1.5rem 0 0.5rem 0',
            marginTop: 'auto'
        }}>
            <button
                onClick={() => setIsAIModalOpen(true)}
                style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(0, 0, 0, 0.03)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--primary-glow)';
                    e.currentTarget.style.color = 'var(--primary)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                }}
            >
                How Does AI Generate This Analysis?
            </button>

            <button
                onClick={() => setIsFeedbackModalOpen(true)}
                style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(0, 0, 0, 0.03)',
                    padding: '6px 14px',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textTransform: 'uppercase',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    marginLeft: 'auto'
                }}
                onMouseOver={(e) => {
                    e.currentTarget.style.background = 'var(--primary-glow)';
                    e.currentTarget.style.color = 'var(--primary)';
                    e.currentTarget.style.borderColor = 'var(--primary)';
                }}
                onMouseOut={(e) => {
                    e.currentTarget.style.background = 'rgba(0, 0, 0, 0.03)';
                    e.currentTarget.style.color = 'var(--text-muted)';
                    e.currentTarget.style.borderColor = 'var(--border)';
                }}
            >
                Provide Feedback
            </button>
        </div>
    ) : (
        <div style={{
            display: 'flex',
            justifyContent: 'center',
            padding: 0,
            marginTop: '0'
        }}>
            <button
                onClick={() => setIsAIModalOpen(true)}
                style={{
                    fontSize: '0.65rem',
                    color: 'var(--text-muted)',
                    background: 'rgba(0, 0, 0, 0.03)',
                    padding: '4px 12px',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    fontWeight: 700,
                    letterSpacing: '0.05em',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                    textTransform: 'uppercase',
                    cursor: 'pointer'
                }}
            >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="var(--primary)" style={{ opacity: 0.9 }}>
                    <path d="M12 2L14.5 9.5L22 12L14.5 14.5L12 22L9.5 14.5L2 12L9.5 9.5L12 2Z" />
                </svg>
                This analysis is generated by AI
            </button>
        </div>
    );

    useEffect(() => {
        if (!client) return;

        // Reset feedback state on client/mode switch
        setRating(null);
        setFeedbackComment('');
        setFeedbackSubmitted(false);
        setFeedbackError(null);

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

                // 2. Aggregate Active Plans for Analysis (Concise & Token-Efficient)
                const activePlans = (client.client_plans || []).filter((p: any) => p.status === 'Active');
                const allocationMap: Record<string, number> = {};
                let totalAssetValue = 0;
                let totalSumAssured = 0;
                let earliestStart: Date | null = null;
                let latestEnd: Date | null = null;
                const activeCategories = new Set<string>();

                activePlans.forEach((plan: any) => {
                    const isInsurance = plan.asset_class?.includes('Insurance') || plan.sum_assured !== undefined;
                    const valuations = isInsurance ? (plan.insurance_valuations || []) : (plan.investment_valuations || []);
                    const valueKey = isInsurance ? 'cash_value' : 'market_value';

                    // 1. Track Types/Categories
                    const cat = plan.asset_class || plan.policy_type || 'Other';
                    if (cat) activeCategories.add(cat);

                    // 2. Track Dates
                    if (plan.start_date) {
                        const d = new Date(plan.start_date);
                        if (!earliestStart || d < earliestStart) earliestStart = d;
                    }
                    const endDateStr = plan.end_date || plan.expiry_date;
                    if (endDateStr) {
                        const d = new Date(endDateStr);
                        if (!latestEnd || d > latestEnd) latestEnd = d;
                    }

                    // 3. Track Valuations (Aggregate & Allocation)
                    const latestVal = valuations?.sort((a: any, b: any) =>
                        new Date(b.as_of_date).getTime() - new Date(a.as_of_date).getTime()
                    )[0];

                    if (latestVal) {
                        const val = parseFloat(latestVal[valueKey] || 0);
                        if (val > 0) {
                            totalAssetValue += val;
                            allocationMap[cat] = (allocationMap[cat] || 0) + val;
                        }
                    }
                    if (isInsurance && plan.sum_assured) {
                        totalSumAssured += parseFloat(plan.sum_assured);
                    }
                });

                // Calculate historical portfolio performance (1 year comparison)
                let portfolioPerformanceString = '';
                const activeInvestments = activePlans.filter((p: any) => !p.asset_class?.includes('Insurance') && p.market_value !== undefined);
                if (activeInvestments.length > 0) {
                    let pastTotalValue = 0;
                    let hasPastData = false;

                    activeInvestments.forEach((plan: any) => {
                        const valuations = plan.investment_valuations || [];
                        if (valuations.length > 1) {
                            const sortedVals = valuations.sort((a: any, b: any) =>
                                new Date(b.as_of_date).getTime() - new Date(a.as_of_date).getTime()
                            );
                            
                            // Get latest value
                            const latestVal = parseFloat(sortedVals[0].market_value || 0);

                            // Find a valuation closest to 1 year ago (365 days)
                            const oneYearAgo = new Date();
                            oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);
                            
                            // Find the first valuation that is older than or equal to 1 year ago
                            let pastValRecord = sortedVals.find((v: any) => new Date(v.as_of_date) <= oneYearAgo);

                            // If we don't have one that's exactly/older than 1 year, just take the oldest one we have 
                            // as long as it's not the latest one.
                            if (!pastValRecord && sortedVals.length > 0) {
                                pastValRecord = sortedVals[sortedVals.length - 1];
                            }

                            if (pastValRecord && sortedVals[0].as_of_date !== pastValRecord.as_of_date) {
                                pastTotalValue += parseFloat(pastValRecord.market_value || 0);
                                hasPastData = true;
                            } else {
                                // If no past data, assume the past value was the same as current for the overall summation
                                pastTotalValue += latestVal;
                            }
                        } else if (valuations.length === 1) {
                             pastTotalValue += parseFloat(valuations[0].market_value || 0);
                        }
                    });

                    if (hasPastData && pastTotalValue > 0) {
                        const diff = totalAssetValue - pastTotalValue;
                        const percentChange = ((diff / pastTotalValue) * 100).toFixed(1);
                        const sign = diff >= 0 ? '+' : '';
                        portfolioPerformanceString = `\n                       - Portfolio Value Change (Last 12 Months): ${sign}${percentChange}%`;
                    }
                }

                const allocationString = totalAssetValue > 0
                    ? Object.entries(allocationMap)
                        .filter(([_, val]) => val > 0)
                        .map(([category, val]) => `${Math.round((val / totalAssetValue) * 100)}% ${category}`)
                        .join(', ')
                    : 'No allocation data';

                const sortedCashflows = client.cashflow?.sort((a: any, b: any) =>
                    new Date(b.as_of_date).getTime() - new Date(a.as_of_date).getTime()
                ) || [];
                
                const latestCashflow = sortedCashflows[0];

                // Calculate historical trend and volatility over the last 12 months
                let historicalTrend = '';
                const oneYearAgoThreshold = new Date();
                oneYearAgoThreshold.setFullYear(oneYearAgoThreshold.getFullYear() - 1);

                const recentCashflows = sortedCashflows.filter((cf: any) => new Date(cf.as_of_date) >= oneYearAgoThreshold);

                if (recentCashflows.length > 1) {
                    const avgSurplus = recentCashflows.reduce((sum: number, cf: any) => sum + (parseFloat(cf.net_surplus) || 0), 0) / recentCashflows.length;
                    const avgInflow = recentCashflows.reduce((sum: number, cf: any) => sum + (parseFloat(cf.total_inflow) || 0), 0) / recentCashflows.length;
                    
                    // Volatility calculation (Standard Deviation of Net Surplus)
                    let surplusVolatilityInfo = '';
                    if (recentCashflows.length >= 3) {
                       const surpluses = recentCashflows.map((cf: any) => parseFloat(cf.net_surplus) || 0);
                       const variance = surpluses.reduce((sum: number, val: number) => sum + Math.pow(val - avgSurplus, 2), 0) / surpluses.length;
                       const stdDev = Math.sqrt(variance);
                       const stdDevPercent = avgSurplus !== 0 ? ((stdDev / Math.abs(avgSurplus)) * 100).toFixed(1) : '0';
                       surplusVolatilityInfo = `, Net Surplus Std Dev: ${stdDevPercent}%`;
                    }

                    historicalTrend = `\n                       - Last 12 Months Average: Total Inflow ($${Math.round(avgInflow)}), Net Surplus ($${Math.round(avgSurplus)})${surplusVolatilityInfo}`;
                }

                const cashflowString = latestCashflow
                    ? `Current Cashflow Summary:
                       - Income: Employment ($${latestCashflow.employment_income_gross}), Rental ($${latestCashflow.rental_income}), Investment ($${latestCashflow.investment_income}). Total Inflow: $${latestCashflow.total_inflow}
                       - Expense: Household ($${latestCashflow.household_expenses}), Tax ($${latestCashflow.income_tax}), Insurance ($${latestCashflow.insurance_premiums}), Property ($${latestCashflow.property_expenses}), Debt/Loan ($${latestCashflow.property_loan_repayment + latestCashflow.non_property_loan_repayment}). Total Expense: $${latestCashflow.total_expense}
                       - Net State: Wealth Transfers ($${latestCashflow.wealth_transfers}), Net Surplus ($${latestCashflow.net_surplus}), Net Cashflow (post-investment/pensions) ($${latestCashflow.net_cashflow}).${historicalTrend}`
                    : 'No cashflow data';

                const plansString = activePlans.length > 0
                    ? `Current Portfolio Summary:
                       - Total Assets: $${Math.round(totalAssetValue).toLocaleString()}
                       - Total Insurance Sum Assured: $${Math.round(totalSumAssured).toLocaleString()}
                       - Holding Period: ${earliestStart ? (earliestStart as Date).toLocaleDateString() : 'Unknown'} to ${latestEnd ? (latestEnd as Date).toLocaleDateString() : 'Ongoing'}
                       - Plan Distribution: ${Array.from(activeCategories).join(', ')}${portfolioPerformanceString}`
                    : 'No active plans';

                const params = {
                    riskProfileDescription: description,
                    assetAllocation: allocationString,
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
                const errMsg = err.message === 'Load failed' || err.message === 'Failed to fetch'
                    ? 'AI Service unreachable.'
                    : 'Failed to load risk analysis.';
                setError(errMsg);
            } finally {
                setLoading(false);
            }
        };

        analyze();
    }, [client, mode]);



    const handleCopy = (e: React.MouseEvent) => {
        e.stopPropagation();
        e.preventDefault();
        let textToCopy = '';
        if (mode === 'overview') {
            textToCopy = summary;
        } else if (mode === 'focused' && structuredAnalysis) {
            textToCopy = `Key Insights:\n${structuredAnalysis["Key Insights"]}\n\n` +
                `Potential Risks:\n${structuredAnalysis["Potential Risks"] || 'None identified.'}\n\n` +
                `Recommendations:\n${structuredAnalysis["Recommendations"]}`;
        }

        if (textToCopy) {
            navigator.clipboard.writeText(textToCopy).then(() => {
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
            });
        }
    };

    return (
        <section className="glass-card quadrant">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Risk Analysis</h3>
                {(summary || (mode === 'focused' && structuredAnalysis)) && (
                    <button
                        onClick={handleCopy}
                        style={{
                            background: 'transparent',
                            color: copied ? 'var(--success)' : 'var(--text-muted)',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            gap: '5px',
                            fontSize: '0.7rem',
                            fontWeight: 700,
                            padding: '4px 8px',
                            borderRadius: '20px',
                            transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                            backgroundColor: copied ? 'rgba(16, 185, 129, 0.08)' : 'rgba(0,0,0,0.02)',
                            textTransform: 'uppercase',
                            letterSpacing: '0.05em',
                            border: copied ? '1px solid var(--success)' : '1px solid var(--border)'
                        }}
                        title="Copy analysis to clipboard"
                        onMouseOver={(e) => {
                            if (!copied) {
                                e.currentTarget.style.background = 'rgba(0, 0, 0, 0.06)';
                                e.currentTarget.style.color = 'var(--secondary)';
                                e.currentTarget.style.borderColor = 'var(--primary)';
                            }
                        }}
                        onMouseOut={(e) => {
                            if (!copied) {
                                e.currentTarget.style.background = 'rgba(0,0,0,0.02)';
                                e.currentTarget.style.color = 'var(--text-muted)';
                                e.currentTarget.style.borderColor = 'var(--border)';
                            }
                        }}
                    >
                        {copied ? (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                                    <polyline points="20 6 9 17 4 12"></polyline>
                                </svg>
                                <span>Copied</span>
                            </>
                        ) : (
                            <>
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                </svg>
                                <span>Copy</span>
                            </>
                        )}
                    </button>
                )}
            </div>

            <div className="risk-indicator" style={{ flex: 1, gap: '1rem', display: 'flex', flexDirection: 'column', minHeight: 0 }}>
                {clientInfo && (
                    <div className="risk-header-info animate-fade">
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                            <div className="risk-category-display" style={{ alignItems: 'center', textAlign: 'center' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', justifyContent: 'center' }}>
                                    <span className="label">Current Category</span>
                                    {mode === 'focused' && (
                                        <button
                                            onClick={() => setIsInfoModalOpen(true)}
                                            style={{
                                                width: '18px',
                                                height: '18px',
                                                borderRadius: '50%',
                                                border: '1px solid var(--border)',
                                                background: 'rgba(0,0,0,0.03)',
                                                color: 'var(--text-muted)',
                                                cursor: 'pointer',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                transition: 'all 0.2s',
                                                padding: 0,
                                                marginTop: '-2px',
                                                fontSize: '0.75rem',
                                                fontWeight: 600
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
                                    )}
                                </div>
                                <span className="value" style={{ fontSize: '2rem' }}>{clientInfo.category}</span>
                            </div>
                        </div>
                    </div>
                )}

                <div className="ai-analysis-content" style={{ minHeight: 0 }}>
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
                                <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-main)', whiteSpace: 'pre-line' }}>
                                    {structuredAnalysis["Key Insights"].replace(/^[\s*•\-→]|(?:->)+/gm, '').trim()}
                                </p>
                            </div>

                            {structuredAnalysis["Potential Risks"] && (
                                <div className="analysis-section red-flags">
                                    <h4>Potential Risks</h4>
                                    <p style={{ fontSize: '0.95rem', lineHeight: '1.6', color: 'var(--text-main)', whiteSpace: 'pre-line' }}>
                                        {structuredAnalysis["Potential Risks"].replace(/^[\s*•\-→]|(?:->)+/gm, '').trim()}
                                    </p>
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

                {mode === 'overview' && aiDisclaimerPill}
            </div>

            {mode === 'focused' && aiDisclaimerPill}

            <RiskLevelInfoModal isOpen={isInfoModalOpen} onClose={() => setIsInfoModalOpen(false)} />
            <AIInfoModal isOpen={isAIModalOpen} onClose={() => setIsAIModalOpen(false)} />
            <AIFeedbackModal
                isOpen={isFeedbackModalOpen}
                onClose={handleCloseFeedbackModal}
                rating={rating}
                setRating={setRating}
                feedbackComment={feedbackComment}
                setFeedbackComment={setFeedbackComment}
                isSubmitting={isSubmittingFeedback}
                submitted={feedbackSubmitted}
                onSubmit={handleFeedbackSubmit}
                error={feedbackError}
            />
        </section>
    );
};

export default RiskProfile;

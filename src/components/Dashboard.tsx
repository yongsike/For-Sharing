import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import { generateRiskAnalysis, generateRiskSummary } from '../lib/riskProfileAI';
import ClientHeader from './ClientHeader';
import './Dashboard.css';

import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend, LineChart, Line } from 'recharts';

const ALLOCATION_COLORS: Record<string, string> = {
    'Equity': '#6366f1',
    'Fixed Income': '#10b981',
    'Cash': '#f59e0b',
    'Bonds': '#3b82f6',
    'Real Estate': '#ec4899',
    'Commodities': '#f97316',
    'Alternatives': '#8b5cf6',
};
const FALLBACK_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#3b82f6', '#ec4899', '#f97316', '#8b5cf6'];

// Shared custom tick renderer to rotate and anchor labels (TypeScript-friendly)
const CustomizedXAxisTick = (props: any) => {
    const { x, y, payload } = props;
    return (
        <g transform={`translate(${x},${y})`}>
            <text x={0} y={0} dy={16} textAnchor="end" fill="rgba(255,255,255,0.5)" fontSize={12} transform="rotate(-25)">
                {payload.value}
            </text>
        </g>
    );
};

const AssetAllocation: React.FC<{ client?: any }> = ({ client }) => {
    const history: any[] = client?.allocation_history || [];
    const assetClasses: string[] = client?.allocation_asset_classes || [];
    const hasData = history.length > 0 && assetClasses.length > 0;

    const CustomTooltip = ({ active, payload, label }: any) => {
        if (active && payload && payload.length) {
            const total = payload.reduce((s: number, e: any) => s + (e.value || 0), 0);
            return (
                <div style={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    padding: '10px 14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                    minWidth: 160,
                }}>
                    <p style={{ color: '#fff', fontWeight: 700, marginBottom: 6 }}>{label}</p>
                    {payload.map((entry: any, i: number) => entry.value > 0 && (
                        <p key={i} style={{ color: entry.fill, fontSize: '0.85rem', margin: '3px 0' }}>
                            {entry.name}: <span style={{ fontWeight: 600 }}>${entry.value.toLocaleString()}</span>
                        </p>
                    ))}
                    <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.75rem', marginTop: 6, borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: 6 }}>
                        Total: ${total.toLocaleString()}
                    </p>
                </div>
            );
        }
        return null;
    };



    return (
        <section className="glass-card quadrant">
            <div className="card-header">
                <h3>Asset Allocation</h3>
                <span className={`badge ${hasData ? 'success' : ''}`}>{hasData ? 'Monthly' : 'No Data'}</span>
            </div>
            <div className="chart-container" style={{ width: '100%', height: '250px', marginTop: '10px' }}>
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={history} margin={{ top: 5, right: 20, bottom: 35, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="rgba(255,255,255,0.5)"
                                /*
                                    Force Recharts to render every tick (interval=0).
                                    Give extra height so rotated labels don't get clipped,
                                    and rotate labels slightly for readability.
                                */
                                tick={<CustomizedXAxisTick />}
                                tickLine={false}
                                axisLine={false}
                                interval={0}
                                height={50}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.5)"
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            {assetClasses.map((cls, i) => (
                                <Bar
                                    key={cls}
                                    dataKey={cls}
                                    stackId="a"
                                    fill={ALLOCATION_COLORS[cls] || FALLBACK_COLORS[i % FALLBACK_COLORS.length]}
                                    radius={i === assetClasses.length - 1 ? [4, 4, 0, 0] : [0, 0, 0, 0]}
                                />
                            ))}
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="chart-placeholder line-chart-mimic">
                        <svg viewBox="0 0 400 150" className="svg-chart">
                            <path d="M0,120 Q50,110 100,80 T200,60 T300,50 T400,20" fill="none" stroke="var(--primary)" strokeWidth="3" />
                            <path d="M0,120 Q50,110 100,80 T200,60 T300,50 T400,20 L400,150 L0,150 Z" fill="url(#gradient2)" opacity="0.2" />
                            <defs>
                                <linearGradient id="gradient2" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="var(--primary)" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="chart-labels">
                            <span>Missing</span><span>Financial</span><span>Data</span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};


const CashflowAnalysis: React.FC<{ client?: any }> = ({ client }) => {
    // Transform data for the chart
    // We want to show the cashflow history in chronological order
    const chartData = React.useMemo(() => {
        if (!client?.monthly_cashflow_history || client.monthly_cashflow_history.length === 0) {
            return [];
        }

        return [...client.monthly_cashflow_history]
            .sort((a: any, b: any) => new Date(a.month_year).getTime() - new Date(b.month_year).getTime())
            .map((item: any) => ({
                date: new Date(item.month_year).toLocaleDateString('en-SG', { month: 'short', year: '2-digit' }),
                fullDate: new Date(item.month_year).toLocaleDateString('en-SG', { month: 'long', year: 'numeric' }),
                inflow: parseFloat(item.total_inflow),
                outflow: parseFloat(item.total_outflow),
                net: parseFloat(item.net_surplus)
            }));
    }, [client?.monthly_cashflow_history]);

    const hasData = chartData.length > 0;

    // Custom Tooltip for better UX
    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div className="custom-tooltip" style={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    padding: '12px',
                    border: '1px solid rgba(255, 255, 255, 0.1)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.3)'
                }}>
                    <p className="tooltip-date" style={{ color: '#fff', marginBottom: '8px', fontWeight: 600 }}>{payload[0].payload.fullDate}</p>
                    {payload.map((entry: any, index: number) => (
                        <p key={index} style={{ color: entry.color, fontSize: '0.9rem', margin: '4px 0' }}>
                            {entry.name}: <span style={{ fontWeight: 600 }}>${entry.value.toLocaleString()}</span>
                        </p>
                    ))}
                </div>
            );
        }
        return null;
    };

    return (
        <section className="glass-card quadrant">
            <div className="card-header">
                <h3>Cashflow Analysis</h3>
                <span className={`badge ${hasData ? 'success' : ''}`}>{hasData ? 'Active' : 'No Data'}</span>
            </div>
            <div className="chart-container" style={{ width: '100%', height: '250px', marginTop: '10px' }}>
                {hasData ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 35, left: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                            <XAxis
                                dataKey="date"
                                stroke="rgba(255,255,255,0.5)"
                                /* use shared custom tick to force all labels and rotate */
                                tick={<CustomizedXAxisTick />}
                                interval={0}
                                height={50}
                                tickLine={false}
                                axisLine={false}
                            />
                            <YAxis
                                stroke="rgba(255,255,255,0.5)"
                                tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                tickFormatter={(value) => `$${value >= 1000 ? `${value / 1000}k` : value}`}
                                tickLine={false}
                                axisLine={false}
                            />
                            <Tooltip content={<CustomTooltip />} />
                            <Legend wrapperStyle={{ paddingTop: '10px' }} />
                            <Line
                                type="monotone"
                                dataKey="inflow"
                                name="Inflow"
                                stroke="#10b981"
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#10b981', strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="outflow"
                                name="Outflow"
                                stroke="#ef4444"
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#ef4444', strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                            />
                            <Line
                                type="monotone"
                                dataKey="net"
                                name="Net Surplus"
                                stroke="#3b82f6"
                                strokeWidth={2}
                                dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                                activeDot={{ r: 6 }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="chart-placeholder line-chart-mimic">
                        <svg viewBox="0 0 400 150" className="svg-chart">
                            <path d="M0,120 Q50,110 100,80 T200,60 T300,50 T400,20" fill="none" stroke="var(--primary)" strokeWidth="3" />
                            <path d="M0,120 Q50,110 100,80 T200,60 T300,50 T400,20 L400,150 L0,150 Z" fill="url(#gradient)" opacity="0.2" />
                            <defs>
                                <linearGradient id="gradient" x1="0%" y1="0%" x2="0%" y2="100%">
                                    <stop offset="0%" stopColor="var(--primary)" />
                                    <stop offset="100%" stopColor="transparent" />
                                </linearGradient>
                            </defs>
                        </svg>
                        <div className="chart-labels">
                            <span>Missing</span><span>Financial</span><span>Data</span>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
};

const PlanDetailModal: React.FC<{ plan: any; onClose: () => void }> = ({ plan, onClose }) => {
    const valuationData = React.useMemo(() => {
        if (!plan?.monthly_valuations) return [];
        return [...plan.monthly_valuations]
            .sort((a: any, b: any) => new Date(a.as_of_date).getTime() - new Date(b.as_of_date).getTime())
            .map((v: any) => ({
                date: new Date(v.as_of_date).toLocaleDateString('en-SG', { month: 'short', year: '2-digit' }),
                fullDate: new Date(v.as_of_date).toLocaleDateString('en-SG', { month: 'long', year: 'numeric' }),
                value: parseFloat(v.market_value)
            }));
    }, [plan]);

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            return (
                <div style={{
                    backgroundColor: 'rgba(17, 24, 39, 0.95)',
                    padding: '10px 14px',
                    border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '8px',
                    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
                }}>
                    <p style={{ color: '#fff', fontWeight: 600, marginBottom: 4 }}>{payload[0].payload.fullDate}</p>
                    <p style={{ color: '#3b82f6', fontSize: '0.9rem' }}>
                        Value: <span style={{ fontWeight: 600 }}>${payload[0].value.toLocaleString()}</span>
                    </p>
                </div>
            );
        }
        return null;
    };

    return (
        <div className="modal-overlay" onClick={onClose}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <button className="modal-close" onClick={onClose}>&times;</button>
                <div className="modal-header">
                    <h2>{plan.plan_name}</h2>
                    <div className="modal-id">Plan ID: {plan.plan_id}</div>
                </div>

                <div className="chart-container" style={{ width: '100%', height: '350px', marginTop: '20px' }}>
                    {valuationData.length > 0 ? (
                        <ResponsiveContainer width="100%" height="100%">
                            <LineChart data={valuationData} margin={{ top: 10, right: 30, left: 10, bottom: 40 }}>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.1)" vertical={false} />
                                <XAxis
                                    dataKey="date"
                                    stroke="rgba(255,255,255,0.5)"
                                    tick={<CustomizedXAxisTick />}
                                    interval={0}
                                    height={50}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <YAxis
                                    stroke="rgba(255,255,255,0.5)"
                                    tick={{ fill: 'rgba(255,255,255,0.5)', fontSize: 12 }}
                                    tickFormatter={(v) => `$${v >= 1000 ? `${(v / 1000).toFixed(0)}k` : v}`}
                                    tickLine={false}
                                    axisLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Line
                                    type="monotone"
                                    dataKey="value"
                                    name="Market Value"
                                    stroke="#3b82f6"
                                    strokeWidth={3}
                                    dot={{ r: 4, fill: '#3b82f6', strokeWidth: 0 }}
                                    activeDot={{ r: 6 }}
                                />
                            </LineChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="error-text" style={{ textAlign: 'center', padding: '2rem' }}>
                            No valuation history available for this plan.
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

const CustomSelect: React.FC<{
    label: string;
    value: string;
    options: { label: string; value: string }[];
    onChange: (val: string) => void;
}> = ({ label, value, options, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const selectedOption = options.find(o => o.value === value);

    return (
        <div className="filter-group" ref={dropdownRef}>
            <label>{label}</label>
            <div className="custom-select-wrapper">
                <div
                    className={`custom-select-trigger ${isOpen ? 'open' : ''}`}
                    onClick={() => setIsOpen(!isOpen)}
                >
                    <span>{selectedOption?.label || value}</span>
                    <svg className="chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                </div>
                {isOpen && (
                    <div className="custom-select-options glass-card">
                        {options.map(opt => (
                            <div
                                key={opt.value}
                                className={`custom-select-option ${value === opt.value ? 'selected' : ''}`}
                                onClick={() => {
                                    onChange(opt.value);
                                    setIsOpen(false);
                                }}
                            >
                                {opt.label}
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};

const PlansHeld: React.FC<{ client?: any; mode?: 'overview' | 'focused' }> = ({ client, mode = 'overview' }) => {
    const rawPlans = client?.raw_plans || [];
    const [selectedPlan, setSelectedPlan] = useState<any>(null);

    // Filter states
    const [assetFilter, setAssetFilter] = useState<string>('All');
    const [statusFilter, setStatusFilter] = useState<string>('All');
    const [startDateFilter, setStartDateFilter] = useState<string>('');
    const [endDateFilter, setEndDateFilter] = useState<string>('');

    const formatDate = (dateStr: string | null) => {
        if (!dateStr) return '-';
        return new Date(dateStr).toLocaleDateString('en-SG', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
        });
    };

    const getStatus = (startDate: string, endDate: string | null) => {
        const today = new Date();
        const start = new Date(startDate);
        if (today < start) return 'Pending';
        if (endDate && today > new Date(endDate)) return 'Ended';
        return 'Active';
    };

    const startMonthOptions = React.useMemo(() => {
        const months = new Set<string>();
        rawPlans.forEach((plan: any) => {
            if (plan.start_date) {
                const date = new Date(plan.start_date);
                months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
            }
        });
        const sorted = Array.from(months).sort();
        return [
            { label: 'All', value: '' },
            ...sorted.map(m => ({
                label: new Date(m).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' }),
                value: m
            }))
        ];
    }, [rawPlans]);

    const endMonthOptions = React.useMemo(() => {
        const months = new Set<string>();
        rawPlans.forEach((plan: any) => {
            if (plan.end_date) {
                const date = new Date(plan.end_date);
                months.add(`${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-01`);
            }
        });
        const sorted = Array.from(months).sort();
        return [
            { label: 'All', value: '' },
            ...sorted.map(m => ({
                label: new Date(m).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' }),
                value: m
            }))
        ];
    }, [rawPlans]);

    const filteredPlans = React.useMemo(() => {
        return rawPlans.filter((plan: any) => {
            // Asset Class Filter
            if (assetFilter !== 'All' && plan.asset_class !== assetFilter) return false;

            // Status Filter
            const status = getStatus(plan.start_date, plan.end_date);
            if (statusFilter !== 'All' && status !== statusFilter) return false;

            // Start Month Filter (Exact month match)
            if (startDateFilter) {
                const pDate = new Date(plan.start_date);
                const fDate = new Date(startDateFilter);
                if (pDate.getFullYear() !== fDate.getFullYear() || pDate.getMonth() !== fDate.getMonth()) {
                    return false;
                }
            }

            // End Month Filter (Exact month match)
            if (endDateFilter) {
                if (!plan.end_date) return false;
                const pDate = new Date(plan.end_date);
                const fDate = new Date(endDateFilter);
                if (pDate.getFullYear() !== fDate.getFullYear() || pDate.getMonth() !== fDate.getMonth()) {
                    return false;
                }
            }

            return true;
        });
    }, [rawPlans, assetFilter, statusFilter, startDateFilter, endDateFilter]);



    const clearFilters = () => {
        setAssetFilter('All');
        setStatusFilter('All');
        setStartDateFilter('');
        setEndDateFilter('');
    };

    return (
        <section className="glass-card quadrant">
            <div className="card-header">
                <h3>Plans Held</h3>
                <span className="badge accent">Summary</span>
            </div>

            {mode === 'focused' && (
                <div className="filter-bar animate-fade">
                    <CustomSelect
                        label="Asset Class"
                        value={assetFilter}
                        onChange={setAssetFilter}
                        options={[
                            { label: 'All', value: 'All' },
                            { label: 'Equity', value: 'Equity' },
                            { label: 'Fixed Income', value: 'Fixed Income' },
                            { label: 'Cash', value: 'Cash' }
                        ]}
                    />

                    <CustomSelect
                        label="Start Month"
                        value={startDateFilter}
                        onChange={setStartDateFilter}
                        options={startMonthOptions}
                    />

                    <CustomSelect
                        label="End Month"
                        value={endDateFilter}
                        onChange={setEndDateFilter}
                        options={endMonthOptions}
                    />
                    
                    <CustomSelect
                        label="Status"
                        value={statusFilter}
                        onChange={setStatusFilter}
                        options={[
                            { label: 'All', value: 'All' },
                            { label: 'Active', value: 'Active' },
                            { label: 'Pending', value: 'Pending' },
                            { label: 'Ended', value: 'Ended' }
                        ]}
                    />

                    {(assetFilter !== 'All' || statusFilter !== 'All' || startDateFilter || endDateFilter) && (
                        <button className="clear-filters" onClick={clearFilters}>
                            Clear Filters
                        </button>
                    )}
                </div>
            )}

            <div className="plans-table-container">
                <table className={`plans-table ${mode === 'focused' ? 'interactive' : ''}`}>
                    <thead>
                        <tr>
                            <th>Plan Name</th>
                            <th>Asset Class</th>
                            <th>Start Date</th>
                            <th>End Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredPlans.map((plan: any, index: number) => {
                            const status = getStatus(plan.start_date, plan.end_date);
                            return (
                                <tr key={index} onClick={(e) => {
                                    if (mode !== 'focused') return;
                                    e.preventDefault();
                                    e.stopPropagation();
                                    setSelectedPlan(plan);
                                }}>
                                    <td>{plan.plan_name}</td>
                                    <td>{plan.asset_class}</td>
                                    <td>{formatDate(plan.start_date)}</td>
                                    <td>{formatDate(plan.end_date)}</td>
                                    <td>
                                        <span className={`status-pill ${status.toLowerCase()}`}>
                                            {status}
                                        </span>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
                {filteredPlans.length === 0 && (
                    <p style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                        No plans found matching your filters.
                    </p>
                )}
            </div>

            {selectedPlan && (
                <PlanDetailModal
                    plan={selectedPlan}
                    onClose={() => setSelectedPlan(null)}
                />
            )}
        </section>
    );
};

const RiskProfile: React.FC<{
    clientId?: string;
    client?: any;
    mode?: 'overview' | 'focused'
}> = ({ client, mode = 'overview' }) => {
    const [loading, setLoading] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [summary, setSummary] = useState<string>('');

    useEffect(() => {
        if (!client) return;

        const analyze = async () => {
            setLoading(true);
            setError(null);
            setStructuredAnalysis(null);
            setSummary('');

            try {
                setClientInfo({
                    category: client.risk_profile || 'Moderate',
                    date: client.risk_assessment_date || new Date().toISOString()
                });

                // 2. Prepare parameters for AI (EXCLUSIVELY using database data)
                const params = {
                    riskProfileCategory: client.risk_profile || 'Unknown',
                    investmentAllocation: client.investment_allocation || 'Information not provided',
                    cashflow: client.cashflow_analysis || 'Information not provided',
                    plansHeld: client.plans_summary || 'Information not provided',
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
                        setSummary(parsed["Executive Summary"] || fullText);
                    } catch (parseErr) {
                        console.error('JSON Parse Error for summary:', parseErr);
                        setSummary(fullText);
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

    const [clientInfo, setClientInfo] = useState<{
        category: string;
        date: string;
    } | null>(null);

    const [structuredAnalysis, setStructuredAnalysis] = useState<{
        "Key Insights": string;
        "Potential Risks": string;
        "Recommendations": string;
    } | null>(null);

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
                <h3>Risk Profile Analysis</h3>
                <span className={`badge ${loading ? 'animate-pulse' : 'warning'}`}>
                    {loading ? 'AI Thinking...' : 'AI Insights'}
                </span>
            </div>

            <div className="risk-indicator">
                {clientInfo && (
                    <div className="risk-header-info animate-fade">
                        <div className="risk-category-display">
                            <span className="label">Current Category</span>
                            <span className="value">{clientInfo.category}</span>
                        </div>
                        <div className="risk-date-display">
                            <span className="label">Last Assessed</span>
                            <span className="value">
                                {new Date(clientInfo.date).toLocaleDateString('en-SG', {
                                    day: '2-digit',
                                    month: 'short',
                                    year: 'numeric'
                                })}
                            </span>
                        </div>
                    </div>
                )}

                <div className="ai-analysis-content">
                    {loading && !structuredAnalysis && (
                        <div className="loading-shimmer">
                            <div className="line"></div>
                            <div className="line short"></div>
                            <div className="line"></div>
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
        </section>
    );
};

const Dashboard: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(!!clientId);

    useEffect(() => {
        const fetchClientData = async () => {
            if (!clientId) return;
            setLoading(true);
            try {
                // Fetch structured relational data from Supabase
                const { data, error } = await supabase
                    .from('clients')
                    .select(`
                        *,
                        client_plans (
                            plan_id,
                            plan_name,
                            asset_class,
                            start_date,
                            end_date,
                            monthly_valuations (
                                market_value,
                                as_of_date
                            )
                        ),
                        monthly_cashflow (
                            total_inflow,
                            total_outflow,
                            net_surplus,
                            month_year
                        )
                    `)
                    .eq('client_id', clientId)
                    .single();

                if (error) throw error;

                // 1. Process Allocation history (stacked bar chart: month × asset_class)
                const cashflowMonths: string[] = [...(data.monthly_cashflow || [])]
                    .sort((a: any, b: any) => new Date(a.month_year).getTime() - new Date(b.month_year).getTime())
                    .map((c: any) => c.month_year);

                // Collect asset classes from ALL plans (terminated ones still appear in early months)
                const assetClassSet = new Set<string>();
                data.client_plans?.forEach((plan: any) => assetClassSet.add(plan.asset_class));
                const allAssetClasses = Array.from(assetClassSet);

                const allocation_history = cashflowMonths.map((monthYear: string) => {
                    const monthTs = new Date(monthYear).getTime();
                    const row: Record<string, any> = {
                        date: new Date(monthYear).toLocaleDateString('en-SG', { month: 'short', year: '2-digit' }),
                        fullDate: new Date(monthYear).toLocaleDateString('en-SG', { month: 'long', year: 'numeric' }),
                    };

                    allAssetClasses.forEach((cls: string) => { row[cls] = 0; });

                    data.client_plans?.forEach((plan: any) => {
                        // Include this plan only if it was active during this month:
                        // end_date IS NULL (still active) OR end_date >= this month
                        const ed = plan.end_date;
                        const isActive = ed === null || ed === undefined || ed === '';
                        const wasActiveThisMonth = isActive || new Date(ed).getTime() >= monthTs;
                        if (!wasActiveThisMonth) return;

                        // Find the most recent valuation on or before this month
                        const eligible = (plan.monthly_valuations || []).filter(
                            (v: any) => new Date(v.as_of_date).getTime() <= monthTs
                        );
                        if (eligible.length === 0) return;
                        const best = eligible.reduce((a: any, b: any) =>
                            new Date(a.as_of_date).getTime() > new Date(b.as_of_date).getTime() ? a : b
                        );
                        row[plan.asset_class] = (row[plan.asset_class] || 0) + parseFloat(best.market_value);
                    });

                    return row;
                });

                // 2. Process Allocation string (for AI — latest snapshot)
                const allocationMap: Record<string, number> = { 'Equity': 0, 'Fixed Income': 0, 'Cash': 0 };
                let totalValue = 0;

                data.client_plans?.forEach((plan: any) => {
                    // Get latest valuation for this plan
                    const latestVal = plan.monthly_valuations?.sort((a: any, b: any) =>
                        new Date(b.as_of_date).getTime() - new Date(a.as_of_date).getTime()
                    )[0];

                    if (latestVal) {
                        const val = parseFloat(latestVal.market_value);
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

                // 2. Process Cashflow (Latest month)
                const latestCashflow = data.monthly_cashflow?.sort((a: any, b: any) =>
                    new Date(b.month_year).getTime() - new Date(a.month_year).getTime()
                )[0];

                const cashflowString = latestCashflow
                    ? `Inflow: $${latestCashflow.total_inflow}, Outflow: $${latestCashflow.total_outflow}, Net: $${latestCashflow.net_surplus} (${new Date(latestCashflow.month_year).toLocaleDateString('en-SG', { month: 'short', year: 'numeric' })})`
                    : 'No cashflow data';

                // 3. Process Plans Summary
                const plansString = data.client_plans?.length > 0
                    ? data.client_plans.map((p: any) => p.plan_name).join(', ')
                    : 'No active plans';

                // Enriched client object for quadrants and AI
                setClient({
                    ...data,
                    investment_allocation: allocationString,
                    allocation_history,                       // stacked bar data
                    allocation_asset_classes: allAssetClasses, // ordered class names for chart
                    cashflow_analysis: cashflowString,
                    monthly_cashflow_history: data.monthly_cashflow, // Pass the raw history for the chart
                    plans_summary: plansString,
                    raw_plans: data.client_plans // Keep raw for the table view
                });
            } catch (err) {
                console.error('Error fetching comprehensive client data:', err);
            } finally {
                setLoading(false);
            }
        };
        fetchClientData();
    }, [clientId]);

    // Map the pathname to a quadrantId (removing the leading slash and clientId)
    const quadrantId = location.pathname.split('/').pop();
    const isFocused = quadrantId !== "" && quadrantId !== clientId && quadrantId !== undefined;

    if (!clientId) {
        return (
            <div className="dashboard-container animate-fade">
                <div className="empty-state-container glass-card">
                    <div className="empty-state-icon">🔍</div>
                    <h2>No Client Selected</h2>
                    <p>Please use the search bar above to select a client and view their financial dashboard.</p>
                </div>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="dashboard-container animate-fade">
                <div className="empty-state-container glass-card">
                    <div className="empty-state-icon loading-spinner-icon">⏳</div>
                    <h2>Loading Client Data</h2>
                    <p>Fetching the latest financial records from Supabase...</p>
                </div>
            </div>
        );
    }
    if (!client && !loading) return <div className="error-text">Client not found.</div>;

    const renderFullGrid = () => (
        <main className="dashboard-grid">
            <Link to={`/${clientId}/asset-allocation`} className="quadrant-link">
                <AssetAllocation client={client} />
            </Link>
            <Link to={`/${clientId}/cashflow`} className="quadrant-link">
                <CashflowAnalysis client={client} />
            </Link>
            <Link to={`/${clientId}/plans`} className="quadrant-link">
                <PlansHeld client={client} mode="overview" />
            </Link>
            <Link to={`/${clientId}/risk`} className="quadrant-link">
                <RiskProfile clientId={clientId} client={client} mode="overview" />
            </Link>
        </main>
    );

    const renderFocusedQuadrant = () => {
        switch (quadrantId) {
            case 'asset-allocation': return <AssetAllocation client={client} />;
            case 'cashflow': return <CashflowAnalysis client={client} />;
            case 'plans': return <PlansHeld client={client} mode="focused" />;
            case 'risk': return <RiskProfile clientId={clientId} client={client} mode="focused" />;
            default: return null;
        }
    };

    return (
        <div className="dashboard-container animate-fade">
            <ClientHeader
                showBack={isFocused}
                onBack={() => navigate(`/${clientId}`)}
            />
            {isFocused ? (
                <main className="focused-view">
                    {renderFocusedQuadrant()}
                </main>
            ) : (
                renderFullGrid()
            )}
        </div>
    );
};

export default Dashboard;

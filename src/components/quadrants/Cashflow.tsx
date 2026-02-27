import React, { useMemo, useState } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { CustomizedXAxisTick } from '../ChartUtils';

interface CashflowProps {
    client?: any;
    mode?: 'overview' | 'focused';
    dateRange?: { startDate: string; endDate: string };
}

const Cashflow: React.FC<CashflowProps> = ({ client, mode = 'overview', dateRange }) => {
    // State to track which lines are visible
    const [visibleLines, setVisibleLines] = useState<Record<string, boolean>>({
        inflow: true,
        expense: true,
        wealthTransfers: true,
        netSurplus: true,
        netCashflow: true
    });

    // Modal state for detailed breakdown
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [selectedSnapshot, setSelectedSnapshot] = useState<any>(null);
    const [activeComponent, setActiveComponent] = useState<string | null>(null);

    const toggleLine = (dataKey: string) => {
        setVisibleLines(prev => ({
            ...prev,
            [dataKey]: !prev[dataKey]
        }));
    };

    const handleChartClick = (data: any) => {
        if (mode === 'focused' && data) {
            const payload = data.activePayload?.[0]?.payload ||
                (data.activeTooltipIndex !== undefined ? chartData[data.activeTooltipIndex] : null);

            if (payload) {
                setSelectedSnapshot(payload);
                setIsModalOpen(true);
            }
        }
    };

    // Transform data for the chart - Show all snapshots individually
    const chartData = useMemo(() => {
        if (!client?.cashflow || client.cashflow.length === 0) {
            return [];
        }

        let data = [...client.cashflow];

        if (dateRange) {
            data = data.filter((item: any) => {
                const itemDate = item.as_of_date.substring(0, 10);
                if (dateRange.startDate && itemDate < dateRange.startDate) return false;
                if (dateRange.endDate && itemDate > dateRange.endDate) return false;
                return true;
            });
        }

        return data
            .sort((a: any, b: any) => new Date(a.as_of_date).getTime() - new Date(b.as_of_date).getTime())
            .map((item: any) => ({
                // Use the ISO date as the unique key for Recharts to handle multiple points correctly
                as_of_date: item.as_of_date,
                date: new Date(item.as_of_date).toLocaleDateString('en-SG', { month: 'short', year: '2-digit' }),
                fullDate: new Date(item.as_of_date).toLocaleDateString('en-SG', { day: '2-digit', month: 'long', year: 'numeric' }),
                inflow: parseFloat(item.total_inflow),
                expense: parseFloat(item.total_expense),
                wealthTransfers: parseFloat(item.wealth_transfers),
                netSurplus: parseFloat(item.net_surplus),
                netCashflow: parseFloat(item.net_cashflow),
                // Inflows
                employmentIncome: parseFloat(item.employment_income_gross || 0),
                rentalIncome: parseFloat(item.rental_income || 0),
                investmentIncome: parseFloat(item.investment_income || 0),
                // Expenses
                household: parseFloat(item.household_expenses || 0),
                tax: parseFloat(item.income_tax || 0),
                insurance: parseFloat(item.insurance_premiums || 0),
                propertyExp: parseFloat(item.property_expenses || 0),
                propertyLoan: parseFloat(item.property_loan_repayment || 0),
                nonPropertyLoan: parseFloat(item.non_property_loan_repayment || 0),
                // Wealth Transfers
                cpf: parseFloat(item.cpf_contribution_total || 0),
                regularInv: parseFloat(item.regular_investments || 0)
            }));
    }, [client?.cashflow, dateRange]);

    // Pie chart data for the modal
    const getPieData = (data: any) => {
        if (!data) return { sources: [], expenses: [], wealthTransfers: [], surplus: { name: 'Net Cashflow', value: 0, color: '#719266' }, utilization: [] };

        const allSources = [
            { name: 'Employment Income', value: data.employmentIncome, color: '#4361EE' },
            { name: 'Rental Income', value: data.rentalIncome, color: '#7209B7' },
            { name: 'Investment Income', value: data.investmentIncome, color: '#4CC9F0' }
        ];

        const allExpenses = [
            { name: 'Household Expenses', value: data.household, color: '#9B2226' },
            { name: 'Income Tax', value: data.tax, color: '#D62828' },
            { name: 'Insurance Premiums', value: data.insurance, color: '#F77F00' },
            { name: 'Property Expenses', value: data.propertyExp, color: '#FCBF49' },
            { name: 'Property Loan', value: data.propertyLoan, color: '#457B9D' },
            { name: 'Non-Property Loan', value: data.nonPropertyLoan, color: '#1D3557' }
        ];

        const allWealthTransfers = [
            { name: 'CPF Contributions', value: data.cpf, color: '#C5B358' },
            { name: 'Regular Investments', value: data.regularInv, color: '#3C5A82' }
        ];

        const surplusValue = data.netCashflow || 0;
        const surplus = {
            name: 'Net Cashflow',
            value: surplusValue,
            color: surplusValue < 0 ? '#D62828' : '#719266'
        };

        // For the actual chart rendering (no zero/negative segments)
        const activeUtilization = [
            ...allExpenses.filter(e => e.value > 0),
            ...allWealthTransfers.filter(w => w.value > 0),
            ...(surplusValue > 0 ? [surplus] : [])
        ];

        return {
            sources: allSources,
            expenses: allExpenses,
            wealthTransfers: allWealthTransfers,
            surplus,
            utilization: activeUtilization
        };
    };

    const hasData = chartData.length > 0;

    const CustomTooltip = ({ active, payload }: any) => {
        if (active && payload && payload.length) {
            const data = payload[0].payload;
            return (
                <div style={{ backgroundColor: '#fff', padding: '12px', border: '1px solid var(--border)', borderRadius: '8px', boxShadow: 'var(--shadow-lg)', minWidth: '220px' }}>
                    <p style={{ color: 'var(--secondary)', marginBottom: '8px', fontWeight: 600 }}>{data.fullDate}</p>
                    {visibleLines.inflow && <p style={{ color: '#719266', fontSize: '0.9rem', margin: '4px 0' }}>Total Inflow: <strong>${data.inflow.toLocaleString()}</strong></p>}
                    {visibleLines.expense && <p style={{ color: '#9B2226', fontSize: '0.9rem', margin: '4px 0' }}>Total Expense: <strong>${data.expense.toLocaleString()}</strong></p>}
                    {visibleLines.wealthTransfers && <p style={{ color: '#3C5A82', fontSize: '0.9rem', margin: '4px 0' }}>Wealth Transfers: <strong>${data.wealthTransfers.toLocaleString()}</strong></p>}
                    {visibleLines.netSurplus && <p style={{ color: '#BC6C25', fontSize: '0.9rem', margin: '4px 0' }}>Net Surplus: <strong>${data.netSurplus.toLocaleString()}</strong></p>}
                    {visibleLines.netCashflow && <p style={{ color: '#C5B358', fontSize: '0.9rem', margin: '4px 0' }}>Net Cashflow: <strong>${data.netCashflow.toLocaleString()}</strong></p>}
                </div>
            );
        }
        return null;
    };

    return (
        <>
            <section className={`glass-card quadrant ${mode === 'focused' ? 'focused' : ''}`}>
                <div className="card-header">
                    <h3>Cashflow Analysis</h3>
                    <div className="badge">{client?.cashflow?.length || 0} Snapshots</div>
                </div>

                <div className="chart-container" style={{ flex: 1, position: 'relative', minHeight: 0 }}>
                    {hasData ? (
                        <>
                            <ResponsiveContainer width="100%" height="95%">
                                <LineChart data={chartData} onClick={handleChartClick} margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
                                    <XAxis dataKey="as_of_date" tick={<CustomizedXAxisTick />} interval={0} axisLine={false} tickLine={false} height={50} />
                                    <YAxis tickFormatter={(v) => `$${v >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: 'var(--text-muted)' }} />
                                    <Tooltip content={<CustomTooltip />} />
                                    {visibleLines.inflow && <Line type="monotone" dataKey="inflow" stroke="#719266" strokeWidth={1.5} dot={{ r: 2.5 }} activeDot={{ r: 4 }} animationDuration={800} />}
                                    {visibleLines.expense && <Line type="monotone" dataKey="expense" stroke="#9B2226" strokeWidth={1.5} dot={{ r: 2.5 }} activeDot={{ r: 4 }} animationDuration={800} />}
                                    {visibleLines.wealthTransfers && <Line type="monotone" dataKey="wealthTransfers" stroke="#3C5A82" strokeWidth={1.5} dot={{ r: 2.5 }} activeDot={{ r: 4 }} animationDuration={800} />}
                                    {visibleLines.netSurplus && <Line type="monotone" dataKey="netSurplus" stroke="#BC6C25" strokeWidth={1.5} dot={{ r: 2.5 }} activeDot={{ r: 4 }} animationDuration={800} />}
                                    {visibleLines.netCashflow && <Line type="monotone" dataKey="netCashflow" stroke="#C5B358" strokeWidth={1.5} dot={{ r: 2.5 }} activeDot={{ r: 4 }} animationDuration={800} />}
                                </LineChart>
                            </ResponsiveContainer>

                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginTop: '0rem' }}>
                                {[
                                    { key: 'inflow', label: 'Inflow', color: '#719266' },
                                    { key: 'expense', label: 'Expenses', color: '#9B2226' },
                                    { key: 'wealthTransfers', label: 'Wealth Transfers', color: '#3C5A82' },
                                    { key: 'netSurplus', label: 'Net Surplus', color: '#BC6C25' },
                                    { key: 'netCashflow', label: 'Net Cashflow', color: '#C5B358' }
                                ].map((item) => (
                                    <div
                                        key={item.key}
                                        onClick={(e) => {
                                            e.preventDefault();
                                            e.stopPropagation();
                                            toggleLine(item.key);
                                        }}
                                        style={{
                                            display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.8rem',
                                            cursor: 'pointer', opacity: visibleLines[item.key] ? 1 : 0.4,
                                            padding: '4px 10px', borderRadius: '20px', background: '#fff', transition: '0.2s',
                                            color: item.color, fontWeight: 600
                                        }}
                                    >
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color }} />
                                        {item.label}
                                    </div>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="chart-placeholder line-chart-mimic" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'var(--text-muted)' }}>
                            No Cashflow Data Available
                        </div>
                    )}
                </div>
            </section>

            {isModalOpen && selectedSnapshot && (
                <div
                    className="modal-overlay animate-fade"
                    onClick={() => setIsModalOpen(false)}
                    style={{
                        position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                        backgroundColor: 'rgba(26, 26, 26, 0.6)', backdropFilter: 'blur(6px)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
                        paddingTop: '70px' // Offset centering to account for sticky navbar
                    }}
                >
                    <div
                        className="modal-content"
                        onClick={e => e.stopPropagation()}
                        style={{
                            width: '95%', maxWidth: '1000px', maxHeight: '90vh', overflowY: 'auto',
                            position: 'relative', padding: '1.5rem 2.5rem 3rem 2.5rem', display: 'flex', flexDirection: 'column', gap: '1rem',
                            background: '#fff', borderRadius: '16px', boxShadow: 'var(--shadow-xl)'
                        }}
                    >
                        <button
                            onClick={() => setIsModalOpen(false)}
                            style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'transparent', border: 'none', fontSize: '1.8rem', cursor: 'pointer', color: 'var(--text-muted)', padding: '10px', zIndex: 10 }}
                        >&times;</button>

                        <div style={{ textAlign: 'center', marginBottom: '1.5rem', marginTop: '0.5rem' }}>
                            <h2 style={{ marginBottom: '0.25rem', fontSize: '1.5rem' }}>Cashflow Breakdown</h2>
                            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginTop: '4px' }}>{selectedSnapshot.fullDate}</p>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'wrap', alignItems: 'stretch', gap: '3rem' }}>
                            <div style={{ flex: '1.2', minWidth: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                                <div style={{ width: '100%', maxWidth: '280px', padding: '12px', textAlign: 'center', background: 'rgba(67, 97, 238, 0.08)', borderRadius: '12px', border: '1px solid rgba(67, 97, 238, 0.2)' }}>
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: '#4361EE', fontWeight: 700, letterSpacing: '0.05em' }}>Total Inflow</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary)' }}>${selectedSnapshot.inflow.toLocaleString()}</div>
                                </div>

                                <div style={{ width: '100%', flex: 1, minHeight: '350px' }}>
                                    <ResponsiveContainer width="100%" height="100%">
                                        <PieChart>
                                            <Pie
                                                data={getPieData(selectedSnapshot).sources.filter(s => s.value > 0)}
                                                cx="50%" cy="50%" innerRadius={0} outerRadius={110} dataKey="value" animationDuration={800}
                                            >
                                                {getPieData(selectedSnapshot).sources.filter(s => s.value > 0).map((entry: any, index: number) => (
                                                    <Cell key={index} fill={entry.color} stroke="#fff" strokeWidth={1}
                                                        style={{ opacity: activeComponent && activeComponent !== entry.name ? 0.3 : 1, transition: '0.2s', cursor: 'pointer' }}
                                                        onMouseEnter={() => setActiveComponent(entry.name)} onMouseLeave={() => setActiveComponent(null)} />
                                                ))}
                                            </Pie>
                                            <Pie data={getPieData(selectedSnapshot).utilization} cx="50%" cy="50%" innerRadius={120} outerRadius={175} paddingAngle={2} dataKey="value" animationBegin={200} animationDuration={800}>
                                                {getPieData(selectedSnapshot).utilization.map((entry: any, index: number) => (
                                                    <Cell key={index} fill={entry.color} stroke="none"
                                                        style={{ opacity: activeComponent && activeComponent !== entry.name ? 0.3 : 1, transition: '0.2s', cursor: 'pointer' }}
                                                        onMouseEnter={() => setActiveComponent(entry.name)} onMouseLeave={() => setActiveComponent(null)} />
                                                ))}
                                            </Pie>
                                            <Tooltip
                                                formatter={(value: any) => [`$${(value || 0).toLocaleString()}`, 'Amount']}
                                                contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: 'var(--shadow-lg)' }}
                                            />
                                        </PieChart>
                                    </ResponsiveContainer>
                                </div>

                                <div
                                    onMouseEnter={() => setActiveComponent('Net Cashflow')} onMouseLeave={() => setActiveComponent(null)}
                                    style={{
                                        width: '100%', maxWidth: '280px', padding: '12px', textAlign: 'center',
                                        background: getPieData(selectedSnapshot).surplus.value >= 0 ? 'rgba(113, 146, 102, 0.08)' : 'rgba(214, 40, 40, 0.08)',
                                        borderRadius: '12px', border: `1px solid ${getPieData(selectedSnapshot).surplus.value >= 0 ? 'rgba(113, 146, 102, 0.2)' : 'rgba(214, 40, 40, 0.2)'}`,
                                        opacity: activeComponent && activeComponent !== 'Net Cashflow' ? 0.3 : 1, transition: '0.2s', cursor: 'pointer',
                                        transform: activeComponent === 'Net Cashflow' ? 'scale(1.05)' : 'scale(1)'
                                    }}
                                >
                                    <div style={{ fontSize: '0.7rem', textTransform: 'uppercase', color: getPieData(selectedSnapshot).surplus.value >= 0 ? 'var(--success)' : '#D62828', fontWeight: 700 }}>Net Cashflow</div>
                                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--secondary)' }}>${getPieData(selectedSnapshot).surplus.value.toLocaleString()}</div>
                                </div>
                            </div>

                            <div style={{ flex: '1', minWidth: '320px', display: 'flex', flexDirection: 'column', gap: '1rem', justifyContent: 'space-between' }}>
                                {['Inflows', 'Expenses', 'Wealth Transfers'].map((cat) => (
                                    <div key={cat}>
                                        <h4 style={{ fontSize: '0.8rem', textTransform: 'uppercase', color: cat === 'Expenses' ? '#9B2226' : (cat === 'Inflows' ? 'var(--primary)' : '#3C5A82'), marginBottom: '10px', letterSpacing: '0.05em' }}>{cat}</h4>
                                        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                            {(getPieData(selectedSnapshot) as any)[cat === 'Wealth Transfers' ? 'wealthTransfers' : (cat === 'Inflows' ? 'sources' : 'expenses')].map((item: any, idx: number) => (
                                                <div
                                                    key={idx}
                                                    onMouseEnter={() => item.value > 0 && setActiveComponent(item.name)}
                                                    onMouseLeave={() => setActiveComponent(null)}
                                                    style={{
                                                        display: 'flex', alignItems: 'center', fontSize: '0.85rem', padding: '8px 12px', borderRadius: '6px',
                                                        background: activeComponent === item.name ? item.color : 'var(--bg-main)',
                                                        color: activeComponent === item.name ? '#fff' : 'inherit',
                                                        border: `1px solid ${activeComponent === item.name ? item.color : 'var(--border)'}`,
                                                        justifyContent: 'space-between',
                                                        opacity: item.value === 0 ? 0.4 : (activeComponent && activeComponent !== item.name ? 0.3 : 1),
                                                        transition: 'all 0.2s ease',
                                                        cursor: item.value === 0 ? 'default' : 'pointer',
                                                        boxShadow: activeComponent === item.name ? '0 4px 12px rgba(0,0,0,0.1)' : 'none'
                                                    }}>
                                                    <div style={{ display: 'flex', alignItems: 'center' }}>
                                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', backgroundColor: item.color, marginRight: '10px' }} />
                                                        <span>{item.name}</span>
                                                    </div>
                                                    <span style={{ fontWeight: 600 }}>${item.value.toLocaleString()}</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>


                    </div>
                </div>
            )}
        </>
    );
};

export default Cashflow;

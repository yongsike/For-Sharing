import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link, useParams } from 'react-router-dom';
import { supabase } from '../lib/supabaseClient';
import ClientHeader from './ClientHeader';
import PlansHeld from './quadrants/PlansHeld';
import RiskProfile from './quadrants/RiskProfile';
import Cashflow from './quadrants/Cashflow';
import AssetAllocation from './quadrants/AssetAllocation';
import './Dashboard.css';

const Dashboard: React.FC = () => {
    const { clientId } = useParams<{ clientId: string }>();
    const location = useLocation();
    const navigate = useNavigate();
    const [client, setClient] = useState<any>(null);
    const [loading, setLoading] = useState(!!clientId);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newStart = e.target.value;
        setStartDate(newStart);
        // Ensure start date is not after end date
        if (newStart && endDate && newStart > endDate) {
            setEndDate(newStart);
        }
    };

    const handleEndDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newEnd = e.target.value;
        setEndDate(newEnd);
        // Ensure end date is not before start date
        if (newEnd && startDate && newEnd < startDate) {
            setStartDate(newEnd);
        }
    };

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
                            *,
                            investment_valuations (
                                market_value,
                                as_of_date
                            ),
                            insurance_valuations (
                                death_benefit,
                                cash_value,
                                critical_illness_benefit,
                                disability_benefit,
                                as_of_date
                            )
                        ),
                        cashflow (
                            as_of_date,
                            employment_income_gross,
                            rental_income,
                            investment_income,
                            household_expenses,
                            income_tax,
                            insurance_premiums,
                            property_expenses,
                            property_loan_repayment,
                            non_property_loan_repayment,
                            cpf_contribution_total,
                            regular_investments,
                            total_inflow,
                            total_expense,
                            wealth_transfers,
                            net_surplus,
                            net_cashflow
                        )
                    `)
                    .eq('client_id', clientId)
                    .single();

                if (error) throw error;

                setClient(data);
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

    const dateRange = { startDate, endDate };

    const renderFullGrid = () => (
        <main className="dashboard-grid">
            <Link to={`/${clientId}/asset-allocation`} className="quadrant-link">
                <AssetAllocation client={client} dateRange={dateRange} />
            </Link>
            <Link to={`/${clientId}/cashflow`} className="quadrant-link">
                <Cashflow client={client} dateRange={dateRange} />
            </Link>
            <Link to={`/${clientId}/plans`} className="quadrant-link">
                <PlansHeld client={client} mode="overview" dateRange={dateRange} />
            </Link>
            <Link to={`/${clientId}/risk`} className="quadrant-link">
                <RiskProfile clientId={clientId} client={client} mode="overview" dateRange={dateRange} />
            </Link>
        </main>
    );

    const renderFocusedQuadrant = () => {
        switch (quadrantId) {
            case 'asset-allocation': return <AssetAllocation client={client} dateRange={dateRange} />;
            case 'cashflow': return <Cashflow client={client} mode="focused" dateRange={dateRange} />;
            case 'plans': return <PlansHeld client={client} mode="focused" dateRange={dateRange} />;
            case 'risk': return <RiskProfile clientId={clientId} client={client} mode="focused" dateRange={dateRange} />;
            default: return null;
        }
    };

    return (
        <div className="dashboard-container animate-fade">
            <ClientHeader
                client={client}
                showBack={isFocused}
                onBack={() => navigate(`/${clientId}`)}
            />
            {/* Date Range Filter */}
            <div className="filter-bar animate-fade" style={{ marginTop: '0', marginBottom: '1.5rem', padding: '1rem 1.5rem' }}>
                <div className="filter-group">
                    <label>Start Date</label>
                    <input
                        type="date"
                        className="filter-input"
                        style={{ minWidth: '150px' }}
                        value={startDate}
                        onChange={handleStartDateChange}
                    />
                </div>
                <div className="filter-group">
                    <label>End Date</label>
                    <input
                        type="date"
                        className="filter-input"
                        style={{ minWidth: '150px' }}
                        value={endDate}
                        onChange={handleEndDateChange}
                    />
                </div>
                {(startDate || endDate) && (
                    <button
                        className="clear-filters"
                        onClick={() => { setStartDate(''); setEndDate(''); }}
                    >
                        Clear Dates
                    </button>
                )}
            </div>
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

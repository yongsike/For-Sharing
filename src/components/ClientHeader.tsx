import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import './Dashboard.css';

interface ClientDetailModalProps {
    client: any;
    onClose: () => void;
}

const ClientDetailModal: React.FC<ClientDetailModalProps> = ({ client, onClose }) => {
    // Helper to format labels
    const formatLabel = (key: string) => {
        if (key === 'address_type') return 'Type of Address';
        if (key === 'house_block_no') return 'House / Block No.';
        const label = key.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ');
        return label.endsWith(' No') ? label + '.' : label;
    };

    // Define Groups
    const contactFields = ['email', 'employment_status', 'occupation', 'mobile_no', 'home_no', 'office_no'];
    const addressFields = ['address_type', 'postal_district', 'house_block_no', 'street_name', 'building_name', 'unit_no'];
    const technicalFields = ['client_id', 'full_name', 'name_as_per_id', 'client_investments', 'client_insurance', 'cashflow', 'client_plans', 'client_family', 'family_members_count', 'last_updated'];

    const renderValue = (key: string, value: any) => {
        if (value === null || value === undefined || value === '') return '-';
        if (Array.isArray(value)) return value.join(', ');

        let display = value.toString();

        // Handle Pandas/float conversion artifacts: strip '.0' from numeric strings
        if (typeof value === 'number' || (typeof value === 'string' && /^\d+\.0$/.test(value))) {
            display = display.replace(/\.0$/, '');
        }

        if (key.includes('date') || key === 'last_updated') {
            try {
                return new Date(value).toLocaleDateString('en-SG', {
                    day: '2-digit',
                    month: 'long',
                    year: 'numeric'
                });
            } catch { return display; }
        }
        return display;
    };

    const renderSection = (title: string, fields: string[]) => (
        <div className="modal-section" style={{ marginBottom: '2.5rem' }}>
            <h3 style={{
                fontSize: '0.85rem',
                color: 'var(--secondary)',
                borderBottom: '1px solid var(--border)',
                paddingBottom: '8px',
                marginBottom: '1.25rem',
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                fontWeight: 700
            }}>{title}</h3>
            <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))',
                gap: '1.25rem 2rem'
            }}>
                {fields.map(key => (
                    <div key={key} className="info-item">
                        <label style={{
                            display: 'block',
                            fontSize: '0.65rem',
                            textTransform: 'uppercase',
                            color: 'var(--text-muted)',
                            fontWeight: 700,
                            letterSpacing: '0.05em',
                            marginBottom: '4px'
                        }}>
                            {formatLabel(key)}
                        </label>
                        <div style={{
                            fontSize: '0.95rem',
                            color: 'var(--secondary)',
                            fontWeight: 500
                        }}>
                            {renderValue(key, client[key])}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    // Filter for basic info (everything else)
    const basicFields = Object.keys(client).filter(key =>
        !contactFields.includes(key) &&
        !addressFields.includes(key) &&
        !technicalFields.includes(key)
    );

    return (
        <div className="modal-overlay animate-fade" onClick={onClose} style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            backgroundColor: 'rgba(26, 26, 26, 0.7)', backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999,
            padding: '20px'
        }}>
            <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{
                width: '100%', maxWidth: '900px', maxHeight: '90vh', overflowY: 'auto',
                position: 'relative', padding: '3rem', display: 'flex', flexDirection: 'column',
                background: '#fff', borderRadius: '24px', boxShadow: 'var(--shadow-xl)'
            }}>
                <button
                    onClick={onClose}
                    className="modal-close-btn"
                    style={{ position: 'absolute', top: '1.5rem', right: '1.5rem', background: 'transparent', border: 'none', fontSize: '2rem', cursor: 'pointer', color: 'var(--text-muted)', padding: '5px', zIndex: 10 }}
                >&times;</button>

                <div className="modal-header" style={{ marginBottom: '2.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '1px solid var(--border)', paddingBottom: '1.5rem' }}>
                    <div>
                        <h2 style={{ fontSize: '2rem', color: 'var(--secondary)', marginBottom: '4px' }}>{client.full_name}</h2>
                        <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', letterSpacing: '0.02em' }}>
                            Client Identification No.: <span style={{ color: 'var(--secondary)', fontWeight: 600 }}>{client.client_id}</span>
                        </p>
                    </div>
                    <div style={{ textAlign: 'right', paddingRight: '40px' }}>
                        <span style={{ fontSize: '0.65rem', textTransform: 'uppercase', color: 'var(--text-muted)', fontWeight: 700, display: 'block', marginBottom: '4px', letterSpacing: '0.05em' }}>Last Updated</span>
                        <span style={{ fontSize: '1rem', color: 'var(--secondary)', fontWeight: 600 }}>
                            {renderValue('last_updated', client.last_updated)}
                        </span>
                    </div>
                </div>

                {renderSection('Basic Information', basicFields)}
                {renderSection('Contact Information and Other Information', contactFields)}
                {renderSection('Residential Address', addressFields)}
            </div>
        </div>
    );
};

interface ClientHeaderProps {
    client: any;
    onBack?: () => void;
    showBack?: boolean;
}

const ClientHeader: React.FC<ClientHeaderProps> = ({ client, onBack, showBack }) => {
    const [isModalOpen, setIsModalOpen] = useState(false);

    if (!client) return null;

    // Generate initials for avatar
    const initials = client.full_name
        ? client.full_name
            .split(' ')
            .map((n: string) => n[0])
            .join('')
            .toUpperCase()
            .slice(0, 2)
        : '--';

    return (
        <>
            <header
                className="dashboard-header glass"
                onClick={() => setIsModalOpen(true)}
                style={{ cursor: 'pointer', transition: 'transform 0.2s ease' }}
                onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
            >
                <div className="client-meta">
                    {showBack && (
                        <button
                            className="back-button"
                            onClick={(e) => {
                                e.stopPropagation();
                                onBack?.();
                            }}
                            aria-label="Go back"
                        >
                            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <line x1="19" y1="12" x2="5" y2="12"></line>
                                <polyline points="12 19 5 12 12 5"></polyline>
                            </svg>
                        </button>
                    )}
                    <div className="client-avatar">{initials}</div>
                    <div className="client-details">
                        <h1>{client.full_name}</h1>
                        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '2px' }}>Click to view full profile</p>
                    </div>
                </div>
                <div className="header-stats">
                    <div className="stat-group align-end">
                        <span className="label">Last Updated</span>
                        <span className="value">
                            {client.last_updated ? new Date(client.last_updated).toLocaleDateString('en-SG', {
                                day: '2-digit',
                                month: 'short',
                                year: 'numeric'
                            }) : 'Never'}
                        </span>
                    </div>
                </div>
            </header>

            {isModalOpen && createPortal(
                <ClientDetailModal
                    client={client}
                    onClose={() => setIsModalOpen(false)}
                />,
                document.body
            )}
        </>
    );
};

export default ClientHeader;

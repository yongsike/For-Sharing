import React from 'react';
import { RISK_LEVEL_DESCRIPTIONS } from './Insights.helpers';
import { FocusModal } from '../../UI/FocusModal';

export const RiskLevelInfoModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    return (
        <FocusModal
            isOpen={isOpen}
            onClose={onClose}
            modalContentClassName="modal-sm"
                    >
            <div className="modal-header" style={{ padding: '2rem 2rem 0rem 2rem' }}>
                <h2 style={{ fontSize: '1.5rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>Risk Level Guide</h2>
            </div>
            <div className="modal-body">
                {Object.entries(RISK_LEVEL_DESCRIPTIONS).map(([level, desc]) => (
                    <div key={level}>
                        <h4 style={{ color: 'var(--primary)', fontSize: '1rem', display: 'flex', alignItems: 'center', marginTop: '1.5rem', marginBottom: '4px' }}>
                            {level}
                        </h4>
                        <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', lineHeight: '1.5', opacity: 0.85 }}>{desc}</p>
                    </div>
                ))}
            </div>
        </FocusModal>
    );
};

export const AIInfoModal: React.FC<{ isOpen: boolean; onClose: () => void; isMeetingNotes?: boolean }> = ({ isOpen, onClose, isMeetingNotes }) => {
    return (
        <FocusModal
            isOpen={isOpen}
            onClose={onClose}
            modalContentClassName="modal-sm"
                    >
            <div className="modal-header">
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '0', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>
                    <h2 style={{ fontSize: '1.5rem', color: 'var(--secondary)', margin: 0 }}>
                        How Does AI Generate This Analysis?
                    </h2>
                </div>
            </div>

            <div className="modal-body">
                <section style={{ marginBottom: '1.5rem' }}>
                    <p style={{ fontSize: '0.9rem', color: 'var(--secondary)', lineHeight: '1.5', opacity: 0.85, marginBottom: '1rem' }}>
                        {isMeetingNotes
                            ? "Our AI cross-references meeting transcripts with client financial data to deliver five key functions:"
                            : "Our AI synthesizes client financial data across five core analytical pillars to identify misalignments:"}
                    </p>
                    <div style={{ padding: '0', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', lineHeight: '1.6', margin: 0 }}>
                            <strong style={{ color: 'var(--primary)', fontWeight: 700, marginRight: '6px' }}>{isMeetingNotes ? 'Conversation Synthesis:' : 'Temporal Context:'}</strong>
                            <span style={{ opacity: 0.85 }}>{isMeetingNotes ? 'Distills lengthy meeting transcripts into a concise, high-level executive summary.' : 'References valuations and cashflows precisely based on the selected analysis period.'}</span>
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', lineHeight: '1.6', margin: 0 }}>
                            <strong style={{ color: 'var(--primary)', fontWeight: 700, marginRight: '6px' }}>{isMeetingNotes ? 'Key Takeaway Extraction:' : 'Allocation Alignment:'}</strong>
                            <span style={{ opacity: 0.85 }}>{isMeetingNotes ? 'Identifies the most critical decisions and salient points made during the client interaction.' : 'Checks if the volatility of the current portfolio matches the desired risk levels.'}</span>
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', lineHeight: '1.6', margin: 0 }}>
                            <strong style={{ color: 'var(--primary)', fontWeight: 700, marginRight: '6px' }}>{isMeetingNotes ? 'Action Item Tracking:' : 'Risk Capacity:'}</strong>
                            <span style={{ opacity: 0.85 }}>{isMeetingNotes ? 'Automatically generates a structured list of follow-up tasks and next steps discussed in the meeting.' : 'Determines if there is sufficient liquidity to support the risk suggested by their profile.'}</span>
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', lineHeight: '1.6', margin: 0 }}>
                            <strong style={{ color: 'var(--primary)', fontWeight: 700, marginRight: '6px' }}>{isMeetingNotes ? 'Financial Integration:' : 'Structural Integrity:'}</strong>
                            <span style={{ opacity: 0.85 }}>{isMeetingNotes ? 'Connects transcript details with the client\'s actual portfolio data to provide deeper financial context.' : 'Identifies conflicts between illiquid assets, plan overlaps, or insurance coverage holes.'}</span>
                        </p>
                        <p style={{ fontSize: '0.85rem', color: 'var(--secondary)', lineHeight: '1.6', margin: 0 }}>
                            <strong style={{ color: 'var(--primary)', fontWeight: 700, marginRight: '6px' }}>{isMeetingNotes ? 'Strategic Alignment:' : 'Gap Synthesis:'}</strong>
                            <span style={{ opacity: 0.85 }}>{isMeetingNotes ? 'Evaluates how the meeting\'s discussion aligns with the client\'s target goals and risk profile.' : 'Pinpoints the specific delta between the client\'s current reality and their target goals.'}</span>
                        </p>
                    </div>
                </section>

                <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontStyle: 'italic', borderTop: '1px solid var(--border)', paddingTop: '1rem' }}>
                    This analysis is supplementary and should be reviewed by a professional advisor before informing any financial decisions.
                </p>
            </div>
        </FocusModal>
    );
};

export const AIFeedbackModal: React.FC<{
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
    isMeetingNotes?: boolean;
}> = ({ isOpen, onClose, rating, setRating, feedbackComment, setFeedbackComment, isSubmitting, submitted, onSubmit, error }) => {
    return (
        <FocusModal
            isOpen={isOpen}
            onClose={onClose}
            modalContentClassName="modal-sm"
        >
            <div className="modal-header">
                <h2 style={{ fontSize: '1.5rem', color: 'var(--secondary)', borderBottom: '1px solid var(--border)', paddingBottom: '0.75rem' }}>Was This Analysis Helpful?</h2>
            </div>

            <div className="modal-body">
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginTop: '0rem', marginBottom: '1.5rem', lineHeight: '1.5' }}>
                    Your feedback helps us improve the relevance and accuracy of our AI-powered features.
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
        </FocusModal>
    );
};

export const renderCleanList = (content: string) => {
    if (!content) return null;
    // Split by newline and filter out empty lines or lines that are just numbers/dashes (legacy cleanup)
    const lines = content.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .map(line => line.replace(/^[\d.)\s•\-*→]+/, '').trim()); // Additional safety for legacy cleaning

    return (
        <ul style={{
            listStylePosition: 'outside',
            paddingLeft: '1rem',
            display: 'flex',
            flexDirection: 'column'
        }}>
            {lines.map((item, idx) => (
                <li key={idx} style={{
                    fontSize: '0.95rem',
                    lineHeight: '1.6',
                    color: 'var(--text-main)',
                    paddingLeft: '0.2rem'
                }}>
                    {item}
                </li>
            ))}
        </ul>
    );
};

export const InlineCopyButton: React.FC<{ onClick: (e: React.MouseEvent) => void; isCopied: boolean; visible: boolean }> = ({ onClick, isCopied, visible }) => (
    <button
        onClick={onClick}
        style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: isCopied ? 'var(--success)' : 'var(--primary)',
            color: '#fff',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: '0.65rem',
            fontWeight: 700,
            padding: '4px 8px',
            borderRadius: '6px',
            transition: 'all 0.2s ease',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            border: isCopied ? '1px solid var(--success)' : '1px solid var(--primary)',
            opacity: visible || isCopied ? 1 : 0,
            pointerEvents: visible || isCopied ? 'auto' : 'none',
            zIndex: 5,
            boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        }}
        title="Copy to clipboard"
    >
        {isCopied ? (
            <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="20 6 9 17 4 12"></polyline>
                </svg>
                <span>Copied</span>
            </>
        ) : (
            <>
                <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                </svg>
                <span>Copy</span>
            </>
        )}
    </button>
);

export const AIDisclaimerPill: React.FC<{
    mode: 'overview' | 'focused';
    onAIModalOpen: () => void;
    onFeedbackModalOpen: () => void;
}> = ({ mode, onAIModalOpen, onFeedbackModalOpen }) => {
    return mode === 'focused' ? (
        <div style={{
            display: 'flex',
            justifyContent: 'flex-start',
            padding: '1.5rem 0 0.5rem 0',
            marginTop: 'auto'
        }}>
            <button
                onClick={onAIModalOpen}
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
                onClick={onFeedbackModalOpen}
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
            marginTop: 'auto',
            marginBottom: '-0.5rem'
        }}>
            <button
                onClick={onAIModalOpen}
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
};

import React from 'react';
import { FocusModal } from '../../UI/FocusModal';
import { Button } from '../../UI/Button';
import { titleForAiErrorCode } from '../../../lib/aiErrors';

interface AiErrorModalProps {
    open: boolean;
    onClose: () => void;
    message: string | null;
    code?: string | null;
}

/**
 * Clear, presentation-friendly error for AI failures (rate limits, model load, etc.).
 */
export const AiErrorModal: React.FC<AiErrorModalProps> = ({ open, onClose, message, code }) => {
    if (!message) return null;

    return (
        <FocusModal
            isOpen={open}
            onClose={onClose}
            modalContentStyle={{ maxWidth: '420px', padding: '2rem 2rem 1.5rem' }}
        >
            <div style={{ paddingRight: '1.5rem' }}>
                <h3 style={{
                    margin: '0 0 0.75rem',
                    fontSize: 'var(--text-lg)',
                    color: 'var(--secondary)',
                    fontWeight: 700,
                }}>
                    {titleForAiErrorCode(code)}
                </h3>
                <p style={{
                    margin: '0 0 1rem',
                    color: 'var(--text-main)',
                    lineHeight: 1.55,
                    fontSize: 'var(--text-sm)',
                }}>
                    {message}
                </p>
                {code && (
                    <p style={{
                        margin: '0 0 1.25rem',
                        fontSize: '11px',
                        color: 'var(--text-muted)',
                        letterSpacing: '0.02em',
                    }}>
                        Reference: {code}
                    </p>
                )}
                <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
                    <Button variant="outline" onClick={onClose} style={{ minWidth: '120px' }}>
                        Dismiss
                    </Button>
                </div>
            </div>
        </FocusModal>
    );
};

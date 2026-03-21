import React from 'react';
import { RiskAnalysis } from './Insights/RiskAnalysis';
import { MeetingNotes } from './Insights/MeetingNotes';
import type { InsightsProps } from './Insights/Insights.helpers';
import CustomSelect from '../UI/CustomSelect';

const Insights: React.FC<InsightsProps> = (props) => {
    const {
        insightsMode = 'risk-analysis',
        onInsightsModeChange
    } = props;

    return (
        <section className="glass-card quadrant">
            <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3>Insights</h3>
                <CustomSelect
                    value={insightsMode}
                    options={[
                        { label: 'Risk Analysis', value: 'risk-analysis' },
                        { label: 'Meeting Notes', value: 'meeting-notes' }
                    ]}
                    onChange={(val) => onInsightsModeChange?.(val)}
                    style={{ minWidth: '140px' }}
                    preventParentInteraction={true}
                    triggerStyle={{
                        padding: '4px 10px',
                        border: '1px solid var(--border)',
                        backgroundColor: 'rgba(0,0,0,0.02)',
                        minHeight: 'auto'
                    }}
                    optionsStyle={{ marginTop: '4px', padding: '4px' }}
                />
            </div>

            {insightsMode === 'risk-analysis' ? (
                <RiskAnalysis {...props} />
            ) : (
                <MeetingNotes {...props} />
            )}
        </section>
    );
};

export default Insights;

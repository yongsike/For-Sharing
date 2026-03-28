import React from 'react';
export { Button } from '../UI/Button';
import type { PdfExtractedData } from '../../lib/pdfImport';

export const CLIENT_FIELDS: Array<keyof PdfExtractedData['client']> = [
  'name_as_per_id', 'title', 'gender', 'date_of_birth', 'age', 'marital_status',
  'smoker_status', 'race', 'qualification', 'languages_spoken', 'languages_written',
  'nationality', 'singapore_pr', 'id_type', 'id_no',
  'email', 'mobile_no', 'home_no', 'office_no',
  'employment_status', 'occupation',
  'address_type', 'postal_district', 'house_block_no', 'street_name', 'building_name', 'unit_no',
  'risk_profile',
];

export const MANDATORY_CLIENT_FIELDS = [
  'name_as_per_id', 'gender', 'marital_status', 'smoker_status',
  'race', 'nationality', 'singapore_pr', 'id_type', 'employment_status', 'id_no'
];

export const FAMILY_FIELDS = ['family_member_name', 'relationship', 'gender', 'date_of_birth', 'age'];
export const INFLOW_FIELDS = ['employment_income_gross', 'rental_income', 'investment_income', 'cpf_contribution_total'];
export const OUTFLOW_FIELDS = ['household_expenses', 'income_tax', 'insurance_premiums', 'property_expenses', 'property_loan_repayment', 'non_property_loan_repayment', 'regular_investments', 'wealth_transfers'];
export const INSURANCE_FIELDS = ['policy_name', 'policy_type', 'life_assured', 'sum_assured', 'premium_amount', 'payment_frequency', 'payment_term', 'benefit_type', 'start_date', 'expiry_date', 'status'];
export const INVESTMENT_FIELDS = ['policy_name', 'policy_type', 'initial_investment', 'contribution_amount', 'contribution_frequency', 'start_date', 'status'];

export const ENUMS = {
  gender: ['Male', 'Female'],
  title: ['Mr.', 'Ms.', 'Mrs.'],
  marital_status: ['Single', 'Married', 'Divorced', 'Widowed'],
  smoker_status: ['Smoker', 'Non-smoker'],
  race: ['Chinese', 'Malay', 'Indian', 'Caucasian', 'Others'],
  singapore_pr: ['Yes', 'No'],
  id_type: ['NRIC', 'Passport'],
  employment_status: ['Full-time', 'Part-time', 'Contract', 'Self-employed', 'Freelance', 'Student', 'Unemployed', 'Retired'],
  address_type: ['Local', 'Overseas'],
  risk_profile: ['Level 1', 'Level 2', 'Level 3', 'Level 4'],
  investment_policy_type: ['Equity', 'Fixed Income', 'Cash'],
  qualification: ['Primary', 'Secondary', 'Diploma', 'Degree & Above', 'Post-Graduate', 'Others'],
  nationality: ['Singaporean', 'Malaysian', 'Indonesian', 'Indian', 'Chinese', 'British', 'American', 'Australian', 'Others'],
  languages: ['English', 'Mandarin', 'Malay', 'Tamil', 'Hindi', 'Others'],
  relationship: ['Spouse', 'Child', 'Parent'],
  policy_type: ['Life Insurance', 'Health Insurance', 'General Insurance'],
  investment_type: ['Equity', 'Fixed Income', 'Cash', 'Bonds'],
  payment_frequency: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'],
  contribution_frequency: ['Monthly', 'Quarterly', 'Semi-Annual', 'Annual'],
  status: ['Pending', 'Active', 'Lapsed', 'Matured', 'Settled', 'Void']
};

export const formatLabel = (key: string) =>
  key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase());

export const formatValue = (val: any): string => {
  if (val === null || val === undefined) return '—';
  if (typeof val === 'boolean') return val ? 'Yes' : 'No';
  return String(val);
};

export const Section: React.FC<{
  title: string;
  enabled?: boolean;
  onToggle?: () => void;
  children: React.ReactNode;
  hideCheckbox?: boolean;
}> = ({ title, enabled = true, onToggle, children, hideCheckbox }) => (
  <div style={{
    border: '1px solid var(--border, #eee)',
    borderRadius: '14px', overflow: 'hidden',
    opacity: enabled ? 1 : 0.5,
  }}>
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      padding: '0.75rem 1rem',
      background: 'rgba(0,0,0,0.02)',
      borderBottom: '1px solid var(--border, #eee)',
    }}>
      <span style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--secondary, #333)' }}>
        {title}
      </span>
      {!hideCheckbox && onToggle && (
        <label style={{ display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', fontSize: '0.8rem', color: 'var(--text-muted, #888)' }}>
          <input type="checkbox" checked={enabled} onChange={onToggle} />
          Include
        </label>
      )}
    </div>
    <div style={{ padding: '0.75rem 1rem' }}>{children}</div>
  </div>
);

export const EditableFieldRow: React.FC<{
  fieldKey: string;
  label: string;
  val: any;
  oldVal?: string;
  included: boolean;
  onChange: (newVal: any) => void;
  disabled?: boolean;
  error?: boolean;
  required?: boolean;
  customOptions?: string[];
}> = ({ fieldKey, label, val, oldVal, included, onChange, disabled, error, required, customOptions }) => {
  const options = customOptions || (ENUMS as any)[fieldKey] || (fieldKey.includes('language') ? ENUMS.languages : undefined);
  const isDate = fieldKey.includes('date');
  const isArray = Array.isArray(val) || fieldKey.includes('language');

  const inputStyle: React.CSSProperties = {
    padding: '4px 8px',
    border: `1px solid ${error ? '#e74c3c' : 'var(--border, #ddd)'}`,
    borderRadius: '4px',
    fontSize: '0.85rem',
    width: '100%',
    boxSizing: 'border-box' as any,
    color: val ? 'var(--secondary, #333)' : 'var(--text-muted, #888)',
    background: error ? '#fdecea' : (disabled || !included ? '#f5f5f5' : '#fff'),
  };

  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', gap: '6px', padding: '3px 0' }}>
      <div style={{ fontSize: '0.8rem', minWidth: 0, flex: 1 }}>
        <span style={{ color: 'var(--text-muted, #888)', display: 'block', marginBottom: '2px' }}>
          {label}{required && <span style={{ color: '#e74c3c', marginLeft: '2px' }}>*</span>}:
        </span>
        {oldVal !== undefined && oldVal !== String(val) && (
          <div style={{ color: '#c0392b', textDecoration: 'line-through', marginBottom: '4px', fontSize: '0.75rem' }}>Prev: {oldVal}</div>
        )}
        {options ? (
          isArray ? (
            <MultiPillSelect
              options={options}
              values={val || []}
              onChange={onChange}
              disabled={disabled || !included}
              error={error}
            />
          ) : (
            <SingleCustomSelect
              options={options}
              value={val || ''}
              onChange={onChange}
              disabled={disabled || !included}
              error={error}
              placeholder="Select"
            />
          )
        ) : isDate ? (
          <input
            type="date"
            value={val || ''}
            onChange={e => onChange(e.target.value)}
            disabled={disabled || !included}
            style={inputStyle}
            required={included}
          />
        ) : typeof val === 'number' || fieldKey.includes('amount') || fieldKey.includes('income') || fieldKey.includes('expense') || fieldKey.includes('repayment') || fieldKey.includes('investment') || fieldKey.includes('value') || fieldKey.includes('assured') || fieldKey.includes('upkeep') || fieldKey.includes('premium') ? (
          <input
            type="number"
            value={val === null || val === undefined ? '' : val}
            onChange={e => onChange(e.target.value === '' ? null : Number(e.target.value))}
            disabled={disabled || !included}
            style={inputStyle}
            required={included}
            placeholder={label}
          />
        ) : (
          <input
            type="text"
            value={val || ''}
            onChange={e => onChange(e.target.value)}
            disabled={disabled || !included}
            style={inputStyle}
            required={included}
            placeholder={label}
          />
        )}
      </div>
    </div>
  );
};

export const MultiPillSelect: React.FC<{
  options: string[];
  values: string[];
  onChange: (vals: string[]) => void;
  disabled?: boolean;
  error?: boolean;
}> = ({ options, values, onChange, disabled, error }) => {
  const [isOpen, setIsOpen] = React.useState(false);

  const containerStyle: React.CSSProperties = {
    border: `1px solid ${error ? '#e74c3c' : '#ddd'}`,
    borderRadius: '6px',
    padding: '4px',
    background: error ? '#fdecea' : (disabled ? '#f5f5f5' : '#fff'),
    minHeight: '32px',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    position: 'relative',
    cursor: disabled ? 'default' : 'pointer'
  };

  const toggleOpen = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const removeVal = (v: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(values.filter(x => x !== v));
  };

  const addVal = (v: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (values.includes(v)) {
      onChange(values.filter(x => x !== v));
    } else {
      onChange([...values, v]);
    }
  };

  return (
    <div style={{ position: 'relative' }}>
      <div style={containerStyle} onClick={toggleOpen}>
        {values.length === 0 && <span style={{ color: 'var(--text-muted, #888)', fontSize: '0.8rem', paddingLeft: '4px' }}>Select</span>}
        {values.map(v => (
          <div key={v} style={{
            background: 'var(--primary, #c5b358)', color: '#fff',
            borderRadius: '4px', padding: '1px 6px', fontSize: '0.75rem',
            display: 'flex', alignItems: 'center', gap: '4px'
          }}>
            {v}
            {!disabled && <span onClick={(e) => removeVal(v, e)} style={{ cursor: 'pointer', fontWeight: 800 }}>×</span>}
          </div>
        ))}
        <div style={{ marginLeft: 'auto', paddingRight: '4px', color: '#888', display: 'flex', alignItems: 'center' }}>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {isOpen && !disabled && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid #ddd', borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10,
          maxHeight: '150px', overflowY: 'auto', marginTop: '4px'
        }}>
          {options.map(o => (
            <div
              key={o}
              onClick={(e) => addVal(o, e)}
              style={{
                padding: '6px 10px', fontSize: '0.8rem',
                background: values.includes(o) ? 'rgba(197,179,88,0.1)' : 'transparent',
                color: values.includes(o) ? 'var(--primary, #c5b358)' : '#333',
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between'
              }}
            >
              {o}
              {values.includes(o) && <span>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export const SingleCustomSelect: React.FC<{
  options: string[];
  value: string;
  onChange: (val: string) => void;
  disabled?: boolean;
  error?: boolean;
  placeholder?: string;
}> = ({ options, value, onChange, disabled, error, placeholder }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const dropdownRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const toggleOpen = () => {
    if (!disabled) setIsOpen(!isOpen);
  };

  const handleSelect = (v: string, e: React.MouseEvent) => {
    e.stopPropagation();
    onChange(v);
    setIsOpen(false);
  };

  const containerStyle: React.CSSProperties = {
    border: `1px solid ${error ? '#e74c3c' : '#ddd'}`,
    borderRadius: '4px',
    padding: '4px 8px',
    background: error ? '#fdecea' : (disabled ? '#f5f5f5' : '#fff'),
    minHeight: '32px',
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    position: 'relative',
    cursor: disabled ? 'default' : 'pointer',
    fontSize: '0.85rem'
  };

  return (
    <div style={{ position: 'relative' }} ref={dropdownRef}>
      <div style={containerStyle} onClick={toggleOpen}>
        {!value && (
          <span style={{ color: 'var(--text-muted, #888)', fontSize: '0.85rem' }}>
            {placeholder || 'Select'}
          </span>
        )}
        {value && <span style={{ color: 'var(--secondary, #333)', fontSize: '0.85rem' }}>{value}</span>}

        <div style={{ marginLeft: 'auto', color: 'var(--primary)', display: 'flex', alignItems: 'center' }}>
          <svg
            width="12" height="12" viewBox="0 0 24 24" fill="none"
            stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            style={{
              transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
              transition: 'transform 0.2s'
            }}
          >
            <polyline points="6 9 12 15 18 9"></polyline>
          </svg>
        </div>
      </div>

      {isOpen && !disabled && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0,
          background: '#fff', border: '1px solid #ddd', borderRadius: '6px',
          boxShadow: '0 4px 12px rgba(0,0,0,0.1)', zIndex: 10,
          maxHeight: '150px', overflowY: 'auto', marginTop: '4px'
        }}>
          {options.map(o => (
            <div
              key={o}
              onClick={(e) => handleSelect(o, e)}
              style={{
                padding: '8px 10px', fontSize: '0.85rem',
                background: value === o ? 'rgba(197,179,88,0.1)' : 'transparent',
                color: value === o ? 'var(--primary, #c5b358)' : '#333',
                cursor: 'pointer', display: 'flex', justifyContent: 'space-between',
                transition: 'background 0.2s'
              }}
            >
              {o}
              {value === o && <span>✓</span>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

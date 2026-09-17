/* ============================================================
   PayrollConfigPage — Salary Components & Payroll Configuration
   Connected to Spring Boot:
   - POST /api/v1/payroll/components
   ============================================================ */

import { useState } from 'react';
import { Plus, FileText, X } from 'lucide-react';
import { payrollApi } from '../../../api/endpoints/payroll';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { useToast } from '../../../components/ui/Toast';
import {
  isApiError,
  type ApiError,
  type PayrollComponentType,
  type PayrollCalculationType,
} from '../../../api/types';

interface ConfiguredComponent {
  id: string;
  name: string;
  componentType: PayrollComponentType;
  calculationType: PayrollCalculationType;
  defaultValue: number;
}

export function PayrollConfigPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'COMPONENTS' | 'RUNS'>('COMPONENTS');

  const [componentsList, setComponentsList] = useState<ConfiguredComponent[]>([
    {
      id: 'demo-1',
      name: 'Basic Pay',
      componentType: 'EARNING',
      calculationType: 'FIXED',
      defaultValue: 35000,
    },
    {
      id: 'demo-2',
      name: 'House Rent Allowance (HRA)',
      componentType: 'EARNING',
      calculationType: 'PERCENTAGE',
      defaultValue: 20,
    },
    {
      id: 'demo-3',
      name: 'Provident Fund (PF)',
      componentType: 'DEDUCTION',
      calculationType: 'PERCENTAGE',
      defaultValue: 12,
    },
  ]);

  // Modal
  const [isOpen, setIsOpen] = useState(false);
  const [name, setName] = useState('');
  const [componentType, setComponentType] = useState<PayrollComponentType>('EARNING');
  const [calculationType, setCalculationType] = useState<PayrollCalculationType>('FIXED');
  const [defaultValue, setDefaultValue] = useState<number | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || defaultValue === '' || Number(defaultValue) < 0) {
      toast.error('Please enter valid component details');
      return;
    }
    if (calculationType === 'PERCENTAGE' && Number(defaultValue) > 100) {
      toast.error('Percentage components cannot exceed 100%');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await payrollApi.createComponent({
        name: name.trim(),
        componentType,
        calculationType,
        defaultValue: Number(defaultValue),
      });

      const newComp: ConfiguredComponent = {
        id: res.id,
        name: name.trim(),
        componentType,
        calculationType,
        defaultValue: Number(defaultValue),
      };

      setComponentsList((prev) => [...prev, newComp]);
      setIsOpen(false);
      setName('');
      setDefaultValue('');
      toast.success(`Salary component "${newComp.name}" configured!`);
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to create component');
      } else {
        toast.error('Component creation failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h3
            style={{
              margin: 0,
              fontSize: 'var(--font-size-xl)',
              fontWeight: 'var(--font-weight-bold)',
              color: 'var(--color-text-primary)',
            }}
          >
            Staff Payroll & Salary Components
          </h3>
          <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
            Configure institutional salary structure, earnings allowances, and statutory deductions
          </p>
        </div>

        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <div
            style={{
              display: 'flex',
              gap: 8,
              borderBottom: '2px solid #e2e8f0',
              paddingBottom: 2,
            }}
          >
            <button
              type="button"
              onClick={() => setActiveTab('COMPONENTS')}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: 13,
                fontWeight: 600,
                color: activeTab === 'COMPONENTS' ? 'var(--color-primary-600)' : '#64748b',
                borderBottom: activeTab === 'COMPONENTS' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                marginBottom: -4,
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              Salary Components
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('RUNS')}
              style={{
                border: 'none',
                background: 'transparent',
                fontSize: 13,
                fontWeight: 600,
                color: activeTab === 'RUNS' ? 'var(--color-primary-600)' : '#64748b',
                borderBottom: activeTab === 'RUNS' ? '2px solid var(--color-primary-600)' : '2px solid transparent',
                marginBottom: -4,
                padding: '6px 12px',
                cursor: 'pointer',
              }}
            >
              Payroll Runs & Slips
            </button>
          </div>

          {activeTab === 'COMPONENTS' && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsOpen(true)}
            >
              <Plus size={15} />
              <span>Add Component</span>
            </Button>
          )}
        </div>
      </div>

      {/* ── TAB 1: SALARY COMPONENTS ─────────────────────────── */}
      {activeTab === 'COMPONENTS' && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: '#f8fafc', borderBottom: '1px solid #e2e8f0' }}>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b' }}>Component Name</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b' }}>Type</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b' }}>Calculation Mode</th>
                  <th style={{ padding: '12px 16px', fontSize: 12, fontWeight: 600, color: '#64748b' }}>Default Value</th>
                </tr>
              </thead>
              <tbody>
                {componentsList.map((comp) => (
                  <tr key={comp.id} style={{ borderBottom: '1px solid #e2e8f0' }}>
                    <td style={{ padding: '12px 16px', fontWeight: 600, fontSize: 13 }}>{comp.name}</td>
                    <td style={{ padding: '12px 16px' }}>
                      <span
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          padding: '2px 8px',
                          borderRadius: 9999,
                          background: comp.componentType === 'EARNING' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: comp.componentType === 'EARNING' ? '#065f46' : '#991b1b',
                        }}
                      >
                        {comp.componentType}
                      </span>
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, color: '#64748b' }}>
                      {comp.calculationType}
                    </td>
                    <td style={{ padding: '12px 16px', fontSize: 13, fontWeight: 600 }}>
                      {comp.calculationType === 'PERCENTAGE'
                        ? `${comp.defaultValue}% of basic`
                        : `₹${Number(comp.defaultValue).toLocaleString()}`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── TAB 2: PAYROLL RUNS (EMPTY STATE PER CONTRACT) ───── */}
      {activeTab === 'RUNS' && (
        <div
          style={{
            background: '#ffffff',
            border: '1px solid #e2e8f0',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-10) var(--space-6)',
          }}
        >
          <EmptyState
            icon={<FileText size={48} />}
            message="Monthly Payroll Runs & Salary Slips in Staging"
            description="The Spring Boot payroll execution engine, monthly disbursements, and downloadable PDF payslips are scheduled for release in Phase 2. Component configuration above is fully operational and will seed the automated payroll generator."
          />
        </div>
      )}

      {/* ── CREATE COMPONENT MODAL ───────────────────────────── */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.5)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
            padding: 16,
          }}
        >
          <div
            style={{
              background: '#ffffff',
              borderRadius: 16,
              width: '100%',
              maxWidth: 480,
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1)',
              border: '1px solid #e2e8f0',
            }}
          >
            <div style={{ padding: '16px 24px', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>Add Salary Component</h3>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                style={{ border: 'none', background: 'none', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ padding: '24px', display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    Component Name
                  </label>
                  <input
                    type="text"
                    placeholder="E.g., Special Allowance, Travel Concession"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    required
                    style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                      Component Type
                    </label>
                    <select
                      value={componentType}
                      onChange={(e) => setComponentType(e.target.value as PayrollComponentType)}
                      style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                    >
                      <option value="EARNING">EARNING (+)</option>
                      <option value="DEDUCTION">DEDUCTION (-)</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                      Calculation Mode
                    </label>
                    <select
                      value={calculationType}
                      onChange={(e) => setCalculationType(e.target.value as PayrollCalculationType)}
                      style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                    >
                      <option value="FIXED">FIXED AMOUNT (₹)</option>
                      <option value="PERCENTAGE">PERCENTAGE (%)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: '#64748b', textTransform: 'uppercase', marginBottom: 4 }}>
                    {calculationType === 'PERCENTAGE' ? 'Default Percentage (%)' : 'Default Amount (₹)'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder={calculationType === 'PERCENTAGE' ? 'E.g. 15' : 'E.g. 5000'}
                    value={defaultValue}
                    onChange={(e) =>
                      setDefaultValue(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    min={0}
                    max={calculationType === 'PERCENTAGE' ? 100 : undefined}
                    required
                    style={{ width: '100%', height: 40, padding: '0 12px', border: '1px solid #cbd5e1', borderRadius: 6, fontSize: 14 }}
                  />
                </div>
              </div>

              <div style={{ padding: '16px 24px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'flex-end', gap: 12, background: '#f8fafc' }}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isSubmitting}
                >
                  Create Component
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

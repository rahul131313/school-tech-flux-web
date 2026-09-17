/* ============================================================
   FeesPage — Fee Structures, Student Invoices, Payments & Waivers
   Connected to Spring Boot:
   - POST /api/v1/fees/structures
   - POST /api/v1/fees/invoices
   - GET  /api/v1/fees/students/{studentId}/invoices
   - GET  /api/v1/fees/students/{studentId}/invoices/export?format=
   - POST /api/v1/fees/invoices/{invoiceId}/payments
   - POST /api/v1/fees/invoices/{invoiceId}/waivers
   - POST /api/v1/fees/waivers/{id}/approve
   - POST /api/v1/fees/waivers/{id}/reject
   ============================================================ */

import { useState, useEffect } from 'react';
import {
  CreditCard,
  Plus,
  Download,
  Receipt,
  DollarSign,
  X,
  FileSpreadsheet,
} from 'lucide-react';
import { useStudents } from '../../students/hooks/useStudents';
import { useStandards } from '../../settings/hooks/useStandards';
import { useAcademicYears } from '../../settings/hooks/useAcademicYears';
import { feesApi } from '../../../api/endpoints/fees';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import {
  isApiError,
  type ApiError,
  type FeeInvoiceResponse,
  type FeePaymentMode,
  type FeeHeadRequest,
  type ExportFormat,
} from '../../../api/types';
import styles from './FeesPage.module.css';

interface CreatedFeeStructure {
  id: string;
  name: string;
  standardId: string;
  academicYearId: string;
  dueDate: string;
  items: FeeHeadRequest[];
  total: number;
}

export function FeesPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'INVOICES' | 'STRUCTURES' | 'GATEWAY'>('INVOICES');

  // Queries
  const { data: studentsData, isLoading: studentsLoading } = useStudents({ size: 500 });
  const { data: standardsData } = useStandards({ size: 100 });
  const { data: yearsData } = useAcademicYears({ size: 100 });

  // Student Invoices State
  const [selectedStudentId, setSelectedStudentId] = useState('');
  const [invoices, setInvoices] = useState<FeeInvoiceResponse[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);

  // Fee Structures State (in-session management)
  const [structuresList, setStructuresList] = useState<CreatedFeeStructure[]>([]);

  // Modals
  const [isCreateStructureOpen, setIsCreateStructureOpen] = useState(false);
  const [isCreateInvoiceOpen, setIsCreateInvoiceOpen] = useState(false);
  const [selectedInvoiceForPayment, setSelectedInvoiceForPayment] = useState<FeeInvoiceResponse | null>(null);
  const [selectedInvoiceForWaiver, setSelectedInvoiceForWaiver] = useState<FeeInvoiceResponse | null>(null);

  // Structure form
  const [structName, setStructName] = useState('');
  const [structStandardId, setStructStandardId] = useState('');
  const [structYearId, setStructYearId] = useState('');
  const [structDueDate, setStructDueDate] = useState('');
  const [structItems, setStructItems] = useState<FeeHeadRequest[]>([
    { headName: 'Tuition Fee', amount: 12000 },
    { headName: 'Computer Lab Fee', amount: 3000 },
  ]);
  const [isCreatingStructure, setIsCreatingStructure] = useState(false);

  // Invoice creation form
  const [selectedFeeStructureId, setSelectedFeeStructureId] = useState('');
  const [isCreatingInvoice, setIsCreatingInvoice] = useState(false);

  // Payment form
  const [payAmount, setPayAmount] = useState<number | ''>('');
  const [payMode, setPayMode] = useState<FeePaymentMode>('CASH');
  const [payRef, setPayRef] = useState('');
  const [isSubmittingPayment, setIsSubmittingPayment] = useState(false);

  // Waiver form
  const [waiverAmount, setWaiverAmount] = useState<number | ''>('');
  const [waiverReason, setWaiverReason] = useState('');
  const [isSubmittingWaiver, setIsSubmittingWaiver] = useState(false);

  // Automatically select first student once loaded
  useEffect(() => {
    if (!selectedStudentId && studentsData?.content && studentsData.content.length > 0) {
      setSelectedStudentId(studentsData.content[0].id);
    }
  }, [studentsData, selectedStudentId]);

  // Fetch Invoices
  const fetchInvoices = async () => {
    if (!selectedStudentId) return;
    setLoadingInvoices(true);
    try {
      const list = await feesApi.listStudentInvoices(selectedStudentId);
      setInvoices(list);
    } catch {
      toast.error('Failed to load student invoices');
    } finally {
      setLoadingInvoices(false);
    }
  };

  useEffect(() => {
    fetchInvoices();
  }, [selectedStudentId]);

  // Handler: Create Fee Structure
  const handleCreateStructure = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!structName.trim() || !structStandardId || !structYearId || !structDueDate) {
      toast.error('Please complete all structure fields');
      return;
    }

    const validItems = structItems.filter((it) => it.headName.trim() && Number(it.amount) > 0);
    if (validItems.length === 0) {
      toast.error('Add at least one valid fee line item');
      return;
    }

    setIsCreatingStructure(true);
    try {
      const res = await feesApi.createStructure({
        name: structName.trim(),
        standardId: structStandardId,
        academicYearId: structYearId,
        dueDate: structDueDate,
        items: validItems.map((i) => ({ headName: i.headName.trim(), amount: Number(i.amount) })),
      });

      const total = validItems.reduce((acc, curr) => acc + Number(curr.amount), 0);
      const newStruct: CreatedFeeStructure = {
        id: res.id,
        name: structName.trim(),
        standardId: structStandardId,
        academicYearId: structYearId,
        dueDate: structDueDate,
        items: validItems,
        total,
      };

      setStructuresList((prev) => [newStruct, ...prev]);
      setIsCreateStructureOpen(false);
      setStructName('');
      setStructDueDate('');
      toast.success(`Fee structure "${newStruct.name}" created successfully!`);
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to create fee structure');
      } else {
        toast.error('Failed to create fee structure');
      }
    } finally {
      setIsCreatingStructure(false);
    }
  };

  // Handler: Issue Invoice
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentId || !selectedFeeStructureId) {
      toast.error('Please select student and fee structure');
      return;
    }

    setIsCreatingInvoice(true);
    try {
      await feesApi.createInvoice({
        studentId: selectedStudentId,
        feeStructureId: selectedFeeStructureId,
      });
      setIsCreateInvoiceOpen(false);
      setSelectedFeeStructureId('');
      toast.success('Fee invoice generated for student!');
      fetchInvoices();
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to issue invoice');
      } else {
        toast.error('Failed to generate fee invoice');
      }
    } finally {
      setIsCreatingInvoice(false);
    }
  };

  // Handler: Record Payment
  const handlePaymentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForPayment || !payAmount || Number(payAmount) <= 0) {
      toast.error('Enter a valid payment amount');
      return;
    }

    setIsSubmittingPayment(true);
    try {
      const res = await feesApi.recordPayment(selectedInvoiceForPayment.id, {
        amount: Number(payAmount),
        mode: payMode,
        providerReference: payRef.trim() || undefined,
      });

      toast.success(`Payment recorded! Receipt #${res.receiptNumber || res.id.slice(0, 8)}`);
      setSelectedInvoiceForPayment(null);
      setPayAmount('');
      setPayRef('');
      fetchInvoices();
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to record payment');
      } else {
        toast.error('Payment entry failed');
      }
    } finally {
      setIsSubmittingPayment(false);
    }
  };

  // Handler: Request Waiver
  const handleWaiverSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedInvoiceForWaiver || !waiverAmount || Number(waiverAmount) <= 0 || !waiverReason.trim()) {
      toast.error('Enter valid waiver amount and reason');
      return;
    }

    setIsSubmittingWaiver(true);
    try {
      await feesApi.requestWaiver(selectedInvoiceForWaiver.id, {
        amount: Number(waiverAmount),
        reason: waiverReason.trim(),
      });

      toast.success('Fee waiver requested! Pending approval.');
      setSelectedInvoiceForWaiver(null);
      setWaiverAmount('');
      setWaiverReason('');
      fetchInvoices();
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to request waiver');
      } else {
        toast.error('Waiver request failed');
      }
    } finally {
      setIsSubmittingWaiver(false);
    }
  };

  // Handler: Export Invoices
  const handleExport = async (format: ExportFormat) => {
    if (!selectedStudentId) {
      toast.error('Select a student to export invoices');
      return;
    }
    try {
      toast.info(`Generating ${format} invoice document...`);
      await feesApi.exportInvoices(selectedStudentId, format);
      toast.success(`${format} invoices downloaded!`);
    } catch {
      toast.error(`Failed to export ${format} invoice`);
    }
  };

  const selectedStudent = studentsData?.content.find((s) => s.id === selectedStudentId);

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Fee Management & Invoicing</h1>
          <p className={styles.subtitle}>
            Fee structures, student billing, offline & online payments, waivers, and PDF/XLSX export
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
          <div className={styles.tabNav}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'INVOICES' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('INVOICES')}
            >
              <Receipt size={16} />
              <span>Invoices & Payments</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'STRUCTURES' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('STRUCTURES')}
            >
              <FileSpreadsheet size={16} />
              <span>Fee Structures</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'GATEWAY' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('GATEWAY')}
            >
              <CreditCard size={16} />
              <span>Online Gateway</span>
            </button>
          </div>
        </div>
      </div>

      {/* ── TAB 1: STUDENT INVOICES & PAYMENTS ─────────────────── */}
      {activeTab === 'INVOICES' && (
        <>
          <div className={styles.filterCard}>
            <div className={styles.filterGroup}>
              <label className={styles.filterLabel}>Select Student</label>
              <select
                className={styles.filterSelect}
                value={selectedStudentId}
                onChange={(e) => setSelectedStudentId(e.target.value)}
                disabled={studentsLoading}
              >
                {studentsLoading ? (
                  <option>Loading student list...</option>
                ) : (
                  studentsData?.content.map((st) => (
                    <option key={st.id} value={st.id}>
                      {st.fullName} ({st.admissionNumber})
                    </option>
                  ))
                )}
              </select>
            </div>

            <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExport('XLSX')}
                title="Download Excel Invoices"
              >
                <Download size={15} style={{ color: '#10b981' }} />
                <span>Export XLSX</span>
              </Button>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => handleExport('PDF')}
                title="Download PDF Invoices"
              >
                <Download size={15} style={{ color: '#ef4444' }} />
                <span>Export PDF</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setIsCreateInvoiceOpen(true)}
                disabled={!selectedStudentId}
              >
                <Plus size={15} />
                <span>Issue Invoice</span>
              </Button>
            </div>
          </div>

          <div className={styles.card}>
            <div className={styles.toolbar}>
              <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
                Invoices for {selectedStudent?.fullName || 'Student'} ({invoices.length})
              </div>
            </div>

            {loadingInvoices ? (
              <div style={{ padding: 'var(--space-6)' }}>
                <Skeleton variant="table-row" rows={4} columns={7} />
              </div>
            ) : invoices.length === 0 ? (
              <EmptyState
                icon={<Receipt size={44} />}
                message="No invoices generated for this student"
                description="Click 'Issue Invoice' to generate a billing invoice from an active fee structure."
              />
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Invoice #</th>
                      <th className={styles.th}>Due Date</th>
                      <th className={styles.th}>Total</th>
                      <th className={styles.th}>Paid</th>
                      <th className={styles.th}>Waived</th>
                      <th className={styles.th}>Outstanding</th>
                      <th className={styles.th}>Status</th>
                      <th className={styles.th} style={{ width: 170 }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => {
                      let badgeClass = styles.badgePending;
                      if (inv.status === 'PAID') badgeClass = styles.badgePaid;
                      if (inv.status === 'PARTIALLY_PAID') badgeClass = styles.badgePartial;
                      if (inv.status === 'WAIVED') badgeClass = styles.badgeWaived;

                      return (
                        <tr key={inv.id} className={styles.tr}>
                          <td className={styles.td}>
                            <strong>{inv.invoiceNumber}</strong>
                          </td>
                          <td className={styles.td}>{inv.dueDate}</td>
                          <td className={styles.td}>₹{Number(inv.totalAmount).toLocaleString()}</td>
                          <td className={styles.td} style={{ color: '#10b981' }}>
                            ₹{Number(inv.paidAmount).toLocaleString()}
                          </td>
                          <td className={styles.td} style={{ color: '#64748b' }}>
                            ₹{Number(inv.waivedAmount).toLocaleString()}
                          </td>
                          <td className={styles.td} style={{ fontWeight: 600, color: '#ef4444' }}>
                            ₹{Number(inv.outstandingAmount).toLocaleString()}
                          </td>
                          <td className={styles.td}>
                            <span className={`${styles.badge} ${badgeClass}`}>
                              {inv.status}
                            </span>
                          </td>
                          <td className={styles.td}>
                            {inv.status !== 'PAID' && inv.status !== 'WAIVED' && (
                              <div style={{ display: 'flex', gap: 6 }}>
                                <button
                                  type="button"
                                  className={styles.actionBtn}
                                  onClick={() => {
                                    setSelectedInvoiceForPayment(inv);
                                    setPayAmount(inv.outstandingAmount);
                                  }}
                                  title="Record Payment"
                                >
                                  <DollarSign size={13} style={{ color: '#10b981' }} />
                                  <span>Pay</span>
                                </button>
                                <button
                                  type="button"
                                  className={styles.actionBtn}
                                  onClick={() => {
                                    setSelectedInvoiceForWaiver(inv);
                                    setWaiverAmount(inv.outstandingAmount);
                                  }}
                                  title="Request Waiver"
                                >
                                  <span>Waiver</span>
                                </button>
                              </div>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB 2: FEE STRUCTURES CONFIGURATION ──────────────── */}
      {activeTab === 'STRUCTURES' && (
        <>
          <div className={styles.filterCard} style={{ justifyContent: 'space-between', display: 'flex' }}>
            <div>
              <h3 style={{ margin: 0, fontSize: 'var(--font-size-md)', fontWeight: 600 }}>
                Academic Fee Structures
              </h3>
              <p style={{ margin: 0, fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                Configure grade-level tuition heads, laboratory fees, and due dates
              </p>
            </div>

            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCreateStructureOpen(true)}
            >
              <Plus size={15} />
              <span>Create Structure</span>
            </Button>
          </div>

          <div className={styles.card}>
            {structuresList.length === 0 ? (
              <EmptyState
                icon={<FileSpreadsheet size={44} />}
                message="No fee structures created yet"
                description="Click 'Create Structure' above to configure new tuition and term fee schedules."
              />
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.th}>Structure Name</th>
                      <th className={styles.th}>Due Date</th>
                      <th className={styles.th}>Line Items</th>
                      <th className={styles.th}>Total Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {structuresList.map((st) => (
                      <tr key={st.id} className={styles.tr}>
                        <td className={styles.td}>
                          <strong>{st.name}</strong>
                        </td>
                        <td className={styles.td}>{st.dueDate}</td>
                        <td className={styles.td}>
                          <span style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                            {st.items.map((i) => `${i.headName}: ₹${i.amount}`).join(' • ')}
                          </span>
                        </td>
                        <td className={styles.td}>
                          <strong>₹{st.total.toLocaleString()}</strong>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB 3: PAYMENT GATEWAY (EMPTY STATE PER CONTRACT) ─── */}
      {activeTab === 'GATEWAY' && (
        <div className={styles.card} style={{ padding: 'var(--space-10) var(--space-6)' }}>
          <EmptyState
            icon={<CreditCard size={48} />}
            message="Online Payment Gateway (Razorpay) Pending Integration"
            description="As per the technical specifications, parent online payments, Razorpay checkout modal, and automated webhook settlement flows will be activated in the upcoming payments release."
          />
        </div>
      )}

      {/* ── CREATE STRUCTURE MODAL ───────────────────────────── */}
      {isCreateStructureOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: 600 }}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Create Fee Structure</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsCreateStructureOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateStructure}>
              <div className={styles.modalBody}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Structure Name</label>
                  <input
                    type="text"
                    className={styles.filterInput}
                    placeholder="E.g., Class 10 - Term 1 Fees 2026"
                    value={structName}
                    onChange={(e) => setStructName(e.target.value)}
                    required
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Standard / Grade</label>
                    <select
                      className={styles.filterSelect}
                      value={structStandardId}
                      onChange={(e) => setStructStandardId(e.target.value)}
                      required
                    >
                      <option value="">Select Standard</option>
                      {standardsData?.content.map((std) => (
                        <option key={std.id} value={std.id}>
                          {std.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Academic Year</label>
                    <select
                      className={styles.filterSelect}
                      value={structYearId}
                      onChange={(e) => setStructYearId(e.target.value)}
                      required
                    >
                      <option value="">Select Year</option>
                      {yearsData?.content.map((y) => (
                        <option key={y.id} value={y.id}>
                          {y.name}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Due Date</label>
                  <input
                    type="date"
                    className={styles.filterInput}
                    value={structDueDate}
                    onChange={(e) => setStructDueDate(e.target.value)}
                    required
                  />
                </div>

                {/* Line Items */}
                <div style={{ marginTop: 8 }}>
                  <label className={styles.filterLabel}>Fee Line Items</label>
                  {structItems.map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '2fr 1fr 32px',
                        gap: 8,
                        marginTop: 6,
                        alignItems: 'center',
                      }}
                    >
                      <input
                        type="text"
                        className={styles.filterInput}
                        placeholder="Fee head (e.g. Tuition)"
                        value={item.headName}
                        onChange={(e) => {
                          const updated = [...structItems];
                          updated[idx].headName = e.target.value;
                          setStructItems(updated);
                        }}
                        required
                      />
                      <input
                        type="number"
                        step="0.01"
                        className={styles.filterInput}
                        placeholder="Amount"
                        value={item.amount}
                        onChange={(e) => {
                          const updated = [...structItems];
                          updated[idx].amount = Number(e.target.value);
                          setStructItems(updated);
                        }}
                        required
                        min={0.01}
                      />
                      {structItems.length > 1 && (
                        <button
                          type="button"
                          className={styles.closeBtn}
                          onClick={() =>
                            setStructItems((prev) => prev.filter((_, i) => i !== idx))
                          }
                        >
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  ))}

                  <button
                    type="button"
                    className={styles.actionBtn}
                    style={{ marginTop: 8 }}
                    onClick={() =>
                      setStructItems((prev) => [...prev, { headName: '', amount: 1000 }])
                    }
                  >
                    + Add Fee Head
                  </button>
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCreateStructureOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isCreatingStructure}
                >
                  Save Structure
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── ISSUE INVOICE MODAL ──────────────────────────────── */}
      {isCreateInvoiceOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Issue Fee Invoice</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsCreateInvoiceOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreateInvoice}>
              <div className={styles.modalBody}>
                <div>
                  <strong>Student:</strong> {selectedStudent?.fullName} ({selectedStudent?.admissionNumber})
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Fee Structure</label>
                  {structuresList.length === 0 ? (
                    <div style={{ fontSize: 'var(--font-size-xs)', color: '#ef4444' }}>
                      No fee structures configured. Create one in the "Fee Structures" tab first.
                    </div>
                  ) : (
                    <select
                      className={styles.filterSelect}
                      value={selectedFeeStructureId}
                      onChange={(e) => setSelectedFeeStructureId(e.target.value)}
                      required
                    >
                      <option value="">Select Structure</option>
                      {structuresList.map((st) => (
                        <option key={st.id} value={st.id}>
                          {st.name} (₹{st.total.toLocaleString()})
                        </option>
                      ))}
                    </select>
                  )}
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCreateInvoiceOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isCreatingInvoice}
                  disabled={structuresList.length === 0}
                >
                  Generate Invoice
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── RECORD PAYMENT MODAL ─────────────────────────────── */}
      {selectedInvoiceForPayment && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Record Fee Payment</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedInvoiceForPayment(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handlePaymentSubmit}>
              <div className={styles.modalBody}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  Invoice: <strong>{selectedInvoiceForPayment.invoiceNumber}</strong> • Total:{' '}
                  ₹{Number(selectedInvoiceForPayment.totalAmount).toLocaleString()} • Outstanding:{' '}
                  <span style={{ color: '#ef4444', fontWeight: 600 }}>
                    ₹{Number(selectedInvoiceForPayment.outstandingAmount).toLocaleString()}
                  </span>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Payment Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.filterInput}
                    value={payAmount}
                    onChange={(e) =>
                      setPayAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    min={0.01}
                    required
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Payment Mode</label>
                  <select
                    className={styles.filterSelect}
                    value={payMode}
                    onChange={(e) => setPayMode(e.target.value as FeePaymentMode)}
                  >
                    <option value="CASH">CASH</option>
                    <option value="BANK_TRANSFER">BANK TRANSFER (NEFT/RTGS)</option>
                    <option value="UPI">UPI / QR CODE</option>
                    <option value="ONLINE">ONLINE PORTAL</option>
                  </select>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Reference / Transaction ID (Optional)</label>
                  <input
                    type="text"
                    className={styles.filterInput}
                    placeholder="E.g., UTR / Cheque # / UPI Ref"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    maxLength={150}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedInvoiceForPayment(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isSubmittingPayment}
                >
                  Submit Payment
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── REQUEST WAIVER MODAL ─────────────────────────────── */}
      {selectedInvoiceForWaiver && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>Request Fee Waiver / Concession</h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setSelectedInvoiceForWaiver(null)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleWaiverSubmit}>
              <div className={styles.modalBody}>
                <div style={{ fontSize: 'var(--font-size-xs)', color: 'var(--color-text-secondary)' }}>
                  Invoice: <strong>{selectedInvoiceForWaiver.invoiceNumber}</strong>
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Waiver Amount (₹)</label>
                  <input
                    type="number"
                    step="0.01"
                    className={styles.filterInput}
                    value={waiverAmount}
                    onChange={(e) =>
                      setWaiverAmount(e.target.value === '' ? '' : Number(e.target.value))
                    }
                    min={0.01}
                    required
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Justification / Reason</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Provide reason for concession or fee waiver..."
                    value={waiverReason}
                    onChange={(e) => setWaiverReason(e.target.value)}
                    maxLength={500}
                    required
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setSelectedInvoiceForWaiver(null)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isSubmittingWaiver}
                >
                  Request Waiver
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

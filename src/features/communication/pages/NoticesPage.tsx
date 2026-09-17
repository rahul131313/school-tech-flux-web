/* ============================================================
   NoticesPage — School Notices, Bulletins, and Circular Management
   Connected to Spring Boot:
   - POST   /api/v1/notices
   - GET    /api/v1/notices (published)
   - GET    /api/v1/notices/management (administrative)
   - PUT    /api/v1/notices/{id}
   - POST   /api/v1/notices/{id}/publish
   - DELETE /api/v1/notices/{id}
   ============================================================ */

import { useState, useEffect } from 'react';
import {
  Megaphone,
  Plus,
  Globe,
  Edit2,
  Trash2,
  Send,
  X,
  Layers,
} from 'lucide-react';
import { useSections } from '../../settings/hooks/useSections';
import { noticesApi } from '../../../api/endpoints/notices';
import { Button } from '../../../components/ui/Button';
import { EmptyState } from '../../../components/feedback/EmptyState';
import { Skeleton } from '../../../components/feedback/Skeleton';
import { useToast } from '../../../components/ui/Toast';
import {
  isApiError,
  type ApiError,
  type NoticeResponse,
  type NoticeTargetType,
} from '../../../api/types';
import styles from './NoticesPage.module.css';

export function NoticesPage() {
  const toast = useToast();
  const [activeTab, setActiveTab] = useState<'FEED' | 'MANAGEMENT'>('FEED');

  // Queries
  const { data: sectionsData } = useSections({ size: 100 });

  const [publishedNotices, setPublishedNotices] = useState<NoticeResponse[]>([]);
  const [managementNotices, setManagementNotices] = useState<NoticeResponse[]>([]);
  const [loadingFeed, setLoadingFeed] = useState(false);
  const [loadingManagement, setLoadingManagement] = useState(false);

  // Modals & form state
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingNotice, setEditingNotice] = useState<NoticeResponse | null>(null);

  const [targetType, setTargetType] = useState<NoticeTargetType>('SCHOOL');
  const [targetId, setTargetId] = useState('');
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [scheduledAt, setScheduledAt] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load Published Feed
  const fetchPublished = async () => {
    setLoadingFeed(true);
    try {
      const list = await noticesApi.listPublished();
      setPublishedNotices(list);
    } catch {
      toast.error('Failed to load published bulletins');
    } finally {
      setLoadingFeed(false);
    }
  };

  // Load Management List
  const fetchManagement = async () => {
    setLoadingManagement(true);
    try {
      const list = await noticesApi.listManagement();
      setManagementNotices(list);
    } catch {
      toast.error('Failed to load administrative notices');
    } finally {
      setLoadingManagement(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'FEED') {
      fetchPublished();
    } else {
      fetchManagement();
    }
  }, [activeTab]);

  // Open Edit Modal
  const handleOpenEdit = (notice: NoticeResponse) => {
    setEditingNotice(notice);
    setTargetType(notice.targetType);
    setTargetId(notice.targetId || '');
    setTitle(notice.title);
    setMessage(notice.message);
    setScheduledAt(notice.scheduledAt ? notice.scheduledAt.slice(0, 16) : '');
    setIsCreateOpen(true);
  };

  // Submit Notice (Create or Update)
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !message.trim()) {
      toast.error('Title and message are required');
      return;
    }
    if (targetType !== 'SCHOOL' && !targetId.trim()) {
      toast.error('Target ID is required for section/student notices');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        targetType,
        targetId: targetType === 'SCHOOL' ? undefined : targetId.trim(),
        title: title.trim(),
        message: message.trim(),
        scheduledAt: scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
      };

      if (editingNotice) {
        await noticesApi.update(editingNotice.id, payload);
        toast.success('Notice updated successfully!');
      } else {
        await noticesApi.create(payload);
        toast.success('Notice draft / scheduled bulletin created!');
      }

      setIsCreateOpen(false);
      setEditingNotice(null);
      setTitle('');
      setMessage('');
      setTargetId('');
      setScheduledAt('');
      if (activeTab === 'MANAGEMENT') fetchManagement();
      else fetchPublished();
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to save notice');
      } else {
        toast.error('Operation failed');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Publish Notice
  const handlePublish = async (id: string) => {
    try {
      await noticesApi.publish(id);
      toast.success('Notice published to school feed!');
      fetchManagement();
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to publish notice');
      } else {
        toast.error('Publish failed');
      }
    }
  };

  // Delete Notice
  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this notice?')) return;
    try {
      await noticesApi.delete(id);
      toast.success('Notice deleted');
      fetchManagement();
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to delete notice');
      } else {
        toast.error('Delete failed');
      }
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>School Bulletins & Circulars</h1>
          <p className={styles.subtitle}>
            Broadcast official announcements, circulars, and scheduled bulletins
          </p>
        </div>

        <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center' }}>
          <div className={styles.tabNav}>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'FEED' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('FEED')}
            >
              <Globe size={16} />
              <span>Published Feed</span>
            </button>
            <button
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'MANAGEMENT' ? styles.tabBtnActive : ''}`}
              onClick={() => setActiveTab('MANAGEMENT')}
            >
              <Layers size={16} />
              <span>Notice Management</span>
            </button>
          </div>

          <Button
            variant="primary"
            size="sm"
            onClick={() => {
              setEditingNotice(null);
              setTitle('');
              setMessage('');
              setTargetId('');
              setScheduledAt('');
              setTargetType('SCHOOL');
              setIsCreateOpen(true);
            }}
          >
            <Plus size={15} />
            <span>New Notice</span>
          </Button>
        </div>
      </div>

      {/* ── TAB 1: PUBLISHED BULLETINS FEED ──────────────────── */}
      {activeTab === 'FEED' && (
        <div className={styles.feedContainer}>
          {loadingFeed ? (
            <Skeleton variant="rect" rows={3} />
          ) : publishedNotices.length === 0 ? (
            <EmptyState
              icon={<Megaphone size={48} />}
              message="No published notices right now"
              description="Official circulars and announcements will appear here once published by school administration."
            />
          ) : (
            <div className={styles.feedGrid}>
              {publishedNotices.map((n) => (
                <div key={n.id} className={styles.noticeCard}>
                  <div className={styles.noticeCardHeader}>
                    <span className={styles.targetBadge}>
                      {n.targetType === 'SCHOOL' ? 'School-wide' : `Target: ${n.targetType}`}
                    </span>
                    <span className={styles.noticeDate}>
                      {n.publishedAt ? new Date(n.publishedAt).toLocaleDateString() : 'Recent'}
                    </span>
                  </div>
                  <h3 className={styles.noticeCardTitle}>{n.title}</h3>
                  <p className={styles.noticeCardMessage}>{n.message}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── TAB 2: ADMINISTRATIVE MANAGEMENT ─────────────────── */}
      {activeTab === 'MANAGEMENT' && (
        <div className={styles.card}>
          <div className={styles.toolbar}>
            <div style={{ fontWeight: 600, fontSize: 'var(--font-size-sm)' }}>
              All Notices ({managementNotices.length})
            </div>
          </div>

          {loadingManagement ? (
            <div style={{ padding: 'var(--space-6)' }}>
              <Skeleton variant="table-row" rows={5} columns={5} />
            </div>
          ) : managementNotices.length === 0 ? (
            <EmptyState
              icon={<Megaphone size={44} />}
              message="No notices configured"
              description="Click 'New Notice' above to draft or schedule announcements."
            />
          ) : (
            <div className={styles.tableWrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th className={styles.th}>Title</th>
                    <th className={styles.th}>Audience</th>
                    <th className={styles.th}>Scheduled / Published</th>
                    <th className={styles.th}>Status</th>
                    <th className={styles.th} style={{ width: 160 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {managementNotices.map((n) => (
                    <tr key={n.id} className={styles.tr}>
                      <td className={styles.td}>
                        <div style={{ fontWeight: 600 }}>{n.title}</div>
                        <div
                          style={{
                            fontSize: 'var(--font-size-xs)',
                            color: 'var(--color-text-secondary)',
                            maxWidth: 320,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                          }}
                        >
                          {n.message}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span className={styles.targetBadge}>
                          {n.targetType}
                          {n.targetId ? ` (${n.targetId.slice(0, 8)}...)` : ''}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div style={{ fontSize: 'var(--font-size-xs)' }}>
                          {n.publishedAt
                            ? `Published: ${new Date(n.publishedAt).toLocaleDateString()}`
                            : n.scheduledAt
                            ? `Scheduled: ${new Date(n.scheduledAt).toLocaleString()}`
                            : 'Unscheduled draft'}
                        </div>
                      </td>
                      <td className={styles.td}>
                        <span
                          className={`${styles.badge} ${
                            n.status === 'PUBLISHED'
                              ? styles.badgePublished
                              : n.status === 'SCHEDULED'
                              ? styles.badgeScheduled
                              : styles.badgeDraft
                          }`}
                        >
                          {n.status}
                        </span>
                      </td>
                      <td className={styles.td}>
                        <div style={{ display: 'flex', gap: 6 }}>
                          {n.status !== 'PUBLISHED' && (
                            <button
                              type="button"
                              className={styles.actionBtn}
                              onClick={() => handlePublish(n.id)}
                              title="Publish immediately"
                            >
                              <Send size={13} style={{ color: 'var(--color-primary-600)' }} />
                              <span>Publish</span>
                            </button>
                          )}
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleOpenEdit(n)}
                            title="Edit notice"
                          >
                            <Edit2 size={13} />
                          </button>
                          <button
                            type="button"
                            className={styles.actionBtn}
                            onClick={() => handleDelete(n.id)}
                            title="Delete notice"
                          >
                            <Trash2 size={13} style={{ color: '#ef4444' }} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ── CREATE / EDIT NOTICE MODAL ───────────────────────── */}
      {isCreateOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                {editingNotice ? 'Edit Notice' : 'Draft / Schedule Bulletin'}
              </h3>
              <button
                type="button"
                className={styles.closeBtn}
                onClick={() => setIsCreateOpen(false)}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className={styles.modalBody}>
                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Target Audience</label>
                  <select
                    className={styles.filterSelect}
                    value={targetType}
                    onChange={(e) => setTargetType(e.target.value as NoticeTargetType)}
                  >
                    <option value="SCHOOL">School-wide (All Users)</option>
                    <option value="SECTION">Specific Section / Class</option>
                    <option value="STUDENT">Individual Student</option>
                  </select>
                </div>

                {targetType === 'SECTION' && (
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Target Section</label>
                    <select
                      className={styles.filterSelect}
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      required
                    >
                      <option value="">Select Section</option>
                      {sectionsData?.content.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {targetType === 'STUDENT' && (
                  <div className={styles.filterGroup}>
                    <label className={styles.filterLabel}>Target Student UUID</label>
                    <input
                      type="text"
                      className={styles.filterInput}
                      placeholder="Enter student UUID"
                      value={targetId}
                      onChange={(e) => setTargetId(e.target.value)}
                      required
                    />
                  </div>
                )}

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Notice Title</label>
                  <input
                    type="text"
                    className={styles.filterInput}
                    placeholder="E.g., Annual Sports Day Rescheduled"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    maxLength={180}
                    required
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Message Content</label>
                  <textarea
                    className={styles.textarea}
                    placeholder="Write announcement body..."
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    maxLength={4000}
                    required
                    style={{ minHeight: 120 }}
                  />
                </div>

                <div className={styles.filterGroup}>
                  <label className={styles.filterLabel}>Scheduled Broadcast Time (Optional)</label>
                  <input
                    type="datetime-local"
                    className={styles.filterInput}
                    value={scheduledAt}
                    onChange={(e) => setScheduledAt(e.target.value)}
                  />
                </div>
              </div>

              <div className={styles.modalFooter}>
                <Button
                  type="button"
                  variant="secondary"
                  size="sm"
                  onClick={() => setIsCreateOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="sm"
                  loading={isSubmitting}
                >
                  {editingNotice ? 'Save Changes' : 'Save Notice'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

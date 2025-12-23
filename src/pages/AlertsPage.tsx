import { useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { DashboardLayout } from '../components/layout/DashboardLayout';
import type { Alert } from '../types/alert';
import {
  getAllAlerts,
  markAlertAsRead,
  markAllAlertsAsRead,
  addCommentToAlert,
  deleteComment,
} from '../utils/alertDb';
import { getAlertPriorityColor } from '../types/alert';
import { getUserByEmail } from '../utils/userDb';
import toast from 'react-hot-toast';

export function AlertsPage() {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [filter, setFilter] = useState<'all' | 'unread' | 'pilot'>('all');
  const [loading, setLoading] = useState(true);
  const [expandedAlertId, setExpandedAlertId] = useState<string | null>(null);
  const [commentText, setCommentText] = useState<{ [key: string]: string }>({});
  const [showCommentBox, setShowCommentBox] = useState<{ [key: string]: boolean }>({});
  const [userNames, setUserNames] = useState<{ [email: string]: string }>({});

  const currentUserEmail = JSON.parse(localStorage.getItem('auth_user') || '{}').email || '';

  const loadUserNames = useCallback(async () => {
    const emails = new Set<string>();
    alerts.forEach(alert => {
      emails.add(alert.createdBy);
      alert.comments?.forEach(comment => emails.add(comment.createdBy));
    });

    const names: { [email: string]: string } = {};
    for (const email of emails) {
      const user = await getUserByEmail(email);
      names[email] = user?.name || email.split('@')[0];
    }
    setUserNames(names);
  }, [alerts]);

  useEffect(() => {
    loadAlerts();
  }, []);

  useEffect(() => {
    if (alerts.length > 0) {
      loadUserNames();
    }
  }, [alerts.length, loadUserNames]);

  async function loadAlerts() {
    try {
      const data = await getAllAlerts();
      setAlerts(data);
    } catch (error) {
      console.error('Error loading alerts:', error);
      toast.error('Failed to load alerts');
    } finally {
      setLoading(false);
    }
  }

  async function handleMarkAsRead(alertId: string) {
    try {
      await markAlertAsRead(alertId);
      setAlerts(prev =>
        prev.map(alert =>
          alert.id === alertId ? { ...alert, isRead: true, readAt: new Date().toISOString() } : alert
        )
      );
    } catch (error) {
      console.error('Error marking alert as read:', error);
    }
  }

  async function handleMarkAllAsRead() {
    try {
      await markAllAlertsAsRead();
      setAlerts(prev =>
        prev.map(alert => ({
          ...alert,
          isRead: true,
          readAt: alert.readAt || new Date().toISOString(),
        }))
      );
      toast.success('All alerts marked as read');
    } catch (error) {
      console.error('Error marking all as read:', error);
      toast.error('Failed to mark alerts as read');
    }
  }

  async function handleAddComment(alertId: string) {
    const text = commentText[alertId]?.trim();
    if (!text) return;

    try {
      await addCommentToAlert(alertId, text, currentUserEmail);
      setCommentText(prev => ({ ...prev, [alertId]: '' }));
      setShowCommentBox(prev => ({ ...prev, [alertId]: false }));
      await loadAlerts();
      toast.success('Comment added');
    } catch (error) {
      console.error('Error adding comment:', error);
      toast.error('Failed to add comment');
    }
  }

  async function handleDeleteComment(alertId: string, commentId: string) {
    if (!confirm('Delete this comment?')) return;

    try {
      await deleteComment(alertId, commentId);
      await loadAlerts();
      toast.success('Comment deleted');
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  }

  const filteredAlerts = alerts.filter(alert => {
    if (filter === 'unread') return !alert.isRead;
    if (filter === 'pilot') return !!alert.pilotId;
    return true;
  });

  const unreadCount = alerts.filter(a => !a.isRead).length;

  function formatRelativeTime(dateString: string): string {
    const now = new Date();
    const date = new Date(dateString);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Activity & Alerts</h1>
              <p className="mt-1 text-gray-600">
                Stay updated with real-time notifications and project activities
              </p>
            </div>
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllAsRead}
                className="px-4 py-2 text-sm text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 rounded-lg transition-colors"
              >
                Mark all as read
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'all'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All ({alerts.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'unread'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Unread ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('pilot')}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === 'pilot'
                  ? 'bg-indigo-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              Pilot Activities ({alerts.filter(a => a.pilotId).length})
            </button>
          </div>
        </div>

        {/* Timeline */}
        {filteredAlerts.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-gray-600 text-lg">No alerts to display</p>
          </div>
        ) : (
          <div className="relative">
            {/* Timeline line */}
            <div className="absolute left-8 top-0 bottom-0 w-0.5 bg-gray-200"></div>

            <div className="space-y-6">
              <AnimatePresence>
                {filteredAlerts.map((alert, index) => (
                  <motion.div
                    key={alert.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                    transition={{ delay: index * 0.05 }}
                    className="relative"
                  >
                    {/* Timeline dot */}
                    <div
                      className={`absolute left-6 w-5 h-5 rounded-full border-4 border-white shadow-md ${
                        alert.isRead ? 'bg-gray-300' : 'bg-indigo-600'
                      }`}
                    ></div>

                    {/* Alert card */}
                    <div
                      className={`ml-16 bg-white rounded-lg shadow-sm border-2 transition-all hover:shadow-md ${
                        !alert.isRead ? 'border-indigo-200' : 'border-gray-200'
                      }`}
                      onClick={() => !alert.isRead && handleMarkAsRead(alert.id)}
                    >
                      <div
                        className="p-5 cursor-pointer"
                        onClick={() =>
                          setExpandedAlertId(expandedAlertId === alert.id ? null : alert.id)
                        }
                      >
                        {/* Header */}
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex items-start gap-3 flex-1">
                            <div className="flex-1">
                              <h3 className="font-semibold text-gray-900">{alert.title}</h3>
                              {alert.pilotName && (
                                <p className="text-xs text-gray-500 mt-0.5">{alert.pilotName}</p>
                              )}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span
                              className={`px-2 py-1 text-xs font-medium rounded border ${getAlertPriorityColor(
                                alert.priority
                              )}`}
                            >
                              {alert.priority}
                            </span>
                            {!alert.isRead && (
                              <span className="w-2 h-2 bg-indigo-600 rounded-full"></span>
                            )}
                          </div>
                        </div>

                        {/* Message */}
                        <p className="text-gray-700 mb-3 ml-11">{alert.message}</p>

                        {/* Footer */}
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-4 text-sm text-gray-500">
                            <span>{formatRelativeTime(alert.createdAt)}</span>
                            {alert.comments && alert.comments.length > 0 && (
                              <span className="flex items-center gap-1">
                                {alert.comments.length} comment
                                {alert.comments.length !== 1 ? 's' : ''}
                              </span>
                            )}
                          </div>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setExpandedAlertId(expandedAlertId === alert.id ? null : alert.id);
                              setShowCommentBox(prev => ({
                                ...prev,
                                [alert.id]: true,
                              }));
                            }}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                          >
                            Add comment
                          </button>
                        </div>
                      </div>

                      {/* Expanded content */}
                      <AnimatePresence>
                        {expandedAlertId === alert.id && (
                          <motion.div
                            initial={{ height: 0, opacity: 0 }}
                            animate={{ height: 'auto', opacity: 1 }}
                            exit={{ height: 0, opacity: 0 }}
                            transition={{ duration: 0.2 }}
                            className="border-t border-gray-100 overflow-hidden"
                          >
                            <div className="p-5 space-y-4">
                              {/* Comments */}
                              {alert.comments && alert.comments.length > 0 && (
                                <div className="space-y-3">
                                  <h4 className="text-sm font-semibold text-gray-700">
                                    Comments
                                  </h4>
                                  {alert.comments.map(comment => (
                                    <motion.div
                                      key={comment.id}
                                      initial={{ opacity: 0, x: -10 }}
                                      animate={{ opacity: 1, x: 0 }}
                                      className="bg-gray-50 rounded-lg p-3"
                                    >
                                      <div className="flex items-start justify-between mb-1">
                                        <span className="text-sm font-medium text-gray-900">
                                          {userNames[comment.createdBy] || comment.createdBy}
                                        </span>
                                        <div className="flex items-center gap-2">
                                          <span className="text-xs text-gray-500">
                                            {formatRelativeTime(comment.createdAt)}
                                          </span>
                                          {comment.createdBy === currentUserEmail && (
                                            <button
                                              onClick={() =>
                                                handleDeleteComment(alert.id, comment.id)
                                              }
                                              className="text-xs text-red-600 hover:text-red-700"
                                            >
                                              Delete
                                            </button>
                                          )}
                                        </div>
                                      </div>
                                      <p className="text-sm text-gray-700">{comment.text}</p>
                                      {comment.isEdited && (
                                        <span className="text-xs text-gray-400 italic">
                                          (edited)
                                        </span>
                                      )}
                                    </motion.div>
                                  ))}
                                </div>
                              )}

                              {/* Comment input */}
                              {showCommentBox[alert.id] && (
                                <motion.div
                                  initial={{ opacity: 0, y: -10 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className="space-y-2"
                                >
                                  <textarea
                                    value={commentText[alert.id] || ''}
                                    onChange={(e) =>
                                      setCommentText(prev => ({
                                        ...prev,
                                        [alert.id]: e.target.value,
                                      }))
                                    }
                                    placeholder="Write a comment..."
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm resize-none"
                                    rows={3}
                                  />
                                  <div className="flex justify-end gap-2">
                                    <button
                                      onClick={() =>
                                        setShowCommentBox(prev => ({
                                          ...prev,
                                          [alert.id]: false,
                                        }))
                                      }
                                      className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-700 rounded-lg hover:bg-gray-100 transition-colors"
                                    >
                                      Cancel
                                    </button>
                                    <button
                                      onClick={() => handleAddComment(alert.id)}
                                      disabled={!commentText[alert.id]?.trim()}
                                      className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                                    >
                                      Post Comment
                                    </button>
                                  </div>
                                </motion.div>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}

import { useState, useEffect, useRef, useCallback } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  RefreshCw,
  Loader2,
  CheckCircle2,
  XCircle,
  Clock,
  CheckCheck,
  Inbox,
  AlertCircle,
  Download,
  FileText,
} from 'lucide-react';
import { fetchTasks, fetchChannels, getDownloadUrl } from '../services/api';
import { humanizeTaskType } from '../utils/taskTypes';
import './TaskHistory.css';

const POLL_INTERVAL_MS = 5000;
const ACTIVE_STATUSES = ['PENDING', 'PROCESSING'];

const StatusBadge = ({ status }) => {
  const normalized = (status || '').toUpperCase();

  const config = {
    PENDING: { label: 'Pending', icon: <Clock size={14} />, className: 'pending' },
    PROCESSING: { label: 'Processing', icon: <Loader2 size={14} className="badge-spinner" />, className: 'processing' },
    COMPLETED: { label: 'Completed', icon: <CheckCircle2 size={14} />, className: 'completed' },
    COMPLETED_WITH_ERRORS: {
      label: 'Completed with errors',
      icon: <AlertCircle size={14} />,
      className: 'completed-with-error',
    },
    FAILED: { label: 'Failed', icon: <XCircle size={14} />, className: 'failed' },
  }[normalized] || { label: status || 'Unknown', icon: <AlertCircle size={14} />, className: 'unknown' };

  return (
    <span className={`status-badge ${config.className}`}>
      {config.icon}
      <span>{config.label}</span>
    </span>
  );
};

// Pull a clean, human-friendly file name out of whatever the backend sends.
// Falls back to the basename of the uploaded S3 key.
const getFileName = (task) => {
  const raw =
    task.file_name ||
    task.original_filename ||
    task.filename ||
    task.input_s3_key ||
    '';
  if (!raw) return '—';
  const base = raw.split('/').pop();
  // S3 keys often carry a numeric/uuid prefix like "1700000-products.xlsx".
  return base.replace(/^\d{6,}[-_]/, '') || base;
};

// The S3 key (or direct URL) of the generated error report, if the task
// produced one. Tries the common field names the backend might use. For tasks
// that finished as COMPLETED_WITH_ERRORS, the report lives in `result_s3_key`.
const getErrorFileRef = (task) => {
  const status = (task.status || '').toUpperCase();
  return (
    task.error_file_url ||
    task.error_file_key ||
    task.error_s3_key ||
    task.error_report_s3_key ||
    task.error_report_key ||
    (status === 'COMPLETED_WITH_ERRORS' ? task.result_s3_key : null) ||
    null
  );
};

const formatDateTime = (value) => {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

const TaskHistory = () => {
  const [tasks, setTasks] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState(null);
  const [toast, setToast] = useState(null);
  const [channelMap, setChannelMap] = useState({});
  const [downloadingId, setDownloadingId] = useState(null);

  const intervalRef = useRef(null);
  const location = useLocation();
  const navigate = useNavigate();

  // Build an id -> name lookup so we can show the channel name even when the
  // task payload only carries the channel_id.
  useEffect(() => {
    fetchChannels()
      .then((channels) => {
        if (!Array.isArray(channels)) return;
        const map = {};
        channels.forEach((c) => {
          map[c.channel_id] = c.channel_name;
        });
        setChannelMap(map);
      })
      .catch(() => {
        /* non-critical: fall back to the raw channel_id */
      });
  }, []);

  const getChannelName = useCallback(
    (task) =>
      task.channel_name || channelMap[task.channel_id] || task.channel_id || '—',
    [channelMap]
  );

  // Resolve the error report reference to a real URL and trigger a download.
  const handleDownloadError = useCallback(async (task) => {
    const ref = getErrorFileRef(task);
    if (!ref) return;
    setDownloadingId(task.id);
    try {
      // A full URL can be used directly; a bare S3 key needs a presigned URL.
      const url = /^https?:\/\//i.test(ref)
        ? ref
        : (await getDownloadUrl(ref)).url;
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', '');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      setToast(
        err.response?.data?.message || 'Could not download the error file.'
      );
    } finally {
      setDownloadingId(null);
    }
  }, []);

  const loadTasks = useCallback(async ({ silent } = {}) => {
    if (silent) {
      setIsRefreshing(true);
    } else {
      setIsLoading(true);
    }
    try {
      const data = await fetchTasks();
      setTasks(Array.isArray(data) ? data : []);
      setError(null);
    } catch (err) {
      setError(
        err.response?.data?.message || err.message || 'Failed to load tasks.'
      );
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  // Show the success toast passed from the upload form, then clear the
  // navigation state so a refresh doesn't re-show it.
  useEffect(() => {
    if (location.state?.toast) {
      setToast(location.state.toast);
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, [location, navigate]);

  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Initial load.
  useEffect(() => {
    loadTasks();
  }, [loadTasks]);

  // Polling: only run while at least one task is PENDING or PROCESSING.
  // Stop the interval once everything is resolved.
  useEffect(() => {
    const hasActive = tasks.some((t) =>
      ACTIVE_STATUSES.includes((t.status || '').toUpperCase())
    );

    if (hasActive && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        loadTasks({ silent: true });
      }, POLL_INTERVAL_MS);
    } else if (!hasActive && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [tasks, loadTasks]);

  const hasActiveTasks = tasks.some((t) =>
    ACTIVE_STATUSES.includes((t.status || '').toUpperCase())
  );

  return (
    <div className="task-history">
      {toast && (
        <div className="toast toast-success">
          <CheckCheck size={18} />
          <span>{toast}</span>
        </div>
      )}

      <div className="task-history-header">
        <div>
          <h2>Task History</h2>
          <p>Track the progress of your background data processing tasks.</p>
        </div>
        <div className="task-history-actions">
          {hasActiveTasks && (
            <span className="live-indicator">
              <span className="live-dot" />
              Auto-refreshing
            </span>
          )}
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => loadTasks({ silent: true })}
            disabled={isRefreshing}
          >
            <RefreshCw size={16} className={isRefreshing ? 'spinner-small' : ''} />
            Refresh
          </button>
        </div>
      </div>

      <div className="task-table-card">
        {isLoading ? (
          <div className="task-state">
            <Loader2 size={32} className="spinner" />
            <p>Loading tasks...</p>
          </div>
        ) : error ? (
          <div className="task-state">
            <AlertCircle size={32} className="state-icon-error" />
            <p>{error}</p>
            <button type="button" className="btn btn-secondary" onClick={() => loadTasks()}>
              <RefreshCw size={16} />
              Try Again
            </button>
          </div>
        ) : tasks.length === 0 ? (
          <div className="task-state">
            <Inbox size={32} className="state-icon-muted" />
            <p>No tasks yet. Submitted uploads will appear here.</p>
          </div>
        ) : (
          <div className="task-table-wrapper">
            <table className="task-table">
              <thead>
                <tr>
                  <th className="col-id">ID</th>
                  <th>Task Type</th>
                  <th>File Name</th>
                  <th>Status</th>
                  <th>Channel</th>
                  <th>Tenant ID</th>
                  <th>Submitted At</th>
                  <th>Details</th>
                  <th className="col-error">Error File</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => {
                  const status = (task.status || '').toUpperCase();
                  const errorRef = getErrorFileRef(task);
                  const fileName = getFileName(task);
                  const hasError =
                    status === 'FAILED' || status === 'COMPLETED_WITH_ERRORS';
                  const detail = hasError
                    ? task.error_message || task.message
                    : task.message;
                  return (
                    <tr key={task.id}>
                      <td className="cell-id">{task.id ?? task.task_id ?? '—'}</td>
                      <td className="cell-type">{humanizeTaskType(task.task_type)}</td>
                      <td className="cell-file" title={fileName}>
                        <FileText size={13} className="cell-file-icon" />
                        <span className="cell-file-name">{fileName}</span>
                      </td>
                      <td>
                        <StatusBadge status={task.status} />
                      </td>
                      <td className="cell-muted">{getChannelName(task)}</td>
                      <td className="cell-muted">{task.tenant_id || '—'}</td>
                      <td className="cell-date">{formatDateTime(task.created_at)}</td>
                      <td
                        className={`cell-detail ${hasError ? 'is-error' : ''}`}
                        title={detail || ''}
                      >
                        {detail || '—'}
                      </td>
                      <td className="col-error">
                        {errorRef ? (
                          <button
                            type="button"
                            className="btn-download"
                            onClick={() => handleDownloadError(task)}
                            disabled={downloadingId === task.id}
                            title="Download error file"
                          >
                            {downloadingId === task.id ? (
                              <Loader2 size={15} className="spinner-small" />
                            ) : (
                              <Download size={15} />
                            )}
                            <span>Error file</span>
                          </button>
                        ) : hasError ? (
                          <span className="no-error-file">No file</span>
                        ) : (
                          <span className="no-error-file">—</span>
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
    </div>
  );
};

export default TaskHistory;

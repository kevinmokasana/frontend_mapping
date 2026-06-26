import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, File, X, AlertCircle, Download, Loader2 } from 'lucide-react';
import {
  fetchChannels,
  fetchTenants,
  getUploadUrl,
  uploadFileToS3,
  submitTask,
} from '../../services/api';
import './UploadForm.css';

const UploadForm = ({ title, endpoint, requiresChannel, requiresTenant, templateEndpoint }) => {
  const [file, setFile] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [phase, setPhase] = useState(''); // 'uploading' | 'submitting'
  const [uploadProgress, setUploadProgress] = useState(0);
  const [status, setStatus] = useState(null); // 'error' | null
  const [message, setMessage] = useState('');

  // Dynamic fields
  const [channels, setChannels] = useState([]);
  const [tenants, setTenants] = useState([]);
  const [selectedChannel, setSelectedChannel] = useState('');
  const [selectedTenant, setSelectedTenant] = useState('');

  const fileInputRef = useRef(null);
  const navigate = useNavigate();

  // task_type is the old endpoint name without the leading slash (e.g. "core-creation").
  const taskType = endpoint.replace(/^\//, '');

  useEffect(() => {
    // Load metadata if required
    const loadMetadata = async () => {
      try {
        if (requiresChannel) {
          const ch = await fetchChannels();
          setChannels(ch);
        }
        if (requiresTenant) {
          const t = await fetchTenants();
          setTenants(t);
        }
      } catch (err) {
        console.error("Failed to load metadata", err);
      }
    };
    loadMetadata();

    // Reset state when route changes
    setFile(null);
    setStatus(null);
    setMessage('');
    setSelectedChannel('');
    setSelectedTenant('');
    setUploadProgress(0);
  }, [endpoint, requiresChannel, requiresTenant]);

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile.name.endsWith('.xlsx')) {
        setFile(droppedFile);
        setStatus(null);
      } else {
        setStatus('error');
        setMessage('Please upload a valid .xlsx file.');
      }
    }
  };

  const handleFileSelect = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      setFile(e.target.files[0]);
      setStatus(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setStatus('error');
      setMessage('Please select a file to upload.');
      return;
    }

    if (requiresChannel && !selectedChannel) {
      setStatus('error');
      setMessage('Please select a channel.');
      return;
    }

    if (requiresTenant && !selectedTenant) {
      setStatus('error');
      setMessage('Please select a tenant.');
      return;
    }

    setIsSubmitting(true);
    setStatus(null);
    setMessage('');
    setUploadProgress(0);

    try {
      // 1. Get a presigned URL + reserved object key from the backend.
      setPhase('uploading');
      const { url, key } = await getUploadUrl(file.name);

      // 2. Upload the file directly to S3.
      await uploadFileToS3(url, file, setUploadProgress);

      // 3. Register the background task against the uploaded object.
      setPhase('submitting');
      const payload = {
        task_type: taskType,
        input_s3_key: key,
      };

      if (requiresChannel) {
        payload.channel_id = Number(selectedChannel);
      }

      if (requiresTenant) {
        const tenant = tenants.find((t) => t.tenant_id === selectedTenant);
        if (tenant) {
          payload.tenant_id = tenant.tenant_id;
          payload.org_id = tenant.org_id;
        }
      }

      await submitTask(payload);

      // 4. Clear the form and redirect to Task History with a success toast.
      setFile(null);
      setSelectedChannel('');
      setSelectedTenant('');
      navigate('/task-history', {
        state: {
          toast: 'Task submitted successfully! You can track its progress in Task History.',
        },
      });
    } catch (err) {
      const fallback =
        phase === 'uploading'
          ? 'Failed to upload the file to storage. Please try again.'
          : 'Failed to submit the task. Please try again.';
      const apiMessage =
        err.response?.data?.message || err.response?.data?.error || err.message;
      setStatus('error');
      setMessage(apiMessage || fallback);
    } finally {
      setIsSubmitting(false);
      setPhase('');
    }
  };

  const downloadTemplate = () => {
    if (!templateEndpoint) {
      alert('No template available for this task.');
      return;
    }

    // templateEndpoint will be a static path (e.g., /templates/core-category.xlsx)
    const link = document.createElement('a');
    link.href = templateEndpoint;

    // Extract a clean filename from the URL, or default to template.xlsx
    const filename = templateEndpoint.split('/').pop() || 'template.xlsx';
    link.setAttribute('download', filename);

    document.body.appendChild(link);
    link.click();
    link.parentNode.removeChild(link);
  };

  const overlayText =
    phase === 'uploading'
      ? `Uploading file to storage... ${uploadProgress}%`
      : 'Submitting your task to the queue...';

  return (
    <div className="upload-form-container" style={{ position: 'relative' }}>
      {isSubmitting && (
        <div className="processing-overlay">
          <Loader2 size={48} className="spinner" />
          <h3>{phase === 'uploading' ? 'Uploading File' : 'Submitting Task'}</h3>
          <p>{overlayText}</p>
        </div>
      )}

      <div className="form-header">
        <h2>{title}</h2>
        <p>Upload your Excel data sheet to queue it for processing.</p>
      </div>

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-controls">
          {requiresTenant && (
            <div className="form-group">
              <label>Select Tenant</label>
              <select
                value={selectedTenant}
                onChange={(e) => setSelectedTenant(e.target.value)}
                className="custom-select"
              >
                <option value="" disabled>Choose a tenant...</option>
                {tenants.map(t => (
                  <option key={t.tenant_id} value={t.tenant_id}>
                    {t.tenant_id}
                  </option>
                ))}
              </select>
            </div>
          )}

          {requiresChannel && (
            <div className="form-group">
              <label>Select Channel</label>
              <select
                value={selectedChannel}
                onChange={(e) => setSelectedChannel(e.target.value)}
                className="custom-select"
              >
                <option value="" disabled>Choose a channel...</option>
                {channels.map(c => (
                  <option key={c.channel_id} value={c.channel_id}>
                    {c.channel_name}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        <div
          className={`dropzone ${isDragging ? 'dragging' : ''} ${file ? 'has-file' : ''}`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current.click()}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileSelect}
            accept=".xlsx"
            style={{ display: 'none' }}
          />

          {file ? (
            <div className="file-info">
              <File className="file-icon" size={48} />
              <div className="file-details">
                <span className="file-name">{file.name}</span>
                <span className="file-size">{(file.size / 1024).toFixed(2)} KB</span>
              </div>
              <button
                type="button"
                className="remove-btn"
                onClick={(e) => { e.stopPropagation(); setFile(null); }}
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <div className="dropzone-content">
              <div className="upload-icon-wrapper">
                <UploadCloud size={32} />
              </div>
              <h3>Click or drag file to this area to upload</h3>
              <p>Support for a single .xlsx file upload.</p>
            </div>
          )}
        </div>

        {status === 'error' && (
          <div className="status-message error">
            <AlertCircle size={20} />
            <span>{message}</span>
          </div>
        )}

        <div className="form-actions">
          <button type="button" className="btn btn-secondary" onClick={downloadTemplate}>
            <Download size={18} />
            Download Template
          </button>
          <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
            {isSubmitting && <Loader2 size={18} className="spinner-small" />}
            {isSubmitting ? 'Submitting...' : 'Submit Data'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default UploadForm;

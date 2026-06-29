import axios from 'axios';

// Change this to your actual backend URL when ready
const API_BASE_URL = 'http://localhost:8080';

const api = axios.create({
  baseURL: API_BASE_URL,
});

let cachedChannels = null;
export const fetchChannels = async () => {
  if (cachedChannels) return cachedChannels;
  const response = await api.get('/get-channels');
  cachedChannels = response.data;
  return cachedChannels;
};

let cachedTenants = null;
export const fetchTenants = async () => {
  if (cachedTenants) return cachedTenants;
  const response = await api.get('/get-tenant');
  cachedTenants = response.data;
  return cachedTenants;
};

const XLSX_MIME =
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet';

// Step 1: ask the backend for a presigned S3 PUT URL + the object key it
// reserved for this upload. The browser never sees AWS credentials.
export const getUploadUrl = async (filename) => {
  const response = await api.get('/upload-url', {
    params: { filename, content_type: XLSX_MIME },
  });
  // Expected: { url: "https://bucket.s3...?X-Amz-...", key: "uploads/123-file.xlsx" }
  return response.data;
};

// Step 2: PUT the raw file straight to S3 using the presigned URL.
// Uses a bare axios call (not the `api` instance) so the backend baseURL and
// any auth headers are not sent to S3, which would break the signature.
export const uploadFileToS3 = async (presignedUrl, file, onProgress) => {
  await axios.put(presignedUrl, file, {
    headers: {
      'Content-Type': file.type || XLSX_MIME,
    },
    onUploadProgress: (event) => {
      if (onProgress && event.total) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    },
  });
};

// Step 3: register the background task against the uploaded S3 object.
export const submitTask = async (payload) => {
  const response = await api.post('/task', payload);
  // Expected: { task_id, status, message }
  return response.data;
};

// Task History: list all tasks for the dashboard / polling.
export const fetchTasks = async () => {
  const response = await api.get('/tasks');
  return response.data;
};

// Ask the backend for a presigned GET URL to download a stored object
// (e.g. the generated error report for a failed task) by its S3 key.
export const getDownloadUrl = async (key) => {
  const response = await api.get('/download-url', { params: { key } });
  // Expected: { url: "https://bucket.s3...?X-Amz-..." }
  return response.data;
};

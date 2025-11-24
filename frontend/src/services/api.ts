/**
 * API Client Service
 *
 * Centralized HTTP client for backend API communication.
 * Provides base configuration and error handling.
 */

import axios, { AxiosInstance, AxiosError } from 'axios';

/**
 * API response wrapper
 */
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta: {
    timestamp: string;
    requestId: string;
  };
}

/**
 * API Client class
 */
class ApiClient {
  private client: AxiosInstance;

  constructor() {
    this.client = axios.create({
      baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api',
      timeout: 30000, // 30 seconds
      headers: {
        'Content-Type': 'application/json',
      },
    });

    // Response interceptor for error handling
    this.client.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        if (error.response) {
          // Server responded with error status
          console.error('API Error:', error.response.data);
        } else if (error.request) {
          // No response received
          console.error('Network Error:', error.message);
        } else {
          // Request setup error
          console.error('Request Error:', error.message);
        }
        return Promise.reject(error);
      }
    );
  }

  /**
   * GET request
   */
  async get<T>(url: string): Promise<ApiResponse<T>> {
    const response = await this.client.get<ApiResponse<T>>(url);
    return response.data;
  }

  /**
   * POST request
   */
  async post<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.client.post<ApiResponse<T>>(url, data);
    return response.data;
  }

  /**
   * PATCH request
   */
  async patch<T>(url: string, data?: unknown): Promise<ApiResponse<T>> {
    const response = await this.client.patch<ApiResponse<T>>(url, data);
    return response.data;
  }

  /**
   * PUT request for file upload
   */
  async put(url: string, data: Blob, contentType: string): Promise<void> {
    await axios.put(url, data, {
      headers: {
        'Content-Type': contentType,
      },
    });
  }

  /**
   * Upload file to presigned URL
   */
  async uploadFile(
    presignedUrl: string,
    file: File,
    onProgress?: (progress: number) => void
  ): Promise<void> {
    await axios.put(presignedUrl, file, {
      headers: {
        'Content-Type': file.type,
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.round(progress));
        }
      },
    });
  }
}

// Export singleton instance
export const api = new ApiClient();

// ============================================================================
// Session API Methods
// ============================================================================

export interface Session {
  sessionId: string;
  createdAt: string;
  lastActivityAt: string;
  status: string;
}

/**
 * Create a new session
 */
export async function createSession(): Promise<Session> {
  const response = await api.post<{ sessionId: string; session: Session }>(
    '/sessions'
  );

  if (!response.data) {
    throw new Error('Failed to create session');
  }

  // Handle double-wrapped response
  const data =
    'data' in response.data && typeof response.data.data === 'object'
      ? (response.data.data as { sessionId: string; session: Session })
      : response.data;

  return data.session;
}

// ============================================================================
// Video API Methods
// ============================================================================

export interface UploadVideoRequest {
  fileName: string;
  fileSize: number;
  mimeType: string;
}

export interface UploadVideoResponse {
  uploadUrl: string;
  uploadFields: Record<string, string>;
  s3Key: string;
}

/**
 * Upload video file to backend (which proxies to S3)
 */
export async function uploadVideo(
  sessionId: string,
  file: File,
  onProgress?: (progress: number) => void
): Promise<void> {
  const formData = new FormData();
  formData.append('video', file);

  await axios.post(
    `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000/api'}/sessions/${sessionId}/video/upload`,
    formData,
    {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const progress = (progressEvent.loaded / progressEvent.total) * 100;
          onProgress(Math.round(progress));
        }
      },
    }
  );
}

// ============================================================================
// Analysis API Methods
// ============================================================================

export interface VideoAnalysis {
  analysisId: string;
  analyzedAt: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  sceneBreakdown: string;
  userEdits?: string;
  error?: {
    code: string;
    message: string;
    timestamp: string;
  };
}

/**
 * Trigger video analysis
 */
export async function triggerAnalysis(
  sessionId: string
): Promise<{ analysisId: string; status: string }> {
  const response = await api.post<{ analysisId: string; status: string }>(
    `/sessions/${sessionId}/analysis`
  );

  if (!response.data) {
    throw new Error('Failed to trigger analysis');
  }

  // Handle double-wrapped response
  const data =
    'data' in response.data && typeof response.data.data === 'object'
      ? (response.data.data as { analysisId: string; status: string })
      : response.data;

  return data;
}

/**
 * Get analysis status and results (for polling)
 */
export async function getAnalysisStatus(
  sessionId: string
): Promise<VideoAnalysis> {
  const response = await api.get<VideoAnalysis>(
    `/sessions/${sessionId}/analysis`
  );

  if (!response.data) {
    throw new Error('Failed to get analysis status');
  }

  // Handle double-wrapped response
  const data =
    'data' in response.data && typeof response.data.data === 'object'
      ? (response.data.data as VideoAnalysis)
      : response.data;

  return data;
}

/**
 * Update analysis with user edits
 */
export async function updateAnalysis(
  sessionId: string,
  editedText: string
): Promise<VideoAnalysis> {
  const response = await api.patch<VideoAnalysis>(
    `/sessions/${sessionId}/analysis`,
    { editedText }
  );

  if (!response.data) {
    throw new Error('Failed to update analysis');
  }

  // Handle double-wrapped response
  const data =
    'data' in response.data && typeof response.data.data === 'object'
      ? (response.data.data as VideoAnalysis)
      : response.data;

  return data;
}

// ============================================================================
// Product API Methods
// ============================================================================

export interface ProductInformation {
  productName: string;
  productDescription: string;
}

export interface SubmitProductInfoResponse {
  sessionId: string;
  productName: string;
  productDescription: string;
  status: string;
}

/**
 * Submit product information
 */
export async function submitProductInfo(
  sessionId: string,
  productName: string,
  productDescription: string
): Promise<SubmitProductInfoResponse> {
  const response = await api.post<SubmitProductInfoResponse>(
    `/sessions/${sessionId}/product`,
    { productName, productDescription }
  );

  if (!response.data) {
    throw new Error('Failed to submit product information');
  }

  // Handle double-wrapped response
  const data =
    'data' in response.data && typeof response.data.data === 'object'
      ? (response.data.data as SubmitProductInfoResponse)
      : response.data;

  return data;
}

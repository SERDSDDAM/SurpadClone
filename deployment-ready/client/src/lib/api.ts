// API configuration and utilities
export const API_BASE_URL = '';  // Use relative paths for same-origin requests

export class APIError extends Error {
  constructor(
    message: string,
    public status?: number,
    public response?: Response
  ) {
    super(message);
    this.name = 'APIError';
  }
}

export async function apiRequest(
  url: string,
  options: RequestInit = {}
): Promise<any> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 300000); // 5 minutes

  try {
    const fullUrl = `${API_BASE_URL}${url}`;
    const response = await fetch(fullUrl, {
      ...options,
      signal: controller.signal,
    });

    clearTimeout(timeout);

    if (!response.ok) {
      const errorText = await response.text().catch(() => 'Unknown error');
      throw new APIError(
        `HTTP ${response.status}: ${errorText}`,
        response.status,
        response
      );
    }

    const contentType = response.headers.get('content-type');
    if (contentType?.includes('application/json')) {
      return response.json();
    }

    return response.text();
  } catch (error) {
    clearTimeout(timeout);
    
    if (error instanceof APIError) {
      throw error;
    }
    
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        throw new APIError('Request timeout (5 minutes)');
      }
      if (error.message.includes('Failed to fetch')) {
        throw new APIError('Network error - unable to reach server');
      }
    }
    
    throw new APIError('Unknown network error');
  }
}

export function uploadFile(file: File, onProgress?: (progress: number) => void) {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const formData = new FormData();
    formData.append('file', file);

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const response = JSON.parse(xhr.responseText);
          resolve(response);
        } catch (e) {
          resolve(xhr.responseText);
        }
      } else {
        reject(new APIError(
          `HTTP ${xhr.status}: ${xhr.responseText || xhr.statusText}`,
          xhr.status
        ));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new APIError('Network error during upload'));
    });

    xhr.addEventListener('timeout', () => {
      reject(new APIError('Upload timeout'));
    });

    xhr.timeout = 300000; // 5 minutes
    xhr.open('POST', '/api/gis/upload');
    xhr.send(formData);
  });
}
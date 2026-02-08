import { Task, TaskCreateData, TaskUpdateData, TaskListResponse, TaskQueryParams } from "@/types";

// Configuration interface
interface ApiClientConfig {
  baseUrl: string;           // Backend API URL (from env)
  tokenKey: string;          // localStorage key for JWT
  timeout: number;           // Request timeout in ms (default: 10000)
}

// Error class
export class ApiError extends Error {
  status: number;
  errorCode: string | null;
  timestamp: string;
  canRetry: boolean;

  constructor(
    message: string,
    status: number,
    errorCode: string | null = null,
    timestamp: string = new Date().toISOString(),
    canRetry: boolean = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.errorCode = errorCode;
    this.timestamp = timestamp;
    this.canRetry = canRetry;
  }
}

// Request options interface
interface RequestOptions {
  headers?: Record<string, string>;
  timeout?: number;
}

class ApiClient {
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const url = `${this.config.baseUrl}${endpoint}`;

    // Get token from localStorage
    const token = typeof window !== 'undefined' ? localStorage.getItem(this.config.tokenKey) : null;

    if (!token) {
      throw new ApiError('No authentication token found', 401, 'AUTH_001', undefined, false);
    }

    const timeout = options.signal ? undefined : this.config.timeout;

    // Set default headers and merge with provided headers
    const headers = {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    };

    // Create AbortController for timeout if needed
    let timeoutId: NodeJS.Timeout | null = null;
    let controller: AbortController | null = null;

    if (timeout) {
      controller = new AbortController();
      timeoutId = setTimeout(() => controller?.abort(), timeout);
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller?.signal,
      });

      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      // Handle 401 Unauthorized - clear token and redirect
      if (response.status === 401) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem(this.config.tokenKey);
          // Note: Actual redirect would be handled by the calling component
        }
        throw new ApiError('Unauthorized access', 401, 'AUTH_001', undefined, false);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorCode = errorData.error_code || errorData.errorCode || null;

        let message = 'Request failed';
        switch (response.status) {
          case 400:
            message = 'Invalid request';
            break;
          case 403:
            message = 'You don\'t have access to this resource';
            break;
          case 404:
            message = 'The requested item was not found';
            break;
          case 422:
            message = 'Please check your input';
            break;
          case 500:
            message = 'Something went wrong. Please try again.';
            break;
          default:
            message = errorData.message || 'Request failed';
        }

        throw new ApiError(
          message,
          response.status,
          errorCode,
          new Date().toISOString(),
          response.status >= 500 || response.status === 0
        );
      }

      // Handle 204 No Content responses
      if (response.status === 204) {
        return undefined as unknown as T;
      }

      return await response.json();
    } catch (error) {
      if (timeoutId) {
        clearTimeout(timeoutId);
      }

      if (error instanceof ApiError) {
        throw error;
      }

      if (error instanceof TypeError && error.name === 'AbortError') {
        throw new ApiError('Request timeout', 0, null, undefined, true);
      }

      // Network error
      throw new ApiError('Network error. Check your connection.', 0, null, undefined, true);
    }
  }

  async get<T>(endpoint: string, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'GET',
      headers: options?.headers,
    });
  }

  async post<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'POST',
      headers: options?.headers,
      body: JSON.stringify(data),
    });
  }

  async put<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      headers: options?.headers,
      body: JSON.stringify(data),
    });
  }

  async patch<T>(endpoint: string, data: unknown, options?: RequestOptions): Promise<T> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      headers: options?.headers,
      body: JSON.stringify(data),
    });
  }

  async delete(endpoint: string, options?: RequestOptions): Promise<void> {
    await this.request<void>(endpoint, {
      method: 'DELETE',
      headers: options?.headers,
    });
  }
}

// Create the default API client instance
const apiClient = new ApiClient({
  baseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:8000',
  tokenKey: 'auth_token',
  timeout: 10000,
});

// Task API methods
export const taskApi = {
  async getTasks(params?: TaskQueryParams): Promise<TaskListResponse> {
    const queryParams = new URLSearchParams();

    if (params?.is_completed !== undefined) {
      queryParams.append('is_completed', String(params.is_completed));
    }
    if (params?.limit !== undefined) {
      queryParams.append('limit', String(params.limit));
    }
    if (params?.offset !== undefined) {
      queryParams.append('offset', String(params.offset));
    }

    const queryString = queryParams.toString();
    const endpoint = queryString ? `/api/v1/tasks?${queryString}` : '/api/v1/tasks';

    return apiClient.get<TaskListResponse>(endpoint);
  },

  async getTask(id: number): Promise<Task> {
    return apiClient.get<Task>(`/api/v1/tasks/${id}`);
  },

  async createTask(data: TaskCreateData): Promise<Task> {
    return apiClient.post<Task>('/api/v1/tasks', data);
  },

  async updateTask(id: number, data: TaskUpdateData): Promise<Task> {
    return apiClient.put<Task>(`/api/v1/tasks/${id}`, data);
  },

  async patchTask(id: number, data: Partial<TaskUpdateData>): Promise<Task> {
    return apiClient.patch<Task>(`/api/v1/tasks/${id}`, data);
  },

  async deleteTask(id: number): Promise<void> {
    return apiClient.delete(`/api/v1/tasks/${id}`);
  },
};

export default apiClient;
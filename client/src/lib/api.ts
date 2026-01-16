const AUTH_TOKEN_KEY = 'auth_token';

interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }

  setToken(token: string): void {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
  }

  clearToken(): void {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }

  private async request<T>(
    method: string,
    path: string,
    options?: {
      body?: unknown;
      headers?: Record<string, string>;
    }
  ): Promise<T> {
    const token = this.getToken();

    const headers: Record<string, string> = {
      ...options?.headers,
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    if (options?.body && !(options.body instanceof FormData)) {
      headers['Content-Type'] = 'application/json';
    }

    const response = await fetch(`/api${path}`, {
      method,
      headers,
      body: options?.body instanceof FormData
        ? options.body
        : options?.body
          ? JSON.stringify(options.body)
          : undefined,
    });

    // Handle 401 - clear token and redirect
    if (response.status === 401) {
      this.clearToken();
      window.location.href = '/login';
      throw new Error('Unauthorized');
    }

    // Handle non-JSON responses
    const contentType = response.headers.get('content-type');
    if (!contentType?.includes('application/json')) {
      if (!response.ok) {
        throw new Error(`Request failed with status ${response.status}`);
      }
      return {} as T;
    }

    const data = await response.json();

    if (!response.ok) {
      const error = data as ApiError;
      throw new ApiRequestError(
        error.error.message,
        error.error.code,
        response.status,
        error.error.details
      );
    }

    return data as T;
  }

  async get<T>(path: string): Promise<T> {
    return this.request<T>('GET', path);
  }

  async post<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('POST', path, { body });
  }

  async patch<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PATCH', path, { body });
  }

  async put<T>(path: string, body?: unknown): Promise<T> {
    return this.request<T>('PUT', path, { body });
  }

  async delete<T>(path: string): Promise<T> {
    return this.request<T>('DELETE', path);
  }

  async upload<T>(path: string, formData: FormData): Promise<T> {
    return this.request<T>('POST', path, { body: formData });
  }
}

export class ApiRequestError extends Error {
  constructor(
    message: string,
    public code: string,
    public status: number,
    public details?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'ApiRequestError';
  }
}

export const api = new ApiClient();

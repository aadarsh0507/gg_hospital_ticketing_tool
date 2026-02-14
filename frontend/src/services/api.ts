// Use proxy in development, or full URL in production

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || (import.meta.env.DEV ? '/api' : 'http://192.168.137.204:3001/api');
  
  // 'http://localhost:3001/api');
  

interface RequestOptions extends RequestInit {
  requiresAuth?: boolean;
}

class ApiError extends Error {
  constructor(
    public status: number,
    public statusText: string,
    public data?: any
  ) {
    super(`API Error: ${status} ${statusText}`);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestOptions = {}
): Promise<T> {
  const { requiresAuth = true, ...fetchOptions } = options;

  const url = `${API_BASE_URL}${endpoint}`;
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(fetchOptions.headers as Record<string, string>),
  };

  // Add auth token if required
  if (requiresAuth) {
    const token = localStorage.getItem('authToken');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }

  try {
    const response = await fetch(url, {
      ...fetchOptions,
      headers,
    });

    if (!response.ok) {
      let errorData;
      try {
        errorData = await response.json();
      } catch {
        errorData = { message: response.statusText };
      }
      throw new ApiError(response.status, response.statusText, errorData);
    }

    // Handle empty responses
    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      return await response.json();
    }
    return {} as T;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    // Handle connection errors (backend not available)
    if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
      throw new Error('Unable to connect to the server. Please ensure the backend server is running on port 3001.');
    }
    throw new Error(`Network error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

// Auth API
export const authApi = {
  login: (email: string, password: string) =>
    request<{ token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      requiresAuth: false,
    }),

  register: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    role?: string;
  }) =>
    request<{ token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(data),
      requiresAuth: false,
    }),

  getProfile: () => request<{ user: any }>('/auth/profile'),
};

// Dashboard API
export const dashboardApi = {
  getStats: () => request<{
    totalRequestsToday: number;
    completedRequestsToday: number;
    activeStaff: number;
    totalRequests: number;
    averageResponseTime: number;
    recentActivities: Array<{
      id: string;
      action: string;
      description: string;
      user: string;
      requestId: string;
      serviceType: string;
      time: string;
      createdAt: string;
    }>;
  }>('/dashboard/stats'),
};

// Requests API
export const requestsApi = {
  getRequests: (params?: {
    status?: string;
    departmentId?: string;
    assignedToId?: string;
    locationId?: string;
    serviceType?: string;
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return request<{
      requests: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/requests${query ? `?${query}` : ''}`);
  },

  getMyRequests: (params?: {
    status?: string;
    page?: number;
    limit?: number;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return request<{
      requests: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/requests/my-requests${query ? `?${query}` : ''}`);
  },

  getRequestById: (id: string) =>
    request<{ request: any }>(`/requests/${id}`),

  updateRequest: (id: string, data: {
    status?: string;
    priority?: number;
    assignedToId?: string;
    locationId?: string;
    departmentId?: string;
    description?: string;
    estimatedTime?: number;
    serviceType?: string;
    title?: string;
    scheduledDate?: string;
    scheduledTime?: string;
    recurring?: boolean;
    recurringPattern?: string;
  }) =>
    request<{ message: string; request: any }>(`/requests/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  createRequest: (data: {
    serviceType: string;
    title: string;
    description?: string;
    priority?: number;
    locationId?: string;
    departmentId?: string;
    requestedBy?: string;
    assignedToId?: string;
    estimatedTime?: number;
    scheduledDate?: string;
    scheduledTime?: string;
    recurring?: boolean;
    recurringPattern?: string;
  }) =>
    request<{ message: string; request: any }>('/requests', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  deleteRequest: (id: string) =>
    request<{ message: string }>(`/requests/${id}`, {
      method: 'DELETE',
    }),

  getScheduledRequests: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return request<{
      scheduledRequests: any[];
      pagination: {
        page: number;
        limit: number;
        total: number;
        pages: number;
      };
    }>(`/requests/scheduled${query ? `?${query}` : ''}`);
  },
};

// Metrics API
export const metricsApi = {
  getMetrics: () => request<any>('/metrics'),
};

// Leaderboard API
export const leaderboardApi = {
  getLeaderboard: () => request<any>('/leaderboard'),
  downloadLeaderboard: () => request<Blob>('/leaderboard/download'),
};

// Locations API
export const locationsApi = {
  getBlocks: () => request<any>('/locations/blocks'),
  getLocations: () => request<any>('/locations'),
  getDepartments: () => request<any>('/locations/departments'),
  createBlock: (data: any) =>
    request<any>('/locations/blocks', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateBlock: (id: string, data: any) =>
    request<any>(`/locations/blocks/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteBlock: (id: string) =>
    request<any>(`/locations/blocks/${id}`, {
      method: 'DELETE',
    }),
  createLocation: (data: any) =>
    request<any>('/locations', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  createDepartment: (data: any) =>
    request<any>('/locations/departments', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateLocation: (id: string, data: any) =>
    request<any>(`/locations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteLocation: (id: string) =>
    request<any>(`/locations/${id}`, {
      method: 'DELETE',
    }),
  updateDepartment: (id: string, data: any) =>
    request<any>(`/locations/departments/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteDepartment: (id: string) =>
    request<any>(`/locations/departments/${id}`, {
      method: 'DELETE',
    }),
};

// Request Links API
export const requestLinksApi = {
  getRequestLinks: () => request<any>('/request-links'),
  createRequestLink: (data: any) =>
    request<any>('/request-links', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
  updateRequestLink: (id: string, data: any) =>
    request<any>(`/request-links/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
  deleteRequestLink: (id: string) =>
    request<any>(`/request-links/${id}`, {
      method: 'DELETE',
    }),
};

// Services API
export const servicesApi = {
  getServices: (params?: {
    search?: string;
    isActive?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return request<{ services: any[] }>(`/services${query ? `?${query}` : ''}`);
  },

  getServiceById: (id: string) =>
    request<{ service: any }>(`/services/${id}`),

  createService: (data: {
    name: string;
    description?: string;
    areaType?: string;
    departmentId?: string;
    locationId?: string;
    slaEnabled?: boolean;
    slaHours?: number;
    slaMinutes?: number;
    otpVerificationRequired?: boolean;
    displayToCustomer?: boolean;
    iconUrl?: string;
  }) =>
    request<{ message: string; service: any }>('/services', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateService: (id: string, data: {
    name?: string;
    description?: string;
    areaType?: string;
    departmentId?: string;
    locationId?: string;
    slaEnabled?: boolean;
    slaHours?: number;
    slaMinutes?: number;
    otpVerificationRequired?: boolean;
    displayToCustomer?: boolean;
    iconUrl?: string;
    isActive?: boolean;
  }) =>
    request<{ message: string; service: any }>(`/services/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),

  deleteService: (id: string) =>
    request<{ message: string }>(`/services/${id}`, {
      method: 'DELETE',
    }),
};

// Users API
export const usersApi = {
  getUsers: (params?: {
    search?: string;
    role?: string;
    isActive?: boolean;
  }) => {
    const queryParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          queryParams.append(key, String(value));
        }
      });
    }
    const query = queryParams.toString();
    return request<{
      users: any[];
      usersByDepartment: Array<{
        name: string | null;
        users: any[];
      }>;
      total: number;
    }>(`/users${query ? `?${query}` : ''}`);
  },

  createUser: (data: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phoneNumber?: string;
    role?: string;
    department?: string;
  }) =>
    request<{ message: string; user: any }>('/users', {
      method: 'POST',
      body: JSON.stringify(data),
    }),

  updateUser: (id: string, data: {
    email?: string;
    password?: string;
    firstName?: string;
    lastName?: string;
    phoneNumber?: string;
    role?: string;
    department?: string;
    locationId?: string;
    isActive?: boolean;
  }) =>
    request<{ message: string; user: any }>(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    }),
};

// System Settings API
export const systemSettingsApi = {
  getSystemStatus: () =>
    request<{
      isActive: boolean;
      updatedAt: string;
      updatedBy: string | null;
    }>('/system-settings/status'),

  updateSystemStatus: (isActive: boolean) =>
    request<{
      message: string;
      isActive: boolean;
      updatedAt: string;
      updatedBy: string | null;
    }>('/system-settings/status', {
      method: 'PUT',
      body: JSON.stringify({ isActive }),
    }),
};

export { ApiError };


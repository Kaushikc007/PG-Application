// API Client for FastAPI Backend Integration
import { getSession } from 'next-auth/react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

interface ApiResponse<T> {
  data?: T;
  error?: string;
  status: number;
}

class ApiClient {
  public baseUrl: string;
  private token: string | null = null;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  // Set authentication token
  setToken(token: string) {
    this.token = token;
  }

  // Get headers with authentication
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  // Generic API request method
  public async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${this.baseUrl}/api/v1${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers,
        },
      });

      const data = await response.json();

      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.detail || 'An error occurred',
        status: response.status,
      };
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : 'Network error',
        status: 0,
      };
    }
  }

  // Authentication methods
  async login(email: string, password: string) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  }

  async register(userData: {
    email: string;
    password: string;
    name: string;
    role: 'tenant' | 'owner';
    phone?: string;
  }) {
    return this.request('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser() {
    return this.request('/auth/me', {
      method: 'GET',
    });
  }

  // Property methods
  async getProperties(params?: {
    location?: string;
    maxPrice?: number;
    sharing?: string;
    verified?: boolean;
    amenities?: string[];
  }) {
    const searchParams = new URLSearchParams();
    if (params) {
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined) {
          if (Array.isArray(value)) {
            searchParams.append(key, value.join(','));
          } else {
            searchParams.append(key, value.toString());
          }
        }
      });
    }
    
    const query = searchParams.toString();
    return this.request(`/properties/${query ? `?${query}` : ''}`, {
      method: 'GET',
    });
  }

  async getProperty(id: string) {
    return this.request(`/properties/${id}`, {
      method: 'GET',
    });
  }

  async createProperty(propertyData: any) {
    return this.request('/properties/', {
      method: 'POST',
      body: JSON.stringify(propertyData),
    });
  }

  async updateProperty(id: string, propertyData: any) {
    return this.request(`/properties/${id}`, {
      method: 'PUT',
      body: JSON.stringify(propertyData),
    });
  }

  async deleteProperty(id: string) {
    return this.request(`/properties/${id}`, {
      method: 'DELETE',
    });
  }

  // Application methods
  async getApplications() {
    return this.request('/applications/', {
      method: 'GET',
    });
  }

  async createApplication(applicationData: {
    property_id: string;
    message?: string;
  }) {
    return this.request('/applications/', {
      method: 'POST',
      body: JSON.stringify(applicationData),
    });
  }

  async updateApplicationStatus(id: string, status: 'approved' | 'rejected') {
    return this.request(`/applications/${id}/status`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  }

  // Tenant methods
  async getTenants() {
    return this.request('/tenants/', {
      method: 'GET',
    });
  }

  async getPropertyTenants(propertyId: string) {
    return this.request(`/tenants/property/${propertyId}`, {
      method: 'GET',
    });
  }

  // Payment methods
  async getPayments() {
    return this.request('/payments/', {
      method: 'GET',
    });
  }

  async createPayment(paymentData: {
    tenant_id: string;
    amount: number;
    payment_type: string;
    description?: string;
  }) {
    return this.request('/payments/', {
      method: 'POST',
      body: JSON.stringify(paymentData),
    });
  }

  // File upload methods
  async uploadFile(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    return fetch(`${this.baseUrl}/api/v1/upload/`, {
      method: 'POST',
      headers: {
        ...(this.token && { Authorization: `Bearer ${this.token}` }),
      },
      body: formData,
    }).then(async (response) => {
      const data = await response.json();
      return {
        data: response.ok ? data : undefined,
        error: response.ok ? undefined : data.detail || 'Upload failed',
        status: response.status,
      };
    });
  }

  // User management methods
  async getUsers() {
    return this.request('/users/', {
      method: 'GET',
    });
  }

  async updateUser(id: string, userData: any) {
    return this.request(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  }

  async deleteUser(id: string) {
    return this.request(`/users/${id}`, {
      method: 'DELETE',
    });
  }
}

// Create and export a singleton instance
export const apiClient = new ApiClient();

// Hook for authenticated API calls
export const useApiClient = () => {
  const setupAuthenticatedClient = async () => {
    const session = await getSession();
    if (session?.user) {
      // Note: We'll need to modify the auth system to return JWT tokens
      // For now, we'll use a placeholder
      const token = localStorage.getItem('jwt_token');
      if (token) {
        apiClient.setToken(token);
      }
    }
    return apiClient;
  };

  return { apiClient, setupAuthenticatedClient };
};

export default apiClient;

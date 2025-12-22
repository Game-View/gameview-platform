/**
 * @gameview/api
 * API client for Game View platform services
 */

import type { ApiResponse, ApiError, Production, AppSettings } from '@gameview/types';

export interface ApiClientConfig {
  baseUrl: string;
  apiKey?: string;
}

export class GameViewApiClient {
  private baseUrl: string;
  private apiKey?: string;

  constructor(config: ApiClientConfig) {
    this.baseUrl = config.baseUrl.replace(/\/$/, '');
    this.apiKey = config.apiKey;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
      ...options.headers,
    };

    try {
      const response = await fetch(url, { ...options, headers });
      const data = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: data as ApiError,
        };
      }

      return {
        success: true,
        data: data as T,
      };
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'NETWORK_ERROR',
          message: error instanceof Error ? error.message : 'Network error',
        },
      };
    }
  }

  // Production endpoints
  async getProductions(): Promise<ApiResponse<Production[]>> {
    return this.request<Production[]>('/api/productions');
  }

  async getProduction(id: string): Promise<ApiResponse<Production>> {
    return this.request<Production>(`/api/productions/${id}`);
  }

  async createProduction(data: Partial<Production>): Promise<ApiResponse<Production>> {
    return this.request<Production>('/api/productions', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async updateProduction(id: string, data: Partial<Production>): Promise<ApiResponse<Production>> {
    return this.request<Production>(`/api/productions/${id}`, {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }

  async deleteProduction(id: string): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/productions/${id}`, {
      method: 'DELETE',
    });
  }

  // Settings endpoints
  async getSettings(): Promise<ApiResponse<AppSettings>> {
    return this.request<AppSettings>('/api/settings');
  }

  async updateSettings(data: Partial<AppSettings>): Promise<ApiResponse<AppSettings>> {
    return this.request<AppSettings>('/api/settings', {
      method: 'PATCH',
      body: JSON.stringify(data),
    });
  }
}

export function createApiClient(config: ApiClientConfig): GameViewApiClient {
  return new GameViewApiClient(config);
}

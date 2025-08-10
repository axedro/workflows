// NEW FILE - FIXED DELETE API - 2025-08-09-09:20
import { User, Workflow, WorkflowTemplate } from '@flowcraft/shared-types';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

console.log('🔥 BRAND NEW API FILE LOADED - DELETE FIX ACTIVE');

export interface ApiError {
  error: string;
  message: string;
  details?: any;
}

class FixedApiService {
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    console.log('🎯 FIXED API SERVICE - DELETE WORKFLOW CALLED!');
    alert('🔧 USING NEW FIXED API SERVICE!');
    
    const url = `${API_BASE_URL}${endpoint}`;
    const token = localStorage.getItem('accessToken');

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...(token && { Authorization: `Bearer ${token}` }),
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    console.log('📡 Response status:', response.status, response.statusText);

    if (!response.ok) {
      try {
        const errorText = await response.text();
        if (errorText && errorText.trim() !== '') {
          const error: ApiError = JSON.parse(errorText);
          throw new Error(error.message || 'API request failed');
        } else {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
      } catch (parseError) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
    }

    // ✅ FIXED: Handle empty responses properly
    const contentLength = response.headers.get('content-length');
    const contentType = response.headers.get('content-type');
    
    console.log('📊 Content-Length:', contentLength);
    console.log('📊 Content-Type:', contentType);
    
    if (
      response.status === 204 || 
      contentLength === '0' ||   
      contentLength === null ||  
      !contentType ||            
      !contentType.includes('application/json')
    ) {
      console.log('✅ FIXED: Returning undefined for empty response');
      return undefined as T;
    }

    try {
      const text = await response.text();
      console.log('📝 Response text:', text);
      if (!text || text.trim() === '') {
        console.log('✅ FIXED: Empty text body handled');
        return undefined as T;
      }
      return JSON.parse(text);
    } catch (error) {
      console.log('✅ FIXED: JSON parse error handled gracefully');
      return undefined as T;
    }
  }

  async deleteWorkflow(id: string): Promise<void> {
    console.log('🗑️ FIXED DELETE WORKFLOW CALLED FOR ID:', id);
    return this.request<void>(`/workflows/${id}`, {
      method: 'DELETE',
    });
  }
}

export const fixedApiService = new FixedApiService();
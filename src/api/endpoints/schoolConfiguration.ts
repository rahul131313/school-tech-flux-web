/* ============================================================
   SchoolConnect — School Branding & Modules API Endpoints
   Consumes Spring Boot SchoolConfigurationController:
   - GET /api/v1/school-configuration/branding
   - PUT /api/v1/school-configuration/branding
   - GET /api/v1/school-modules
   - PUT /api/v1/school-modules
   ============================================================ */

import { apiClient } from '../client';
import type {
  SchoolBrandingRequest,
  SchoolBrandingResponse,
  SchoolModuleRequest,
  SchoolModuleResponse,
} from '../types';

export const schoolConfigurationApi = {
  getBranding: async (): Promise<SchoolBrandingResponse> => {
    const response = await apiClient.get<SchoolBrandingResponse>(
      '/v1/school-configuration/branding'
    );
    return response.data;
  },

  updateBranding: async (
    data: SchoolBrandingRequest
  ): Promise<SchoolBrandingResponse> => {
    const response = await apiClient.put<SchoolBrandingResponse>(
      '/v1/school-configuration/branding',
      data
    );
    return response.data;
  },

  getModules: async (): Promise<SchoolModuleResponse[]> => {
    const response = await apiClient.get<SchoolModuleResponse[]>('/v1/school-modules');
    return response.data;
  },

  updateModule: async (
    data: SchoolModuleRequest
  ): Promise<SchoolModuleResponse> => {
    const response = await apiClient.put<SchoolModuleResponse>(
      '/v1/school-modules',
      data
    );
    return response.data;
  },
};

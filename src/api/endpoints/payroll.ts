/* ============================================================
   SchoolConnect — Payroll Configuration API Endpoints
   Consumes Spring Boot PayrollConfigurationController:
   - POST /api/v1/payroll/components
   ============================================================ */

import { apiClient } from '../client';
import type { PayrollComponentRequest } from '../types';

const BASE = '/v1/payroll';

export const payrollApi = {
  createComponent: async (data: PayrollComponentRequest): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>(`${BASE}/components`, data);
    return response.data;
  },
};

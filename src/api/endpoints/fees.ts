/* ============================================================
   SchoolConnect — Fees API Endpoints
   Consumes Spring Boot FeeController:
   - POST /api/v1/fees/structures
   - POST /api/v1/fees/invoices
   - GET  /api/v1/fees/students/{studentId}/invoices
   - GET  /api/v1/fees/students/{studentId}/invoices/export?format=
   - POST /api/v1/fees/invoices/{invoiceId}/payments
   - POST /api/v1/fees/invoices/{invoiceId}/waivers
   - POST /api/v1/fees/waivers/{id}/approve
   - POST /api/v1/fees/waivers/{id}/reject
   ============================================================ */

import { apiClient } from '../client';
import { downloadExportFile } from '../../utils/fileDownload';
import type {
  FeeStructureRequest,
  FeeInvoiceRequest,
  FeeInvoiceResponse,
  FeePaymentRequest,
  FeeWaiverRequest,
  ExportFormat,
} from '../types';

const BASE = '/v1/fees';

export const feesApi = {
  createStructure: async (data: FeeStructureRequest): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>(`${BASE}/structures`, data);
    return response.data;
  },

  createInvoice: async (data: FeeInvoiceRequest): Promise<FeeInvoiceResponse> => {
    const response = await apiClient.post<FeeInvoiceResponse>(`${BASE}/invoices`, data);
    return response.data;
  },

  listStudentInvoices: async (studentId: string): Promise<FeeInvoiceResponse[]> => {
    const response = await apiClient.get<FeeInvoiceResponse[]>(
      `${BASE}/students/${studentId}/invoices`
    );
    return response.data;
  },

  exportInvoices: async (
    studentId: string,
    format: ExportFormat = 'XLSX'
  ): Promise<void> => {
    await downloadExportFile(
      `${BASE}/students/${studentId}/invoices/export`,
      { format },
      `fee-invoices-${studentId}.${format.toLowerCase()}`
    );
  },

  recordPayment: async (
    invoiceId: string,
    data: FeePaymentRequest
  ): Promise<{ id: string; receiptNumber: string }> => {
    const response = await apiClient.post<{ id: string; receiptNumber: string }>(
      `${BASE}/invoices/${invoiceId}/payments`,
      data
    );
    return response.data;
  },

  requestWaiver: async (
    invoiceId: string,
    data: FeeWaiverRequest
  ): Promise<{ id: string }> => {
    const response = await apiClient.post<{ id: string }>(
      `${BASE}/invoices/${invoiceId}/waivers`,
      data
    );
    return response.data;
  },

  approveWaiver: async (waiverId: string): Promise<{ status: string }> => {
    const response = await apiClient.post<{ status: string }>(
      `${BASE}/waivers/${waiverId}/approve`
    );
    return response.data;
  },

  rejectWaiver: async (waiverId: string): Promise<{ status: string }> => {
    const response = await apiClient.post<{ status: string }>(
      `${BASE}/waivers/${waiverId}/reject`
    );
    return response.data;
  },
};

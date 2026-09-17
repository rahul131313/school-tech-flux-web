/* ============================================================
   SchoolConnect — File Download Utility
   Handles binary file downloads (XLSX, PDF) with
   Content-Disposition filename parsing and cleanup.
   ============================================================ */

import { apiClient } from '../api/client';

export async function downloadExportFile(
  endpoint: string,
  params: Record<string, unknown>,
  fallbackFilename: string
): Promise<void> {
  const response = await apiClient.get(endpoint, {
    params,
    responseType: 'blob',
  });

  let filename = fallbackFilename;
  const disposition = response.headers['content-disposition'] || response.headers['Content-Disposition'];
  if (disposition && typeof disposition === 'string') {
    const filenameRegex = /filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/;
    const matches = filenameRegex.exec(disposition);
    if (matches != null && matches[1]) {
      filename = matches[1].replace(/['"]/g, '').trim();
    }
  }

  const rawContentType =
    response.headers['content-type'] ||
    response.headers['Content-Type'];
  const contentType =
    typeof rawContentType === 'string' ? rawContentType : 'application/octet-stream';

  const blob = new Blob([response.data], { type: contentType });
  const downloadUrl = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  link.parentNode?.removeChild(link);

  setTimeout(() => {
    window.URL.revokeObjectURL(downloadUrl);
  }, 1000);
}

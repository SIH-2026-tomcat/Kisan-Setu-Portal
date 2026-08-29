const BASE_URL = '/api';

function getAuthHeader(): Record<string, string> {
  const token = localStorage.getItem('kisan_setu_token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export async function apiRequest<T = any>(
  endpoint: string,
  options: RequestInit = {}
): Promise<{ success: boolean; data?: T; message?: string; [key: string]: any }> {
  try {
    const headers = {
      'Content-Type': 'application/json',
      ...getAuthHeader(),
      ...(options.headers || {}),
    };

    const res = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    const data = await res.json().catch(() => ({}));

    if (!res.ok) {
      if (res.status === 401 && !endpoint.includes('/auth/farmer/request-otp') && !endpoint.includes('/auth/farmer/verify-otp') && !endpoint.includes('/auth/officer/login')) {
        // Clear invalid token
        // localStorage.removeItem('kisan_setu_token');
      }
      return {
        success: false,
        message: data.message || `Request failed with status ${res.status}`,
        status: res.status,
        ...data,
      };
    }

    return data;
  } catch (error: any) {
    console.error(`API Error on ${endpoint}:`, error);
    return {
      success: false,
      message: 'Kisan Setu service is temporarily unreachable. Please check your connection.',
    };
  }
}

// API Service Methods
export const api = {
  // Auth
  registerFarmer: (payload: any) =>
    apiRequest('/auth/farmer/register', { method: 'POST', body: JSON.stringify(payload) }),
  requestOTP: (mobileNumber: string) =>
    apiRequest('/auth/farmer/request-otp', { method: 'POST', body: JSON.stringify({ mobileNumber }) }),
  verifyOTP: (mobileNumber: string, otp: string) =>
    apiRequest('/auth/farmer/verify-otp', { method: 'POST', body: JSON.stringify({ mobileNumber, otp }) }),
  officerLogin: (payload: any) =>
    apiRequest('/auth/officer/login', { method: 'POST', body: JSON.stringify(payload) }),
  getMe: () => apiRequest('/auth/me'),

  // Centres & Slots
  getCentres: (params?: { district?: string; search?: string }) => {
    const q = new URLSearchParams();
    if (params?.district) q.append('district', params.district);
    if (params?.search) q.append('search', params.search);
    return apiRequest(`/centres?${q.toString()}`);
  },
  getCentreById: (id: string) => apiRequest(`/centres/${id}`),
  getCentreSlots: (id: string, date?: string) =>
    apiRequest(`/centres/${id}/slots${date ? `?date=${date}` : ''}`),

  // Bookings
  createBooking: (payload: any) =>
    apiRequest('/bookings', { method: 'POST', body: JSON.stringify(payload) }),
  getMyBookings: () => apiRequest('/bookings/me'),
  getBookingById: (id: string) => apiRequest(`/bookings/${id}`),

  // Live Queue
  getLiveQueue: (centreId: string, tokenNumber?: string, date?: string) => {
    const q = new URLSearchParams();
    if (tokenNumber) q.append('tokenNumber', tokenNumber);
    if (date) q.append('date', date);
    return apiRequest(`/queue/${centreId}?${q.toString()}`);
  },

  // Farmer Tracking
  getMyProcurements: () => apiRequest('/farmer/procurements'),
  getMyPayments: () => apiRequest('/farmer/payments'),
  getMyNotifications: () => apiRequest('/farmer/notifications'),
  markNotificationRead: (id: string) =>
    apiRequest(`/farmer/notifications/${id}/read`, { method: 'PATCH' }),

  // Officer Operations
  getOfficerDashboard: () => apiRequest('/officer/dashboard'),
  getOfficerQueue: () => apiRequest('/officer/queue'),
  callNextFarmer: () => apiRequest('/officer/queue/next', { method: 'POST' }),
  markFarmerArrived: (bookingId: string) =>
    apiRequest('/officer/mark-arrived', { method: 'POST', body: JSON.stringify({ bookingId }) }),
  processProcurement: (procurementId: string, payload: any) =>
    apiRequest(`/officer/procurement/${procurementId}/status`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    }),
  updatePaymentStatus: (paymentId: string, nextStatus: string) =>
    apiRequest(`/officer/payments/${paymentId}/status`, {
      method: 'PATCH',
      body: JSON.stringify({ nextStatus }),
    }),
  getAuditLogs: () => apiRequest('/officer/audit'),
};

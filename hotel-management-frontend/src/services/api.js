// src/services/api.js
import axios from 'axios';
import API_BASE_URL from "../config";  // config.js එකෙන් import කරන්න

// මේ line එක DELETE කරන්න හෝ comment කරන්න
// const API_BASE_URL = process.env.REACT_APP_API_URL;  // <-- මේක දෙපාරක් declare කරනවා

const apiClient = axios.create({
    baseURL: API_BASE_URL,  // දැන් config.js එකෙන් එන value එක use කරනවා
    headers: {
        'Content-Type': 'application/json',
    }
});

// Request Interceptor: Attach JWT Token
apiClient.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('gh_jwt_token');
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

// Response Interceptor: Catch 401 Unauthorized errors
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized access (401), clearing session and redirecting...');
            localStorage.removeItem('gh_jwt_token');
            localStorage.removeItem('gh_user_data');
            window.dispatchEvent(new CustomEvent('unauthorized-redirect'));
        }
        return Promise.reject(error);
    }
);

const api = {
    // Auth
    login: (credentials) => apiClient.post('/auth/login', credentials),
    changePassword: (passwordData) => apiClient.put('/auth/change-password', passwordData),
    logout: () => apiClient.post('/auth/logout'),
    
    // Dashboard Stats
    getDashboardStats: () => apiClient.get('/reports/dashboard'),
    
    // Rooms CRUD
    getRooms: () => apiClient.get('/rooms'),
    createRoom: (roomData) => apiClient.post('/rooms', roomData),
    updateRoom: (id, roomData) => apiClient.put(`/rooms/${id}`, roomData),
    deleteRoom: (id) => apiClient.delete(`/rooms/${id}`),
    
    // Bookings CRUD & Actions
    getBookings: () => apiClient.get('/bookings'),
    createBooking: (bookingData) => apiClient.post('/bookings', bookingData),
    checkinBooking: (id) => apiClient.post(`/bookings/${id}/checkin`),
    checkoutBooking: (id) => apiClient.post(`/bookings/${id}/checkout`),
    
    // Customers CRUD
    getCustomers: () => apiClient.get('/customers'),
    createCustomer: (customerData) => apiClient.post('/customers', customerData),
    updateCustomer: (id, customerData) => apiClient.put(`/customers/${id}`, customerData),
    deleteCustomer: (id) => apiClient.delete(`/customers/${id}`),
    
    // Payments CRUD
    getPayments: () => apiClient.get('/payments'),
    createPayment: (paymentData) => apiClient.post('/payments', paymentData),
    
    // Expenses CRUD
    getExpenses: () => apiClient.get('/expenses'),
    createExpense: (expenseData) => apiClient.post('/expenses', expenseData),
    
    // Reports
    getIncomeReport: (params) => apiClient.get('/reports/income', { params }),
    getExpenseReport: (params) => apiClient.get('/reports/expenses', { params }),
    getProfitLossReport: (params) => apiClient.get('/reports/profit-loss', { params }),
    getOccupancyReport: (params) => apiClient.get('/reports/occupancy', { params }),
    
    // Export Blob endpoints
    exportReportPdf: (reportType, params = {}) => apiClient.get('/reports/export/pdf', {
        params: { report_type: reportType, ...params },
        responseType: 'blob'
    }),
    exportReportExcel: (reportType, params = {}) => apiClient.get('/reports/export/excel', {
        params: { report_type: reportType, ...params },
        responseType: 'blob'
    }),
    
    // Admin Users (admin only)
    getAdminUsers: () => apiClient.get('/admin/users'),
    createAdminUser: (userData) => apiClient.post('/admin/users', userData),
    updateAdminUser: (id, userData) => apiClient.put(`/admin/users/${id}`, userData),
    deleteAdminUser: (id) => apiClient.delete(`/admin/users/${id}`),
    
    // Audit Logs (admin only)
    getAuditLogs: () => apiClient.get('/admin/audit-logs'),
};

export default api;
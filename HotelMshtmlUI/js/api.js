// Centralized API configuration and client using Axios

const API_BASE_URL = 'http://localhost:5000/api/v1';

// Create Axios Instance
const apiClient = axios.create({
    baseURL: API_BASE_URL,
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

// Response Interceptor: Catch 401 Unauthorized errors to redirect to login
apiClient.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response && error.response.status === 401) {
            console.warn('Unauthorized access (401), clearing session and redirecting...');
            localStorage.removeItem('gh_jwt_token');
            localStorage.removeItem('gh_user_data');
            // Dispatch custom event to trigger UI routing update
            window.dispatchEvent(new CustomEvent('unauthorized-redirect'));
        }
        return Promise.reject(error);
    }
);

// API methods wrapper
const api = {
    // Auth
    login: (credentials) => apiClient.post('/auth/login', credentials),
    
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
    exportReportPdf: (reportType) => apiClient.get(`/reports/export/pdf?type=${reportType}`, { responseType: 'blob' }),
    exportReportExcel: (reportType) => apiClient.get(`/reports/export/excel?type=${reportType}`, { responseType: 'blob' }),
    
    // Admin Users (admin only)
    getAdminUsers: () => apiClient.get('/admin/users'),
    createAdminUser: (userData) => apiClient.post('/admin/users', userData),
    updateAdminUser: (id, userData) => apiClient.put(`/admin/users/${id}`, userData),
    deleteAdminUser: (id) => apiClient.delete(`/admin/users/${id}`),
    
    // Audit Logs (admin only)
    getAuditLogs: () => apiClient.get('/admin/audit-logs'),
};

export default api;

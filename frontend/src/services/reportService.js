import axios from 'axios';

// Create axios instance with base URL
const api = axios.create({
  baseURL: '/api'
});

// Add token to requests if available
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Report services
const reportService = {
  // Get all reports (admin only)
  getReports: () => {
    return api.get('/reports');
  },

  // Get a single report by ID (admin only)
  getReport: (id) => {
    return api.get(`/reports/${id}`);
  },
  
  // Create a report
  createReport: (reportData) => {
    return api.post('/reports', reportData);
  },
  
  // Update report status (admin only)
  updateReportStatus: (id, status) => {
    return api.put(`/reports/${id}`, { status });
  },
  
  // Download items inventory report (admin only)
  downloadItemsInventoryReport: () => {
    return api.get('/admin/reports/items-inventory', {
      responseType: 'blob'
    });
  },
  
  // Download items by category report (admin only)
  downloadItemsByCategoryReport: () => {
    return api.get('/admin/reports/items-by-category', {
      responseType: 'blob'
    });
  }
};

export default reportService;

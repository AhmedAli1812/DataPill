import axios from 'axios';

const API_BASE_URL = 'http://localhost:5089/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

api.interceptors.request.use((config) => {
  const userStr = localStorage.getItem('user');
  if (userStr) {
    const user = JSON.parse(userStr);
    if (user && user.token) {
      config.headers.Authorization = `Bearer ${user.token}`;
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const getDashboardStats = async () => {
  const response = await api.get('/dashboard');
  return response.data;
};

export const getStudents = async () => {
  const response = await api.get('/students');
  return response.data;
};

export const getStudent = async (id) => {
  const response = await api.get(`/students/${id}`);
  return response.data;
};

export const createStudent = async (studentData) => {
  const response = await api.post('/students', studentData);
  return response.data;
};

export const deleteStudent = async (id) => {
  const response = await api.delete(`/students/${id}`);
  return response.data;
};

export const getSubscriptions = async (studentId = null) => {
  const url = studentId ? `/subscriptions?studentId=${studentId}` : '/subscriptions';
  const response = await api.get(url);
  return response.data;
};

export const getSubscription = async (id) => {
  const response = await api.get(`/subscriptions/${id}`);
  return response.data;
};

export const createSubscription = async (subscriptionData) => {
  const response = await api.post('/subscriptions', subscriptionData);
  return response.data;
};

export const getPaymentsBySubscription = async (subscriptionId) => {
  const response = await api.get(`/payments/by-subscription/${subscriptionId}`);
  return response.data;
};

// Admin Endpoints
export const getAdminStats = async () => {
  const response = await api.get('/Admin/stats');
  return response.data;
};

export const getSalesUsers = async () => {
  const response = await api.get('/Admin/users');
  return response.data;
};

export const createSalesUser = async (userData) => {
  const response = await api.post('/Admin/users', userData);
  return response.data;
};

export const updateSalesUser = async (userId, userData) => {
  const response = await api.put(`/Admin/users/${userId}`, userData);
  return response.data;
};

export const deleteSalesUser = async (userId) => {
  const response = await api.delete(`/Admin/users/${userId}`);
  return response.data;
};

export const getSalesPerformance = async () => {
  const response = await api.get('/Admin/performance');
  return response.data;
};

export const getUserAuditLogs = async (userId) => {
  const response = await api.get(`/Admin/users/${userId}/audit`);
  return response.data;
};

export const getFinancialTrends = async () => {
  const response = await api.get('/Admin/financial-trends');
  return response.data;
};

// Expenses
export const getExpenses = async () => {
  const response = await api.get('/expenses');
  return response.data;
};

export const createExpense = async (expenseData) => {
  const response = await api.post('/expenses', expenseData);
  return response.data;
};

export const deleteExpense = async (id) => {
  const response = await api.delete(`/expenses/${id}`);
  return response.data;
};

// Reminders
export const getPendingPayments = async () => {
  const response = await api.get('/reminders/pending');
  return response.data;
};

// Reports
export const getReportsData = async (month, year) => {
  const url = (month && year) ? `/reports/monthly?month=${month}&year=${year}` : '/reports/monthly';
  const response = await api.get(url);
  return response.data;
};

export const exportReport = (format, month, year) => {
  return `${api.defaults.baseURL}/reports/export?format=${format}&month=${month}&year=${year}`;
};

export const downloadReport = async (format, month, year) => {
  const response = await api.get(`/reports/export?format=${format}&month=${month}&year=${year}`, {
    responseType: 'blob',
  });
  return response.data;
};

export const createPayment = async (paymentData) => {
  const response = await api.post('/payments', paymentData);
  return response.data;
};

// Groups
export const getGroups = async () => {
  const response = await api.get('/groups');
  return response.data;
};

export const createGroup = async (groupData) => {
  const response = await api.post('/groups', groupData);
  return response.data;
};

export const updateGroup = async (id, groupData) => {
  const response = await api.put(`/groups/${id}`, groupData);
  return response.data;
};

export const deleteGroup = async (id) => {
  const response = await api.delete(`/groups/${id}`);
  return response.data;
};

// Salaries (Payroll)
export const getSalaries = async (month, year) => {
  const url = month && year ? `/salaries?month=${month}&year=${year}` : '/salaries';
  const response = await api.get(url);
  return response.data;
};

export const createSalary = async (salaryData) => {
  const response = await api.post('/salaries', salaryData);
  return response.data;
};

export const deleteSalary = async (id) => {
  const response = await api.delete(`/salaries/${id}`);
  return response.data;
};

// Instructor Endpoints
export const getInstructorDashboard = async (instructorId = null) => {
  const url = instructorId ? `/Instructor/dashboard?instructorId=${instructorId}` : '/Instructor/dashboard';
  const response = await api.get(url);
  return response.data;
};

export const recordInstructorSession = async (sessionData) => {
  const response = await api.post('/Instructor/sessions', sessionData);
  return response.data;
};

export const getAllInstructorSessions = async () => {
  const response = await api.get('/Instructor/all-sessions');
  return response.data;
};export const getAllInstructorsWithGroups = async () => {
  const response = await api.get('/Instructor/all-instructors');
  return response.data;
};
export const updateInstructorSession = async (id, data) => {
  const response = await api.put(`/Instructor/sessions/${id}`, data);
  return response.data;
};

export const deleteInstructorSession = async (id) => {
  const response = await api.delete(`/Instructor/sessions/${id}`);
  return response.data;
};

export const createInstructor = async (data) => {
  const response = await api.post('/Instructor/create-instructor', data);
  return response.data;
};
// Evaluations
export const getEvaluations = async (studentId = null, groupId = null) => {
  let url = '/evaluations?';
  if (studentId) url += `studentId=${studentId}&`;
  if (groupId) url += `groupId=${groupId}&`;
  const response = await api.get(url);
  return response.data;
};

export const createEvaluation = async (evaluationData) => {
  const response = await api.post('/evaluations', evaluationData);
  return response.data;
};

export const deleteEvaluation = async (id) => {
  const response = await api.delete(`/evaluations/${id}`);
  return response.data;
};

// Audit Logs
export const getAuditLogs = async () => {
  const response = await api.get('/auditlogs');
  return response.data;
};

// Student Portal
export const studentLogin = async (phone, password) => {
  const response = await api.post('/StudentAuth/login', { email: phone, password }); // reusing LoginDto which has Email/Password
  return response.data;
};

export const getStudentDashboard = async () => {
  const response = await api.get('/StudentPortal/dashboard');
  return response.data;
};

export const getStudentGroupSessions = async (groupId) => {
  const response = await api.get(`/StudentPortal/group/${groupId}/sessions`);
  return response.data;
};

export const joinStudentSession = async (sessionId) => {
  const response = await api.post(`/StudentPortal/session/${sessionId}/join`);
  return response.data;
};

// Coordinator Session Management
export const getGroupSessions = async (groupId) => {
  const response = await api.get(`/GroupSessions/group/${groupId}`);
  return response.data;
};

export const createGroupSession = async (sessionData) => {
  const response = await api.post('/GroupSessions', sessionData);
  return response.data;
};

export const updateGroupSession = async (sessionId, sessionData) => {
  const response = await api.put(`/GroupSessions/${sessionId}`, sessionData);
  return response.data;
};

export const deleteGroupSession = async (sessionId) => {
  const response = await api.delete(`/GroupSessions/${sessionId}`);
  return response.data;
};

export default api;

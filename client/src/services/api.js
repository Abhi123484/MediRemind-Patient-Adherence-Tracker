import axios from 'axios';

const API = axios.create({
  baseURL: '/api'
});

API.interceptors.request.use((config) => {
  const token = localStorage.getItem('mediremind_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

API.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('mediremind_token');
      localStorage.removeItem('mediremind_user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth
export const login = (data) => API.post('/auth/login', data);
export const register = (data) => API.post('/auth/register', data);
export const getMe = () => API.get('/auth/me');
export const getDoctors = () => API.get('/auth/doctors');
export const assignDoctor = (doctorId) => API.put('/auth/assign-doctor', { doctorId });

// Medications
export const getMedications = (patientId) =>
  API.get('/medications', { params: patientId ? { patientId } : {} });
export const addMedication = (data) => API.post('/medications', data);
export const updateMedication = (id, data) => API.put(`/medications/${id}`, data);
export const deleteMedication = (id) => API.delete(`/medications/${id}`);

// Helper: get local date as YYYY-MM-DD string
const getLocalDate = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

// Adherence
export const logDose = (data) => API.post('/adherence/log', data);
export const getTodaySchedule = () =>
  API.get('/adherence/today', { params: { localDate: getLocalDate() } });
export const getWeeklySummary = (patientId) =>
  API.get('/adherence/weekly', { params: { localDate: getLocalDate(), ...(patientId ? { patientId } : {}) } });
export const getStreak = () =>
  API.get('/adherence/streak', { params: { localDate: getLocalDate() } });
export const getCalendarData = (month, year) =>
  API.get('/adherence/calendar', { params: { month, year } });

// Doctor
export const getDoctorPatients = () => API.get('/adherence/doctor/patients');
export const getPatientReport = (patientId) =>
  API.get(`/adherence/doctor/report/${patientId}`);

export default API;

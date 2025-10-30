import axios from 'axios';
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  Project,
  ProjectDetail,
  CreateProjectRequest,
  Task,
  CreateTaskRequest,
  UpdateTaskRequest,
} from '../types';

const API_BASE_URL = 'https://assprojectmanagerextended.onrender.com/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for error handling
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: RegisterRequest) =>
    api.post<AuthResponse>('/auth/register', data),
  
  login: (data: LoginRequest) =>
    api.post<AuthResponse>('/auth/login', data),
};

// Projects API
export const projectsApi = {
  getAll: () =>
    api.get<Project[]>('/projects'),
  
  getById: (id: number) =>
    api.get<ProjectDetail>(`/projects/${id}`),
  
  create: (data: CreateProjectRequest) =>
    api.post<Project>('/projects', data),
  
  delete: (id: number) =>
    api.delete(`/projects/${id}`),
};

// Tasks API
export const tasksApi = {
  create: (projectId: number, data: CreateTaskRequest) =>
    api.post<Task>(`/projects/${projectId}/tasks`, data),
  
  update: (taskId: number, data: UpdateTaskRequest) =>
    api.put<Task>(`/tasks/${taskId}`, data),
  
  delete: (taskId: number) =>
    api.delete(`/tasks/${taskId}`),
};

export default api;
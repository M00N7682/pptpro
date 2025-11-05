// Frontend API for projects
import apiClient from './client';

export interface ProjectCreatePayload {
  title: string;
  topic?: string;
  target_audience?: string;
  goal?: string;
}

export interface Project {
  id: string;
  user_id: string;
  title: string;
  topic?: string;
  target_audience?: string;
  goal?: string;
}

export const createProject = async (payload: ProjectCreatePayload): Promise<Project> => {
  const res = await apiClient.post('/projects/', payload);
  return res.data;
};

export const listProjects = async (): Promise<Project[]> => {
  const res = await apiClient.get('/projects/');
  return res.data;
};

export const getProject = async (id: string): Promise<Project> => {
  const res = await apiClient.get(`/projects/${id}`);
  return res.data;
};

export const updateProject = async (id: string, payload: Partial<ProjectCreatePayload>): Promise<Project> => {
  const res = await apiClient.patch(`/projects/${id}`, payload);
  return res.data;
};

export const deleteProject = async (id: string): Promise<void> => {
  await apiClient.delete(`/projects/${id}`);
};

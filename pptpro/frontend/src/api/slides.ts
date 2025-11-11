import apiClient from './client';

export interface Slide {
  id: string;
  project_id: string;
  order: number;
  head_message: string;
  template_type: string;
  purpose: string;
  content: Record<string, unknown>;
  status: string;
  created_at: string;
  updated_at: string;
}

export interface SlideCreateRequest {
  project_id: string;
  order: number;
  head_message: string;
  template_type?: string;
  purpose?: string;
}

export interface SlideUpdateRequest {
  head_message?: string;
  template_type?: string;
  purpose?: string;
  content?: Record<string, unknown>;
  status?: string;
}

export interface TemplateInfo {
  name: string;
  description: string;
  fields: string[];
}

export interface TemplatesResponse {
  templates: Record<string, TemplateInfo>;
}

export const slidesApi = {
  // 프로젝트의 슬라이드 목록 조회
  async getSlidesForProject(projectId: string): Promise<Slide[]> {
    const response = await apiClient.get(`/slides/project/${projectId}`);
    return response.data;
  },

  // 슬라이드 생성
  async createSlide(request: SlideCreateRequest): Promise<Slide> {
    const response = await apiClient.post('/slides/', request);
    return response.data;
  },

  // 슬라이드 상세 조회
  async getSlide(slideId: string): Promise<Slide> {
    const response = await apiClient.get(`/slides/${slideId}`);
    return response.data;
  },

  // 슬라이드 수정
  async updateSlide(slideId: string, request: SlideUpdateRequest): Promise<Slide> {
    const response = await apiClient.patch(`/slides/${slideId}`, request);
    return response.data;
  },

  // 슬라이드 삭제
  async deleteSlide(slideId: string): Promise<void> {
    await apiClient.delete(`/slides/${slideId}`);
  },

  // 사용 가능한 템플릿 목록
  async getAvailableTemplates(): Promise<TemplatesResponse> {
    const response = await apiClient.get('/slides/templates/available');
    return response.data;
  },
};

export default slidesApi;
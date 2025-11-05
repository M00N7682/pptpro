import apiClient from './client';

export interface ContentGenerateRequest {
  slide_id: string;
  regenerate?: boolean;
}

export interface ContentUpdateRequest {
  content: Record<string, any>;
  user_completed_fields?: string[];
}

export interface ContentResponse {
  slide_id: string;
  template_type: string;
  content: Record<string, any>;
  user_needed_items: string[];
  generation_notes: string;
  status: string;
}

export interface TemplateField {
  name: string;
  type: string;
  required: boolean;
  description: string;
  sub_fields?: TemplateField[];
}

export interface TemplateFieldsResponse {
  fields: TemplateField[];
}

export interface BatchGenerateResult {
  slide_id: string;
  head_message: string;
  status: string;
  error?: string;
}

export interface BatchGenerateResponse {
  message: string;
  results: BatchGenerateResult[];
}

export const contentApi = {
  // 슬라이드 콘텐츠 생성
  async generateSlideContent(request: ContentGenerateRequest): Promise<ContentResponse> {
    const response = await apiClient.post('/content/generate', request);
    return response.data;
  },

  // 슬라이드 콘텐츠 수정
  async updateSlideContent(slideId: string, request: ContentUpdateRequest): Promise<ContentResponse> {
    const response = await apiClient.patch(`/content/${slideId}`, request);
    return response.data;
  },

  // 슬라이드 콘텐츠 조회
  async getSlideContent(slideId: string): Promise<ContentResponse> {
    const response = await apiClient.get(`/content/${slideId}`);
    return response.data;
  },

  // 프로젝트 전체 슬라이드 일괄 생성
  async batchGenerateContent(projectId: string): Promise<BatchGenerateResponse> {
    const response = await apiClient.post(`/content/batch-generate/${projectId}`);
    return response.data;
  },

  // 템플릿별 필드 구조 조회
  async getTemplateFields(templateType: string): Promise<TemplateFieldsResponse> {
    const response = await apiClient.get(`/content/templates/${templateType}/fields`);
    return response.data;
  },
};

export default contentApi;
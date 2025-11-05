import apiClient from './client';

export interface SlideOutline {
  order: number;
  head_message: string;
  purpose: string;
  template_suggestion: string;
}

export interface StorylineResult {
  outline: SlideOutline[];
  overall_narrative: string;
  project_id?: string;
}

export interface StorylineRequest {
  topic: string;
  target: string;
  goal: string;
  narrative_style?: string;
  create_project?: boolean;
  project_title?: string;
}

export interface Template {
  name: string;
  description: string;
}

export interface TemplateResponse {
  templates: Record<string, Template>;
}

export const storylineApi = {
  // 스토리라인 생성
  async generateStoryline(request: StorylineRequest): Promise<StorylineResult> {
    const response = await apiClient.post('/storyline/generate', request);
    return response.data;
  },

  // 템플릿 목록 조회
  async getTemplates(): Promise<TemplateResponse> {
    const response = await apiClient.get('/storyline/templates');
    return response.data;
  },
};

export default storylineApi;
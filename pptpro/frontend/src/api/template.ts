/**
 * Template API client
 */
import apiClient from './client';

export interface TemplateSuggestionRequest {
  slide_purpose: string;
  head_message: string;
  context?: string;
}

export interface TemplateComponent {
  type: string;
  description: string;
  required: boolean;
}

export interface TemplateSuggestionResponse {
  template_type: string;
  reason: string;
  components: TemplateComponent[];
  alternative_templates?: string[];
}

export const templateApi = {
  /**
   * 슬라이드 목적과 헤드메시지를 기반으로 최적의 템플릿 추천
   */
  suggestTemplate: async (
    request: TemplateSuggestionRequest
  ): Promise<TemplateSuggestionResponse> => {
    const response = await apiClient.post<TemplateSuggestionResponse>(
      '/api/template/suggest',
      request
    );
    return response.data;
  },
};

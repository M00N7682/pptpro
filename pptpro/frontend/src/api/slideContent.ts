/**
 * Slide content API client - classification and generation
 */
import apiClient from './client';

export interface SlideClassificationRequest {
  slide_text: string;
  slide_type: string;
  head_message?: string;
}

export interface ContentElement {
  element_type: string;
  description: string;
  classification: 'USER_NEEDED' | 'AI_GENERATED';
  reason: string;
}

export interface SlideClassificationResponse {
  user_needed: ContentElement[];
  ai_generated: ContentElement[];
}

export interface SlideContentGenerationRequest {
  slide_type: string;
  ai_generated_elements: string[];
  context: Record<string, any>;
}

export interface SlideComponents {
  title?: string;
  sub_message?: string;
  bullet_points?: string[];
  evidence_block?: string;
  diagram_components?: Record<string, any>;
  insight_box?: string;
  action_guide?: string;
  caption?: string;
  main_message?: string;
  supporting_points?: string[];
  call_to_action?: string;
  as_is_title?: string;
  as_is_points?: string[];
  to_be_title?: string;
  to_be_points?: string[];
  transition_method?: string;
  cases?: Array<Record<string, any>>;
  steps?: Array<Record<string, any>>;
  chart_title?: string;
  chart_type?: string;
  key_insights?: string[];
  data_source?: string;
  central_concept?: string;
  primary_nodes?: string[];
  connections?: Array<Record<string, any>>;
  ppt_payload?: Record<string, any>;
  [key: string]: any;
}

export interface SlideContentGenerationResponse {
  components: SlideComponents;
  metadata?: Record<string, any>;
}

export const slideContentApi = {
  /**
   * 슬라이드 콘텐츠를 USER_NEEDED / AI_GENERATED로 자동 분류
   */
  classifyContent: async (
    request: SlideClassificationRequest
  ): Promise<SlideClassificationResponse> => {
    const response = await apiClient.post<SlideClassificationResponse>(
      '/api/slide/classify',
      request
    );
    return response.data;
  },

  /**
   * AI_GENERATED 요소들에 대해 실제 콘텐츠 생성
   */
  generateContent: async (
    request: SlideContentGenerationRequest
  ): Promise<SlideContentGenerationResponse> => {
    const response = await apiClient.post<SlideContentGenerationResponse>(
      '/api/slide/generate',
      request
    );
    return response.data;
  },
};

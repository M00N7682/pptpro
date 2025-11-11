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

export interface SlideContentGenerationRequestContext {
  [key: string]: string | number | boolean | null | undefined;
}

export interface SlideContentGenerationRequest {
  slide_type: string;
  ai_generated_elements: string[];
  context: SlideContentGenerationRequestContext;
}

export interface MessageOnlyPayload {
  main_message?: string;
  supporting_points?: string[];
  call_to_action?: string;
}

export interface AsIsToBePayload {
  as_is_title?: string;
  as_is_points?: string[];
  to_be_title?: string;
  to_be_points?: string[];
  transition_method?: string;
}

export interface CaseBoxItem {
  title?: string;
  description?: string;
  pros?: string[];
  cons?: string[];
  recommendation?: string;
}

export interface CaseBoxPayload {
  cases?: CaseBoxItem[];
  insight_box?: string;
}

export interface StepItem {
  order?: number;
  title?: string;
  description?: string;
  deliverables?: string[];
  timeline?: string;
}

export interface StepFlowPayload {
  steps?: StepItem[];
  action_guide?: string;
}

export interface ChartInsightPayload {
  chart_title?: string;
  chart_type?: string;
  key_insights?: string[];
  data_source?: string;
  evidence_block?: string;
  insight_box?: string;
}

export interface ConnectionItem {
  from: string;
  to: string;
  relationship?: string;
}

export interface NodeMapPayload {
  central_concept?: string;
  primary_nodes?: string[];
  connections?: ConnectionItem[];
  insight_box?: string;
}

export type TemplatePayload =
  | MessageOnlyPayload
  | AsIsToBePayload
  | CaseBoxPayload
  | StepFlowPayload
  | ChartInsightPayload
  | NodeMapPayload;

export interface SlideComponents {
  title?: string;
  sub_message?: string;
  bullet_points?: string[];
  evidence_block?: string;
  diagram_components?: Record<string, unknown>;
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
  cases?: CaseBoxItem[];
  steps?: StepItem[];
  chart_title?: string;
  chart_type?: string;
  key_insights?: string[];
  data_source?: string;
  central_concept?: string;
  primary_nodes?: string[];
  connections?: ConnectionItem[];
  ppt_payload?: TemplatePayload;
  [key: string]: unknown;
}

export interface SlideContentGenerationResponse {
  components: SlideComponents;
  metadata?: Record<string, unknown>;
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

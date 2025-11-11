import apiClient from './client';

export interface PPTPreviewInfo {
  project: {
    id: string;
    title: string;
    topic: string;
    target_audience: string;
    goal: string;
  };
  slides: Array<{
    order: number;
    head_message: string;
    template_type: string;
    status: string;
    has_content: boolean;
    content_summary?: string;
    purpose?: string;
  }>;
  summary: {
    total_slides: number;
    content_slides: number;
    ready_slides: number;
    completion_rate: number;
  };
  can_generate: boolean;
}

export interface TemplatePreview {
  name: string;
  description: string;
  preview: string;
  best_for: string[];
}

export interface TemplatePreviewsResponse {
  templates: Record<string, TemplatePreview>;
}

export const pptApi = {
  // PPT 파일 생성 및 다운로드
  async generatePPT(projectId: string, includeEmpty: boolean = false): Promise<Blob> {
    const response = await apiClient.post(
      `/ppt/generate/${projectId}?include_empty=${includeEmpty}`,
      {},
      { responseType: 'blob' }
    );
    return response.data;
  },

  // PPT 생성 미리보기 정보
  async getPPTPreview(projectId: string): Promise<PPTPreviewInfo> {
    const response = await apiClient.get(`/ppt/preview/${projectId}`);
    return response.data;
  },

  // 템플릿 미리보기 정보
  async getTemplatePreviews(): Promise<TemplatePreviewsResponse> {
    const response = await apiClient.get('/ppt/templates/preview');
    return response.data;
  },

  // PPT 파일 다운로드 헬퍼
  downloadPPT(blob: Blob, filename: string) {
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(url);
  },
};

export default pptApi;
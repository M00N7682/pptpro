import React, { useState, useEffect } from 'react';
import { Button, LoadingSpinner } from '../ui';
import { pptApi, type PPTPreviewInfo } from '../../api/ppt';
import './PPTGenerator.css';

interface PPTGeneratorProps {
  projectId: string;
}

const PPTGenerator: React.FC<PPTGeneratorProps> = ({ projectId }) => {
  const [previewInfo, setPreviewInfo] = useState<PPTPreviewInfo | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadPreviewInfo();
  }, [projectId]);

  const loadPreviewInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const info = await pptApi.getPPTPreview(projectId);
      setPreviewInfo(info);
    } catch (err) {
      setError('미리보기 정보를 불러오는데 실패했습니다.');
      console.error('Failed to load PPT preview info:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleGeneratePPT = async (includeEmpty: boolean = false) => {
    if (!previewInfo) return;

    try {
      setIsGenerating(true);
      setError(null);

      const blob = await pptApi.generatePPT(projectId, includeEmpty);
      const filename = `${previewInfo.project.title}.pptx`;
      pptApi.downloadPPT(blob, filename);
    } catch (err) {
      setError('PPT 생성에 실패했습니다.');
      console.error('Failed to generate PPT:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  if (isLoading) {
    return (
      <div className="ppt-generator card">
        <div className="card-body">
          <LoadingSpinner message="PPT 정보를 불러오는 중..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="ppt-generator card">
        <div className="card-body">
          <div className="error-message">
            <p>{error}</p>
            <Button onClick={loadPreviewInfo} variant="secondary" size="small">
              다시 시도
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!previewInfo) return null;

  const { project, slides, summary, can_generate } = previewInfo;

  return (
    <div className="ppt-generator card card--bordered card--hoverable">
      <div className="card-header">
        <div className="ppt-header">
          <h3>🎯 PPT 생성하기</h3>
          <div className="completion-badge">
            {Math.round(summary.completion_rate)}% 완료
          </div>
        </div>
      </div>

      <div className="card-body">
        <div className="project-info">
          <h4>{project.title}</h4>
          <p className="project-topic">{project.topic}</p>
        </div>

        <div className="ppt-stats">
          <div className="stat-item">
            <div className="stat-number">{summary.total_slides}</div>
            <div className="stat-label">총 슬라이드</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{summary.content_slides}</div>
            <div className="stat-label">콘텐츠 슬라이드</div>
          </div>
          <div className="stat-item">
            <div className="stat-number">{summary.ready_slides}</div>
            <div className="stat-label">완성된 슬라이드</div>
          </div>
        </div>

        <div className="progress-bar">
          <div 
            className="progress-fill"
            style={{ width: `${summary.completion_rate}%` }}
          />
        </div>

        <div className="slide-preview">
          <h5>슬라이드 미리보기</h5>
          <div className="slide-list">
            {slides.map((slide, index) => (
              <div 
                key={index} 
                className={`slide-item ${slide.has_content ? 'has-content' : 'empty'}`}
              >
                <div className="slide-number">{slide.order}</div>
                <div className="slide-info">
                  <div className="slide-title">{slide.head_message}</div>
                  <div className="slide-meta">
                    <span className={`template-badge ${slide.template_type}`}>
                      {slide.template_type}
                    </span>
                    <span className={`status-badge ${slide.status}`}>
                      {slide.status}
                    </span>
                  </div>
                  {slide.content_summary && (
                    <div className="slide-summary">{slide.content_summary}</div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="card-footer">
        <div className="ppt-actions">
          <Button
            variant="success"
            size="large"
            onClick={() => handleGeneratePPT(false)}
            disabled={!can_generate || isGenerating}
            loading={isGenerating}
            className="generate-btn"
          >
            📄 완성된 슬라이드만 PPT 생성
          </Button>
          
          <Button
            variant="primary"
            size="large"
            onClick={() => handleGeneratePPT(true)}
            disabled={isGenerating}
            loading={isGenerating}
            className="generate-btn"
          >
            📋 모든 슬라이드 PPT 생성
          </Button>
        </div>

        {!can_generate && (
          <div className="warning-message">
            ⚠️ 완성된 슬라이드가 없어서 PPT를 생성할 수 없습니다.
          </div>
        )}
      </div>
    </div>
  );
};

export default PPTGenerator;
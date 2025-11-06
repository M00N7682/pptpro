/**
 * PPT Preview & Download Page - Page 5
 * 최종 렌더링 결과 미리보기 및 다운로드
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { pptApi } from '../api/ppt';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import './PPTPreviewPage.css';

const PPTPreviewPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const projectId: string = location.state?.projectId || '';

  const [previewInfo, setPreviewInfo] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (projectId) {
      loadPreviewInfo();
    }
  }, [projectId]);

  const loadPreviewInfo = async () => {
    setIsLoading(true);
    try {
      const info = await pptApi.getPPTPreview(projectId);
      setPreviewInfo(info);
    } catch (error) {
      console.error('미리보기 정보 로드 실패:', error);
      alert('프로젝트 정보를 불러오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async (includeEmpty: boolean = false) => {
    setIsDownloading(true);
    try {
      const blob = await pptApi.generatePPT(projectId, includeEmpty);
      const filename = `${previewInfo.project.title}_${new Date().toISOString().split('T')[0]}.pptx`;
      pptApi.downloadPPT(blob, filename);
      alert('PPT 파일이 다운로드되었습니다!');
    } catch (error: any) {
      console.error('PPT 다운로드 실패:', error);
      alert(error.response?.data?.detail || 'PPT 다운로드에 실패했습니다.');
    } finally {
      setIsDownloading(false);
    }
  };

  if (!projectId) {
    return (
      <div className="ppt-preview-page">
        <div className="error-message">
          <p>프로젝트 정보가 없습니다.</p>
          <button onClick={() => navigate('/projects')}>프로젝트 목록으로</button>
        </div>
      </div>
    );
  }

  return (
    <div className="ppt-preview-page">
      <div className="preview-header">
        <h1>PPT 미리보기 및 다운로드</h1>
        <p>최종 결과를 확인하고 PPT 파일을 다운로드하세요</p>
      </div>

      {isLoading && (
        <div className="loading-container">
          <LoadingSpinner size="large" message="미리보기 정보를 불러오는 중..." />
        </div>
      )}

      {!isLoading && previewInfo && (
        <div className="preview-content">
          {/* 프로젝트 정보 카드 */}
          <div className="project-info-card">
            <h2>{previewInfo.project.title}</h2>
            <div className="project-meta">
              <div className="meta-item">
                <span className="label">주제:</span>
                <span className="value">{previewInfo.project.topic}</span>
              </div>
              <div className="meta-item">
                <span className="label">타겟:</span>
                <span className="value">{previewInfo.project.target_audience}</span>
              </div>
              <div className="meta-item">
                <span className="label">목표:</span>
                <span className="value">{previewInfo.project.goal}</span>
              </div>
            </div>
          </div>

          {/* 슬라이드 통계 */}
          <div className="stats-card">
            <h3>PPT 구성</h3>
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-number">{previewInfo.summary.total_slides}</div>
                <div className="stat-label">전체 슬라이드</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{previewInfo.summary.ready_slides}</div>
                <div className="stat-label">완성된 슬라이드</div>
              </div>
              <div className="stat-item">
                <div className="stat-number">{previewInfo.summary.completion_rate}%</div>
                <div className="stat-label">완성도</div>
              </div>
            </div>
            
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${previewInfo.summary.completion_rate}%` }}
              ></div>
            </div>
          </div>

          {/* 슬라이드 목록 미리보기 */}
          <div className="slides-preview-card">
            <h3>슬라이드 구성</h3>
            <div className="slides-preview-list">
              {previewInfo.slides.map((slide: any, index: number) => (
                <div 
                  key={index} 
                  className={`slide-preview-item ${slide.has_content ? 'has-content' : 'empty'}`}
                >
                  <div className="slide-preview-number">{slide.order}</div>
                  <div className="slide-preview-content">
                    <h4>{slide.head_message}</h4>
                    <div className="slide-preview-meta">
                      <span className="template-badge">{slide.template_type}</span>
                      <span className={`status-badge status-${slide.status}`}>
                        {slide.status === 'user_completed' ? '완료' :
                         slide.status === 'ai_generated' ? 'AI 생성' : '초안'}
                      </span>
                    </div>
                    {slide.content_summary && (
                      <p className="content-summary">{slide.content_summary}</p>
                    )}
                  </div>
                  <div className="slide-preview-indicator">
                    {slide.has_content ? '✓' : '○'}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 다운로드 옵션 */}
          <div className="download-card">
            <h3>PPT 다운로드</h3>
            <p className="download-description">
              완성된 슬라이드만 포함하거나, 모든 슬라이드를 포함하여 다운로드할 수 있습니다.
            </p>

            <div className="download-options">
              <button
                className="download-button primary"
                onClick={() => handleDownload(false)}
                disabled={isDownloading || !previewInfo.can_generate}
              >
                {isDownloading ? '다운로드 중...' : '완성된 슬라이드만 다운로드'}
              </button>

              <button
                className="download-button secondary"
                onClick={() => handleDownload(true)}
                disabled={isDownloading}
              >
                {isDownloading ? '다운로드 중...' : '모든 슬라이드 다운로드'}
              </button>
            </div>

            {!previewInfo.can_generate && (
              <div className="warning-message">
                ⚠️ 완성된 슬라이드가 없습니다. 슬라이드 편집 페이지에서 콘텐츠를 생성해주세요.
              </div>
            )}
          </div>

          {/* 액션 버튼들 */}
          <div className="action-buttons">
            <button
              className="action-button back-button"
              onClick={() => navigate(`/projects/${projectId}`)}
            >
              프로젝트로 돌아가기
            </button>

            <button
              className="action-button edit-button"
              onClick={() => navigate('/slide-edit', {
                state: {
                  projectId,
                  slides: previewInfo.slides.map((s: any) => ({
                    order: s.order,
                    head_message: s.head_message,
                    template_type: s.template_type,
                    slide_purpose: s.purpose,
                  })),
                },
              })}
            >
              슬라이드 다시 편집하기
            </button>
          </div>
        </div>
      )}

      {isDownloading && (
        <div className="download-overlay">
          <LoadingSpinner size="large" message="PPT 파일을 생성하고 있습니다..." />
        </div>
      )}
    </div>
  );
};

export default PPTPreviewPage;

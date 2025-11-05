import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getProject } from '../api/projects';
import { slidesApi } from '../api/slides';
import { contentApi } from '../api/content';
import { Button, LoadingSpinner } from '../components/ui';
import PPTGenerator from '../components/ppt/PPTGenerator';
import type { Project } from '../api/projects';
import type { Slide, TemplatesResponse } from '../api/slides';
import './ProjectDetailPage.css';

const ProjectDetailPage: React.FC = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const [project, setProject] = useState<Project | null>(null);
  const [slides, setSlides] = useState<Slide[]>([]);
  const [templates, setTemplates] = useState<TemplatesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!projectId) {
      navigate('/projects');
      return;
    }
    
    loadData();
  }, [projectId]);

  const loadData = async () => {
    if (!projectId) return;
    
    setLoading(true);
    try {
      const [projectData, slidesData, templatesData] = await Promise.all([
        getProject(projectId),
        slidesApi.getSlidesForProject(projectId),
        slidesApi.getAvailableTemplates()
      ]);
      
      setProject(projectData);
      setSlides(slidesData);
      setTemplates(templatesData);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to load project data');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateSlide = async (slideId: string, updates: Partial<Slide>) => {
    try {
      const updatedSlide = await slidesApi.updateSlide(slideId, updates);
      setSlides(prev => prev.map(slide => 
        slide.id === slideId ? updatedSlide : slide
      ));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to update slide');
    }
  };

  const handleDeleteSlide = async (slideId: string) => {
    if (!confirm('이 슬라이드를 삭제하시겠습니까?')) return;
    
    try {
      await slidesApi.deleteSlide(slideId);
      setSlides(prev => prev.filter(slide => slide.id !== slideId));
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Failed to delete slide');
    }
  };

  const handleBatchGenerate = async () => {
    if (!projectId || !confirm('모든 슬라이드의 내용을 AI로 생성하시겠습니까?')) return;
    
    setLoading(true);
    try {
      const result = await contentApi.batchGenerateContent(projectId);
      alert(`${result.message}\n생성 완료된 슬라이드를 확인해보세요.`);
      
      // 슬라이드 목록 새로고침
      await loadData();
    } catch (err: any) {
      alert(err.response?.data?.detail || '콘텐츠 생성 중 오류가 발생했습니다');
    } finally {
      setLoading(false);
    }
  };

  const getTemplateDisplayName = (templateType: string) => {
    return templates?.templates[templateType]?.name || templateType;
  };



  const getStatusText = (status: string) => {
    switch (status) {
      case 'draft': return '초안';
      case 'ai_generated': return 'AI 생성';
      case 'user_completed': return '완료';
      default: return status;
    }
  };

  if (loading) {
    return (
      <div className="project-detail-page">
        <div className="loading-container">
          <LoadingSpinner size="large" message="프로젝트 정보를 불러오는 중..." />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="project-detail-page">
        <div className="error-container">
          <div className="error-message">
            <h3>❌ 오류가 발생했습니다</h3>
            <p>{error}</p>
            <Button onClick={() => navigate('/projects')} variant="secondary">
              프로젝트 목록으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="project-detail-page">
        <div className="error-container">
          <div className="error-message">
            <h3>🔍 프로젝트를 찾을 수 없습니다</h3>
            <Button onClick={() => navigate('/projects')} variant="primary">
              프로젝트 목록으로 돌아가기
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="project-detail-page">
      <div className="page-container">
        {/* 헤더 */}
        <div className="page-header">
          <Button
            onClick={() => navigate('/projects')}
            variant="ghost"
            size="small"
            className="back-btn"
          >
            ← 프로젝트 목록으로
          </Button>
          
          <div className="project-header">
            <h1 className="project-title">{project.title}</h1>
            <div className="project-meta">
              <div className="meta-item">
                <span className="meta-label">주제</span>
                <span className="meta-value">{project.topic}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">타겟</span>
                <span className="meta-value">{project.target_audience}</span>
              </div>
              <div className="meta-item">
                <span className="meta-label">목표</span>
                <span className="meta-value">{project.goal}</span>
              </div>
            </div>
          </div>
        </div>

        {/* PPT 생성 섹션 */}
        {projectId && <PPTGenerator projectId={projectId} />}

        {/* 슬라이드 관리 */}
        <div className="card card--bordered slide-management">
          <div className="card-header">
            <div className="section-header">
              <h2 className="section-title">📋 슬라이드 관리</h2>
              <div className="section-actions">
                <Button
                  onClick={handleBatchGenerate}
                  disabled={slides.length === 0}
                  variant="warning"
                  icon="✨"
                >
                  전체 내용 생성
                </Button>
                <Button
                  onClick={() => navigate(`/projects/${projectId}/slides/content`)}
                  variant="primary"
                  icon="🎨"
                >
                  내용 편집하기
                </Button>
              </div>
            </div>
            <p className="section-description">
              {slides.length}개의 슬라이드 · 템플릿을 선택하고 내용을 편집하세요
            </p>
          </div>

          <div className="card-body">
            {slides.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📄</div>
                <h3 className="empty-title">슬라이드가 없습니다</h3>
                <p className="empty-description">
                  스토리라인 생성을 통해 슬라이드를 만들거나 직접 추가하세요.
                </p>
                <Button
                  onClick={() => navigate('/storyline')}
                  variant="primary"
                  size="large"
                  className="empty-action"
                >
                  ✨ 스토리라인 생성하기
                </Button>
              </div>
            ) : (
              <div className="slides-list">
                {slides.map((slide) => (
                  <div
                    key={slide.id}
                    className={`slide-item ${slide.status}`}
                  >
                    <div className="slide-content">
                      <div className="slide-header">
                        <div className="slide-number">{slide.order}</div>
                        <div className="slide-badges">
                          <span className={`status-badge status-${slide.status}`}>
                            {getStatusText(slide.status)}
                          </span>
                          <span className="template-badge">
                            {getTemplateDisplayName(slide.template_type)}
                          </span>
                        </div>
                      </div>
                      
                      <div className="slide-info">
                        <h3 className="slide-title">{slide.head_message}</h3>
                        <p className="slide-purpose">목적: {slide.purpose}</p>
                      </div>
                    </div>

                    <div className="slide-actions">
                      <select
                        value={slide.template_type}
                        onChange={(e) => handleUpdateSlide(slide.id, { template_type: e.target.value })}
                        className="template-selector"
                      >
                        {templates && Object.entries(templates.templates).map(([key, template]) => (
                          <option key={key} value={key}>
                            {template.name}
                          </option>
                        ))}
                      </select>
                      
                      <Button
                        onClick={() => navigate(`/projects/${projectId}/slides/${slide.id}/edit`)}
                        variant="secondary"
                        size="small"
                      >
                        편집
                      </Button>
                      
                      <Button
                        onClick={() => handleDeleteSlide(slide.id)}
                        variant="danger"
                        size="small"
                      >
                        삭제
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* 추가 액션들 */}
        <div className="additional-actions">
          <Button
            onClick={() => navigate('/storyline')}
            variant="secondary"
            size="large"
            icon="✨"
          >
            새 스토리라인 생성
          </Button>
          
          <Button
            onClick={() => window.location.reload()}
            variant="ghost"
            size="large"
            icon="🔄"
          >
            새로고침
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProjectDetailPage;
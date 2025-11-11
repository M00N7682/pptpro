/**
 * Slide Edit Page - Page 4
 * 슬라이드 미리보기(좌측) + 콘텐츠 패널(우측)
 * USER_NEEDED / AI_GENERATED 구분 표시
 */
import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { slidesApi } from '../api/slides';
import {
  slideContentApi,
  type SlideClassificationResponse,
  type SlideComponents,
  type CaseBoxItem,
  type StepItem,
} from '../api/slideContent';
import { Button, LoadingSpinner, ProgressSteps, useToast } from '../components/ui';
import './SlideEditPage.css';

interface SlideData {
  order: number;
  head_message: string;
  slide_purpose?: string;
  template_type: string;
}

interface SlideWithContent extends SlideData {
  id?: string;
  classification?: SlideClassificationResponse;
  content?: SlideComponents;
}

const SlideEditPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const locationState = location.state as { slides?: SlideData[]; projectId?: string } | undefined;
  const slidesRef = useRef<SlideData[]>(locationState?.slides ?? []);
  const projectIdRef = useRef<string>(locationState?.projectId ?? '');
  const slides: SlideData[] = slidesRef.current;
  const projectId: string = projectIdRef.current;

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slidesWithContent, setSlidesWithContent] = useState<SlideWithContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentSlide = slidesWithContent[currentSlideIndex] || slides[currentSlideIndex];

  const workflowSteps = useMemo(() => [
    { label: 'Storyline', description: 'Create structure' },
    { label: 'Templates', description: 'Select design' },
    { label: 'Content', description: 'Edit slides' },
    { label: 'Export', description: 'Download PPT' },
  ], []);

  const createSlidesInBackend = useCallback(async () => {
    setIsLoading(true);
    try {
      const createdSlides: SlideWithContent[] = [];
      const slidesToCreate = slidesRef.current;

      for (const slide of slidesToCreate) {
        const created = await slidesApi.createSlide({
          project_id: projectIdRef.current,
          order: slide.order,
          head_message: slide.head_message,
          template_type: slide.template_type,
          purpose: slide.slide_purpose || 'general',
        });
        createdSlides.push({ ...slide, id: created.id, template_type: slide.template_type });
      }
      
      setSlidesWithContent(createdSlides);
      toast.success(`${createdSlides.length} slides created successfully!`);
    } catch (error: unknown) {
      console.error('슬라이드 생성 실패:', error);
      toast.error('Failed to create slides. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    // 초기화: slides를 slidesWithContent로 변환
    if (slidesRef.current.length > 0 && slidesWithContent.length === 0) {
      void createSlidesInBackend();
    }
  }, [slidesWithContent.length, createSlidesInBackend]);

  // USER_NEEDED / AI_GENERATED 분류
  const handleClassify = async () => {
    if (!currentSlide) return;

    setIsClassifying(true);
    try {
      const classification = await slideContentApi.classifyContent({
        slide_text: currentSlide.head_message,
        slide_type: currentSlide.template_type,
        head_message: currentSlide.head_message,
      });

      // 분류 결과 저장
      const updated = [...slidesWithContent];
      updated[currentSlideIndex] = {
        ...currentSlide,
        classification,
      };
      setSlidesWithContent(updated);
      toast.success('Content classified successfully!');
    } catch (error: unknown) {
      console.error('분류 실패:', error);
      toast.error('Failed to classify content. Please try again.');
    } finally {
      setIsClassifying(false);
    }
  };

  // AI 콘텐츠 생성
  const handleGenerateContent = async () => {
    if (!currentSlide || !currentSlide.classification) {
      toast.warning('Please classify content first.');
      return;
    }

    setIsGenerating(true);
    try {
      const aiElements = currentSlide.classification.ai_generated.map(
        (elem) => elem.element_type
      );

      const generatedContent = await slideContentApi.generateContent({
        slide_type: currentSlide.template_type,
        ai_generated_elements: aiElements,
        context: {
          head_message: currentSlide.head_message,
          purpose: currentSlide.slide_purpose || 'general',
          order: currentSlide.order,
        },
      });

      // 생성된 콘텐츠 저장
      setSlidesWithContent((prev) => {
        const updated = [...prev];
        updated[currentSlideIndex] = {
          ...currentSlide,
          content: generatedContent.components,
        };
        return updated;
      });

      // 백엔드 슬라이드 업데이트
      if (currentSlide.id) {
        await slidesApi.updateSlide(currentSlide.id, {
          content: generatedContent.components,
          status: 'ai_generated',
        });
      }
      
      toast.success('AI content generated successfully!');
    } catch (error: unknown) {
      console.error('콘텐츠 생성 실패:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 사용자 입력 저장
  const handleUserInput = async (field: string, value: unknown) => {
    if (!currentSlide) {
      return;
    }

    const nextContent: SlideComponents = {
      ...(currentSlide.content ?? {}),
      [field]: value,
    };

    setSlidesWithContent((prev) => {
      const updated = [...prev];
      updated[currentSlideIndex] = {
        ...currentSlide,
        content: nextContent,
      };
      return updated;
    });

    // 백엔드 업데이트
    if (currentSlide.id) {
      await slidesApi.updateSlide(currentSlide.id, {
        content: nextContent,
        status: 'user_completed',
      });
    }
  };

  // 다음/이전 슬라이드
  const handleNext = () => {
    if (currentSlideIndex < slidesWithContent.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    } else {
      // 모든 슬라이드 완료 - PPT 렌더링 페이지로 이동
      navigate('/ppt-preview', {
        state: { projectId },
      });
    }
  };

  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const renderTemplatePreview = () => {
    if (!currentSlide || !currentSlide.content) {
      return (
        <div className="ppt-empty-state">
          <div className="empty-icon">📄</div>
          <p>No content generated yet</p>
          <p className="empty-hint">Classify and generate content on the right panel</p>
        </div>
      );
    }

  const payload = (currentSlide.content.ppt_payload ?? currentSlide.content) as SlideComponents;

    switch (currentSlide.template_type) {
      case 'message_only': {
        return (
          <div className="ppt-content">
            {payload.main_message && (
              <div className="content-section">
                <h2 className="content-title">{payload.main_message}</h2>
              </div>
            )}

            {payload.supporting_points && payload.supporting_points.length > 0 && (
              <div className="content-section bullets">
                <ul className="ppt-bullets">
                  {payload.supporting_points.map((point: string, index: number) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}

            {payload.call_to_action && (
              <div className="content-section action">
                <div className="action-box">
                  <div className="action-icon">→</div>
                  <div className="action-text">{payload.call_to_action}</div>
                </div>
              </div>
            )}
          </div>
        );
      }
      case 'asis_tobe': {
        return (
          <div className="ppt-content two-column">
            <div className="column-block">
              <h2>{payload.as_is_title || 'As-Is'}</h2>
              <ul className="ppt-bullets">
                {(payload.as_is_points || []).map((point: string, index: number) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
            <div className="column-block">
              <h2>{payload.to_be_title || 'To-Be'}</h2>
              <ul className="ppt-bullets">
                {(payload.to_be_points || []).map((point: string, index: number) => (
                  <li key={index}>{point}</li>
                ))}
              </ul>
            </div>
            {payload.transition_method && (
              <div className="content-section action">
                <div className="action-box">
                  <div className="action-icon">⇢</div>
                  <div className="action-text">{payload.transition_method}</div>
                </div>
              </div>
            )}
          </div>
        );
      }
      case 'case_box': {
        return (
          <div className="ppt-content case-grid">
            {(payload.cases || []).map((item: CaseBoxItem, index: number) => (
              <div key={index} className="case-card">
                <h3>{item.title || `Case ${index + 1}`}</h3>
                {item.description && <p>{item.description}</p>}
                {(item.pros || item.cons) && (
                  <div className="case-details">
                    {item.pros && item.pros.length > 0 && (
                      <div>
                        <strong>Pros</strong>
                        <ul>
                          {item.pros.map((pro: string, i: number) => (
                            <li key={i}>{pro}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    {item.cons && item.cons.length > 0 && (
                      <div>
                        <strong>Cons</strong>
                        <ul>
                          {item.cons.map((con: string, i: number) => (
                            <li key={i}>{con}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                )}
                {item.recommendation && (
                  <div className="recommendation">{item.recommendation}</div>
                )}
              </div>
            ))}

            {payload.insight_box && (
              <div className="insight-box">
                <div className="insight-icon">💡</div>
                <div className="insight-text">{payload.insight_box}</div>
              </div>
            )}
          </div>
        );
      }
      case 'step_flow': {
        return (
          <div className="ppt-content step-flow">
            {(payload.steps || []).map((step: StepItem, index: number) => (
              <div key={index} className="step-item">
                <div className="step-number">{step.order || index + 1}</div>
                <div className="step-content">
                  <strong>{step.title || `Step ${index + 1}`}</strong>
                  {step.description && <p>{step.description}</p>}
                </div>
              </div>
            ))}
            {payload.action_guide && (
              <div className="action-box">
                <div className="action-icon">🧭</div>
                <div className="action-text">{payload.action_guide}</div>
              </div>
            )}
          </div>
        );
      }
      case 'chart_insight': {
        return (
            <div className="ppt-content chart-insight">
            <div className="chart-placeholder">
              <span>{payload.chart_title || 'Data Insight'}</span>
              <small>{payload.chart_type || 'Chart'}</small>
              <p>{payload.data_source || 'USER_NEEDED'}</p>
            </div>
            <div className="insight-list">
              <h3>Key Insights</h3>
              <ul>
                {(payload.key_insights || []).map((insight: string, index: number) => (
                  <li key={index}>{insight}</li>
                ))}
              </ul>
              {payload.insight_box && <p className="insight-summary">{payload.insight_box}</p>}
            </div>
          </div>
        );
      }
      case 'node_map': {
        return (
          <div className="ppt-content node-map">
            <div className="central-node">{payload.central_concept || 'Central Concept'}</div>
            <div className="node-grid">
              {(payload.primary_nodes || []).map((node: string, index: number) => (
                <div key={index} className="node-item">{node}</div>
              ))}
            </div>
            {payload.insight_box && (
              <div className="insight-box">
                <div className="insight-icon">💡</div>
                <div className="insight-text">{payload.insight_box}</div>
              </div>
            )}
          </div>
        );
      }
      default: {
        return (
          <div className="ppt-content">
            {currentSlide.content.title && (
              <div className="content-section">
                <h2 className="content-title">{currentSlide.content.title}</h2>
              </div>
            )}
            {currentSlide.content.sub_message && (
              <div className="content-section">
                <p className="sub-message">{currentSlide.content.sub_message}</p>
              </div>
            )}
            {currentSlide.content.bullet_points && (
              <div className="content-section bullets">
                <ul className="ppt-bullets">
                  {currentSlide.content.bullet_points.map((point: string, index: number) => (
                    <li key={index}>{point}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        );
      }
    }
  };

  if (slides.length === 0) {
    return (
      <div className="slide-edit-page">
        <div className="error-message">
          <p>No slide data found. Please start from storyline generation.</p>
          <Button variant="primary" onClick={() => navigate('/storyline')}>
            Go to Storyline Generator
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="slide-edit-page">
      <div className="edit-header">
        <div className="header-content">
          <h1>Slide Content Editor</h1>
          <p>Classify content and generate with AI or input manually</p>
        </div>
        <ProgressSteps 
          steps={workflowSteps}
          currentStep={3}
          completedSteps={[1, 2]}
        />
        <div className="progress-indicator">
          Slide {currentSlideIndex + 1} of {slidesWithContent.length || slides.length}
          {currentSlide.content && <span className="status-badge completed">✓ Generated</span>}
        </div>
      </div>

      <div className="edit-content">
        {/* 좌측: 슬라이드 미리보기 - PPT처럼 보이도록 */}
        <div className="preview-panel">
          <div className="preview-container">
            <div className="ppt-slide">
              {/* 슬라이드 헤더 */}
              <div className="ppt-slide-header">
                <div className="slide-number-badge">Slide {currentSlide.order}</div>
                <div className="template-type-badge">{currentSlide.template_type.replace('_', ' ')}</div>
              </div>

              {/* 슬라이드 메인 콘텐츠 */}
              <div className="ppt-slide-body">
                <h1 className="ppt-title">{currentSlide.head_message}</h1>
                
                {currentSlide.slide_purpose && (
                  <p className="ppt-subtitle">{currentSlide.slide_purpose}</p>
                )}

                {/* AI 생성 콘텐츠 표시 */}
                {renderTemplatePreview()}
              </div>

              {/* 슬라이드 푸터 */}
              <div className="ppt-slide-footer">
                <div className="footer-left">PPT Pro</div>
                <div className="footer-right">{currentSlideIndex + 1}</div>
              </div>
            </div>
          </div>
        </div>

        {/* 우측: 콘텐츠 패널 */}
        <div className="content-panel">
          <div className="panel-section">
            <h3>Content Management</h3>
            
            {/* 분류 버튼 */}
            <Button
              onClick={handleClassify}
              disabled={isClassifying || !!currentSlide.classification}
              loading={isClassifying}
              variant={currentSlide.classification ? 'success' : 'primary'}
              size="large"
              className="action-button"
            >
              {currentSlide.classification ? '✓ Classification Complete' : 'Classify Content'}
            </Button>

            {/* 분류 결과 표시 */}
            {currentSlide.classification && (
              <div className="classification-results">
                <div className="user-needed-section">
                  <h4 className="section-title user-needed">USER_NEEDED</h4>
                  <p className="section-description">Elements that require manual user input</p>
                  {currentSlide.classification.user_needed.map((elem, i) => (
                    <div key={i} className="element-card user-needed-card">
                      <div className="element-header">
                        <strong>{elem.element_type}</strong>
                        <span className="badge user-needed-badge">USER</span>
                      </div>
                      <p>{elem.description}</p>
                      <small>{elem.reason}</small>
                      <textarea
                        placeholder="Enter content here..."
                        className="user-input"
                        rows={3}
                        onChange={(e) => handleUserInput(elem.element_type, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="ai-generated-section">
                  <h4 className="section-title ai-generated">AI_GENERATED</h4>
                  <p className="section-description">Elements that AI can generate automatically</p>
                  {currentSlide.classification.ai_generated.map((elem, i) => (
                    <div key={i} className="element-card ai-generated-card">
                      <div className="element-header">
                        <strong>{elem.element_type}</strong>
                        <span className="badge ai-generated-badge">AI</span>
                      </div>
                      <p>{elem.description}</p>
                      <small>{elem.reason}</small>
                    </div>
                  ))}
                </div>

                {/* AI 생성 버튼 */}
                <Button
                  onClick={handleGenerateContent}
                  disabled={isGenerating || !!currentSlide.content}
                  loading={isGenerating}
                  variant={currentSlide.content ? 'success' : 'primary'}
                  size="large"
                  className="action-button generate-button"
                >
                  {currentSlide.content ? '✓ Content Generated' : 'Generate AI Content'}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 네비게이션 */}
      <div className="edit-navigation">
        <Button
          onClick={handlePrevious}
          disabled={currentSlideIndex === 0}
          variant="secondary"
          size="large"
        >
          ← Previous Slide
        </Button>
        <Button
          onClick={handleNext}
          variant="primary"
          size="large"
        >
          {currentSlideIndex === (slidesWithContent.length || slides.length) - 1
            ? 'Generate PPT →'
            : 'Next Slide →'}
        </Button>
      </div>

      {(isLoading || isClassifying || isGenerating) && <LoadingSpinner />}
    </div>
  );
};

export default SlideEditPage;

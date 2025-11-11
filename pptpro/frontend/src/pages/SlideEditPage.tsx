/**
 * Slide Edit Page - Page 4
 * 슬라이드 미리보기(좌측) + 콘텐츠 패널(우측)
 * USER_NEEDED / AI_GENERATED 구분 표시
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { slidesApi } from '../api/slides';
import { slideContentApi } from '../api/slideContent';
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
  classification?: any;
  content?: any;
}

const SlideEditPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const toast = useToast();
  const slides: SlideData[] = location.state?.slides || [];
  const projectId: string = location.state?.projectId || '';

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slidesWithContent, setSlidesWithContent] = useState<SlideWithContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentSlide = slidesWithContent[currentSlideIndex] || slides[currentSlideIndex];

  const workflowSteps = [
    { label: 'Storyline', description: 'Create structure' },
    { label: 'Templates', description: 'Select design' },
    { label: 'Content', description: 'Edit slides' },
    { label: 'Export', description: 'Download PPT' },
  ];

  useEffect(() => {
    // 초기화: slides를 slidesWithContent로 변환
    if (slides.length > 0 && slidesWithContent.length === 0) {
      createSlidesInBackend();
    }
  }, [slides]);

  // 백엔드에 슬라이드 생성
  const createSlidesInBackend = async () => {
    setIsLoading(true);
    try {
      const createdSlides: SlideWithContent[] = [];
      
      for (const slide of slides) {
        const created = await slidesApi.createSlide({
          project_id: projectId,
          order: slide.order,
          head_message: slide.head_message,
          template_type: slide.template_type,
          purpose: slide.slide_purpose || 'general',
        });
        createdSlides.push({ ...slide, id: created.id, template_type: slide.template_type });
      }
      
      setSlidesWithContent(createdSlides);
      toast.success(`${createdSlides.length} slides created successfully!`);
    } catch (error) {
      console.error('슬라이드 생성 실패:', error);
      toast.error('Failed to create slides. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

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
    } catch (error) {
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
        (elem: any) => elem.element_type
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
      const updated = [...slidesWithContent];
      updated[currentSlideIndex] = {
        ...currentSlide,
        content: generatedContent.components,
      };
      setSlidesWithContent(updated);

      // 백엔드 슬라이드 업데이트
      if (currentSlide.id) {
        await slidesApi.updateSlide(currentSlide.id, {
          content: generatedContent.components,
          status: 'ai_generated',
        });
      }
      
      toast.success('AI content generated successfully!');
    } catch (error) {
      console.error('콘텐츠 생성 실패:', error);
      toast.error('Failed to generate content. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  // 사용자 입력 저장
  const handleUserInput = async (field: string, value: any) => {
    const updated = [...slidesWithContent];
    updated[currentSlideIndex] = {
      ...currentSlide,
      content: {
        ...currentSlide.content,
        [field]: value,
      },
    };
    setSlidesWithContent(updated);

    // 백엔드 업데이트
    if (currentSlide.id) {
      await slidesApi.updateSlide(currentSlide.id, {
        content: updated[currentSlideIndex].content,
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
                {currentSlide.content ? (
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
                    
                    {currentSlide.content.bullet_points && currentSlide.content.bullet_points.length > 0 && (
                      <div className="content-section bullets">
                        <ul className="ppt-bullets">
                          {currentSlide.content.bullet_points.map((point: string, i: number) => (
                            <li key={i}>{point}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {currentSlide.content.insight_box && (
                      <div className="content-section insight">
                        <div className="insight-box">
                          <div className="insight-icon">💡</div>
                          <div className="insight-text">{currentSlide.content.insight_box}</div>
                        </div>
                      </div>
                    )}

                    {currentSlide.content.evidence_block && (
                      <div className="content-section evidence">
                        <div className="evidence-box">
                          <div className="evidence-label">Evidence</div>
                          <div className="evidence-text">{currentSlide.content.evidence_block}</div>
                        </div>
                      </div>
                    )}

                    {currentSlide.content.action_guide && (
                      <div className="content-section action">
                        <div className="action-box">
                          <div className="action-icon">→</div>
                          <div className="action-text">{currentSlide.content.action_guide}</div>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="ppt-empty-state">
                    <div className="empty-icon">📄</div>
                    <p>No content generated yet</p>
                    <p className="empty-hint">Classify and generate content on the right panel</p>
                  </div>
                )}
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
                  {currentSlide.classification.user_needed.map((elem: any, i: number) => (
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
                  {currentSlide.classification.ai_generated.map((elem: any, i: number) => (
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

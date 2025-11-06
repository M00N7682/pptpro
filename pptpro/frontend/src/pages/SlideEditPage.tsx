/**
 * Slide Edit Page - Page 4
 * 슬라이드 미리보기(좌측) + 콘텐츠 패널(우측)
 * USER_NEEDED / AI_GENERATED 구분 표시
 */
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { slidesApi } from '../api/slides';
import { slideContentApi } from '../api/slideContent';
import LoadingSpinner from '../components/ui/LoadingSpinner';
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
  const slides: SlideData[] = location.state?.slides || [];
  const projectId: string = location.state?.projectId || '';

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [slidesWithContent, setSlidesWithContent] = useState<SlideWithContent[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isClassifying, setIsClassifying] = useState(false);
  const [isGenerating, setIsGenerating] = useState(false);

  const currentSlide = slidesWithContent[currentSlideIndex] || slides[currentSlideIndex];

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
    } catch (error) {
      console.error('슬라이드 생성 실패:', error);
      alert('슬라이드를 생성하는데 실패했습니다.');
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
    } catch (error) {
      console.error('분류 실패:', error);
      alert('콘텐츠 분류에 실패했습니다.');
    } finally {
      setIsClassifying(false);
    }
  };

  // AI 콘텐츠 생성
  const handleGenerateContent = async () => {
    if (!currentSlide || !currentSlide.classification) {
      alert('먼저 콘텐츠 분류를 실행해주세요.');
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
    } catch (error) {
      console.error('콘텐츠 생성 실패:', error);
      alert('콘텐츠 생성에 실패했습니다.');
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
          <p>슬라이드 정보가 없습니다.</p>
          <button onClick={() => navigate('/storyline')}>스토리라인 생성하기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="slide-edit-page">
      <div className="edit-header">
        <h1>슬라이드 편집</h1>
        <p>콘텐츠를 분류하고 AI로 자동 생성하거나 직접 입력하세요</p>
        <div className="progress-indicator">
          슬라이드 {currentSlideIndex + 1} / {slidesWithContent.length || slides.length}
        </div>
      </div>

      <div className="edit-content">
        {/* 좌측: 슬라이드 미리보기 */}
        <div className="preview-panel">
          <div className="preview-card">
            <div className="slide-header-info">
              <div className="slide-number">슬라이드 {currentSlide.order}</div>
              <div className="template-badge">{currentSlide.template_type}</div>
            </div>
            <h2>{currentSlide.head_message}</h2>
            {currentSlide.slide_purpose && (
              <p className="purpose">{currentSlide.slide_purpose}</p>
            )}

            {/* 생성된 콘텐츠 미리보기 */}
            {currentSlide.content && (
              <div className="content-preview">
                {currentSlide.content.title && (
                  <div className="preview-item">
                    <strong>제목:</strong> {currentSlide.content.title}
                  </div>
                )}
                {currentSlide.content.sub_message && (
                  <div className="preview-item">
                    <strong>서브메시지:</strong> {currentSlide.content.sub_message}
                  </div>
                )}
                {currentSlide.content.bullet_points && (
                  <div className="preview-item">
                    <strong>불릿 포인트:</strong>
                    <ul>
                      {currentSlide.content.bullet_points.map((point: string, i: number) => (
                        <li key={i}>{point}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {currentSlide.content.insight_box && (
                  <div className="preview-item highlight">
                    <strong>인사이트:</strong> {currentSlide.content.insight_box}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* 우측: 콘텐츠 패널 */}
        <div className="content-panel">
          <div className="panel-section">
            <h3>콘텐츠 관리</h3>
            
            {/* 분류 버튼 */}
            <button
              className="action-button classify-button"
              onClick={handleClassify}
              disabled={isClassifying || !!currentSlide.classification}
            >
              {isClassifying ? '분류 중...' : currentSlide.classification ? '✓ 분류 완료' : '콘텐츠 분류하기'}
            </button>

            {/* 분류 결과 표시 */}
            {currentSlide.classification && (
              <div className="classification-results">
                <div className="user-needed-section">
                  <h4 className="section-title user-needed">USER_NEEDED</h4>
                  <p className="section-description">사용자가 직접 입력해야 하는 요소들</p>
                  {currentSlide.classification.user_needed.map((elem: any, i: number) => (
                    <div key={i} className="element-card user-needed-card">
                      <div className="element-header">
                        <strong>{elem.element_type}</strong>
                        <span className="badge user-needed-badge">USER</span>
                      </div>
                      <p>{elem.description}</p>
                      <small>{elem.reason}</small>
                      <textarea
                        placeholder="여기에 내용을 입력하세요..."
                        className="user-input"
                        rows={3}
                        onChange={(e) => handleUserInput(elem.element_type, e.target.value)}
                      />
                    </div>
                  ))}
                </div>

                <div className="ai-generated-section">
                  <h4 className="section-title ai-generated">AI_GENERATED</h4>
                  <p className="section-description">AI가 자동으로 생성 가능한 요소들</p>
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
                <button
                  className="action-button generate-button"
                  onClick={handleGenerateContent}
                  disabled={isGenerating || !!currentSlide.content}
                >
                  {isGenerating ? 'AI 생성 중...' : currentSlide.content ? '✓ 생성 완료' : 'AI 자동 채움'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 네비게이션 */}
      <div className="edit-navigation">
        <button
          className="nav-button previous"
          onClick={handlePrevious}
          disabled={currentSlideIndex === 0}
        >
          이전 슬라이드
        </button>
        <button
          className="nav-button next"
          onClick={handleNext}
        >
          {currentSlideIndex === (slidesWithContent.length || slides.length) - 1
            ? 'PPT 생성하기'
            : '다음 슬라이드'}
        </button>
      </div>

      {(isLoading || isClassifying || isGenerating) && <LoadingSpinner />}
    </div>
  );
};

export default SlideEditPage;

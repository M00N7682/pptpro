/**
 * Template Selection Page - Page 3
 * 스토리라인 승인 후 각 슬라이드에 템플릿을 매핑하는 페이지
 */
import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { templateApi } from '../api/template';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import './TemplateSelectionPage.css';

interface SlideData {
  order: number;
  head_message: string;
  slide_purpose?: string;
}

interface TemplateInfo {
  name: string;
  type: string;
  description: string;
  bestFor: string[];
  icon: string;
}

const AVAILABLE_TEMPLATES: TemplateInfo[] = [
  {
    name: '메시지 중심',
    type: 'message_only',
    description: '핵심 메시지만 강조하고 시각적 요소는 최소화. 임팩트 있는 문구 전달에 적합.',
    bestFor: ['결론 슬라이드', '핵심 메시지 전달', '요약'],
    icon: '💬',
  },
  {
    name: 'As-Is / To-Be',
    type: 'asis_tobe',
    description: '현재 상태와 목표 상태를 비교하는 장표. 변화나 개선점을 시각적으로 대비.',
    bestFor: ['문제 정의', '개선 방안', '변화 관리'],
    icon: '⇄',
  },
  {
    name: '케이스 박스',
    type: 'case_box',
    description: '여러 사례나 예시를 박스 형태로 나열. 비교 분석이나 다양한 케이스 제시에 적합.',
    bestFor: ['옵션 비교', '사례 연구', '선택지 제시'],
    icon: '▢',
  },
  {
    name: '노드 맵',
    type: 'node_map',
    description: '노드 간 관계를 시각화. 이해관계자, 프로세스, 개념 간 연결 표현.',
    bestFor: ['관계도', '조직 구조', '개념 연결'],
    icon: '◈',
  },
  {
    name: '단계별 플로우',
    type: 'step_flow',
    description: '단계별 프로세스나 절차를 순서대로 표현. 실행 계획, 로드맵에 적합.',
    bestFor: ['프로세스 설명', '실행 계획', '워크플로우'],
    icon: '→',
  },
  {
    name: '차트 & 인사이트',
    type: 'chart_insight',
    description: '차트/그래프와 함께 인사이트를 제공. 데이터 기반 분석 결과 전달.',
    bestFor: ['데이터 분석', '성과 보고', '트렌드 분석'],
    icon: '📊',
  },
];

const TemplateSelectionPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const slides: SlideData[] = location.state?.slides || [];
  const projectId: string = location.state?.projectId || '';

  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [selectedTemplates, setSelectedTemplates] = useState<Record<number, string>>({});
  const [aiSuggestion, setAiSuggestion] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showAiSuggestion, setShowAiSuggestion] = useState(false);

  const currentSlide = slides[currentSlideIndex];

  // AI 추천 받기
  const getAiSuggestion = async () => {
    if (!currentSlide) return;

    setIsLoading(true);
    setShowAiSuggestion(true);

    try {
      const result = await templateApi.suggestTemplate({
        slide_purpose: currentSlide.slide_purpose || '일반 슬라이드',
        head_message: currentSlide.head_message,
      });
      setAiSuggestion(result);
    } catch (error) {
      console.error('AI 템플릿 추천 실패:', error);
      alert('AI 추천을 가져오는데 실패했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  // 템플릿 선택
  const handleTemplateSelect = (templateType: string) => {
    setSelectedTemplates({
      ...selectedTemplates,
      [currentSlideIndex]: templateType,
    });
  };

  // 다음 슬라이드로
  const handleNext = () => {
    if (!selectedTemplates[currentSlideIndex]) {
      alert('템플릿을 선택해주세요.');
      return;
    }

    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
      setAiSuggestion(null);
      setShowAiSuggestion(false);
    } else {
      // 모든 슬라이드 템플릿 선택 완료
      handleComplete();
    }
  };

  // 이전 슬라이드로
  const handlePrevious = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
      setAiSuggestion(null);
      setShowAiSuggestion(false);
    }
  };

  // 완료 - 슬라이드 편집 페이지로 이동
  const handleComplete = () => {
    const slidesWithTemplates = slides.map((slide, index) => ({
      ...slide,
      template_type: selectedTemplates[index],
    }));

    navigate('/slide-edit', {
      state: {
        slides: slidesWithTemplates,
        projectId,
      },
    });
  };

  if (slides.length === 0) {
    return (
      <div className="template-selection-page">
        <div className="error-message">
          <p>슬라이드 정보가 없습니다. 스토리라인 생성부터 시작해주세요.</p>
          <button onClick={() => navigate('/storyline')}>스토리라인 생성하기</button>
        </div>
      </div>
    );
  }

  return (
    <div className="template-selection-page">
      <div className="template-header">
        <h1>템플릿 선택</h1>
        <p>각 슬라이드에 가장 적합한 템플릿을 선택하세요</p>
        <div className="progress-indicator">
          슬라이드 {currentSlideIndex + 1} / {slides.length}
        </div>
      </div>

      <div className="template-content">
        {/* 현재 슬라이드 정보 */}
        <div className="current-slide-info">
          <div className="slide-card">
            <div className="slide-number">슬라이드 {currentSlide.order}</div>
            <h2>{currentSlide.head_message}</h2>
            {currentSlide.slide_purpose && (
              <p className="slide-purpose">{currentSlide.slide_purpose}</p>
            )}
          </div>

          <button 
            className="ai-suggest-button" 
            onClick={getAiSuggestion}
            disabled={isLoading}
          >
            {isLoading ? 'AI 분석 중...' : 'AI 추천 받기'}
          </button>

          {showAiSuggestion && aiSuggestion && (
            <div className="ai-suggestion-box">
              <h3>AI 추천</h3>
              <div className="suggested-template">
                <strong>{AVAILABLE_TEMPLATES.find(t => t.type === aiSuggestion.template_type)?.name}</strong>
              </div>
              <p className="suggestion-reason">{aiSuggestion.reason}</p>
              {aiSuggestion.alternative_templates && aiSuggestion.alternative_templates.length > 0 && (
                <div className="alternatives">
                  <small>대안: {aiSuggestion.alternative_templates.map((t: string) => 
                    AVAILABLE_TEMPLATES.find(temp => temp.type === t)?.name
                  ).join(', ')}</small>
                </div>
              )}
            </div>
          )}
        </div>

        {/* 템플릿 갤러리 */}
        <div className="template-gallery">
          <h3>템플릿 선택</h3>
          <div className="template-grid">
            {AVAILABLE_TEMPLATES.map((template) => (
              <div
                key={template.type}
                className={`template-card ${
                  selectedTemplates[currentSlideIndex] === template.type ? 'selected' : ''
                } ${
                  aiSuggestion?.template_type === template.type ? 'ai-recommended' : ''
                }`}
                onClick={() => handleTemplateSelect(template.type)}
              >
                <div className="template-icon">{template.icon}</div>
                <h4>{template.name}</h4>
                <p className="template-description">{template.description}</p>
                <div className="template-best-for">
                  <strong>적합한 경우:</strong>
                  <ul>
                    {template.bestFor.map((use, index) => (
                      <li key={index}>{use}</li>
                    ))}
                  </ul>
                </div>
                {aiSuggestion?.template_type === template.type && (
                  <div className="ai-badge">AI 추천</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 네비게이션 버튼 */}
      <div className="template-navigation">
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
          disabled={!selectedTemplates[currentSlideIndex]}
        >
          {currentSlideIndex === slides.length - 1 ? '완료 및 편집하기' : '다음 슬라이드'}
        </button>
      </div>

      {isLoading && <LoadingSpinner />}
    </div>
  );
};

export default TemplateSelectionPage;

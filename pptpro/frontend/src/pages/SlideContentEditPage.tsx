import React, { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { contentApi } from '../api/content';
import { slidesApi } from '../api/slides';
import type { ContentResponse, TemplateFieldsResponse, TemplateField } from '../api/content';
import type { Slide } from '../api/slides';

const SlideContentEditPage: React.FC = () => {
  const { projectId, slideId } = useParams<{ projectId: string; slideId: string }>();
  const navigate = useNavigate();
  const [slide, setSlide] = useState<Slide | null>(null);
  const [content, setContent] = useState<ContentResponse | null>(null);
  const [templateFields, setTemplateFields] = useState<TemplateFieldsResponse | null>(null);
  const [editedContent, setEditedContent] = useState<Record<string, unknown>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const loadData = useCallback(async () => {
    if (!slideId) return;

    setLoading(true);
    try {
      const [slideData, contentData] = await Promise.all([
        slidesApi.getSlide(slideId),
        contentApi.getSlideContent(slideId).catch(() => null), // 콘텐츠가 없을 수도 있음
      ]);

      setSlide(slideData);
      setContent(contentData);
      setEditedContent((contentData?.content as Record<string, unknown>) || {});

      if (slideData.template_type) {
        const fields = await contentApi.getTemplateFields(slideData.template_type);
        setTemplateFields(fields);
      }
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      setError(message || 'Failed to load slide data');
    } finally {
      setLoading(false);
    }
  }, [slideId]);

  useEffect(() => {
    if (!slideId || !projectId) {
      navigate(`/projects/${projectId}/slides`);
      return;
    }
    void loadData();
  }, [slideId, projectId, navigate, loadData]);

  const handleGenerateContent = async () => {
    if (!slideId) return;
    
    setSaving(true);
    try {
      const result = await contentApi.generateSlideContent({ 
        slide_id: slideId, 
        regenerate: true 
      });
      setContent(result);
      setEditedContent(result.content);
    } catch (err: any) {
      const message = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      alert(message || '콘텐츠 생성에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveContent = async () => {
    if (!slideId) return;
    
    setSaving(true);
    try {
      const result = await contentApi.updateSlideContent(slideId, {
        content: editedContent,
        user_completed_fields: Object.keys(editedContent)
      });
      setContent(result);
      alert('저장되었습니다');
    } catch (err: any) {
      const message = (err as { response?: { data?: { detail?: string } } }).response?.data?.detail;
      alert(message || '저장에 실패했습니다');
    } finally {
      setSaving(false);
    }
  };

  const handleFieldChange = (fieldName: string, value: unknown) => {
    setEditedContent(prev => ({
      ...prev,
      [fieldName]: value
    }));
  };

  const renderField = (field: TemplateField, fieldName: string, value: unknown) => {
    const isUserNeeded = typeof value === 'string' && value.includes('USER_NEEDED');
    
    switch (field.type) {
      case 'text':
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.description}
              {field.required && <span className="text-red-500 ml-1">*</span>}
              {isUserNeeded && (
                <span className="ml-2 px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded">
                  사용자 입력 필요
                </span>
              )}
            </label>
            <textarea
              value={typeof value === 'string' ? value : ''}
              onChange={(e) => handleFieldChange(fieldName, e.target.value)}
              placeholder={isUserNeeded ? value : `${field.description}을 입력하세요`}
              className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                isUserNeeded ? 'border-yellow-300 bg-yellow-50' : 'border-gray-300'
              }`}
              rows={3}
            />
          </div>
        );

      case 'array': {
        const arrayValue = Array.isArray(value) ? (value as string[]) : [];
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.description}
              {field.required && <span className="text-red-500 ml-1">*</span>}
            </label>
            <div className="space-y-2">
              {arrayValue.map((item: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <input
                    type="text"
                    value={item}
                    onChange={(e) => {
                      const newArray = [...arrayValue];
                      newArray[index] = e.target.value;
                      handleFieldChange(fieldName, newArray);
                    }}
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`${field.description} ${index + 1}`}
                  />
                  <button
                    onClick={() => {
                      const newArray = arrayValue.filter((_, i) => i !== index);
                      handleFieldChange(fieldName, newArray);
                    }}
                    className="px-3 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                  >
                    삭제
                  </button>
                </div>
              ))}
              <button
                onClick={() => {
                  const newArray = [...arrayValue, ''];
                  handleFieldChange(fieldName, newArray);
                }}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
              >
                + 항목 추가
              </button>
            </div>
          </div>
        );
      }

      default:
        return (
          <div key={fieldName} className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              {field.description}
            </label>
            <textarea
              value={JSON.stringify(value, null, 2)}
              onChange={(e) => {
                try {
                  const parsed = JSON.parse(e.target.value);
                  handleFieldChange(fieldName, parsed);
                } catch {
                  // JSON 파싱 실패시 문자열로 저장
                  handleFieldChange(fieldName, e.target.value);
                }
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
              rows={5}
            />
          </div>
        );
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">로딩 중...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-red-600">{error}</div>
      </div>
    );
  }

  if (!slide) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">슬라이드를 찾을 수 없습니다.</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-4xl mx-auto">
        {/* 헤더 */}
        <div className="mb-6">
          <button
            onClick={() => navigate(`/projects/${projectId}/slides`)}
            className="text-blue-500 hover:text-blue-700 mb-4"
          >
            ← 슬라이드 목록으로
          </button>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            슬라이드 {slide.order}: 콘텐츠 편집
          </h1>
          <p className="text-gray-600">{slide.head_message}</p>
          <div className="flex gap-2 mt-2">
            <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-sm">
              {slide.template_type}
            </span>
            <span className={`px-2 py-1 rounded-full text-sm ${
              slide.status === 'user_completed' ? 'bg-green-100 text-green-800' :
              slide.status === 'ai_generated' ? 'bg-blue-100 text-blue-800' :
              'bg-gray-100 text-gray-800'
            }`}>
              {slide.status === 'user_completed' ? '완료' :
               slide.status === 'ai_generated' ? 'AI 생성' : '초안'}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* 콘텐츠 편집 폼 */}
          <div className="lg:col-span-2">
            <div className="bg-white p-6 rounded-lg shadow-md">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-semibold">슬라이드 내용</h2>
                <div className="flex gap-2">
                  {!content && (
                    <button
                      onClick={handleGenerateContent}
                      disabled={saving}
                      className="bg-purple-500 text-white px-4 py-2 rounded-md hover:bg-purple-600 disabled:opacity-50"
                    >
                      {saving ? '생성 중...' : '✨ AI 생성'}
                    </button>
                  )}
                  <button
                    onClick={handleSaveContent}
                    disabled={saving}
                    className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600 disabled:opacity-50"
                  >
                    {saving ? '저장 중...' : '💾 저장'}
                  </button>
                </div>
              </div>

              {content && content.user_needed_items.length > 0 && (
                <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-md">
                  <h3 className="font-medium text-yellow-800 mb-2">📝 사용자 입력이 필요한 항목들</h3>
                  <ul className="text-sm text-yellow-700 list-disc list-inside">
                    {content.user_needed_items.map((item, index) => (
                      <li key={index}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}

              {templateFields ? (
                <div className="space-y-4">
                  {templateFields.fields.map((field) => {
                    const fieldValue = editedContent[field.name] || '';
                    return renderField(field, field.name, fieldValue);
                  })}
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  템플릿 정보를 불러오는 중...
                </div>
              )}
            </div>
          </div>

          {/* 사이드바 - 가이드 및 정보 */}
          <div className="space-y-4">
            <div className="bg-white p-4 rounded-lg shadow-md">
              <h3 className="font-semibold mb-3">💡 작성 가이드</h3>
              <div className="text-sm text-gray-600 space-y-2">
                <p><strong>헤드메시지:</strong> {slide.head_message}</p>
                <p><strong>목적:</strong> {slide.purpose}</p>
                <p><strong>템플릿:</strong> {slide.template_type}</p>
              </div>
            </div>

            {content && content.generation_notes && (
              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-800 mb-2">🤖 AI 생성 노트</h3>
                <p className="text-sm text-blue-700">{content.generation_notes}</p>
              </div>
            )}

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-semibold mb-2">📋 체크리스트</h3>
              <div className="text-sm space-y-1">
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span>핵심 메시지가 명확한가?</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span>근거가 충분한가?</span>
                </label>
                <label className="flex items-center">
                  <input type="checkbox" className="mr-2" />
                  <span>타겟에게 적합한가?</span>
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SlideContentEditPage;
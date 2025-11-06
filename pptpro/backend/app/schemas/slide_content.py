"""
Slide content generation schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class SlideClassificationRequest(BaseModel):
    """슬라이드 분류 요청 - USER_NEEDED / AI_GENERATED 구분"""
    slide_text: str = Field(..., description="분류할 슬라이드 텍스트 또는 개요")
    slide_type: str = Field(..., description="슬라이드 타입 (template_type)")
    head_message: Optional[str] = Field(None, description="헤드 메시지")


class ContentElement(BaseModel):
    """콘텐츠 요소"""
    element_type: str = Field(..., description="요소 타입 (title, bullet_point, data, insight 등)")
    description: str = Field(..., description="요소 설명")
    classification: str = Field(..., description="USER_NEEDED 또는 AI_GENERATED")
    reason: str = Field(..., description="분류 이유")


class SlideClassificationResponse(BaseModel):
    """슬라이드 분류 응답"""
    user_needed: List[ContentElement] = Field(..., description="사용자 입력이 필요한 요소들")
    ai_generated: List[ContentElement] = Field(..., description="AI가 생성 가능한 요소들")


class SlideContentGenerationRequest(BaseModel):
    """슬라이드 콘텐츠 생성 요청"""
    slide_type: str = Field(..., description="슬라이드 템플릿 타입")
    ai_generated_elements: List[str] = Field(..., description="AI가 생성할 요소 타입 리스트")
    context: Dict[str, Any] = Field(..., description="생성에 필요한 컨텍스트 (주제, 목표, 헤드메시지 등)")


class SlideComponents(BaseModel):
    """생성된 슬라이드 컴포넌트"""
    title: Optional[str] = Field(None, description="슬라이드 제목")
    sub_message: Optional[str] = Field(None, description="서브 메시지")
    bullet_points: Optional[List[str]] = Field(None, description="불릿 포인트 리스트")
    evidence_block: Optional[str] = Field(None, description="근거/증거 블록")
    diagram_components: Optional[Dict[str, Any]] = Field(None, description="다이어그램 구성 요소")
    insight_box: Optional[str] = Field(None, description="인사이트 박스")
    action_guide: Optional[str] = Field(None, description="액션 가이드")
    caption: Optional[str] = Field(None, description="캡션")


class SlideContentGenerationResponse(BaseModel):
    """슬라이드 콘텐츠 생성 응답"""
    components: SlideComponents = Field(..., description="생성된 컴포넌트들")
    metadata: Optional[Dict[str, Any]] = Field(None, description="추가 메타데이터")

"""
Template related schemas
"""
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any


class TemplateSuggestionRequest(BaseModel):
    """템플릿 추천 요청"""
    slide_purpose: str = Field(..., description="슬라이드의 목적 (예: 문제정의, 해결방안, 비교분석 등)")
    head_message: str = Field(..., description="해당 슬라이드의 헤드 메시지")
    context: Optional[str] = Field(None, description="추가 컨텍스트 정보")


class TemplateComponent(BaseModel):
    """템플릿 구성 요소"""
    type: str = Field(..., description="컴포넌트 타입 (title, subtitle, bullet_points, diagram 등)")
    description: str = Field(..., description="컴포넌트 설명")
    required: bool = Field(True, description="필수 여부")


class TemplateSuggestionResponse(BaseModel):
    """템플릿 추천 응답"""
    template_type: str = Field(..., description="추천된 템플릿 타입 (message_only, asis_tobe, case_box, node_map, step_flow, chart_insight)")
    reason: str = Field(..., description="해당 템플릿을 추천한 이유")
    components: List[TemplateComponent] = Field(..., description="템플릿 구성 요소 목록")
    alternative_templates: Optional[List[str]] = Field(None, description="대안 템플릿들")

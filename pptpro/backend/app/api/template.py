"""
Template API endpoints
"""
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.template import (
    TemplateSuggestionRequest,
    TemplateSuggestionResponse,
)
from app.services.template_service import TemplateService
from app.core.auth import get_current_user
from app.db.memory_store import User

router = APIRouter(prefix="/template", tags=["template"])


@router.post("/suggest", response_model=TemplateSuggestionResponse)
async def suggest_template(
    request: TemplateSuggestionRequest,
    current_user: User = Depends(get_current_user),
):
    """
    슬라이드 목적과 헤드메시지를 기반으로 최적의 템플릿 추천
    
    - **slide_purpose**: 슬라이드의 목적 (예: "문제 정의", "해결 방안 제시")
    - **head_message**: 해당 슬라이드의 헤드 메시지
    - **context**: 추가적인 컨텍스트 정보 (선택)
    
    Returns:
    - 추천 템플릿 타입
    - 추천 이유
    - 템플릿 구성 요소 목록
    - 대안 템플릿들
    """
    try:
        service = TemplateService()
        result = await service.suggest_template(request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"템플릿 추천 중 오류 발생: {str(e)}")

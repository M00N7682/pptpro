"""
Slide content API endpoints - classification and generation
"""
from fastapi import APIRouter, HTTPException, Depends
from app.schemas.slide_content import (
    SlideClassificationRequest,
    SlideClassificationResponse,
    SlideContentGenerationRequest,
    SlideContentGenerationResponse,
)
from app.services.slide_content_service import SlideContentService
from app.core.auth import get_current_user
from app.db.memory_store import User

router = APIRouter(prefix="/slide", tags=["slide_content"])


@router.post("/classify", response_model=SlideClassificationResponse)
async def classify_slide_content(
    request: SlideClassificationRequest,
    current_user: User = Depends(get_current_user),
):
    """
    슬라이드 콘텐츠를 USER_NEEDED / AI_GENERATED로 자동 분류
    
    - **slide_text**: 분류할 슬라이드 텍스트 또는 개요
    - **slide_type**: 슬라이드 템플릿 타입
    - **head_message**: 헤드 메시지 (선택)
    
    Returns:
    - user_needed: 사용자 입력이 필요한 요소들
    - ai_generated: AI가 생성 가능한 요소들
    """
    try:
        service = SlideContentService()
        result = await service.classify_slide_content(request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"슬라이드 콘텐츠 분류 중 오류 발생: {str(e)}"
        )


@router.post("/generate", response_model=SlideContentGenerationResponse)
async def generate_slide_content(
    request: SlideContentGenerationRequest,
    current_user: User = Depends(get_current_user),
):
    """
    AI_GENERATED 요소들에 대해 실제 콘텐츠 생성
    
    - **slide_type**: 슬라이드 템플릿 타입
    - **ai_generated_elements**: AI가 생성할 요소 타입 리스트
    - **context**: 생성에 필요한 컨텍스트 (주제, 목표, 헤드메시지 등)
    
    Returns:
    - components: 생성된 슬라이드 컴포넌트들 (title, sub_message, bullet_points 등)
    - metadata: 추가 메타데이터
    """
    try:
        service = SlideContentService()
        result = await service.generate_slide_content(request)
        return result
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"슬라이드 콘텐츠 생성 중 오류 발생: {str(e)}"
        )

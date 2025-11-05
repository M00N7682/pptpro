"""
콘텐츠 생성 API
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.services.content_generation import ContentGenerationService, SlideContent
from app.core.auth import get_current_user
from app.db.memory_store import User, project_store, slide_store


router = APIRouter(prefix="/content", tags=["content"])


class ContentGenerateRequest(BaseModel):
    slide_id: str
    regenerate: Optional[bool] = False  # 기존 내용을 다시 생성할지 여부


class ContentUpdateRequest(BaseModel):
    content: Dict[str, Any]
    user_completed_fields: Optional[List[str]] = []


class ContentResponse(BaseModel):
    slide_id: str
    template_type: str
    content: Dict[str, Any]
    user_needed_items: List[str]
    generation_notes: str
    status: str  # "ai_generated", "partial_user_input", "user_completed"


@router.post("/generate", response_model=ContentResponse)
async def generate_slide_content(
    request: ContentGenerateRequest,
    current_user: User = Depends(get_current_user)
):
    """슬라이드 콘텐츠 생성"""
    
    # 슬라이드 조회 및 권한 확인
    slide = slide_store.get_slide(request.slide_id)
    if not slide:
        raise HTTPException(status_code=404, detail="슬라이드를 찾을 수 없습니다")
    
    project = project_store.get_project(slide.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")
    
    # 이미 내용이 있고 재생성이 아닌 경우
    if slide.content and not request.regenerate:
        raise HTTPException(
            status_code=400, 
            detail="이미 생성된 콘텐츠가 있습니다. regenerate=true로 설정하여 재생성하세요"
        )
    
    try:
        # 프로젝트 컨텍스트 구성
        project_context = {
            "topic": project.topic,
            "target_audience": project.target_audience,
            "goal": project.goal,
            "title": project.title
        }
        
        # 콘텐츠 생성
        service = ContentGenerationService()
        slide_content = await service.generate_slide_content(slide, project_context)
        
        # 슬라이드에 생성된 콘텐츠 저장
        slide_store.update_slide(
            request.slide_id,
            content=slide_content.generated_content,
            status="ai_generated"
        )
        
        return ContentResponse(
            slide_id=slide_content.slide_id,
            template_type=slide_content.template_type,
            content=slide_content.generated_content,
            user_needed_items=slide_content.user_needed_items,
            generation_notes=slide_content.generation_notes,
            status="ai_generated"
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"콘텐츠 생성 중 오류가 발생했습니다: {str(e)}")


@router.patch("/{slide_id}", response_model=ContentResponse)
async def update_slide_content(
    slide_id: str,
    request: ContentUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """슬라이드 콘텐츠 수정"""
    
    # 슬라이드 조회 및 권한 확인
    slide = slide_store.get_slide(slide_id)
    if not slide:
        raise HTTPException(status_code=404, detail="슬라이드를 찾을 수 없습니다")
    
    project = project_store.get_project(slide.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")
    
    try:
        # 기존 콘텐츠와 병합
        updated_content = {**(slide.content or {}), **request.content}
        
        # 상태 결정
        user_completed_fields = set(request.user_completed_fields or [])
        
        # USER_NEEDED 항목 확인
        user_needed_items = []
        for key, value in updated_content.items():
            if isinstance(value, str) and "USER_NEEDED" in value:
                if key not in user_completed_fields:
                    user_needed_items.append(key)
        
        # 상태 업데이트
        if len(user_needed_items) == 0:
            new_status = "user_completed"
        elif len(user_completed_fields) > 0:
            new_status = "partial_user_input"
        else:
            new_status = slide.status
        
        # 슬라이드 업데이트
        slide_store.update_slide(
            slide_id,
            content=updated_content,
            status=new_status
        )
        
        return ContentResponse(
            slide_id=slide_id,
            template_type=slide.template_type,
            content=updated_content,
            user_needed_items=user_needed_items,
            generation_notes="사용자가 수정한 내용입니다",
            status=new_status
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"콘텐츠 수정 중 오류가 발생했습니다: {str(e)}")


@router.get("/{slide_id}", response_model=ContentResponse)
async def get_slide_content(
    slide_id: str,
    current_user: User = Depends(get_current_user)
):
    """슬라이드 콘텐츠 조회"""
    
    # 슬라이드 조회 및 권한 확인
    slide = slide_store.get_slide(slide_id)
    if not slide:
        raise HTTPException(status_code=404, detail="슬라이드를 찾을 수 없습니다")
    
    project = project_store.get_project(slide.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")
    
    # USER_NEEDED 항목 추출
    user_needed_items = []
    content = slide.content or {}
    
    for key, value in content.items():
        if isinstance(value, str) and "USER_NEEDED" in value:
            user_needed_items.append(key)
    
    return ContentResponse(
        slide_id=slide_id,
        template_type=slide.template_type,
        content=content,
        user_needed_items=user_needed_items,
        generation_notes="",
        status=slide.status
    )


@router.post("/batch-generate/{project_id}")
async def batch_generate_content(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """프로젝트의 모든 슬라이드 콘텐츠 일괄 생성"""
    
    # 프로젝트 권한 확인
    project = project_store.get_project(project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")
    
    # 프로젝트의 슬라이드들 조회
    slides = slide_store.get_slides_for_project(project_id)
    if not slides:
        raise HTTPException(status_code=404, detail="생성할 슬라이드가 없습니다")
    
    try:
        service = ContentGenerationService()
        project_context = {
            "topic": project.topic,
            "target_audience": project.target_audience,
            "goal": project.goal,
            "title": project.title
        }
        
        results = []
        
        for slide in slides:
            # 이미 콘텐츠가 있는 슬라이드는 스킵
            if slide.content:
                continue
                
            try:
                slide_content = await service.generate_slide_content(slide, project_context)
                
                # 슬라이드 업데이트
                slide_store.update_slide(
                    slide.id,
                    content=slide_content.generated_content,
                    status="ai_generated"
                )
                
                results.append({
                    "slide_id": slide.id,
                    "head_message": slide.head_message,
                    "status": "generated"
                })
                
            except Exception as e:
                results.append({
                    "slide_id": slide.id,
                    "head_message": slide.head_message, 
                    "status": "failed",
                    "error": str(e)
                })
        
        return {
            "message": f"{len(results)}개 슬라이드 콘텐츠 생성 완료",
            "results": results
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"일괄 생성 중 오류가 발생했습니다: {str(e)}")


@router.get("/templates/{template_type}/fields")
async def get_template_fields(template_type: str):
    """템플릿별 필드 구조 조회"""
    
    template_fields = {
        "message_only": {
            "fields": [
                {"name": "main_message", "type": "text", "required": True, "description": "핵심 메시지"},
                {"name": "supporting_points", "type": "array", "required": True, "description": "뒷받침 근거들"},
                {"name": "call_to_action", "type": "text", "required": False, "description": "다음 액션"}
            ]
        },
        "asis_tobe": {
            "fields": [
                {"name": "as_is_title", "type": "text", "required": True, "description": "현재 상황 제목"},
                {"name": "as_is_points", "type": "array", "required": True, "description": "현재 상황 포인트들"},
                {"name": "to_be_title", "type": "text", "required": True, "description": "목표 상황 제목"},
                {"name": "to_be_points", "type": "array", "required": True, "description": "목표 상황 포인트들"},
                {"name": "transition_method", "type": "text", "required": False, "description": "전환 방법"}
            ]
        },
        "case_box": {
            "fields": [
                {"name": "cases", "type": "array_object", "required": True, "description": "사례들", 
                 "sub_fields": [
                     {"name": "title", "type": "text"},
                     {"name": "description", "type": "text"}, 
                     {"name": "pros", "type": "array"},
                     {"name": "cons", "type": "array"},
                     {"name": "recommendation", "type": "text"}
                 ]}
            ]
        }
    }
    
    if template_type not in template_fields:
        raise HTTPException(status_code=404, detail="지원하지 않는 템플릿 타입입니다")
    
    return template_fields[template_type]
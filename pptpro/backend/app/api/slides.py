"""
슬라이드 관리 API
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from app.core.auth import get_current_user
from app.db.memory_store import User, project_store, slide_store


router = APIRouter(prefix="/slides", tags=["slides"])


class SlideCreateRequest(BaseModel):
    project_id: str
    order: int
    head_message: str
    template_type: Optional[str] = "message_only"
    purpose: Optional[str] = "general"


class SlideUpdateRequest(BaseModel):
    head_message: Optional[str] = None
    template_type: Optional[str] = None
    purpose: Optional[str] = None
    content: Optional[Dict[str, Any]] = None
    status: Optional[str] = None


class SlideResponse(BaseModel):
    id: str
    project_id: str
    order: int
    head_message: str
    template_type: str
    purpose: str
    content: Dict[str, Any]
    status: str
    created_at: str
    updated_at: str


@router.get("/project/{project_id}", response_model=List[SlideResponse])
async def get_slides_for_project(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """프로젝트의 슬라이드 목록 조회"""
    
    # 프로젝트 소유권 확인
    project = project_store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
    
    if project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")
    
    slides = slide_store.get_slides_for_project(project_id)
    
    return [
        SlideResponse(
            id=slide.id,
            project_id=slide.project_id,
            order=slide.order,
            head_message=slide.head_message,
            template_type=slide.template_type,
            purpose=slide.purpose,
            content=slide.content,
            status=slide.status,
            created_at=slide.created_at.isoformat(),
            updated_at=slide.updated_at.isoformat()
        )
        for slide in slides
    ]


@router.post("/", response_model=SlideResponse)
async def create_slide(
    request: SlideCreateRequest,
    current_user: User = Depends(get_current_user)
):
    """새 슬라이드 생성"""
    
    # 프로젝트 소유권 확인
    project = project_store.get_project(request.project_id)
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
    
    if project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")
    
    try:
        slide = slide_store.create_slide(
            project_id=request.project_id,
            order=request.order,
            head_message=request.head_message,
            template_type=request.template_type or "message_only",
            purpose=request.purpose or "general"
        )
        
        return SlideResponse(
            id=slide.id,
            project_id=slide.project_id,
            order=slide.order,
            head_message=slide.head_message,
            template_type=slide.template_type,
            purpose=slide.purpose,
            content=slide.content,
            status=slide.status,
            created_at=slide.created_at.isoformat(),
            updated_at=slide.updated_at.isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"슬라이드 생성 중 오류가 발생했습니다: {str(e)}")


@router.get("/{slide_id}", response_model=SlideResponse)
async def get_slide(
    slide_id: str,
    current_user: User = Depends(get_current_user)
):
    """슬라이드 상세 조회"""
    
    slide = slide_store.get_slide(slide_id)
    if not slide:
        raise HTTPException(status_code=404, detail="슬라이드를 찾을 수 없습니다")
    
    # 프로젝트 소유권 확인
    project = project_store.get_project(slide.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")
    
    return SlideResponse(
        id=slide.id,
        project_id=slide.project_id,
        order=slide.order,
        head_message=slide.head_message,
        template_type=slide.template_type,
        purpose=slide.purpose,
        content=slide.content,
        status=slide.status,
        created_at=slide.created_at.isoformat(),
        updated_at=slide.updated_at.isoformat()
    )


@router.patch("/{slide_id}", response_model=SlideResponse)
async def update_slide(
    slide_id: str,
    request: SlideUpdateRequest,
    current_user: User = Depends(get_current_user)
):
    """슬라이드 수정"""
    
    slide = slide_store.get_slide(slide_id)
    if not slide:
        raise HTTPException(status_code=404, detail="슬라이드를 찾을 수 없습니다")
    
    # 프로젝트 소유권 확인
    project = project_store.get_project(slide.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")
    
    try:
        # None이 아닌 값만 업데이트
        update_data = {k: v for k, v in request.dict().items() if v is not None}
        
        updated_slide = slide_store.update_slide(slide_id, **update_data)
        if not updated_slide:
            raise HTTPException(status_code=500, detail="슬라이드 수정에 실패했습니다")
        
        return SlideResponse(
            id=updated_slide.id,
            project_id=updated_slide.project_id,
            order=updated_slide.order,
            head_message=updated_slide.head_message,
            template_type=updated_slide.template_type,
            purpose=updated_slide.purpose,
            content=updated_slide.content,
            status=updated_slide.status,
            created_at=updated_slide.created_at.isoformat(),
            updated_at=updated_slide.updated_at.isoformat()
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"슬라이드 수정 중 오류가 발생했습니다: {str(e)}")


@router.delete("/{slide_id}")
async def delete_slide(
    slide_id: str,
    current_user: User = Depends(get_current_user)
):
    """슬라이드 삭제"""
    
    slide = slide_store.get_slide(slide_id)
    if not slide:
        raise HTTPException(status_code=404, detail="슬라이드를 찾을 수 없습니다")
    
    # 프로젝트 소유권 확인
    project = project_store.get_project(slide.project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")
    
    try:
        success = slide_store.delete_slide(slide_id)
        if not success:
            raise HTTPException(status_code=500, detail="슬라이드 삭제에 실패했습니다")
        
        return {"message": "슬라이드가 삭제되었습니다"}
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"슬라이드 삭제 중 오류가 발생했습니다: {str(e)}")


@router.get("/templates/available")
async def get_available_templates():
    """사용 가능한 템플릿 목록"""
    return {
        "templates": {
            "message_only": {
                "name": "메시지 중심",
                "description": "핵심 메시지를 강조하는 간단한 구조",
                "fields": ["main_message", "supporting_text"]
            },
            "asis_tobe": {
                "name": "As-Is / To-Be", 
                "description": "현재 상황과 목표 상황을 대비",
                "fields": ["as_is_title", "as_is_content", "to_be_title", "to_be_content", "transition_method"]
            },
            "case_box": {
                "name": "케이스 박스",
                "description": "여러 사례나 옵션을 박스로 구분",
                "fields": ["cases"]  # List of {"title": "", "content": "", "highlight": bool}
            },
            "node_map": {
                "name": "노드 맵",
                "description": "개념들의 관계를 시각화",
                "fields": ["central_concept", "nodes", "connections"]
            },
            "step_flow": {
                "name": "단계별 플로우", 
                "description": "순차적 프로세스나 실행 단계",
                "fields": ["steps"]  # List of {"order": int, "title": "", "description": ""}
            },
            "chart_insight": {
                "name": "차트 & 인사이트",
                "description": "데이터 차트와 분석 내용을 함께 표시",
                "fields": ["chart_type", "chart_data", "key_insights", "data_source"]
            }
        }
    }
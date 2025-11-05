"""
스토리라인 생성 API
"""
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from app.services.storyline import StorylineService, SlideOutline, StorylineResult
from app.core.auth import get_current_user
from app.db.memory_store import User, project_store, slide_store


router = APIRouter(prefix="/storyline", tags=["storyline"])


class StorylineRequest(BaseModel):
    topic: str
    target: str
    goal: str
    narrative_style: Optional[str] = "consulting"
    create_project: Optional[bool] = False
    project_title: Optional[str] = None


class SlideOutlineResponse(BaseModel):
    order: int
    head_message: str
    purpose: str
    template_suggestion: str


class StorylineResponse(BaseModel):
    outline: List[SlideOutlineResponse]
    head_messages: List[str]
    overall_narrative: str
    project_id: Optional[str] = None


@router.post("/generate", response_model=StorylineResponse)
async def generate_storyline(
    request: StorylineRequest,
    current_user: User = Depends(get_current_user)
):
    """스토리라인 생성"""
    
    # 입력 검증
    if not request.topic.strip():
        raise HTTPException(status_code=400, detail="주제를 입력해주세요")
    if not request.target.strip():
        raise HTTPException(status_code=400, detail="타겟 청중을 입력해주세요")
    if not request.goal.strip():
        raise HTTPException(status_code=400, detail="목표를 입력해주세요")
    
    try:
        # 스토리라인 서비스로 생성
        service = StorylineService()
        result = await service.generate_storyline(
            topic=request.topic.strip(),
            target=request.target.strip(), 
            goal=request.goal.strip(),
            narrative_style=request.narrative_style or "consulting"
        )
        
        # 응답 변환
        outline_responses = []
        head_messages = []
        for slide in result.outline:
            outline_responses.append(SlideOutlineResponse(
                order=slide.order,
                head_message=slide.head_message,
                purpose=slide.purpose,
                template_suggestion=slide.template_suggestion
            ))
            head_messages.append(slide.head_message)
        
        project_id = None
        
        # 프로젝트 생성이 요청된 경우
        if request.create_project:
            project_title = request.project_title or f"{request.topic} 프로젝트"
            project = project_store.create_project(
                user_id=current_user.id,
                title=project_title,
                topic=request.topic,
                target_audience=request.target,
                goal=request.goal
            )
            project_id = project.id
            
            # 스토리라인을 기반으로 슬라이드 생성
            storyline_data = []
            for slide in result.outline:
                storyline_data.append({
                    "order": slide.order,
                    "head_message": slide.head_message,
                    "purpose": slide.purpose,
                    "template_suggestion": slide.template_suggestion
                })
            
            slide_store.create_slides_from_storyline(project.id, storyline_data)
        
        return StorylineResponse(
            outline=outline_responses,
            head_messages=head_messages,
            overall_narrative=result.overall_narrative,
            project_id=project_id
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"스토리라인 생성 중 오류가 발생했습니다: {str(e)}")


@router.get("/templates")
async def get_template_suggestions():
    """사용 가능한 템플릿 목록 조회 - specs 기준"""
    return {
        "templates": {
            "message_only": {
                "name": "메시지 중심",
                "description": "핵심 메시지를 강조하는 간단한 구조",
                "best_for": ["opening", "closing", "key_message"]
            },
            "asis_tobe": {
                "name": "As-Is / To-Be",
                "description": "현재 상황과 목표 상황을 대비하여 변화 필요성 강조",
                "best_for": ["problem_analysis", "solution_comparison"]
            },
            "case_box": {
                "name": "케이스 박스",
                "description": "여러 사례나 옵션을 박스로 구분하여 비교",
                "best_for": ["options_comparison", "case_studies", "examples"]
            },
            "node_map": {
                "name": "노드 맵",
                "description": "요소 간의 관계나 연결성을 시각화",
                "best_for": ["relationship_mapping", "ecosystem", "stakeholder_analysis"]
            },
            "step_flow": {
                "name": "단계별 플로우",
                "description": "순차적 프로세스나 실행 단계를 표현",
                "best_for": ["process", "timeline", "implementation_steps"]
            },
            "chart_insight": {
                "name": "차트 & 인사이트",
                "description": "데이터 차트와 분석 내용을 함께 표시",
                "best_for": ["data_analysis", "market_research", "performance_metrics"]
            }
        }
    }
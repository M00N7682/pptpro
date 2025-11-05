"""
PPT 생성 API
"""
from fastapi import APIRouter, HTTPException, Depends, Response
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import Optional
from app.services.ppt_generation import PPTGenerationService
from app.core.auth import get_current_user
from app.db.memory_store import User, project_store, slide_store
import datetime


router = APIRouter(prefix="/ppt", tags=["ppt"])


class PPTGenerateRequest(BaseModel):
    project_id: str
    include_empty_slides: Optional[bool] = False  # 콘텐츠가 없는 슬라이드도 포함할지


@router.post("/generate/{project_id}")
async def generate_ppt(
    project_id: str,
    include_empty: bool = False,
    current_user: User = Depends(get_current_user)
):
    """프로젝트의 PPT 파일 생성 및 다운로드"""
    
    # 프로젝트 권한 확인
    project = project_store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
    
    if project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")
    
    # 프로젝트의 슬라이드들 조회
    slides = slide_store.get_slides_for_project(project_id)
    if not slides:
        raise HTTPException(status_code=404, detail="생성할 슬라이드가 없습니다")
    
    # 콘텐츠가 있는 슬라이드만 필터링 (옵션에 따라)
    if not include_empty:
        slides = [slide for slide in slides if slide.content]
        
        if not slides:
            raise HTTPException(
                status_code=400, 
                detail="콘텐츠가 생성된 슬라이드가 없습니다. 먼저 슬라이드 콘텐츠를 생성해주세요."
            )
    
    try:
        # PPT 생성
        service = PPTGenerationService()
        ppt_buffer = service.generate_ppt(project, slides)
        
        # 파일명 생성 (한글 파일명 지원)
        timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{project.title}_{timestamp}.pptx"
        
        # 응답 헤더 설정
        headers = {
            'Content-Disposition': f'attachment; filename="{filename}"',
            'Content-Type': 'application/vnd.openxmlformats-officedocument.presentationml.presentation'
        }
        
        return StreamingResponse(
            iter([ppt_buffer.getvalue()]), 
            media_type='application/vnd.openxmlformats-officedocument.presentationml.presentation',
            headers=headers
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"PPT 생성 중 오류가 발생했습니다: {str(e)}")


@router.get("/preview/{project_id}")
async def preview_ppt_info(
    project_id: str,
    current_user: User = Depends(get_current_user)
):
    """PPT 생성 미리보기 정보"""
    
    # 프로젝트 권한 확인
    project = project_store.get_project(project_id)
    if not project:
        raise HTTPException(status_code=404, detail="프로젝트를 찾을 수 없습니다")
    
    if project.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="접근 권한이 없습니다")
    
    # 슬라이드 정보 수집
    slides = slide_store.get_slides_for_project(project_id)
    
    slide_info = []
    content_ready_count = 0
    
    for slide in sorted(slides, key=lambda x: x.order):
        has_content = bool(slide.content)
        if has_content:
            content_ready_count += 1
        
        slide_info.append({
            "order": slide.order,
            "head_message": slide.head_message,
            "template_type": slide.template_type,
            "status": slide.status,
            "has_content": has_content,
            "content_summary": _summarize_content(slide.content) if has_content else None
        })
    
    return {
        "project": {
            "id": project.id,
            "title": project.title,
            "topic": project.topic,
            "target_audience": project.target_audience,
            "goal": project.goal
        },
        "slides": slide_info,
        "summary": {
            "total_slides": len(slides) + 2,  # +2 for title and closing slides
            "content_slides": len(slides),
            "ready_slides": content_ready_count,
            "completion_rate": round(content_ready_count / len(slides) * 100) if slides else 0
        },
        "can_generate": content_ready_count > 0
    }


def _summarize_content(content: dict) -> str:
    """콘텐츠 요약"""
    if not content:
        return "콘텐츠 없음"
    
    # 주요 필드들의 내용을 간단히 요약
    summary_parts = []
    
    for key, value in content.items():
        if isinstance(value, str) and value and not "USER_NEEDED" in value:
            # 문자열 내용을 30자로 제한
            truncated = value[:30] + "..." if len(value) > 30 else value
            summary_parts.append(truncated)
        elif isinstance(value, list) and value:
            # 리스트의 첫 번째 항목만
            if value[0] and not "USER_NEEDED" in str(value[0]):
                summary_parts.append(f"{str(value[0])[:20]}... 등 {len(value)}개")
    
    return " | ".join(summary_parts[:2]) if summary_parts else "기본 콘텐츠"


@router.get("/templates/preview")
async def get_template_previews():
    """템플릿 미리보기 정보"""
    return {
        "templates": {
            "message_only": {
                "name": "메시지 중심",
                "description": "핵심 메시지와 지원 포인트를 강조",
                "preview": "제목 + 지원 포인트들 + 액션 아이템",
                "best_for": ["결론 슬라이드", "핵심 메시지 전달", "요약"]
            },
            "asis_tobe": {
                "name": "As-Is / To-Be",
                "description": "현재 상황과 목표 상황을 대비",
                "preview": "현재 상황 (왼쪽) | 목표 상황 (오른쪽) + 전환 방법",
                "best_for": ["문제 정의", "개선 방안", "변화 관리"]
            },
            "case_box": {
                "name": "케이스 박스",
                "description": "여러 사례나 옵션을 박스로 구분",
                "preview": "케이스들을 2x2 그리드로 배치",
                "best_for": ["옵션 비교", "사례 연구", "선택지 제시"]
            },
            "step_flow": {
                "name": "단계별 플로우",
                "description": "순차적 프로세스나 실행 단계",
                "preview": "원형 단계들을 화살표로 연결",
                "best_for": ["프로세스 설명", "실행 계획", "워크플로우"]
            },
            "chart_insight": {
                "name": "차트 & 인사이트",
                "description": "데이터 차트와 분석 내용을 함께 표시",
                "preview": "차트 영역 (왼쪽) + 인사이트 (오른쪽)",
                "best_for": ["데이터 분석", "성과 보고", "트렌드 분석"]
            },
            "node_map": {
                "name": "노드 맵",
                "description": "개념들의 관계를 시각화",
                "preview": "중심 노드 + 주변 연결 노드들",
                "best_for": ["관계도", "조직 구조", "개념 연결"]
            }
        }
    }
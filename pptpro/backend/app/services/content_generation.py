"""
콘텐츠 생성 서비스 - 슬라이드별 세부 내용 LLM 생성
"""
from typing import Dict, Any, List, Optional
from dataclasses import dataclass
from app.infrastructure.llm_provider import get_llm_provider
from app.db.memory_store import Slide


@dataclass
class ContentItem:
    type: str  # "text", "bullet_point", "data", "chart", "user_needed"
    content: str
    placeholder: Optional[str] = None  # USER_NEEDED일 때 사용자가 입력해야 할 내용 설명
    metadata: Optional[Dict[str, Any]] = None  # 추가 정보


@dataclass  
class SlideContent:
    slide_id: str
    template_type: str
    generated_content: Dict[str, Any]  # 템플릿별 구조화된 내용
    user_needed_items: List[str]  # 사용자가 직접 입력해야 할 항목들
    generation_notes: str  # AI 생성 과정의 메모


class ContentGenerationService:
    """슬라이드 콘텐츠 생성 서비스"""
    
    def __init__(self):
        self.llm_provider = get_llm_provider()
    
    async def generate_slide_content(
        self, 
        slide: Slide, 
        project_context: Dict[str, str]
    ) -> SlideContent:
        """슬라이드 템플릿에 맞는 내용 생성"""
        
        prompt = self._build_content_prompt(slide, project_context)
        schema = self._get_template_schema(slide.template_type)
        
        try:
            response = await self.llm_provider.generate_structured(prompt, schema)
            
            # USER_NEEDED 항목 추출
            user_needed_items = self._extract_user_needed_items(response)
            
            return SlideContent(
                slide_id=slide.id,
                template_type=slide.template_type,
                generated_content=response.get("content", {}),
                user_needed_items=user_needed_items,
                generation_notes=response.get("notes", "AI가 생성한 초안입니다.")
            )
            
        except Exception as e:
            # LLM 실패 시 기본 구조 반환
            return self._get_fallback_content(slide)
    
    def _build_content_prompt(self, slide: Slide, project_context: Dict[str, str]) -> str:
        """콘텐츠 생성 프롬프트 구성"""
        
        base_prompt = f"""
당신은 전문 컨설팅 슬라이드 작성자입니다. 다음 정보를 바탕으로 슬라이드 내용을 생성해주세요.

**프로젝트 맥락:**
- 주제: {project_context.get('topic', '')}
- 타겟: {project_context.get('target_audience', '')}
- 목표: {project_context.get('goal', '')}

**슬라이드 정보:**
- 헤드메시지: {slide.head_message}
- 템플릿: {slide.template_type}
- 목적: {slide.purpose}
- 순서: {slide.order}번째 슬라이드

**생성 원칙:**
1. 헤드메시지를 뒷받침하는 구체적 내용 생성
2. 컨설팅 스타일: 논리적, 간결, 액션 지향적
3. 데이터가 필요한 부분은 "USER_NEEDED" 표시
4. 템플릿 구조에 맞는 형태로 출력
"""
        
        template_instruction = self._get_template_instruction(slide.template_type)
        return f"{base_prompt}\n\n{template_instruction}"
    
    def _get_template_instruction(self, template_type: str) -> str:
        """템플릿별 생성 지침"""
        
        instructions = {
            "message_only": """
**Message Only 템플릿 지침:**
- main_message: 핵심 메시지 (1-2문장)
- supporting_points: 뒷받침하는 논리 (3-4개 포인트)
- call_to_action: 다음 액션 제안
""",
            
            "asis_tobe": """
**As-Is To-Be 템플릿 지침:**
- as_is_title: 현재 상황 제목
- as_is_points: 현재 문제점/특징 (3-4개)
- to_be_title: 목표 상황 제목  
- to_be_points: 개선된 모습 (3-4개)
- transition_method: 전환 방법 제안
- 구체적 데이터가 필요한 부분은 USER_NEEDED 표시
""",
            
            "case_box": """
**Case Box 템플릿 지침:**
- cases: 사례/옵션들의 배열
- 각 case: title, description, pros_cons, recommendation
- 실제 기업/데이터가 필요한 부분은 USER_NEEDED 표시
""",
            
            "step_flow": """
**Step Flow 템플릿 지침:**
- steps: 순서별 단계 배열
- 각 step: order, title, description, deliverables, timeline
- 구체적 일정/리소스가 필요한 부분은 USER_NEEDED 표시
""",
            
            "chart_insight": """
**Chart Insight 템플릿 지침:**
- chart_title: 차트 제목
- chart_type: "bar", "line", "pie", "scatter" 등
- key_insights: 핵심 인사이트 (2-3개)
- data_source: 데이터 출처 (USER_NEEDED로 표시)
- chart_data: 샘플 데이터 구조만 제공, 실제 데이터는 USER_NEEDED
""",
            
            "node_map": """
**Node Map 템플릿 지침:**
- central_concept: 중심 개념
- primary_nodes: 1차 연결 노드들 (4-6개)
- secondary_connections: 노드 간 관계 설명
- 실제 조직도/데이터가 필요한 부분은 USER_NEEDED 표시
"""
        }
        
        return instructions.get(template_type, "일반적인 슬라이드 내용을 생성해주세요.")
    
    def _get_template_schema(self, template_type: str) -> Dict[str, Any]:
        """템플릿별 응답 스키마"""
        
        base_schema = {
            "content": {},
            "notes": "string (생성 과정 설명)",
            "user_needed_fields": ["array of field names requiring user input"]
        }
        
        content_schemas = {
            "message_only": {
                "main_message": "string",
                "supporting_points": ["array of strings"],
                "call_to_action": "string"
            },
            
            "asis_tobe": {
                "as_is_title": "string",
                "as_is_points": ["array of strings"],
                "to_be_title": "string", 
                "to_be_points": ["array of strings"],
                "transition_method": "string"
            },
            
            "case_box": {
                "cases": [{
                    "title": "string",
                    "description": "string",
                    "pros": ["array of strings"],
                    "cons": ["array of strings"], 
                    "recommendation": "string"
                }]
            },
            
            "step_flow": {
                "steps": [{
                    "order": "number",
                    "title": "string",
                    "description": "string",
                    "deliverables": ["array of strings"],
                    "timeline": "string"
                }]
            },
            
            "chart_insight": {
                "chart_title": "string",
                "chart_type": "string",
                "key_insights": ["array of strings"],
                "data_source": "string",
                "sample_data_structure": "object"
            },
            
            "node_map": {
                "central_concept": "string",
                "primary_nodes": ["array of strings"],
                "connections": [{
                    "from": "string",
                    "to": "string", 
                    "relationship": "string"
                }]
            }
        }
        
        base_schema["content"] = content_schemas.get(template_type, {})
        return base_schema
    
    def _extract_user_needed_items(self, response: Dict[str, Any]) -> List[str]:
        """USER_NEEDED 항목들을 추출"""
        user_needed = response.get("user_needed_fields", [])
        
        # 컨텐츠에서 "USER_NEEDED" 표시된 항목들도 찾기
        content = response.get("content", {})
        for key, value in content.items():
            if isinstance(value, str) and "USER_NEEDED" in value:
                if key not in user_needed:
                    user_needed.append(key)
        
        return user_needed
    
    def _get_fallback_content(self, slide: Slide) -> SlideContent:
        """LLM 실패 시 기본 콘텐츠"""
        
        fallback_contents = {
            "message_only": {
                "main_message": f"{slide.head_message}",
                "supporting_points": [
                    "USER_NEEDED: 구체적 근거 데이터 필요",
                    "USER_NEEDED: 사례 연구 결과 필요", 
                    "USER_NEEDED: 전문가 의견 필요"
                ],
                "call_to_action": "다음 단계로 진행"
            },
            
            "asis_tobe": {
                "as_is_title": "현재 상황",
                "as_is_points": ["USER_NEEDED: 현재 상태 분석 데이터 필요"],
                "to_be_title": "목표 상황",
                "to_be_points": ["USER_NEEDED: 목표 상태 정의 필요"],
                "transition_method": "USER_NEEDED: 전환 계획 수립 필요"
            }
        }
        
        content = fallback_contents.get(slide.template_type, {
            "content": f"USER_NEEDED: {slide.head_message}에 대한 내용을 작성해주세요"
        })
        
        return SlideContent(
            slide_id=slide.id,
            template_type=slide.template_type,
            generated_content=content,
            user_needed_items=["content"],
            generation_notes="기본 템플릿이 적용되었습니다. 내용을 직접 입력해주세요."
        )
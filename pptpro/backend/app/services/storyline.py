"""
스토리라인 생성 서비스
"""
from typing import List, Dict, Any
from dataclasses import dataclass
from app.infrastructure.llm_provider import get_llm_provider


@dataclass
class SlideOutline:
    order: int
    head_message: str
    purpose: str
    template_suggestion: str = "message_only"


@dataclass
class StorylineResult:
    outline: List[SlideOutline]
    overall_narrative: str


class StorylineService:
    """스토리라인 생성 서비스"""
    
    def __init__(self):
        self.llm_provider = get_llm_provider()
    
    async def generate_storyline(
        self, 
        topic: str, 
        target: str, 
        goal: str, 
        narrative_style: str = "consulting"
    ) -> StorylineResult:
        """사용자 입력을 바탕으로 스토리라인 생성"""
        
        prompt = self._build_storyline_prompt(topic, target, goal, narrative_style)
        schema = self._get_response_schema()
        
        try:
            # LLM으로 구조화된 응답 생성
            response = await self.llm_provider.generate_structured(prompt, schema)
            
            # 응답을 SlideOutline 객체로 변환
            outline = []
            for item in response.get("outline", []):
                slide = SlideOutline(
                    order=item.get("order", 0),
                    head_message=item.get("head_message", ""),
                    purpose=item.get("purpose", "general"),
                    template_suggestion=self._suggest_template(item.get("purpose", "general"))
                )
                outline.append(slide)
            
            return StorylineResult(
                outline=outline,
                overall_narrative=response.get("overall_narrative", "")
            )
            
        except Exception as e:
            # LLM 실패 시 기본 구조 반환
            return self._get_fallback_storyline(topic, target, goal)
    
    def _build_storyline_prompt(self, topic: str, target: str, goal: str, style: str) -> str:
        """프롬프트 생성"""
        return f"""
당신은 컨설팅 장표 전문가입니다. 다음 정보를 바탕으로 프레젠테이션의 목차와 각 슬라이드의 핵심 메시지를 생성하세요.

**프로젝트 정보:**
- 주제: {topic}
- 타겟 청중: {target}  
- 목표: {goal}
- 스타일: {style}

**요구사항:**
1. 논리적 흐름을 가진 5-8개의 슬라이드 구성
2. 각 슬라이드는 하나의 명확한 핵심 메시지(헤드메시지)
3. 컨설팅 스타일: 문제 → 분석 → 해결책 구조 권장
4. 헤드메시지는 결론 중심의 명확한 1문장

**슬라이드 목적 유형:**
- problem_statement: 문제/이슈 정의
- current_state: 현재 상황 분석  
- analysis: 데이터 분석/인사이트
- solution: 해결 방안 제시
- implementation: 실행 계획
- conclusion: 결론/요약

각 슬라이드의 order, head_message, purpose를 JSON으로 반환해주세요.
"""

    def _get_response_schema(self) -> Dict[str, Any]:
        """응답 JSON 스키마"""
        return {
            "outline": [
                {
                    "order": "int (순서)",
                    "head_message": "string (핵심 메시지 1문장)", 
                    "purpose": "string (슬라이드 목적)"
                }
            ],
            "overall_narrative": "string (전체 스토리 요약)"
        }
    
    def _suggest_template(self, purpose: str) -> str:
        """목적에 따른 템플릿 추천"""
        template_mapping = {
            "problem_statement": "message_only",
            "current_state": "asis_tobe", 
            "analysis": "chart_insight",
            "solution": "case_box",
            "implementation": "step_flow",
            "conclusion": "message_only"
        }
        return template_mapping.get(purpose, "message_only")
    
    def _get_fallback_storyline(self, topic: str, target: str, goal: str) -> StorylineResult:
        """LLM 실패 시 기본 스토리라인"""
        outline = [
            SlideOutline(1, f"{topic} 개요", "problem_statement", "message_only"),
            SlideOutline(2, f"{target}의 현재 상황", "current_state", "asis_tobe"),
            SlideOutline(3, "핵심 이슈 분석", "analysis", "chart_insight"),
            SlideOutline(4, f"{goal} 달성 방안", "solution", "case_box"),
            SlideOutline(5, "실행 계획", "implementation", "step_flow"),
            SlideOutline(6, "기대 효과 및 결론", "conclusion", "message_only")
        ]
        
        return StorylineResult(
            outline=outline,
            overall_narrative=f"{topic}에 대한 {target} 대상 프레젠테이션으로 {goal} 달성을 목표로 합니다."
        )
"""
Slide content classification and generation service
"""
import json
from typing import Dict, Any, List
from app.infrastructure.llm_provider import get_llm_provider
from app.schemas.slide_content import (
    SlideClassificationRequest,
    SlideClassificationResponse,
    ContentElement,
    SlideContentGenerationRequest,
    SlideContentGenerationResponse,
    SlideComponents,
)


class SlideContentService:
    """슬라이드 콘텐츠 분류 및 생성 서비스"""
    
    def __init__(self):
        self.llm = get_llm_provider()
    
    async def classify_slide_content(
        self, 
        request: SlideClassificationRequest
    ) -> SlideClassificationResponse:
        """
        슬라이드 콘텐츠를 USER_NEEDED와 AI_GENERATED로 자동 분류
        """
        
        prompt = self._build_classification_prompt(request)
        
        prompt_text = f"{self._get_classification_system_prompt()}\n\n{prompt}"

        llm_response = await self.llm.generate(
            prompt=prompt_text,
            temperature=0.2,  # 일관된 분류를 위해 낮은 temperature
        )
        
        # LLM 응답 파싱
        result = self._parse_classification_response(
            llm_response.content if hasattr(llm_response, "content") else llm_response
        )
        
        return SlideClassificationResponse(**result)
    
    async def generate_slide_content(
        self, 
        request: SlideContentGenerationRequest
    ) -> SlideContentGenerationResponse:
        """
        AI_GENERATED 요소들에 대해 실제 콘텐츠 생성
        """
        
        prompt = self._build_generation_prompt(request)
        
        prompt_text = f"{self._get_generation_system_prompt(request.slide_type)}\n\n{prompt}"

        llm_response = await self.llm.generate(
            prompt=prompt_text,
            temperature=0.7,  # 창의적인 콘텐츠 생성을 위해 적절한 temperature
        )
        
        # LLM 응답 파싱
        raw_result = self._parse_generation_response(
            llm_response.content if hasattr(llm_response, "content") else llm_response,
            request.slide_type
        )

        normalized_components = self._normalize_components(
            raw_result.get("components", {}),
            request
        )

        raw_result["components"] = normalized_components
        
        return SlideContentGenerationResponse(**raw_result)
    
    def _get_classification_system_prompt(self) -> str:
        """분류용 시스템 프롬프트"""
        return """당신은 PPT 콘텐츠 분석 전문가입니다.
슬라이드의 각 요소를 분석하여 다음 두 가지로 분류해야 합니다:

1. **USER_NEEDED**: 사용자가 직접 입력해야 하는 요소
   - 자료조사가 필요한 데이터
   - 실제 수치/통계
   - 외부 출처 정보
   - 구체적인 사례나 레퍼런스
   - 사용자 조직의 특수한 정보

2. **AI_GENERATED**: AI가 자동으로 작성 가능한 요소
   - 논리적 연결 문구
   - 인사이트 도출
   - 일반적인 설명 텍스트
   - 구조적 요약
   - 액션 가이드

응답은 반드시 JSON 형식으로 작성하세요:
{
  "user_needed": [
    {
      "element_type": "요소_타입",
      "description": "설명",
      "classification": "USER_NEEDED",
      "reason": "분류 이유"
    }
  ],
  "ai_generated": [
    {
      "element_type": "요소_타입",
      "description": "설명",
      "classification": "AI_GENERATED",
      "reason": "분류 이유"
    }
  ]
}"""
    
    def _build_classification_prompt(self, request: SlideClassificationRequest) -> str:
        """분류용 프롬프트 생성"""
        
        prompt = f"""다음 슬라이드의 콘텐츠 요소를 USER_NEEDED와 AI_GENERATED로 분류해주세요.

**슬라이드 타입**: {request.slide_type}
**슬라이드 텍스트/개요**:
{request.slide_text}
"""
        
        if request.head_message:
            prompt += f"\n**헤드 메시지**: {request.head_message}\n"
        
        prompt += """
각 요소가 사용자 입력이 필요한지(USER_NEEDED), AI가 생성 가능한지(AI_GENERATED) 판단하세요.
데이터, 수치, 실제 사례는 USER_NEEDED로, 논리적 설명이나 인사이트는 AI_GENERATED로 분류하세요.
"""
        
        return prompt
    
    def _parse_classification_response(self, response: str) -> Dict[str, Any]:
        """분류 응답 파싱"""
        try:
            response = response.strip()
            
            # Markdown 코드 블록 제거
            if response.startswith("```"):
                lines = response.split("\n")
                response = "\n".join(lines[1:-1]) if len(lines) > 2 else response
                if response.startswith("json"):
                    response = response[4:].strip()
            
            data = json.loads(response)
            
            # 기본값 설정
            if "user_needed" not in data:
                data["user_needed"] = []
            if "ai_generated" not in data:
                data["ai_generated"] = []
            
            return data
            
        except json.JSONDecodeError:
            # 파싱 실패 시 기본값
            return {
                "user_needed": [
                    {
                        "element_type": "data",
                        "description": "사용자 입력이 필요한 데이터",
                        "classification": "USER_NEEDED",
                        "reason": "자료조사 필요",
                    }
                ],
                "ai_generated": [
                    {
                        "element_type": "text",
                        "description": "AI가 생성 가능한 텍스트",
                        "classification": "AI_GENERATED",
                        "reason": "논리적 설명 가능",
                    }
                ],
            }
    
    def _get_generation_system_prompt(self, slide_type: str) -> str:
        """콘텐츠 생성용 시스템 프롬프트"""

        base_instruction = (
            "당신은 전문 컨설턴트이자 PPT 작성 전문가입니다.\n"
            "주어진 컨텍스트를 바탕으로 슬라이드의 각 구성 요소를 작성해야 합니다.\n\n"
            "응답은 반드시 JSON 형식으로 작성하세요."
        )

        template_guidance = self._get_template_generation_guidance(slide_type)

        return f"{base_instruction}\n\n{template_guidance}"
    
    def _build_generation_prompt(self, request: SlideContentGenerationRequest) -> str:
        """콘텐츠 생성용 프롬프트"""
        context_str = "\n".join(
            [f"- {key}: {value}" for key, value in request.context.items()]
        )
        elements_str = ", ".join(request.ai_generated_elements)

        prompt = f"""다음 슬라이드의 콘텐츠를 생성해주세요.

**슬라이드 타입**: {request.slide_type}
**생성할 요소**: {elements_str}

**컨텍스트**:
{context_str}

각 요소는 템플릿 구조에 맞게 작성하고, 숫자나 조직 고유 정보처럼 실제 데이터가 필요한 부분은 "USER_NEEDED"라고 명시하세요.
"""

        return prompt
    
    def _parse_generation_response(
        self, 
        response: str, 
        slide_type: str
    ) -> Dict[str, Any]:
        """콘텐츠 생성 응답 파싱"""
        try:
            response = response.strip()
            
            # Markdown 코드 블록 제거
            if response.startswith("```"):
                lines = response.split("\n")
                response = "\n".join(lines[1:-1]) if len(lines) > 2 else response
                if response.startswith("json"):
                    response = response[4:].strip()
            
            data = json.loads(response)
            
            # components가 없으면 빈 객체
            if "components" not in data:
                data["components"] = {}

            return data

        except json.JSONDecodeError:
            # 파싱 실패 시 기본값
            return {
                "components": {
                    "title": "제목",
                    "sub_message": "서브 메시지",
                    "bullet_points": ["포인트 1", "포인트 2", "포인트 3"],
                },
                "metadata": {"status": "fallback"},
            }

    def _get_template_generation_guidance(self, slide_type: str) -> str:
        """템플릿별 생성 가이드"""

        guidance = {
            "message_only": """
슬라이드 구성은 다음 JSON 구조를 따라야 합니다:
{
    "components": {
        "title": "슬라이드 제목 (필수)",
        "main_message": "헤드 메시지를 강화하는 핵심 문장",
        "bullet_points": ["핵심 지원 포인트", "..."],
        "call_to_action": "다음 액션 또는 결론"
    },
    "metadata": {
        "tone": "professional",
        "length": "medium"
    }
}
불릿 포인트는 3-4개로, 각 포인트는 15단어 이하로 작성하세요.
""",
            "asis_tobe": """
JSON 구조:
{
    "components": {
        "as_is_title": "현재 상태 제목",
        "as_is_points": ["현재 상태 포인트", "..."],
        "to_be_title": "목표 상태 제목",
        "to_be_points": ["목표 상태 포인트", "..."],
        "transition_method": "전환 방법 요약"
    }
}
각 포인트는 문제와 개선 방향을 명확히 비교 가능한 형태로 작성하세요.
""",
            "case_box": """
JSON 구조:
{
    "components": {
        "cases": [
            {
                "title": "사례 제목",
                "description": "간단한 설명",
                "pros": ["장점"],
                "cons": ["단점"],
                "recommendation": "권장 방향"
            }
        ],
        "insight_box": "종합 인사이트"
    }
}
사례는 최대 4개까지 작성하고, 장단점은 각각 2-3개로 요약하세요.
""",
            "step_flow": """
JSON 구조:
{
    "components": {
        "steps": [
            {
                "order": 1,
                "title": "단계 명",
                "description": "주요 내용",
                "deliverables": ["산출물"],
                "timeline": "기간"
            }
        ],
        "action_guide": "추가 실행 가이드"
    }
}
단계는 3-6개, 각 설명은 20단어 이하로 작성하세요.
""",
            "chart_insight": """
JSON 구조:
{
    "components": {
        "chart_title": "차트 제목",
        "chart_type": "bar|line|pie 등",
        "key_insights": ["핵심 인사이트"],
        "data_source": "데이터 출처 (USER_NEEDED 표시 가능)",
        "evidence_block": "추가 근거",
        "insight_box": "요약 인사이트"
    }
}
인사이트는 2-3개, 각 문장은 18단어 이하로 작성하세요.
""",
            "node_map": """
JSON 구조:
{
    "components": {
        "central_concept": "중심 개념",
        "primary_nodes": ["핵심 노드"],
        "connections": [
            {"from": "노드", "to": "노드", "relationship": "관계 설명"}
        ],
        "insight_box": "요약 인사이트"
    }
}
노드는 4-6개로 제한하고, 관계 설명은 간략히 작성하세요.
""",
        }

        return guidance.get(slide_type, "JSON 형식으로 components 객체를 채워주세요.")

    def _normalize_components(self, components: Dict[str, Any], request: SlideContentGenerationRequest) -> Dict[str, Any]:
        """템플릿별로 PPT 렌더러와 UI가 모두 활용할 수 있는 구조로 정규화"""

        slide_type = request.slide_type
        normalized = dict(components)

        if slide_type == "message_only":
            normalized.setdefault("title", request.context.get("head_message"))
            normalized["main_message"] = (
                normalized.get("main_message")
                or normalized.get("title")
                or request.context.get("head_message")
            )
            normalized["bullet_points"] = (
                normalized.get("bullet_points")
                or normalized.get("supporting_points")
                or []
            )
            normalized["supporting_points"] = normalized["bullet_points"]
            normalized["call_to_action"] = (
                normalized.get("call_to_action")
                or normalized.get("action_guide")
                or normalized.get("sub_message", "")
            )

        elif slide_type == "asis_tobe":
            normalized["as_is_title"] = normalized.get("as_is_title") or "현재 상태"
            normalized["to_be_title"] = normalized.get("to_be_title") or "목표 상태"
            normalized["as_is_points"] = (
                normalized.get("as_is_points")
                or normalized.get("current_state_points")
                or normalized.get("bullet_points", [])
            )
            normalized["to_be_points"] = (
                normalized.get("to_be_points")
                or normalized.get("future_state_points")
                or []
            )
            normalized["transition_method"] = (
                normalized.get("transition_method")
                or normalized.get("action_guide")
                or "USER_NEEDED"
            )

        elif slide_type == "case_box":
            normalized["cases"] = normalized.get("cases") or []
            normalized["insight_box"] = (
                normalized.get("insight_box")
                or normalized.get("sub_message")
                or ""
            )

        elif slide_type == "step_flow":
            steps = normalized.get("steps") or []
            for idx, step in enumerate(steps, start=1):
                step.setdefault("order", idx)
            normalized["steps"] = steps
            normalized["action_guide"] = (
                normalized.get("action_guide")
                or normalized.get("insight_box")
                or ""
            )

        elif slide_type == "chart_insight":
            normalized["chart_title"] = (
                normalized.get("chart_title")
                or request.context.get("head_message")
            )
            normalized["key_insights"] = (
                normalized.get("key_insights")
                or normalized.get("bullet_points", [])
            )
            normalized["insight_box"] = (
                normalized.get("insight_box")
                or normalized.get("sub_message")
                or ""
            )
            normalized["data_source"] = normalized.get("data_source") or "USER_NEEDED"
            normalized["evidence_block"] = (
                normalized.get("evidence_block")
                or normalized.get("evidence")
            )

        elif slide_type == "node_map":
            normalized["central_concept"] = (
                normalized.get("central_concept")
                or request.context.get("head_message")
            )
            normalized["primary_nodes"] = (
                normalized.get("primary_nodes")
                or normalized.get("bullet_points", [])
            )
            normalized["connections"] = normalized.get("connections") or []
            normalized["insight_box"] = (
                normalized.get("insight_box")
                or normalized.get("sub_message")
                or ""
            )

        # PPT 렌더링용 payload 저장
        ppt_payload_map = {
            "message_only": {
                "main_message": normalized.get("main_message"),
                "supporting_points": normalized.get("supporting_points", []),
                "call_to_action": normalized.get("call_to_action"),
            },
            "asis_tobe": {
                "as_is_title": normalized.get("as_is_title"),
                "as_is_points": normalized.get("as_is_points", []),
                "to_be_title": normalized.get("to_be_title"),
                "to_be_points": normalized.get("to_be_points", []),
                "transition_method": normalized.get("transition_method"),
            },
            "case_box": {
                "cases": normalized.get("cases", []),
                "insight_box": normalized.get("insight_box"),
            },
            "step_flow": {
                "steps": normalized.get("steps", []),
                "action_guide": normalized.get("action_guide"),
            },
            "chart_insight": {
                "chart_title": normalized.get("chart_title"),
                "chart_type": normalized.get("chart_type"),
                "key_insights": normalized.get("key_insights", []),
                "data_source": normalized.get("data_source"),
                "evidence_block": normalized.get("evidence_block"),
                "insight_box": normalized.get("insight_box"),
            },
            "node_map": {
                "central_concept": normalized.get("central_concept"),
                "primary_nodes": normalized.get("primary_nodes", []),
                "connections": normalized.get("connections", []),
                "insight_box": normalized.get("insight_box"),
            },
        }

        normalized["ppt_payload"] = ppt_payload_map.get(slide_type, normalized)

        return normalized

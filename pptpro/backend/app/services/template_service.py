"""
Template suggestion service using LLM
"""
import json
from typing import Dict, Any, List
from app.infrastructure.llm_provider import get_llm_provider
from app.schemas.template import (
    TemplateSuggestionRequest,
    TemplateSuggestionResponse,
    TemplateComponent,
)


class TemplateService:
    """템플릿 추천 서비스"""
    
    def __init__(self):
        self.llm = get_llm_provider()
        self.template_descriptions = {
            "message_only": "메시지 중심 장표. 핵심 메시지만 강조하고 시각적 요소는 최소화. 임팩트 있는 문구 전달에 적합.",
            "asis_tobe": "현재 상태(As-Is)와 목표 상태(To-Be)를 비교하는 장표. 변화나 개선점을 시각적으로 대비.",
            "case_box": "여러 사례나 예시를 박스 형태로 나열하는 장표. 비교 분석이나 다양한 케이스 제시에 적합.",
            "node_map": "노드 간 관계를 시각화하는 장표. 이해관계자, 프로세스, 개념 간 연결 표현.",
            "step_flow": "단계별 프로세스나 절차를 순서대로 표현하는 장표. 실행 계획, 로드맵에 적합.",
            "chart_insight": "차트/그래프와 함께 인사이트를 제공하는 장표. 데이터 기반 분석 결과 전달.",
        }
    
    async def suggest_template(
        self, 
        request: TemplateSuggestionRequest
    ) -> TemplateSuggestionResponse:
        """
        슬라이드 목적과 헤드메시지를 기반으로 최적의 템플릿 추천
        """
        
        prompt = self._build_suggestion_prompt(request)
        
        prompt_text = f"{self._get_system_prompt()}\n\n{prompt}"

        llm_response = await self.llm.generate(
            prompt=prompt_text,
            temperature=0.3,  # 일관된 추천을 위해 낮은 temperature
        )
        
        # LLM 응답 파싱
        result = self._parse_llm_response(llm_response.content if hasattr(llm_response, "content") else llm_response)
        
        return TemplateSuggestionResponse(**result)
    
    def _get_system_prompt(self) -> str:
        """시스템 프롬프트"""
        return """당신은 컨설팅 장표 전문가입니다.
슬라이드의 목적과 메시지를 분석하여 가장 적합한 템플릿을 추천해야 합니다.

사용 가능한 템플릿:
1. message_only: 메시지 중심 장표 (핵심 메시지만 강조)
2. asis_tobe: As-Is/To-Be 비교 장표 (현재 vs 목표)
3. case_box: 사례 박스 나열 장표 (여러 케이스 비교)
4. node_map: 노드 관계도 (이해관계자, 개념 연결)
5. step_flow: 단계별 프로세스 (순서/절차)
6. chart_insight: 차트+인사이트 (데이터 기반 분석)

응답은 반드시 JSON 형식으로 작성하세요:
{
  "template_type": "선택한_템플릿",
  "reason": "추천 이유 (2-3문장)",
  "components": [
    {
      "type": "컴포넌트_타입",
      "description": "설명",
      "required": true/false
    }
  ],
  "alternative_templates": ["대안1", "대안2"]
}"""
    
    def _build_suggestion_prompt(self, request: TemplateSuggestionRequest) -> str:
        """LLM 프롬프트 생성"""
        
        template_info = "\n".join([
            f"- {key}: {desc}" 
            for key, desc in self.template_descriptions.items()
        ])
        
        prompt = f"""다음 슬라이드에 가장 적합한 템플릿을 추천해주세요.

**슬라이드 목적**: {request.slide_purpose}
**헤드 메시지**: {request.head_message}
"""
        
        if request.context:
            prompt += f"\n**추가 컨텍스트**: {request.context}\n"
        
        prompt += f"""
**템플릿 설명**:
{template_info}

가장 적합한 템플릿 1개를 선택하고, 해당 템플릿에 포함되어야 할 구성 요소(components)를 나열하세요.
각 컴포넌트는 title, sub_message, bullet_points, diagram, insight_box, action_guide, caption 등이 될 수 있습니다.
"""
        
        return prompt
    
    def _parse_llm_response(self, response: str) -> Dict[str, Any]:
        """LLM 응답을 파싱하여 구조화된 데이터로 변환"""
        try:
            # JSON 블록 추출 (```json ... ``` 또는 {...} 형태)
            response = response.strip()
            
            # Markdown 코드 블록 제거
            if response.startswith("```"):
                lines = response.split("\n")
                response = "\n".join(lines[1:-1]) if len(lines) > 2 else response
                if response.startswith("json"):
                    response = response[4:].strip()
            
            data = json.loads(response)
            
            # 검증: 필수 필드 확인
            if "template_type" not in data:
                raise ValueError("template_type이 응답에 없습니다")
            
            # components가 없으면 기본값 제공
            if "components" not in data:
                data["components"] = self._get_default_components(data["template_type"])
            
            return data
            
        except json.JSONDecodeError as e:
            # JSON 파싱 실패 시 기본값 반환
            return {
                "template_type": "message_only",
                "reason": "LLM 응답 파싱 실패로 기본 템플릿을 선택했습니다.",
                "components": self._get_default_components("message_only"),
                "alternative_templates": ["case_box", "step_flow"],
            }
    
    def _get_default_components(self, template_type: str) -> List[Dict[str, Any]]:
        """템플릿 타입별 기본 컴포넌트"""
        
        defaults = {
            "message_only": [
                {"type": "title", "description": "슬라이드 제목", "required": True},
                {"type": "main_message", "description": "핵심 메시지", "required": True},
            ],
            "asis_tobe": [
                {"type": "title", "description": "슬라이드 제목", "required": True},
                {"type": "asis_section", "description": "현재 상태 (As-Is)", "required": True},
                {"type": "tobe_section", "description": "목표 상태 (To-Be)", "required": True},
                {"type": "insight_box", "description": "변화 인사이트", "required": False},
            ],
            "case_box": [
                {"type": "title", "description": "슬라이드 제목", "required": True},
                {"type": "case_boxes", "description": "사례 박스들 (3-6개)", "required": True},
                {"type": "insight_box", "description": "종합 인사이트", "required": False},
            ],
            "node_map": [
                {"type": "title", "description": "슬라이드 제목", "required": True},
                {"type": "nodes", "description": "노드 요소들", "required": True},
                {"type": "connections", "description": "노드 간 연결", "required": True},
            ],
            "step_flow": [
                {"type": "title", "description": "슬라이드 제목", "required": True},
                {"type": "steps", "description": "단계별 프로세스 (3-7단계)", "required": True},
                {"type": "action_guide", "description": "실행 가이드", "required": False},
            ],
            "chart_insight": [
                {"type": "title", "description": "슬라이드 제목", "required": True},
                {"type": "chart", "description": "차트/그래프", "required": True},
                {"type": "insight_box", "description": "데이터 인사이트", "required": True},
                {"type": "evidence_block", "description": "근거 데이터", "required": False},
            ],
        }
        
        return defaults.get(template_type, defaults["message_only"])

"""
Slide content classification and generation service
"""
import json
from typing import Dict, Any, List
from app.infrastructure.llm_provider import LLMProvider
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
        self.llm = LLMProvider()
    
    async def classify_slide_content(
        self, 
        request: SlideClassificationRequest
    ) -> SlideClassificationResponse:
        """
        슬라이드 콘텐츠를 USER_NEEDED와 AI_GENERATED로 자동 분류
        """
        
        prompt = self._build_classification_prompt(request)
        
        response = await self.llm.generate(
            system_prompt=self._get_classification_system_prompt(),
            user_prompt=prompt,
            temperature=0.2,  # 일관된 분류를 위해 낮은 temperature
        )
        
        # LLM 응답 파싱
        result = self._parse_classification_response(response)
        
        return SlideClassificationResponse(**result)
    
    async def generate_slide_content(
        self, 
        request: SlideContentGenerationRequest
    ) -> SlideContentGenerationResponse:
        """
        AI_GENERATED 요소들에 대해 실제 콘텐츠 생성
        """
        
        prompt = self._build_generation_prompt(request)
        
        response = await self.llm.generate(
            system_prompt=self._get_generation_system_prompt(),
            user_prompt=prompt,
            temperature=0.7,  # 창의적인 콘텐츠 생성을 위해 적절한 temperature
        )
        
        # LLM 응답 파싱
        result = self._parse_generation_response(response, request.slide_type)
        
        return SlideContentGenerationResponse(**result)
    
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
    
    def _get_generation_system_prompt(self) -> str:
        """콘텐츠 생성용 시스템 프롬프트"""
        return """당신은 전문 컨설턴트이자 PPT 작성 전문가입니다.
주어진 컨텍스트를 바탕으로 슬라이드의 각 구성 요소를 작성해야 합니다.

다음 요소들을 생성할 수 있습니다:
- **title**: 슬라이드 제목 (명확하고 임팩트 있게)
- **sub_message**: 서브 메시지 (제목을 보완하는 설명)
- **bullet_points**: 불릿 포인트 리스트 (3-5개, 각각 명확한 포인트)
- **evidence_block**: 근거/증거 블록 (논리적 뒷받침)
- **diagram_components**: 다이어그램 구성 요소 (노드, 연결 등)
- **insight_box**: 인사이트 박스 (핵심 통찰)
- **action_guide**: 액션 가이드 (실행 방안)
- **caption**: 캡션 (부연설명)

응답은 반드시 JSON 형식으로 작성하세요:
{
  "components": {
    "title": "...",
    "sub_message": "...",
    "bullet_points": ["...", "...", "..."],
    ...
  },
  "metadata": {
    "tone": "professional",
    "length": "medium"
  }
}"""
    
    def _build_generation_prompt(self, request: SlideContentGenerationRequest) -> str:
        """콘텐츠 생성용 프롬프트"""
        
        context_str = "\n".join([f"- {key}: {value}" for key, value in request.context.items()])
        elements_str = ", ".join(request.ai_generated_elements)
        
        prompt = f"""다음 슬라이드의 콘텐츠를 생성해주세요.

**슬라이드 타입**: {request.slide_type}
**생성할 요소**: {elements_str}

**컨텍스트**:
{context_str}

각 요소를 컨텍스트에 맞게 작성하되, 전문적이고 명확하게 작성하세요.
불릿 포인트는 3-5개로 작성하고, 인사이트는 핵심을 간결하게 표현하세요.
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

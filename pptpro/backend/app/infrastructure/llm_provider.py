"""
LLM Provider 추상화 레이어
"""
from abc import ABC, abstractmethod
from typing import Dict, Any, Optional
from dataclasses import dataclass
import openai
import httpx
from app.core.config import settings


@dataclass
class LLMResponse:
    content: str
    usage_tokens: Optional[int] = None
    latency_ms: Optional[int] = None


class LLMProvider(ABC):
    """LLM Provider 추상 기본 클래스"""
    
    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> LLMResponse:
        """텍스트 생성"""
        pass
    
    @abstractmethod 
    async def generate_structured(self, prompt: str, schema: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """구조화된 JSON 응답 생성"""
        pass


class OpenAIProvider(LLMProvider):
    """OpenAI API Provider"""
    
    def __init__(self, api_key: str, model: str = "gpt-3.5-turbo"):
        self.client = openai.AsyncOpenAI(api_key=api_key)
        self.model = model
    
    async def generate(self, prompt: str, **kwargs) -> LLMResponse:
        """일반 텍스트 생성"""
        try:
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": prompt}],
                max_tokens=kwargs.get("max_tokens", 1000),
                temperature=kwargs.get("temperature", 0.7)
            )
            
            content = response.choices[0].message.content
            tokens = response.usage.total_tokens if response.usage else None
            
            return LLMResponse(
                content=content,
                usage_tokens=tokens
            )
        except Exception as e:
            raise Exception(f"OpenAI API Error: {str(e)}")
    
    async def generate_structured(self, prompt: str, schema: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """JSON 모드를 사용한 구조화된 응답"""
        try:
            # JSON 형식 요청을 프롬프트에 추가
            json_prompt = f"{prompt}\n\n응답은 반드시 다음 JSON 형식으로 해주세요:\n{schema}"
            
            response = await self.client.chat.completions.create(
                model=self.model,
                messages=[{"role": "user", "content": json_prompt}],
                max_tokens=kwargs.get("max_tokens", 1500),
                temperature=kwargs.get("temperature", 0.3),
                response_format={"type": "json_object"}
            )
            
            content = response.choices[0].message.content
            
            # JSON 파싱
            import json
            return json.loads(content)
            
        except Exception as e:
            raise Exception(f"OpenAI Structured API Error: {str(e)}")


class MockLLMProvider(LLMProvider):
    """개발/테스트용 Mock Provider"""
    
    async def generate(self, prompt: str, **kwargs) -> LLMResponse:
        """Mock 응답"""
        return LLMResponse(
            content="Mock LLM response for: " + prompt[:50] + "...",
            usage_tokens=100
        )
    
    async def generate_structured(self, prompt: str, schema: Dict[str, Any], **kwargs) -> Dict[str, Any]:
        """Mock 구조화 응답"""
        return {
            "outline": [
                {"order": 1, "head_message": "문제 정의", "purpose": "problem_statement"},
                {"order": 2, "head_message": "현황 분석", "purpose": "analysis"}, 
                {"order": 3, "head_message": "해결 방안", "purpose": "solution"}
            ],
            "overall_narrative": "Mock narrative for development"
        }


# LLM Provider Factory
def get_llm_provider() -> LLMProvider:
    """설정에 따라 적절한 LLM Provider 반환"""
    if settings.OPENAI_API_KEY:
        return OpenAIProvider(api_key=settings.OPENAI_API_KEY)
    else:
        # API 키가 없으면 Mock Provider 사용 (개발용)
        return MockLLMProvider()
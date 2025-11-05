# ADR 004: LLM 통합 전략

## 상태
채택됨 (Accepted) - 2025-10-27

## 컨텍스트
PPT Pro의 핵심 기능은 LLM을 활용한 스토리라인/헤드메시지/콘텐츠 생성임:
- 다양한 LLM 제공자 (OpenAI, Anthropic, Azure OpenAI 등)
- 프롬프트 엔지니어링이 품질을 좌우
- 비용과 응답 속도 최적화 필요

## 결정사항

### LLM 제공자: 멀티 프로바이더 지원 (추상화 레이어)
**구조:**
```python
# infrastructure/llm/base.py
class LLMProvider(ABC):
    @abstractmethod
    async def generate(self, prompt: str, **kwargs) -> str:
        pass

# infrastructure/llm/openai_provider.py
class OpenAIProvider(LLMProvider):
    async def generate(self, prompt: str, **kwargs) -> str:
        # OpenAI API 호출

# infrastructure/llm/anthropic_provider.py
class AnthropicProvider(LLMProvider):
    async def generate(self, prompt: str, **kwargs) -> str:
        # Anthropic API 호출
```

**선택 이유:**
- 제공자 변경 시 비즈니스 로직 수정 불필요
- A/B 테스트로 최적의 모델 선택 가능
- 비용 최적화 (작업별로 다른 모델 사용)

### 프롬프트 관리: 템플릿 기반 프롬프트
**구조:**
```python
# domain/prompts/storyline_prompt.py
STORYLINE_PROMPT = """
당신은 컨설팅 장표 전문가입니다.
다음 정보를 바탕으로 프레젠테이션 목차와 각 슬라이드의 헤드메시지를 생성하세요.

주제: {topic}
타겟 청중: {target}
목표: {goal}

요구사항:
1. 논리적 흐름 (문제 → 분석 → 해결책)
2. 각 슬라이드는 하나의 핵심 메시지
3. 헤드메시지는 결론 중심 1문장

출력 형식: JSON
"""
```

**선택 이유:**
- 프롬프트 버전 관리 용이
- 프롬프트 개선이 코드 변경 없이 가능
- 다국어 지원 준비 (한국어/영어 프롬프트 분리)

### 응답 파싱: Structured Output 활용
**방법:**
- OpenAI Function Calling 또는 JSON mode 사용
- Pydantic 모델로 응답 검증

```python
from pydantic import BaseModel

class SlideOutline(BaseModel):
    order: int
    head_message: str
    purpose: str
    template_suggestion: str

class StorylineResponse(BaseModel):
    outline: list[SlideOutline]
    overall_narrative: str
```

**선택 이유:**
- 응답 형식이 보장되어 파싱 에러 감소
- 타입 안정성 확보
- 프론트엔드와 API 계약 명확

### 비용 최적화 전략
1. **캐싱**: 동일한 입력에 대한 LLM 응답 캐시 (Redis)
2. **토큰 제한**: 프롬프트 길이 제한, 응답 max_tokens 설정
3. **Fallback 모델**: 주 모델 실패 시 저렴한 모델로 대체
4. **사용자 피드백**: 재생성 요청 횟수 제한 (Tier별)

### 에러 처리
- **Timeout**: 30초 제한, 초과 시 사용자에게 재시도 안내
- **Rate Limit**: Exponential backoff with jitter
- **Content Policy 위반**: 사용자에게 입력 수정 요청

## 결과
- LLM 제공자 독립적인 서비스 설계
- 프롬프트 개선과 모델 선택이 유연함
- 응답 품질과 비용 균형 달성

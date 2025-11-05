"""
API 테스트 스크립트
"""
import asyncio
import json
from app.services.storyline import StorylineService
from app.infrastructure.llm_provider import get_llm_provider


async def test_storyline_generation():
    """스토리라인 생성 테스트"""
    print("=== 스토리라인 생성 테스트 ===")
    
    service = StorylineService()
    
    try:
        result = await service.generate_storyline(
            topic="디지털 전환 전략",
            target="중소기업 임원진",
            goal="디지털 전환의 필요성 인식 및 추진 동기 부여",
            narrative_style="consulting"
        )
        
        print("✅ 스토리라인 생성 성공!")
        print(f"전체 내러티브: {result.overall_narrative}")
        print("\n슬라이드 목록:")
        for slide in result.outline:
            print(f"  {slide.order}. {slide.head_message} ({slide.purpose}) -> {slide.template_suggestion}")
            
    except Exception as e:
        print(f"❌ 스토리라인 생성 실패: {e}")


async def test_llm_provider():
    """LLM Provider 테스트"""
    print("\n=== LLM Provider 테스트 ===")
    
    provider = get_llm_provider()
    
    try:
        # 일반 텍스트 생성 테스트
        response = await provider.generate("안녕하세요! 간단한 테스트입니다.")
        print(f"✅ 일반 생성 성공: {response.content[:50]}...")
        
        # 구조화된 응답 테스트
        schema = {
            "test_field": "string",
            "number": "int"
        }
        structured = await provider.generate_structured(
            "테스트용 JSON을 만들어 주세요", 
            schema
        )
        print(f"✅ 구조화 생성 성공: {json.dumps(structured, ensure_ascii=False)}")
        
    except Exception as e:
        print(f"❌ LLM Provider 테스트 실패: {e}")


async def main():
    """메인 테스트 함수"""
    await test_llm_provider()
    await test_storyline_generation()


if __name__ == "__main__":
    asyncio.run(main())
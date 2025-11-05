# ADR 005: PPT 생성 전략

## 상태
채택됨 (Accepted) - 2025-10-27

## 컨텍스트
PPT Pro는 python-pptx를 사용해 실제 .pptx 파일을 생성함:
- 다양한 템플릿 (asis_tobe, case_box, node_map 등)
- 동적 콘텐츠 삽입
- 디자인 일관성 유지

## 결정사항

### PPT 생성 라이브러리: python-pptx
**선택 이유:**
- Python 네이티브 라이브러리로 FastAPI와 통합 자연스러움
- 프로그래밍 방식으로 슬라이드 레이아웃 제어 가능
- 텍스트, 도형, 표, 차트 삽입 지원

**대안 검토:**
- Office.js: 브라우저 기반, 서버 생성 불가
- LibreOffice Python: 설치 복잡도 높음

### 템플릿 시스템: 코드 기반 템플릿
**구조:**
```python
# domain/templates/base_template.py
class SlideTemplate(ABC):
    @abstractmethod
    def render(self, slide: pptx.slide.Slide, content: dict):
        pass

# domain/templates/asis_tobe_template.py
class AsisTobeTemplate(SlideTemplate):
    def render(self, slide, content):
        # As-is / To-be 레이아웃 구성
        # 왼쪽: As-is 텍스트박스
        # 오른쪽: To-be 텍스트박스
        # 중간: 화살표 도형
        pass
```

**선택 이유:**
- 템플릿별 렌더링 로직을 명확히 분리
- 새로운 템플릿 추가가 쉬움 (확장성)
- 단위 테스트 가능

**대안 검토:**
- .pptx 마스터 슬라이드: python-pptx의 마스터 지원이 제한적
- HTML to PPT: 스타일 일관성 유지 어려움

### 디자인 시스템: 중앙집중식 스타일 관리
```python
# domain/styles/design_system.py
class DesignSystem:
    COLORS = {
        "primary": RGBColor(0, 102, 204),
        "secondary": RGBColor(102, 102, 102),
        "accent": RGBColor(255, 153, 0),
    }
    
    FONTS = {
        "heading": {"name": "Arial", "size": Pt(28), "bold": True},
        "body": {"name": "Arial", "size": Pt(14)},
    }
    
    LAYOUTS = {
        "margin_left": Inches(0.5),
        "margin_top": Inches(1.0),
    }
```

**선택 이유:**
- 모든 슬라이드에 일관된 디자인 적용
- 디자인 변경 시 한 곳만 수정
- 브랜드 아이덴티티 유지

### PPT 생성 워크플로우
1. **Project → Slides 데이터 조회**
2. **빈 Presentation 객체 생성**
3. **각 Slide를 순회하며:**
   - `template_type`에 맞는 Template 인스턴스 선택
   - `content` 데이터를 Template.render()에 전달
4. **BytesIO에 저장 후 반환**

### 성능 최적화
- **비동기 처리**: PPT 생성은 Celery 작업으로 백그라운드 실행 (확장 단계)
- **캐싱**: 동일한 프로젝트 재생성 시 캐시 활용
- **청크 다운로드**: 대용량 파일은 스트리밍 응답

### 한계 및 향후 개선
- python-pptx는 차트 생성이 복잡 → 초기에는 간단한 표/텍스트 중심
- 이미지 삽입은 URL 또는 base64로 처리
- 애니메이션/트랜지션은 미지원 (추후 Office Open XML 직접 편집 검토)

## 결과
- 코드로 템플릿을 관리해 유연성과 확장성 확보
- 디자인 일관성 유지
- 백그라운드 처리로 사용자 경험 개선

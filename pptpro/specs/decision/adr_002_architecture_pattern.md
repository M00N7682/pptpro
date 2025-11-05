# ADR 002: 아키텍처 패턴

## 상태
채택됨 (Accepted) - 2025-10-27

## 컨텍스트
PPT Pro는 장표 제작/보완 기능을 제공하며, 다음 특성을 고려해야 함:
- LLM 호출이 빈번하고 응답 시간이 길 수 있음 (비동기 처리 필요)
- 단계별 플로우 (입력 → 스토리라인 → 템플릿 → 세부내용 → PPT 생성)
- 복잡한 비즈니스 로직 (템플릿 매핑, 콘텐츠 생성 규칙)

## 결정사항

### 백엔드 아키텍처: Layered Architecture
**구조:**
```
presentation layer (FastAPI routers)
  ↓
service layer (business logic)
  ↓
repository layer (DB access)
  ↓
infrastructure layer (external APIs: LLM, OCR, storage)
```

**선택 이유:**
- 관심사 분리로 테스트와 유지보수 용이
- LLM API, OCR 등 외부 의존성을 infrastructure layer에 격리
- 비즈니스 로직이 복잡하므로 service layer에서 집중 관리

### 프론트엔드 아키텍처: Feature-Based Structure
**구조:**
```
src/
  features/
    storyline/      # 스토리라인 생성 관련
    template/       # 템플릿 선택 관련
    ppt-editor/     # PPT 편집 관련
  shared/
    components/     # 공통 UI 컴포넌트
    api/            # API 클라이언트
    hooks/          # 커스텀 훅
  pages/            # 라우트별 페이지
```

**선택 이유:**
- 기능 단위로 코드 조직화 → 확장성
- 공통 컴포넌트와 기능별 컴포넌트 명확히 분리
- 팀 협업 시 기능별로 작업 분담 용이

### API 설계: RESTful + 작업 기반 엔드포인트
**패턴:**
- 리소스 중심: `/api/presentations`, `/api/templates`
- 작업 중심: `/api/storyline/generate`, `/api/ppt/render`

**선택 이유:**
- CRUD는 REST로, 복잡한 비즈니스 로직은 작업 기반 엔드포인트로
- 프론트엔드에서 의도가 명확한 API 호출 가능
- LLM 호출 같은 시간 소요 작업은 명시적 작업 엔드포인트로 분리

### 비동기 처리 전략
**MVP 단계: 동기 + 스트리밍 응답**
- LLM 응답을 Server-Sent Events(SSE)로 스트리밍
- 사용자는 생성 과정을 실시간으로 확인

**확장 단계: 작업 큐 (Celery + Redis)**
- PPT 생성 같은 장시간 작업을 백그라운드에서 처리
- 폴링 또는 WebSocket으로 진행 상황 전달

## 결과
- 명확한 레이어 분리로 테스트 가능성 향상
- 비동기 작업 처리 전략이 단계별로 확장 가능
- 프론트-백 간 API 계약이 명확함

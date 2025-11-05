# ADR 001: 기술 스택 선정

## 상태
채택됨 (Accepted) - 2025-10-27

## 컨텍스트
PPT Pro 서비스는 AI 기반 프레젠테이션 생성 플랫폼으로, 다음 요구사항을 만족해야 함:
- LLM API 호출 및 복잡한 비즈니스 로직 처리
- PPT 파일 생성 (python-pptx 활용)
- 대화형 UI와 실시간 피드백
- 파일 업로드 및 OCR 처리

## 결정사항

### 백엔드: Python + FastAPI
**선택 이유:**
- python-pptx 라이브러리를 활용한 PPT 생성 로직이 필수
- LLM API (OpenAI, Anthropic 등) 연동에 Python 생태계가 강점
- FastAPI는 비동기 처리, 자동 문서화(OpenAPI), 타입 힌팅 지원
- OCR 라이브러리(pytesseract, easyocr) 통합 용이

**대안 검토:**
- Node.js + Express: PPT 생성 라이브러리 제한적, Python 스크립트 별도 실행 필요
- Django: 오버헤드가 크고 API 중심 서비스에는 FastAPI가 더 적합

### 프론트엔드: React + TypeScript
**선택 이유:**
- 컴포넌트 기반 구조로 슬라이드 편집 UI 구성에 적합
- 풍부한 생태계 (상태관리, 라우팅, UI 라이브러리)
- TypeScript로 API 계약 명확화 및 런타임 에러 감소
- 대화형 UI와 단계별 플로우 구현에 유리

**대안 검토:**
- Vue.js: React 대비 생태계 규모 작음
- Next.js: SSR 필요성 낮고, 초기에는 SPA로 충분

### 추가 기술 선택
- **데이터베이스**: PostgreSQL (구조화된 데이터, 트랜잭션 지원)
- **ORM**: SQLAlchemy (FastAPI 공식 권장)
- **인증**: JWT (stateless, 확장성)
- **파일 스토리지**: AWS S3 or 로컬 (MVP는 로컬, 추후 클라우드)
- **상태관리**: TanStack Query (React Query) - 서버 상태 관리에 최적화

## 결과
- 백엔드와 프론트엔드 개발 병렬 진행 가능
- Python 기반 PPT 생성 로직과 LLM 통합이 자연스러움
- API 문서 자동 생성으로 프론트-백 협업 효율 향상

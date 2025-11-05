# ADR 007: 개발 단계 및 순서

## 상태
채택됨 (Accepted) - 2025-10-27

## 컨텍스트
PPT Pro 개발을 효율적으로 진행하기 위해 단계를 나누고, 각 단계의 목표와 산출물을 정의함.
- 핵심 가치를 빠르게 검증 (MVP 우선)
- 프론트-백 병렬 개발 가능하도록 API 먼저 설계
- 점진적 확장 (Incremental Development)

## 결정사항

---

## 📍 Phase 0: 기반 설정 (Foundation)
**목표**: 개발 환경 구축 및 기술 의사결정 완료

**백엔드 작업:**
1. FastAPI 프로젝트 초기화
   - 디렉토리 구조: `presentation/`, `service/`, `repository/`, `infrastructure/`
   - 의존성: `fastapi`, `sqlalchemy`, `alembic`, `pydantic`, `python-jose`, `passlib`, `python-multipart`
   - 설정: `pyproject.toml` (Poetry) 또는 `requirements.txt`
   - 환경변수 관리: `.env` + `pydantic-settings`

2. 데이터베이스 설정
   - PostgreSQL 로컬 설치 또는 Docker Compose
   - SQLAlchemy 모델 정의 (User, Project, Slide, Template)
   - Alembic 마이그레이션 초기화

3. 기본 미들웨어 및 설정
   - CORS 설정 (프론트엔드 도메인 허용)
   - 에러 핸들러 (JSON 응답 표준화)
   - 로깅 설정 (structlog 또는 기본 logging)

**프론트엔드 작업:**
1. React + TypeScript 프로젝트 초기화
   - Vite 사용 (빠른 개발 서버)
   - 디렉토리 구조: `src/features/`, `src/shared/`, `src/pages/`
   - 의존성: `react-router-dom`, `@tanstack/react-query`, `axios`, `zustand` (전역 상태)

2. 공통 설정
   - ESLint + Prettier
   - 환경변수 관리: `.env.local`
   - API 클라이언트 baseURL 설정

**산출물:**
- 백엔드: `http://localhost:8000` 에서 실행되는 FastAPI 앱 (health check 엔드포인트)
- 프론트엔드: `http://localhost:5173` 에서 실행되는 React 앱 (빈 홈페이지)
- `README.md`: 로컬 실행 가이드

**예상 기간**: 1-2일

---

## 📍 Phase 1: 인증 시스템 (Authentication)
**목표**: 회원가입/로그인 구현, JWT 인증 인프라 구축

**백엔드 작업:**
1. 인증 API 구현
   - `POST /api/auth/register`
   - `POST /api/auth/login`
   - `POST /api/auth/refresh`
2. JWT 발급 및 검증 로직
3. 의존성: `get_current_user` (FastAPI Depends)
4. 비밀번호 해싱 (bcrypt)

**프론트엔드 작업:**
1. 로그인/회원가입 페이지 UI
2. JWT 저장 (localStorage 또는 메모리)
3. API 클라이언트에 Authorization 헤더 자동 추가
4. 보호된 라우트 (Private Route) 구현

**산출물:**
- 회원가입 → 로그인 → 대시보드 이동 플로우 작동
- Postman/Swagger로 인증 API 테스트 가능

**예상 기간**: 2-3일

---

## 📍 Phase 2: 프로젝트 CRUD (Project Management)
**목표**: 프레젠테이션 프로젝트 생성/조회/수정/삭제

**백엔드 작업:**
1. 프로젝트 API 구현
   - `POST /api/projects` (생성)
   - `GET /api/projects` (목록 조회)
   - `GET /api/projects/{id}` (상세 조회)
   - `PATCH /api/projects/{id}` (수정)
   - `DELETE /api/projects/{id}` (삭제)
2. 사용자 권한 체크 (자신의 프로젝트만 접근)

**프론트엔드 작업:**
1. 대시보드 페이지 (프로젝트 목록)
2. 프로젝트 생성 모달/폼
3. 프로젝트 카드 UI (제목, 생성일, 상태)

**산출물:**
- 사용자가 로그인 후 프로젝트를 생성하고 목록에서 확인 가능
- 프로젝트 클릭 시 상세 페이지 이동 (빈 페이지)

**예상 기간**: 2-3일

---

## 📍 Phase 3: LLM 통합 - 스토리라인 생성 (Core AI Feature)
**목표**: AI를 활용한 스토리라인 및 헤드메시지 생성

**백엔드 작업:**
1. LLM Provider 추상화 레이어 구현
   - `infrastructure/llm/openai_provider.py`
2. 스토리라인 생성 API
   - `POST /api/storyline/generate`
   - 입력: topic, target, goal
   - 출력: outline (슬라이드 목차 + 헤드메시지)
3. 프롬프트 템플릿 작성 및 테스트
4. 응답 파싱 및 검증 (Pydantic)

**프론트엔드 작업:**
1. 프로젝트 상세 페이지: 입력 폼
   - 주제, 타겟 청중, 목표 입력
   - "스토리라인 생성" 버튼
2. 로딩 UI (스트리밍 응답 시 실시간 표시 선택적)
3. 생성된 outline 표시 (슬라이드 목록)

**산출물:**
- 사용자가 주제/타겟/목표를 입력하면 LLM이 슬라이드 목차를 생성
- 생성된 목차를 프론트엔드에서 확인 가능

**예상 기간**: 3-4일

---

## 📍 Phase 4: 슬라이드 관리 및 템플릿 매핑 (Slide Management)
**목표**: 생성된 슬라이드를 DB에 저장하고, 템플릿 추천

**백엔드 작업:**
1. 슬라이드 CRUD API
   - `POST /api/projects/{id}/slides` (슬라이드 추가)
   - `GET /api/projects/{id}/slides` (목록 조회)
   - `PATCH /api/slides/{id}` (수정)
   - `DELETE /api/slides/{id}` (삭제)
2. 템플릿 추천 API
   - `POST /api/template/suggest`
   - 입력: head_message, purpose
   - 출력: template_type (asis_tobe, case_box 등)

**프론트엔드 작업:**
1. 슬라이드 목록 UI (드래그 앤 드롭으로 순서 변경 선택적)
2. 슬라이드 편집 모달
   - 헤드메시지 수정
   - 템플릿 선택 드롭다운
3. 템플릿 미리보기 (간단한 아이콘 또는 레이아웃 설명)

**산출물:**
- 사용자가 생성된 슬라이드 목록을 보고 편집 가능
- 각 슬라이드에 템플릿 지정 가능

**예상 기간**: 3-4일

---

## 📍 Phase 5: 슬라이드 콘텐츠 생성 (Content Generation)
**목표**: 각 슬라이드의 세부 내용을 LLM으로 생성

**백엔드 작업:**
1. 콘텐츠 생성 API
   - `POST /api/slides/{id}/generate-content`
   - 입력: head_message, template_type, context (전체 프로젝트 정보)
   - 출력: content (JSONB, 템플릿별 구조)
2. 프롬프트: 템플릿별로 다른 프롬프트 사용
   - `asis_tobe`: As-is/To-be 내용 생성
   - `case_box`: 사례 제목 및 설명 생성
3. USER_NEEDED vs AI_GENERATED 구분 로직

**프론트엔드 작업:**
1. 슬라이드 편집 페이지
   - "콘텐츠 생성" 버튼
   - 생성된 내용 표시 (텍스트 에디터 또는 폼)
2. USER_NEEDED 부분 하이라이트 (사용자가 직접 입력)
3. 콘텐츠 수정 및 저장

**산출물:**
- 사용자가 슬라이드별로 세부 내용을 AI로 생성하고 수정 가능
- 템플릿에 맞는 구조화된 콘텐츠 확인

**예상 기간**: 4-5일

---

## 📍 Phase 6: PPT 파일 생성 (PPT Generation)
**목표**: 완성된 프로젝트를 .pptx 파일로 내보내기

**백엔드 작업:**
1. PPT 생성 API
   - `POST /api/projects/{id}/export`
   - 응답: .pptx 파일 스트림
2. python-pptx 템플릿 렌더러 구현
   - `domain/templates/` 에 템플릿별 클래스
   - 디자인 시스템 적용 (색상, 폰트, 레이아웃)
3. 파일 생성 로직
   - Project와 Slides 조회
   - 각 슬라이드를 템플릿으로 렌더링
   - BytesIO에 저장 후 반환

**프론트엔드 작업:**
1. "PPT 다운로드" 버튼
2. API 호출 후 파일 다운로드 처리
3. 로딩 UI (생성 시간 소요 시)

**산출물:**
- 사용자가 완성된 프로젝트를 .pptx 파일로 다운로드 가능
- 다운로드한 파일을 PowerPoint에서 열어 확인

**예상 기간**: 4-5일

---

## 📍 Phase 7: 기존 장표 보완 기능 (추가 기능)
**목표**: 기존 PPT를 업로드하고 개선 제안 받기

**백엔드 작업:**
1. 파일 업로드 API
   - `POST /api/projects/{id}/upload-ppt`
   - 파일 파싱 (python-pptx로 텍스트 추출)
2. OCR 통합 (이미지 기반 슬라이드)
   - pytesseract 또는 Azure Computer Vision
3. 구조 분석 및 개선 제안 API
   - `POST /api/projects/{id}/analyze`
   - LLM이 구조와 메시지 평가

**프론트엔드 작업:**
1. 파일 업로드 UI (드래그 앤 드롭)
2. 분석 결과 표시 (개선 제안 목록)
3. 제안 수락/거부 인터페이스

**산출물:**
- 사용자가 기존 PPT를 업로드하고 AI 피드백 받기
- 제안을 반영해 수정된 PPT 다운로드

**예상 기간**: 5-6일 (OCR 복잡도에 따라 조정)

---

## 📍 Phase 8: UI/UX 개선 및 테스트 (Polish & Testing)
**목표**: 사용성 개선, 버그 수정, 테스트 작성

**백엔드 작업:**
1. 단위 테스트 작성 (pytest)
   - 서비스 로직, 리포지토리 레이어
2. 통합 테스트 (API 엔드포인트)
3. 에러 처리 개선 (명확한 에러 메시지)

**프론트엔드 작업:**
1. 공통 컴포넌트 라이브러리 정리
2. 로딩/에러 상태 UI 개선
3. 반응형 디자인 (모바일 고려)
4. E2E 테스트 (Playwright 또는 Cypress)

**산출물:**
- 테스트 커버리지 60% 이상
- 주요 플로우 E2E 테스트 통과
- 사용자 피드백 기반 UI 개선

**예상 기간**: 3-4일

---

## 📍 Phase 9: 배포 및 모니터링 (Deployment)
**목표**: 프로덕션 환경 배포 및 모니터링 설정

**작업:**
1. 백엔드 배포 (Railway)
   - Railway 프로젝트 생성 및 GitHub 연결
   - PostgreSQL 데이터베이스 서비스 추가
   - 환경변수 설정 (Railway 대시보드)
   - 자동 배포 설정 (main 브랜치 push 시)

2. 프론트엔드 배포 (Vercel)
   - Vercel 프로젝트 생성 및 GitHub 연결
   - 빌드 설정 (React + Vite)
   - 환경변수 설정 (API URL)
   - 자동 배포 설정 (main 브랜치 push 시)

3. CI/CD 파이프라인 (GitHub Actions)
   - 백엔드: 테스트 → Railway 자동 배포 트리거
   - 프론트엔드: 빌드 테스트 → Vercel 자동 배포

4. 환경변수 관리
   - Railway: DATABASE_URL, JWT_SECRET, LLM_API_KEY 등
   - Vercel: VITE_API_URL, VITE_APP_ENV 등

5. 모니터링: Sentry (에러 추적), Railway 내장 메트릭

**산출물:**
- Railway에 백엔드 자동 배포
- Vercel에 프론트엔드 자동 배포
- 에러 발생 시 알림
- 기본 대시보드 (Railway 메트릭, Vercel Analytics)

**예상 기간**: 1-2일 (PaaS 서비스로 간소화)

---

## 우선순위 및 의존성
**필수 경로 (MVP):**
Phase 0 → Phase 1 → Phase 2 → Phase 3 → Phase 4 → Phase 5 → Phase 6

**추가 기능:**
Phase 7 (기존 장표 보완)은 MVP 이후 추가

**병렬 가능:**
- Phase 1~2: 백엔드 API 개발 후 프론트엔드 UI 병렬 작업
- Phase 8: 백엔드 테스트와 프론트엔드 E2E 병렬

---

## 총 예상 기간
- **MVP (Phase 0~6)**: 약 3-4주
- **확장 기능 포함 (Phase 7)**: 추가 1-2주
- **배포 및 안정화 (Phase 8~9)**: 추가 1주

**총합**: 5-7주 (1인 풀타임 기준)

---

## 마일스톤
1. **Week 1-2**: 기반 설정 + 인증 + 프로젝트 CRUD → **사용자가 로그인하고 프로젝트 생성 가능**
2. **Week 3**: LLM 통합 → **AI가 스토리라인 생성**
3. **Week 4**: 슬라이드 관리 + 콘텐츠 생성 → **슬라이드 편집 가능**
4. **Week 5**: PPT 생성 → **실제 .pptx 파일 다운로드 가능 (MVP 완성)**
5. **Week 6-7**: 기존 장표 보완 + UI/UX 개선 + 배포

---

## 결과
- 단계별 목표와 산출물이 명확함
- 프론트-백 병렬 개발 가능
- MVP를 빠르게 검증 후 확장
- 각 단계는 독립적으로 테스트 가능

## 다음 액션
1. Phase 0 시작: 백엔드/프론트엔드 프로젝트 초기화
2. `backend/` 와 `frontend/` 디렉토리 구조 확정
3. 로컬 개발 환경 가이드 작성 (`README.md`)

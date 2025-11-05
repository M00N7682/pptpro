# ADR 003: 데이터 모델 설계

## 상태
채택됨 (Accepted) - 2025-10-27

## 컨텍스트
PPT Pro의 핵심 데이터:
- 사용자 (인증, 권한)
- 프레젠테이션 프로젝트 (메타데이터, 생성 이력)
- 슬라이드 (개별 장표 정보)
- 템플릿 (재사용 가능한 레이아웃)
- 생성 로그 (LLM 호출 기록, 디버깅용)

## 결정사항

### 주요 엔티티

#### 1. User
```
id: UUID (PK)
email: String (unique)
hashed_password: String
name: String
created_at: DateTime
updated_at: DateTime
```

#### 2. Project (프레젠테이션 프로젝트)
```
id: UUID (PK)
user_id: UUID (FK → User)
title: String
topic: String
target_audience: String
goal: String
narrative_style: String (default: "consulting")
status: Enum (draft, in_progress, completed)
created_at: DateTime
updated_at: DateTime
```

#### 3. Slide
```
id: UUID (PK)
project_id: UUID (FK → Project)
order_index: Integer
head_message: String
template_type: Enum (message_only, asis_tobe, case_box, ...)
content: JSONB (유연한 구조, 템플릿별로 다름)
notes: Text (발표자 노트)
created_at: DateTime
updated_at: DateTime
```

#### 4. Template
```
id: UUID (PK)
name: String
type: Enum (message_only, asis_tobe, ...)
description: Text
structure_schema: JSONB (content 필드 구조 정의)
example_content: JSONB
created_at: DateTime
```

#### 5. GenerationLog (선택적, 디버깅/분석용)
```
id: UUID (PK)
project_id: UUID (FK → Project, nullable)
slide_id: UUID (FK → Slide, nullable)
llm_provider: String (openai, anthropic, ...)
prompt: Text
response: Text
tokens_used: Integer
latency_ms: Integer
created_at: DateTime
```

### 관계
- User 1:N Project
- Project 1:N Slide
- Template은 독립적 (Slide의 template_type이 참조)

### 설계 원칙
1. **JSONB 활용**: Slide.content는 템플릿마다 구조가 다르므로 유연한 JSONB 사용
2. **Enum 타입**: template_type, status 등은 PostgreSQL Enum으로 제약
3. **Soft Delete 고려**: 추후 필요시 deleted_at 컬럼 추가
4. **Audit Trail**: created_at, updated_at으로 기본 추적

### 인덱스 전략
- `User.email` (unique index)
- `Project.user_id` (FK index)
- `Slide.project_id, order_index` (composite index, 정렬 쿼리용)
- `GenerationLog.created_at` (시계열 분석용)

## 결과
- 유연한 데이터 구조로 다양한 템플릿 지원 가능
- 정규화된 설계로 데이터 무결성 확보
- LLM 사용 로그를 별도 테이블로 관리해 분석 용이

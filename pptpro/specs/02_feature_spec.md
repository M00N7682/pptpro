# 기능 1. 장표 제작 기능
## 목적
사용자가 주제/타겟/목표/스토리 기반으로 PPT를 자동 생성할 수 있도록 한다.

## 플로우 요약
입력 → 스토리라인 생성 → 헤드메시지 생성 → 템플릿 추천 → 세부내용 채우기 → PPT 다운로드

## 상세 동작
1. 사용자 입력 단계
   input: 주제, 타겟, 목표, 스토리
   output: 사용자의 의도 파악된 구조적 설명
   추가적으로 대화를 주고받으며 사용자가 최종적으로 선정한 구조를 입력

2. 스토리라인 & 헤드메시지 생성
   LLM이 사용자의 목적에 맞춰 장표구성과 헤드메시지 생성

3. 장표 템플릿 매핑
   slide_type ∈ {message_only, asis_tobe, case_box, node_map, step_flow, chart_insight}

4. 세부 내용 채우기
   구분:
   - USER_NEEDED: 자료조사/데이터/외부출처 필요한 부분
   - AI_GENERATED: 요약/인사이트/논리 연결문

5. PPT 생성 및 다운로드
   engine: python-pptx

---

# 기능 1. 장표 제작 기능

## 목적
사용자가 주제/타겟/목표 기반으로 논리적 스토리와 슬라이드를 자동 생성받고, 웹에서 확인·수정 후 PPT로 다운로드할 수 있도록 한다.

## 상세 동작

1. 사용자 입력 단계  
   input: 주제, 타겟, 목표, 스토리  
   output: 사용자의 의도 파악된 구조적 설명  
   - 웹에서 대화를 주고받으며 사용자가 최종 스토리 구조를 확정함.

2. 스토리라인 & 헤드메시지 생성  
   - LLM이 목적/타겟/스토리에 맞춰 전체 목차와 Head Message 리스트 생성  
   - 웹 화면에 리스트 형태로 표시  
   - 사용자가 OK/수정 선택

3. 장표 템플릿 매핑  
   - slide_type ∈ {message_only, asis_tobe, case_box, node_map, step_flow, chart_insight}  
   - LLM이 각 장표의 목적에 맞는 템플릿을 추천  
   - 사용자가 승인

4. USER_NEEDED / AI_GENERATED 자동 분리  
   - LLM이 각 슬라이드의 요소를 분석하여 분류  
     - USER_NEEDED: 자료조사·데이터·외부출처가 필요한 내용  
     - AI_GENERATED: LLM이 작성 가능한 요약·논리·인사이트  
   - 웹화면에서 슬라이드별 태그로 표시

5. 슬라이드 요소 자동 생성  
   - AI_GENERATED 영역에 대해 LLM이 텍스트 자동 생성  
   - ppt 요소 종류: Title, Sub-Message, Bullet Points, Evidence Block, Diagram Component, Insight Box, Action Guide, Caption  
   - 사용자 실시간 미리보기 UI에서 확인 가능

6. PPT 생성 및 다운로드  
   - python-pptx 기반 PPT 렌더링  
   - 선택된 템플릿 + 생성된 요소 삽입  
   - 완성된 pptx 파일 다운로드

---

# 기능 2. 장표 보완 기능

## 목적
기존 PPT 또는 장표 이미지를 기반으로 슬라이드를 재구성하고 보완 가능하게 한다.

## 상세 동작

1. 입력 단계  
   - 주제, 타겟, 목표 입력  
   - 기존 장표 이미지 업로드 또는 텍스트 복붙  
   - OCR 또는 텍스트 파싱

2. 장표 분석 단계  
   - LLM이 슬라이드 구조(제목/본문/구조 요소)를 분석  
   - 부족한 요소, 논리적 빈틈을 자동 감지

3. 구성요소 선택 단계  
   - 사용자가 보완할 컴포넌트 선택 (문구, 인사이트, 메시지 구조, 템플릿 변경 등)

4. 내용 생성 단계  
   - 선택된 요소에 대해 LLM이 AI_GENERATED 요소를 작성  
   - USER_NEEDED 요소는 사용자 입력 요청

5. PPT 업데이트 및 다운로드  
   - 수정된 요소 기반으로 PPT 렌더링  
   - pptx 파일로 재다운로드

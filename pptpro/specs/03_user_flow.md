# 유저 플로우 (User Flow)

---

# 1. 장표 제작 기능

## Page 1: 기본 입력 화면
- Input: Topic
- Input: Target Audience
- Input: Goal
- Textarea: Story background
- Button: "Generate Storyline"

→ action: /storyline

---

## Page 2: 스토리라인 미리보기
- Storyline 리스트 출력
- 각 항목: 장표 제목 + 헤드메시지 요약
- 버튼: [승인], [수정]

→ 승인 시 /templates 페이지로 이동

---

## Page 3: AI 템플릿 구성 및 선택 화면
- Template Gallery  
  - Card: Message Only  
  - Card: As-Is / To-Be  
  - Card: Case Box  
  - Card: Node Map  
  - Card: Step Flow  
  - Card: Chart Insight

- 각 템플릿 선택 시 Preview 표시 후 보여줌 
- [승인] 버튼 → /slide-edit

---

## Page 4: 슬라이드 편집 화면
- 좌측: Slide Preview  
- 우측: Content Panel  
- USER_NEEDED와 AI_GENERATED 각각 표시  
- 버튼: “AI 자동 채움”, “사용자 직접 입력”

- 저장 버튼 → 슬라이드 구조 JSON 저장

---

## Page 5: PPT 렌더링 화면
- 슬라이드별 요소 확인  
- 템플릿 적용된 렌더링 결과 미리보기  
- 버튼: “Download PPTX”

---

# 2. 장표 보완 기능

## Page: 기존 PPT/이미지 업로드
- Upload box: PPTX or Image
- OCR 처리
- 분석 결과 구조화된 슬라이드 표시

## Page: 보완 요소 선택
- 부족한 요소 목록 자동 제시
- 사용자가 선택

## Page: 보완 내용 생성
- LLM이 AI_GENERATED 영역 생성
- 사용자 입력 유도(USER_NEEDED)

## Page: PPT 재생성
- 수정된 요소 기반 pptx 다운로드

# API Endpoints

## 1) 스토리라인 생성
POST /api/storyline/generate
body:
{
  "topic": "...",
  "target": "...",
  "goal": "...",
  "narrative_style": "consulting"
}
response:
{
  "outline": [...],
  "head_messages": [...]
}

## 2) 템플릿 추천
POST /api/template/suggest
body:
{
  "head_message": "...",
  "slide_purpose": "problem_statement"
}
response:
{
  "template_type": "asis_tobe",
  "example_structure": [...]
}

## 3) PPT 생성
POST /api/ppt/render
body:
{
  "slides": [
     { "template": "case_box", "content": {...} }
  ]
}
response:
file_stream (pptx)

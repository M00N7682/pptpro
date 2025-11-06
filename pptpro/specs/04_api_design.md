# API Design (Backend Specification)

---

# 1) 스토리라인 생성 API
POST /api/storyline/generate
body:
{
  "topic": "string",
  "target": "string",
  "goal": "string",
  "story": "string"
}
response:
{
  "outline": [...],
  "head_messages": [...]
}

---

# 2) 템플릿 추천 API
POST /api/template/suggest
body:
{
  "slide_purpose": "string",
  "head_message": "string"
}
response:
{
  "template_type": "message_only | asis_tobe | case_box | node_map | step_flow | chart_insight",
  "components": [...]
}

---

# 3) 슬라이드 분류 API (USER_NEEDED / AI_GENERATED)
POST /api/slide/classify
body:
{
  "slide_text": "string",
  "slide_type": "string"
}
response:
{
  "user_needed": [...],
  "ai_generated": [...]
}

---

# 4) 슬라이드 콘텐츠 생성 API
POST /api/slide/generate
body:
{
  "slide_type": "string",
  "ai_generated": [...],
  "context": {...}
}
response:
{
  "components": {
     "title": "string",
     "sub_message": "string",
     "bullet_points": [...],
     "diagram": "...",
     "insight_box": "...",
     "action_guide": "...",
     "caption": "..."
  }
}

---

# 5) PPT 생성 API
POST /api/ppt/render
body:
{
  "slides": [
    {
      "template": "string",
      "components": {...}
    }
  ]
}
response:
file_stream (.pptx)


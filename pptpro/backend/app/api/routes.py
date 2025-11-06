"""
API routes configuration
"""
from fastapi import APIRouter

from app.api.auth import auth_router
from app.api.projects import router as projects_router
from app.api.storyline import router as storyline_router
from app.api.slides import router as slides_router
from app.api.content import router as content_router
from app.api.ppt import router as ppt_router
from app.api.template import router as template_router
from app.api.slide_content import router as slide_content_router

# 메인 API 라우터
api_router = APIRouter()

# 인증 라우터 포함
api_router.include_router(auth_router)
api_router.include_router(projects_router)
api_router.include_router(storyline_router)
api_router.include_router(slides_router)
api_router.include_router(content_router)
api_router.include_router(ppt_router)
api_router.include_router(template_router)
api_router.include_router(slide_content_router)


@api_router.get("/")
async def api_root():
    """API root endpoint"""
    return {"message": "PPT Pro API", "version": "0.1.0"}


@api_router.get("/status")
async def api_status():
    """API status endpoint"""
    return {"status": "active", "features": ["auth", "projects", "storyline", "slides", "content", "ppt", "llm"]}
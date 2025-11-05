"""
Database models for PPT Pro
"""
import uuid
from datetime import datetime
from typing import Dict, Any
from enum import Enum as PyEnum

from sqlalchemy import (
    Column, String, DateTime, Text, Integer, 
    ForeignKey, Boolean, JSON, Enum
)
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func

from app.db.base import Base


class ProjectStatus(PyEnum):
    """프로젝트 상태"""
    DRAFT = "draft"
    IN_PROGRESS = "in_progress" 
    COMPLETED = "completed"


class SlideTemplateType(PyEnum):
    """슬라이드 템플릿 타입"""
    MESSAGE_ONLY = "message_only"
    ASIS_TOBE = "asis_tobe"
    CASE_BOX = "case_box"
    NODE_MAP = "node_map"
    STEP_FLOW = "step_flow"
    CHART_INSIGHT = "chart_insight"


class User(Base):
    """사용자 모델"""
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    hashed_password = Column(String(255), nullable=False)
    name = Column(String(100), nullable=False)
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계
    projects = relationship("Project", back_populates="user", cascade="all, delete-orphan")


class Project(Base):
    """프로젝트 모델"""
    __tablename__ = "projects"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    title = Column(String(255), nullable=False)
    topic = Column(Text)
    target_audience = Column(Text)
    goal = Column(Text)
    narrative_style = Column(String(50), default="consulting")
    status = Column(Enum(ProjectStatus), default=ProjectStatus.DRAFT)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계
    user = relationship("User", back_populates="projects")
    slides = relationship("Slide", back_populates="project", cascade="all, delete-orphan")


class Slide(Base):
    """슬라이드 모델"""
    __tablename__ = "slides"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=False)
    
    order_index = Column(Integer, nullable=False)
    head_message = Column(Text)
    template_type = Column(Enum(SlideTemplateType))
    content = Column(JSON)  # 유연한 구조, 템플릿별로 다름
    notes = Column(Text)  # 발표자 노트
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    
    # 관계
    project = relationship("Project", back_populates="slides")


class Template(Base):
    """템플릿 모델"""
    __tablename__ = "templates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    template_type = Column(Enum(SlideTemplateType), nullable=False)
    description = Column(Text)
    structure_schema = Column(JSON)  # content 필드 구조 정의
    example_content = Column(JSON)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class GenerationLog(Base):
    """LLM 생성 로그 (선택적, 디버깅/분석용)"""
    __tablename__ = "generation_logs"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    project_id = Column(UUID(as_uuid=True), ForeignKey("projects.id"), nullable=True)
    slide_id = Column(UUID(as_uuid=True), ForeignKey("slides.id"), nullable=True)
    
    llm_provider = Column(String(50))  # openai, anthropic, etc.
    prompt = Column(Text)
    response = Column(Text)
    tokens_used = Column(Integer)
    latency_ms = Column(Integer)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
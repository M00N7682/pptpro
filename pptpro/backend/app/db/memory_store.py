"""
In-memory user storage (temporary solution until SQLAlchemy issue is resolved)
"""
import uuid
from typing import Dict, Optional, List
from datetime import datetime

from app.core.auth import get_password_hash, verify_password


class User:
    def __init__(self, email: str, password: str, name: str):
        self.id = str(uuid.uuid4())
        self.email = email
        self.hashed_password = get_password_hash(password)
        self.name = name
        self.is_active = True
        self.created_at = datetime.utcnow()


class Project:
    def __init__(self, user_id: str, title: str, topic: Optional[str] = None, target_audience: Optional[str] = None, goal: Optional[str] = None):
        self.id = str(uuid.uuid4())
        self.user_id = user_id
        self.title = title
        self.topic = topic or ""
        self.target_audience = target_audience or ""
        self.goal = goal or ""
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()


class Slide:
    def __init__(self, project_id: str, order: int, head_message: str, template_type: str = "message_only", purpose: str = "general"):
        self.id = str(uuid.uuid4())
        self.project_id = project_id
        self.order = order
        self.head_message = head_message
        self.template_type = template_type  # message_only, asis_tobe, case_box, node_map, step_flow, chart_insight
        self.purpose = purpose  # problem_statement, current_state, analysis, solution, implementation, conclusion
        self.content = {}  # 슬라이드별 세부 내용 (템플릿에 따라 구조 다름)
        self.status = "draft"  # draft, ai_generated, user_completed
        self.created_at = datetime.utcnow()
        self.updated_at = datetime.utcnow()


class InMemoryUserStore:
    def __init__(self):
        self.users: Dict[str, User] = {}
        self.email_to_id: Dict[str, str] = {}
    
    def create_user(self, email: str, password: str, name: str) -> User:
        """사용자 생성"""
        if email in self.email_to_id:
            raise ValueError("Email already registered")
        
        user = User(email=email, password=password, name=name)
        self.users[user.id] = user
        self.email_to_id[email] = user.id
        return user
    
    def get_user_by_email(self, email: str) -> Optional[User]:
        """이메일로 사용자 조회"""
        user_id = self.email_to_id.get(email)
        if user_id:
            return self.users.get(user_id)
        return None
    
    def get_user_by_id(self, user_id: str) -> Optional[User]:
        """ID로 사용자 조회"""
        return self.users.get(user_id)
    
    def authenticate_user(self, email: str, password: str) -> Optional[User]:
        """사용자 인증"""
        user = self.get_user_by_email(email)
        if not user:
            return None
        if not verify_password(password, user.hashed_password):
            return None
        return user


class InMemorySlideStore:
    def __init__(self):
        self.slides: Dict[str, Slide] = {}
        self.project_to_slides: Dict[str, List[str]] = {}

    def create_slide(self, project_id: str, order: int, head_message: str, template_type: str = "message_only", purpose: str = "general") -> Slide:
        slide = Slide(project_id=project_id, order=order, head_message=head_message, template_type=template_type, purpose=purpose)
        self.slides[slide.id] = slide
        self.project_to_slides.setdefault(project_id, []).append(slide.id)
        # 순서대로 정렬
        self.project_to_slides[project_id].sort(key=lambda sid: self.slides[sid].order)
        return slide

    def get_slides_for_project(self, project_id: str) -> List[Slide]:
        ids = self.project_to_slides.get(project_id, [])
        return [self.slides[i] for i in ids if i in self.slides]

    def get_slide(self, slide_id: str) -> Optional[Slide]:
        return self.slides.get(slide_id)

    def update_slide(self, slide_id: str, **kwargs) -> Optional[Slide]:
        slide = self.slides.get(slide_id)
        if not slide:
            return None
        for k, v in kwargs.items():
            if hasattr(slide, k) and v is not None:
                setattr(slide, k, v)
        slide.updated_at = datetime.utcnow()
        return slide

    def delete_slide(self, slide_id: str) -> bool:
        slide = self.slides.get(slide_id)
        if not slide:
            return False
        project_slides = self.project_to_slides.get(slide.project_id, [])
        if slide_id in project_slides:
            project_slides.remove(slide_id)
        del self.slides[slide_id]
        return True

    def create_slides_from_storyline(self, project_id: str, storyline_outline: List[dict]) -> List[Slide]:
        """스토리라인으로부터 슬라이드들을 일괄 생성"""
        slides = []
        for item in storyline_outline:
            slide = self.create_slide(
                project_id=project_id,
                order=item.get("order", 1),
                head_message=item.get("head_message", ""),
                template_type=item.get("template_suggestion", "message_only"),
                purpose=item.get("purpose", "general")
            )
            slides.append(slide)
        return slides


class InMemoryProjectStore:
    def __init__(self):
        self.projects: Dict[str, Project] = {}
        self.user_to_projects: Dict[str, List[str]] = {}

    def create_project(self, user_id: str, title: str, topic: Optional[str] = None, target_audience: Optional[str] = None, goal: Optional[str] = None) -> Project:
        project = Project(user_id=user_id, title=title, topic=topic, target_audience=target_audience, goal=goal)
        self.projects[project.id] = project
        self.user_to_projects.setdefault(user_id, []).append(project.id)
        return project

    def get_projects_for_user(self, user_id: str) -> List[Project]:
        ids = self.user_to_projects.get(user_id, [])
        return [self.projects[i] for i in ids if i in self.projects]

    def get_project(self, project_id: str) -> Optional[Project]:
        return self.projects.get(project_id)

    def update_project(self, project_id: str, **kwargs) -> Optional[Project]:
        project = self.projects.get(project_id)
        if not project:
            return None
        for k, v in kwargs.items():
            if hasattr(project, k) and v is not None:
                setattr(project, k, v)
        project.updated_at = datetime.utcnow()
        return project

    def delete_project(self, project_id: str) -> bool:
        project = self.projects.get(project_id)
        if not project:
            return False
        user_projects = self.user_to_projects.get(project.user_id, [])
        if project_id in user_projects:
            user_projects.remove(project_id)
        del self.projects[project_id]
        return True


# 전역 인스턴스
user_store = InMemoryUserStore()
project_store = InMemoryProjectStore()
slide_store = InMemorySlideStore()
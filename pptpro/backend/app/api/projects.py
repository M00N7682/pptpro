"""
Project CRUD API (in-memory store for now)
"""
from fastapi import APIRouter, Depends, HTTPException, status
from typing import List

from app.api.auth import get_current_user
from app.db.memory_store import project_store

from pydantic import BaseModel

router = APIRouter(prefix="/projects", tags=["Projects"])


class ProjectCreate(BaseModel):
    title: str
    topic: str | None = None
    target_audience: str | None = None
    goal: str | None = None


class ProjectUpdate(BaseModel):
    title: str | None = None
    topic: str | None = None
    target_audience: str | None = None
    goal: str | None = None


class ProjectOut(BaseModel):
    id: str
    user_id: str
    title: str
    topic: str | None = None
    target_audience: str | None = None
    goal: str | None = None


@router.post("/", response_model=ProjectOut, status_code=status.HTTP_201_CREATED)
async def create_project(payload: ProjectCreate, current_user=Depends(get_current_user)):
    user = current_user
    project = project_store.create_project(
        user_id=user.id,
        title=payload.title,
        topic=payload.topic,
        target_audience=payload.target_audience,
        goal=payload.goal,
    )
    return ProjectOut(
        id=project.id,
        user_id=project.user_id,
        title=project.title,
        topic=project.topic,
        target_audience=project.target_audience,
        goal=project.goal,
    )


@router.get("/", response_model=List[ProjectOut])
async def list_projects(current_user=Depends(get_current_user)):
    user = current_user
    projects = project_store.get_projects_for_user(user.id)
    return [ProjectOut(
        id=p.id,
        user_id=p.user_id,
        title=p.title,
        topic=p.topic,
        target_audience=p.target_audience,
        goal=p.goal,
    ) for p in projects]


@router.get("/{project_id}", response_model=ProjectOut)
async def get_project(project_id: str, current_user=Depends(get_current_user)):
    project = project_store.get_project(project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    return ProjectOut(
        id=project.id,
        user_id=project.user_id,
        title=project.title,
        topic=project.topic,
        target_audience=project.target_audience,
        goal=project.goal,
    )


@router.patch("/{project_id}", response_model=ProjectOut)
async def update_project(project_id: str, payload: ProjectUpdate, current_user=Depends(get_current_user)):
    project = project_store.get_project(project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    updated = project_store.update_project(project_id, **payload.dict())
    return ProjectOut(
        id=updated.id,
        user_id=updated.user_id,
        title=updated.title,
        topic=updated.topic,
        target_audience=updated.target_audience,
        goal=updated.goal,
    )


@router.delete("/{project_id}")
async def delete_project(project_id: str, current_user=Depends(get_current_user)):
    project = project_store.get_project(project_id)
    if not project or project.user_id != current_user.id:
        raise HTTPException(status_code=404, detail="Project not found")
    project_store.delete_project(project_id)
    return {"message": "deleted"}

"""
Database base configuration
"""
"""
Database base configuration
"""
# from sqlalchemy import create_engine
# from sqlalchemy.ext.declarative import declarative_base
# from sqlalchemy.orm import sessionmaker

# from app.core.config import settings

# # SQLAlchemy 설정 (일시적으로 비활성화)
# # engine = create_engine(
# #     settings.DATABASE_URL,
# #     echo=settings.DEBUG,  # SQL 쿼리 로그 (개발 환경에서만)
# # )

# # SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# # Base class for ORM models
# # Base = declarative_base()


def get_db():
    """데이터베이스 세션 의존성 (일시적으로 비활성화)"""
    # db = SessionLocal()
    # try:
    #     yield db
    # finally:
    #     db.close()
    pass
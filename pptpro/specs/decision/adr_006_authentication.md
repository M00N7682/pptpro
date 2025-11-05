# ADR 006: 인증 및 권한 관리

## 상태
채택됨 (Accepted) - 2025-10-27

## 컨텍스트
PPT Pro는 사용자별 프로젝트 관리가 필요하며, 보안이 중요함:
- 회원가입/로그인
- API 호출 시 사용자 식별
- 프로젝트별 접근 권한

## 결정사항

### 인증 방식: JWT (JSON Web Token)
**구조:**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "exp": 1234567890,
  "iat": 1234567890
}
```

**선택 이유:**
- Stateless: 서버에 세션 저장 불필요 (수평 확장 용이)
- FastAPI와 잘 통합됨 (python-jose, passlib)
- Access Token + Refresh Token 패턴으로 보안 강화

**대안 검토:**
- Session-based: Redis 등 별도 저장소 필요, 확장성 낮음
- OAuth 2.0 (소셜 로그인): MVP 단계에서는 과도, 추후 추가 가능

### 토큰 전략
1. **Access Token**
   - 유효기간: 15분
   - 모든 API 요청에 포함 (Authorization: Bearer <token>)
   
2. **Refresh Token**
   - 유효기간: 7일
   - HttpOnly 쿠키 또는 별도 엔드포인트로 저장
   - Access Token 갱신 전용

### 비밀번호 관리
- **해싱**: bcrypt (passlib 사용)
- **검증**: 최소 8자, 영문+숫자 조합 (강제 아님, 권장)
- **재설정**: 이메일 인증 링크 (추후 구현)

### 권한 관리: RBAC (Role-Based Access Control)
**역할:**
- `user`: 기본 사용자 (자신의 프로젝트만 접근)
- `admin`: 관리자 (모든 프로젝트 접근, 사용자 관리)

**구현:**
```python
# dependencies/auth.py
async def get_current_user(token: str = Depends(oauth2_scheme)) -> User:
    # JWT 검증 및 사용자 조회
    pass

async def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role != "admin":
        raise HTTPException(status_code=403)
    return user
```

### 보안 고려사항
1. **CORS**: 프론트엔드 도메인만 허용
2. **Rate Limiting**: 로그인 엔드포인트 brute-force 방지 (slowapi)
3. **HTTPS Only**: 프로덕션에서 TLS 필수
4. **Token Blacklist**: 로그아웃 시 토큰 무효화 (Redis 활용, 선택적)

### API 엔드포인트
```
POST /api/auth/register
  body: { email, password, name }
  response: { user, access_token, refresh_token }

POST /api/auth/login
  body: { email, password }
  response: { access_token, refresh_token }

POST /api/auth/refresh
  body: { refresh_token }
  response: { access_token }

POST /api/auth/logout
  header: Authorization: Bearer <token>
  response: { message: "logged out" }
```

## 결과
- JWT 기반으로 확장 가능한 인증 시스템
- Access/Refresh Token으로 보안과 사용성 균형
- FastAPI의 dependency injection으로 권한 체크 간편

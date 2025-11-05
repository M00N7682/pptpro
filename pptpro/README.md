# PPT Pro

AI-powered presentation generator for consultants and strategists.

## Quick Start

### Prerequisites
- Node.js 18+ 
- Python 3.11+
- Docker Desktop (for PostgreSQL, optional)

### Backend Setup (FastAPI)

```bash
# Navigate to backend directory
cd backend

# Install Python dependencies
pip install -r requirements.txt

# Start development server
python run.py
```

Backend will be available at: `http://localhost:8000`

### Frontend Setup (React + Vite)

```bash
# Navigate to frontend directory  
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

Frontend will be available at: `http://localhost:5173`

### API Documentation

When backend is running, visit:
- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`

## Project Structure

```
pptpro/
├── backend/                 # FastAPI backend
│   ├── app/
│   │   ├── api/            # API routes
│   │   ├── core/           # Configuration
│   │   ├── db/             # Database setup
│   │   ├── models/         # SQLAlchemy models
│   │   └── main.py         # FastAPI app
│   ├── requirements.txt    # Python dependencies
│   └── run.py             # Development server
├── frontend/               # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/         # Page components
│   │   └── App.tsx        # Main app
│   ├── package.json       # Node.js dependencies
│   └── vite.config.ts     # Vite configuration
├── specs/                  # Project specifications
│   ├── decision/          # Architecture Decision Records
│   └── *.md              # Feature specifications
└── docker-compose.yml     # PostgreSQL database
```

## Development Phases

- [x] **Phase 0**: Foundation setup ✅
- [ ] **Phase 1**: Authentication system
- [ ] **Phase 2**: Project CRUD
- [ ] **Phase 3**: LLM storyline generation  
- [ ] **Phase 4**: Slide management
- [ ] **Phase 5**: Content generation
- [ ] **Phase 6**: PPT generation (MVP)
- [ ] **Phase 7**: Existing slide enhancement
- [ ] **Phase 8**: Testing & improvements
- [ ] **Phase 9**: Railway + Vercel deployment

## Tech Stack

**Backend:**
- FastAPI (Python web framework)
- SQLAlchemy (ORM) 
- PostgreSQL (Database)
- python-pptx (PPT generation)
- OpenAI API (LLM integration)

**Frontend:**
- React 18 + TypeScript
- Vite (Build tool)
- TanStack Query (Server state)
- React Router (Routing)

**Deployment:**
- Railway (Backend + Database)
- Vercel (Frontend)
- GitHub Actions (CI/CD)

## Environment Variables

### Backend (.env)
```env
DATABASE_URL=sqlite:///./pptpro.db
SECRET_KEY=your-secret-key
OPENAI_API_KEY=your-openai-api-key
DEBUG=true
```

### Frontend (.env.local)
```env
VITE_API_URL=http://localhost:8000
```

## Next Steps

1. Set up authentication system (JWT)
2. Create project management APIs
3. Integrate LLM for storyline generation
4. Build slide editing interface  
5. Implement PPT export functionality

For detailed development plan, see `specs/decision/adr_007_development_phases.md`.
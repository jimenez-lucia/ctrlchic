# CtrlChic

Virtual outfit visualization application - Try on outfits without actually putting on or buying the clothes.

## Concept

CtrlChic uses AI to generate realistic images of outfits on your body. Upload a full-body photo (your "mannequin"), add clothing items from your wardrobe, and let AI show you how different combinations look - all without changing clothes.

## Tech Stack

- **Frontend**: React
- **Backend**: Django + Django REST Framework
- **Authentication**: Firebase Auth
- **Storage**: Firebase Storage (for clothing images and mannequin photos)
- **AI Generation**: nanobanana API (cost-effective outfit generation)
- **Database**: PostgreSQL 16 (Docker for dev, managed service for production)

## Core Features (MVP - Tonight's Goal)

- [ ] User authentication (Firebase Auth)
- [ ] Upload mannequin photo (full-body image)
- [ ] Upload clothing items (images of individual pieces)
- [ ] Generate outfit visualization using AI

## Future Features

- Background removal for clothing items (better AI results)
- Outfit history and favorites
- Wardrobe organization (categories, colors, seasons)
- Multiple mannequin poses
- Sharing outfits
- Shopping integration
- Style recommendations

## Project Structure

```
ctrlchic/
├── backend/          # Django REST API
├── frontend/         # React application
└── README.md
```

## Setup

### Prerequisites

- Python 3.9+
- Node.js 18+
- npm or yarn
- Docker and Docker Compose (for PostgreSQL)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repo-url>
   cd ctrlchic
   ```

2. **Backend Setup**
   ```bash
   cd backend
   python3 -m venv venv
   source venv/bin/activate
   pip install -r requirements.txt
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   ```

4. **Environment Configuration**

   Backend (.env in `backend/` directory):
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

   Frontend (.env in `frontend/` directory):
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

5. **Run Database Migrations**
   ```bash
   cd backend
   source venv/bin/activate
   python manage.py migrate
   ```

### Running the Application

**Run both servers with one command (from root directory):**
```bash
npm run dev
```

This will:
1. Start PostgreSQL in a Docker container
2. Start the Django backend API at http://localhost:8000
3. Start the React frontend at http://localhost:5173

**Or run servers individually:**

Start PostgreSQL:
```bash
npm run docker:up
```

Backend:
```bash
cd backend
source venv/bin/activate
python manage.py runserver
```

Frontend:
```bash
cd frontend
npm run dev
```

**Docker Management:**
```bash
npm run docker:up      # Start PostgreSQL container
npm run docker:down    # Stop and remove containers
npm run docker:logs    # View PostgreSQL logs
```

### Verify Setup

Visit http://localhost:5173 in your browser. You should see the CtrlChic landing page with system status showing both frontend and backend as "Running" or "healthy".

## Development Goals

- Keep costs minimal (free tier services where possible)
- Focus on functionality first, UI polish later
- Build for resume/portfolio showcase

## API Services

- **nanobanana**: AI-powered outfit generation
- **Firebase**: Auth and blob storage

---

Built with ❤️ for fun and learning

# Agentic AI Drug Discovery Platform

An autonomous Master-Worker agentic architecture platform for accelerating drug repurposing and discovery. This platform reduces months of manual pharmaceutical research to hours using specialized AI agents.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Mobile App (Expo)                        │
│  ┌──────────┬──────────┬──────────┬──────────┐                 │
│  │Dashboard │  Chat    │ Patents  │ Mind Map │                 │
│  └──────────┴──────────┴──────────┴──────────┘                 │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    FastAPI Backend                              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                    Master Agent                          │   │
│  │         (Intent Understanding + Task Planning)           │   │
│  └─────────────────────────────────────────────────────────┘   │
│                              │                                  │
│        ┌─────────────────────┼─────────────────────┐           │
│        ▼                     ▼                     ▼           │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐       │
│  │  IQVIA   │  │  Patent  │  │ Clinical │  │   Web    │       │
│  │ Insights │  │Landscape │  │  Trials  │  │  Intel   │       │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘       │
│        │                     │                     │           │
│        └─────────────────────┼─────────────────────┘           │
│                              ▼                                  │
│                   ┌──────────────────┐                         │
│                   │ Report Generator │                         │
│                   └──────────────────┘                         │
└─────────────────────────────────────────────────────────────────┘
```

## Tech Stack

### Backend
- **Python 3.10+** - Core language
- **FastAPI** - High-performance API framework
- **LangGraph** - Stateful agent orchestration
- **LangChain** - LLM tooling and chains
- **SQLite** - Database (MVP)
- **Pydantic** - Data validation

### Frontend
- **React Native (Expo)** - Cross-platform mobile
- **TypeScript** - Type safety
- **NativeWind** - Tailwind CSS for React Native
- **react-native-svg** - Mind Map visualization
- **Zustand** - State management

## Project Structure

```
eyproject/
├── packages/
│   ├── backend/                 # Python FastAPI Backend
│   │   ├── app/
│   │   │   ├── agents/         # LangGraph Master-Worker
│   │   │   │   ├── workers/    # Specialized agents
│   │   │   │   ├── state.py    # Shared state
│   │   │   │   └── graph_builder.py
│   │   │   ├── api/v1/         # REST endpoints
│   │   │   ├── models/         # SQLAlchemy models
│   │   │   ├── schemas/        # Pydantic schemas
│   │   │   ├── services/       # Business logic
│   │   │   └── db/             # Database
│   │   ├── requirements.txt
│   │   └── Dockerfile
│   │
│   └── mobile/                  # React Native Expo App
│       ├── app/                 # Expo Router screens
│       ├── components/          # UI components
│       ├── hooks/               # Custom hooks
│       ├── services/            # API clients
│       ├── store/               # Zustand store
│       └── constants/           # Theme, mock data
│
├── docker-compose.yml
└── README.md
```

## Getting Started

### Prerequisites
- Python 3.10+
- Node.js 18+
- npm or yarn
- Expo CLI (`npm install -g expo-cli`)

### Backend Setup

```bash
# Navigate to backend
cd packages/backend

# Create virtual environment
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create .env file
cp ../../.env.example .env
# Edit .env and add your API keys

# Run the server
uvicorn app.main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`
- API Docs: `http://localhost:8000/docs`
- Health check: `http://localhost:8000/health`

### Frontend Setup

```bash
# Navigate to mobile app
cd packages/mobile

# Install dependencies
npm install

# Start Expo development server
npx expo start
```

### Using Docker

```bash
# From project root
docker-compose up --build
```

## API Endpoints

### Chat
- `POST /api/v1/chat/initiate` - Start new analysis job
- `POST /api/v1/chat/message` - Send follow-up message

### Jobs
- `GET /api/v1/jobs/{job_id}/status` - Poll job status
- `GET /api/v1/jobs/{job_id}/result` - Get final result
- `GET /api/v1/jobs` - List all jobs
- `DELETE /api/v1/jobs/{job_id}` - Cancel job

### Patents
- `GET /api/v1/patents/search` - Search patents
- `GET /api/v1/patents/{patent_id}` - Get patent details
- `POST /api/v1/patents/{patent_id}/analyze` - Analyze patent

### Graph
- `GET /api/v1/graph/visualize` - Get mind map data
- `GET /api/v1/graph/node/{node_id}` - Get node details

## Example Usage

### Initiate Analysis Job
```bash
curl -X POST "http://localhost:8000/api/v1/chat/initiate" \
  -H "Content-Type: application/json" \
  -d '{
    "query": "Research GLP-1 agonists for obesity treatment",
    "options": {
      "include_patents": true,
      "include_clinical_trials": true,
      "include_market_data": true
    }
  }'
```

### Poll Job Status
```bash
curl "http://localhost:8000/api/v1/jobs/{job_id}/status"
```

### Get Mind Map Data
```bash
curl "http://localhost:8000/api/v1/graph/visualize?context=GLP-1"
```

## Features

### Dashboard
- Quick action buttons for common tasks
- Active jobs panel with progress tracking
- Recent activity feed

### Master Chatbot
- Natural language research queries
- Real-time job progress with worker status
- Embedded status cards showing:
  - Market Research progress
  - Patent Finder progress
  - Clinical Data progress
  - Web Intelligence progress

### Patent Intelligence
- Patent search by molecule/keyword
- Relevance scoring (0-100%)
- Actions: Extract Claims, FTO Analysis, Prior Art Search
- Patent cards with key metadata

### Mind Map Visualization
- Hierarchical node tree
- Node types with color coding:
  - Disease (Pink) - Root nodes
  - Molecule (Purple) - Middle nodes
  - Product (Yellow) - Leaf nodes
- Interactive tap for details
- Match score badges

## Mock Data (GLP-1 Happy Path)

The system includes mock data for the GLP-1 research scenario:

**Diseases:**
- Obesity
- Type 2 Diabetes

**Molecule:**
- Semaglutide

**Products:**
- Wegovy (97% match)
- Ozempic (95% match)
- Rybelsus (92% match)

**Patents:**
- US10,456,789 - GLP-1 receptor agonist formulations (94% relevance)
- US1338,734,547 - Modified Peptide Therapeutics (41% relevance)

## Configuration

### Environment Variables

```env
# Backend
DATABASE_URL=sqlite:///./data/app.db
OPENAI_API_KEY=your-api-key
DEBUG=true
CORS_ORIGINS=http://localhost:3000,http://localhost:8081

# LLM Provider
LLM_PROVIDER=openai
LLM_MODEL=gpt-4-turbo-preview
```

### Theme Configuration

The app uses a dark futuristic theme:
- Background: `#0D0D0D` (primary), `#1A1A1A` (secondary)
- Accent: `#00D4FF` (cyan), `#0066FF` (blue)
- Node colors: Disease (#EC4899), Molecule (#8B5CF6), Product (#FBBF24)

## Development

### Adding New Worker Agents

1. Create worker in `packages/backend/app/agents/workers/`
2. Inherit from `BaseWorker`
3. Implement `execute()` method
4. Register in `graph_builder.py`

```python
class NewWorker(BaseWorker):
    def __init__(self):
        super().__init__("New Worker")

    async def execute(self, state: MasterState) -> Dict[str, Any]:
        # Your implementation
        return {"data": "results"}
```

### Adding New UI Components

1. Create component in appropriate folder under `components/`
2. Follow NativeWind styling conventions
3. Use colors from `constants/colors.ts`

## License

MIT License

## Support

For issues and feature requests, please open a GitHub issue.

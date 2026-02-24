# Dr. Console 🩺

> **AI-Powered Diagnostic Pre-Screening System**

Dr. Console is an intelligent, multimodal medical pre-screening assistant that combines Large Language Models, Computer Vision, and Retrieval-Augmented Generation (RAG) to assist patients and healthcare workers with early-stage symptom analysis.

---

## Features

- 🧠 **Thinking Brain** — Gemini-powered deep reasoning for medical conversations
- 👁️ **Multimodal Vision** — Automatic image analysis (Skin, Eye, Ear, Tongue)
- 📚 **Medical RAG** — Knowledge base powered by MedQuAD dataset
- 📋 **SOAP Report Generator** — Structured clinical notes
- 🔒 **Auth & Profiles** — Supabase-backed user authentication
- 💬 **Session History** — Persistent chat sessions per patient

---

## Tech Stack

| Layer | Technology |
|---|---|
| **Backend** | FastAPI + LangGraph (Python) |
| **AI Brain** | Google Gemini 2.0 Flash |
| **Vision** | TensorFlow MobileNetV2 (local) |
| **Database** | Supabase (PostgreSQL + pgvector) |
| **Frontend** | React + Vite |
| **Embeddings** | Google text-embedding-004 |

---

## Project Structure

```
Dr. Console Project/
├── backend/
│   ├── langgraph_coordinator/   # LangGraph agent graph
│   ├── modules/
│   │   ├── thinking_brain/      # Gemini deep reasoning
│   │   ├── image_analysis/      # Vision agent + specialist classifiers
│   │   ├── medical_rag/         # MedQuAD loader + retriever
│   │   └── report_generator/    # SOAP note generation
│   ├── models/                  # Trained .h5 model files
│   │   ├── skin_model.keras
│   │   ├── model_ear.h5
│   │   ├── model_eye.h5
│   │   └── model_tongue.h5
│   ├── routers/                 # FastAPI route handlers
│   ├── auth_module/
│   └── database/
└── frontend/
    └── src/
        └── components/          # React UI components
```

---

## Setup

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate       # Windows
pip install -r requirements.txt
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

### Environment Variables
Create `backend/.env`:
```
GEMINI_API_KEY=your_key_here
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_anon_key
```

---

## Models

The specialist diagnostic models are trained via Google Colab using MobileNetV2 transfer learning on publicly available medical image datasets (Kaggle).

| Model | Dataset | Classes |
|---|---|---|
| Skin | ISIC / HAM10000 | 23 skin conditions |
| Ear | Otoscopic Image Dataset | 5 ear conditions |
| Eye | Eye Disease Classification | 4 eye diseases |
| Tongue | COVID-19 Tongue Dataset | 6 tongue states |

---

*Built as a college project — Phase 7 in active development.*

from typing import List
from app.config import ALLOWED_ORIGINS
from app.schemas import ChatRequest, DraftEmailRequest, EmailDraftResponse
from app.services.email_service import generate_email_draft
from fastapi import FastAPI, File, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI(title="GenAI Assistant Backend")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


sessions_db = {}
documents_db = []

@app.post("/chat")
def chat(payload: ChatRequest):
    if payload.session_id not in sessions_db:
        sessions_db[payload.session_id] = []

    sessions_db[payload.session_id].append({"role": "user", "content": payload.message})

    ai_text = f"I have reviewed your query regarding: '{payload.message}'. How else can I assist?"
    sources = [d["filename"] for d in documents_db] if documents_db else ["KnowledgeBase_General_v1"]
    tool_calls = [
        {"tool": "retrieve_session_history", "status": "success"},
        {"tool": "vector_search", "top_k": 3}
    ]

    sessions_db[payload.session_id].append({"role": "assistant", "content": ai_text})

    return {
        "reply": ai_text,
        "sources": sources,
        "tool_calls": tool_calls
    }


@app.post("/documents")
async def upload_documents(file: UploadFile = File(...)):
    try:
        content = await file.read()
        documents_db.append({"filename": file.filename, "size": len(content)})
        return {"filename": file.filename, "message": "Document uploaded successfully"}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/draft-email", response_model=EmailDraftResponse)
def draft_email(payload: DraftEmailRequest):
    history = sessions_db.get(payload.session_id, [])
    if not history:
        raise HTTPException(status_code=404, detail="No conversation history found for this session")

    return generate_email_draft(history, payload.tone)
from typing import Literal, Optional
from pydantic import BaseModel, Field

class ChatRequest(BaseModel):
    session_id: str
    message: str

class DraftEmailRequest(BaseModel):
    session_id: str
    tone: Literal["formal", "friendly"] = "formal"

# Task 1: Pydantic Structured Output Schema
class EmailDraftResponse(BaseModel):
    recipient: str = Field(description="Recipient name or email derived from session")
    subject: str = Field(description="Concise email subject line")
    body: str = Field(description="Polite summary, key points, and next steps")
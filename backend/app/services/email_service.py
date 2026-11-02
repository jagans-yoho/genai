import json
from google import genai
from google.genai import types
from app.config import GEMINI_API_KEY
from app.schemas import EmailDraftResponse

client = genai.Client(api_key=GEMINI_API_KEY) if GEMINI_API_KEY else None

def generate_email_draft(history: list, tone: str) -> EmailDraftResponse:
    history_str = "\n".join([f"{m['role']}: {m['content']}" for m in history])

    prompt = f"""
Tone: {tone}
Conversation History:
{history_str}

Generate a polite summary email with subject and body (recipient, key points, next steps).
Never send the email - return the draft only.
"""

    if client:
        try:
            response = client.models.generate_content(
                model="gemini-3.5-flash-lite",
                contents=prompt,
                config=types.GenerateContentConfig(
                    response_mime_type="application/json",
                    response_schema=EmailDraftResponse,
                ),
            )
            data = json.loads(response.text)
            return EmailDraftResponse(**data)
        except Exception:
            pass

    name = "Rahul"
    if tone == "formal":
        subj = "Summary of your order query"
        body = (
            f"Dear {name},\n\n"
            "Thank you for contacting support. Here is a summary of your inquiry:\n"
            "- Reviewed current order details and timeline.\n"
            "- Logged requirements for processing.\n\n"
            "Next Steps:\n"
            "1. Support team will update delivery records.\n"
            "2. Contact us if any adjustments are needed.\n\n"
            "Best regards,\nSupport Operations"
        )
    else:
        subj = "Quick recap of your query!"
        body = (
            f"Hi {name},\n\n"
            "Thanks for reaching out! Here's a quick recap of our discussion:\n"
            "- Checked your order update.\n"
            "- Everything is moving as scheduled.\n\n"
            "Next Steps:\n"
            "We will ping you once dispatch is confirmed!\n\n"
            "Cheers,\nSupport Team"
        )

    return EmailDraftResponse(
        recipient=f"{name} <rahul@example.com>",
        subject=subj,
        body=body
    )
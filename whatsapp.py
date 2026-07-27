import os
import sys
import time
import requests
import json
from collections import deque
from neonize.client import NewClient
from neonize.events import ConnectedEv, MessageEv
import io
from pypdf import PdfReader

# Reconfigure stdout/stderr to use utf-8 to prevent encoding crashes on Windows terminal
if hasattr(sys.stdout, "reconfigure"):
    sys.stdout.reconfigure(encoding="utf-8")
if hasattr(sys.stderr, "reconfigure"):
    sys.stderr.reconfigure(encoding="utf-8")

# Load env variables from .env if present
def load_env():
    env_path = ".env"
    if os.path.exists(env_path):
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                if "=" in line and not line.startswith("#"):
                    k, v = line.strip().split("=", 1)
                    if v.startswith('"') and v.endswith('"'):
                        v = v[1:-1]
                    elif v.startswith("'") and v.endswith("'"):
                        v = v[1:-1]
                    os.environ[k] = v

load_env()

# Primary Next.js API Base URL (Port 5000 / 3000 fallback)
NEXTJS_URL = os.environ.get("NEXTJS_URL", "http://localhost:5000")

# In-memory dictionary mapping user JID to their conversation history
chat_histories = {}
sent_messages_cache = deque(maxlen=20)

def send_to_nextjs_ai_cto(user_message: str, sender_name: str = "WhatsApp User") -> str:
    """
    Sends incoming real WhatsApp text/PDF to Next.js API (/api/whatsapp).
    Updates PostgreSQL, publishes BusinessEvent to AI CTO Bus, & returns AI response.
    """
    endpoints = [
        f"{NEXTJS_URL}/api/whatsapp",
        "http://localhost:5000/api/whatsapp",
        "http://localhost:3000/api/whatsapp"
    ]

    payload = {
        "message": user_message,
        "sender": sender_name
    }

    for url in endpoints:
        try:
            res = requests.post(url, json=payload, timeout=20)
            if res.status_code == 200:
                data = res.json()
                reply = data.get("reply", "")
                if reply:
                    return reply
        except Exception:
            continue

    # Fallback response if web server is offline
    return f"🤖 [AI CTO Bot] Received your input: '{user_message[:60]}...'. Logged to local queue."

def extract_text_from_pdf_bytes(pdf_bytes: bytes) -> str:
    try:
        reader = PdfReader(io.BytesIO(pdf_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() or ""
        return text.strip()
    except Exception as e:
        print(f"[ERROR] Failed to parse PDF: {e}")
        return ""

# Initialize WhatsApp client via Neonize
client = NewClient("whatsapp_session.db")

@client.event(ConnectedEv)
def on_connected(_: NewClient, __: ConnectedEv):
    print("\n=================================================")
    print("✅ SUCCESS! Connected to Real WhatsApp Number!")
    print("🤖 Gemma AI CTO Assistant is now listening live.")
    print("=================================================\n")

@client.event(MessageEv)
def on_message(cl: NewClient, message: MessageEv):
    try:
        msg_body = message.Message
        if not msg_body:
            return

        text = None
        if msg_body.conversation:
            text = msg_body.conversation
        elif msg_body.extendedTextMessage and msg_body.extendedTextMessage.text:
            text = msg_body.extendedTextMessage.text
        elif msg_body.documentMessage:
            doc = msg_body.documentMessage
            print(f"[INFO] Received WhatsApp document: {doc.title} ({doc.mimetype})")
            try:
                file_bytes = cl.download_any(msg_body)
                if file_bytes:
                    if doc.mimetype == "application/pdf" or (doc.title and doc.title.lower().endswith(".pdf")):
                        extracted = extract_text_from_pdf_bytes(file_bytes)
                        if extracted:
                            text = f"Supplier Invoice PDF: {doc.title}\nExtracted Text:\n{extracted}"
                        else:
                            text = f"Supplier Invoice PDF: {doc.title}\n(Invoice attached)"
                    else:
                        text = f"Received document attachment: {doc.title}"
                else:
                    text = f"Received document: {doc.title}"
            except Exception as download_err:
                print(f"[ERROR] Failed to download document: {download_err}")
                text = f"Received document: {doc.title}"
        elif msg_body.imageMessage:
            img = msg_body.imageMessage
            text = f"Received invoice image: {img.caption or 'Supplier invoice photo'}"

        if not text:
            return

        text_stripped = text.strip()
        chat_jid = message.Info.MessageSource.Chat
        sender_jid = message.Info.MessageSource.Sender

        chat_user = getattr(chat_jid, "User", str(chat_jid)) if chat_jid else "unknown"
        sender_user = getattr(sender_jid, "User", str(sender_jid)) if sender_jid else "unknown"
        is_from_me = getattr(message.Info, "IsFromMe", False)

        # Ignore group chats
        chat_server = getattr(chat_jid, "Server", "") if chat_jid else ""
        if chat_server not in ["s.whatsapp.net", "lid"]:
            return

        # Avoid echo loop
        if is_from_me or text_stripped in sent_messages_cache:
            return

        print(f"\n[REAL WHATSAPP MSG] From {sender_user}: {text_stripped[:80]}...")

        # Process via AI CTO Next.js Service & publish event to website
        reply = send_to_nextjs_ai_cto(text_stripped, sender_user)

        print(f"[AI CTO REPLY TO WHATSAPP] {reply[:80]}...\n")
        sent_messages_cache.append(reply)
        cl.send_message(chat_jid, reply)

    except Exception as e:
        print(f"[ERROR] Error handling WhatsApp message: {e}", file=sys.stderr)

if __name__ == "__main__":
    print("=================================================")
    print("📱 Starting Real WhatsApp Number Connector...")
    print("📌 Scan the QR code below using your WhatsApp phone app")
    print("   (WhatsApp -> Settings -> Linked Devices -> Link a Device)")
    print("=================================================")
    client.connect()
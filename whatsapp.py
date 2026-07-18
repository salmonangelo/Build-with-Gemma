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
                    # Remove quotes if present
                    if v.startswith('"') and v.endswith('"'):
                        v = v[1:-1]
                    elif v.startswith("'") and v.endswith("'"):
                        v = v[1:-1]
                    os.environ[k] = v

load_env()

# In-memory dictionary mapping user JID to their conversation history
chat_histories = {}
# Keep track of recent messages sent by the bot to prevent self-triggering loop
sent_messages_cache = deque(maxlen=20)

def get_ai_reply_with_history(user_message: str, chat_user: str) -> str:
    global chat_histories
    
    # Initialize history for new chat user
    if chat_user not in chat_histories:
        chat_histories[chat_user] = []
        
    # Allow resetting the state
    if user_message.strip().lower() in ["/reset", "/new", "reset"]:
        chat_histories[chat_user] = []
        return "Chat history reset! Send me an invoice detail to log it."

    chat_histories[chat_user].append({"role": "user", "content": user_message})

    # Route directly to Next.js API /api/gemma (Text-to-SQL & local Gemma reasoning connected to PostgreSQL)
    try:
        url = "http://localhost:3000/api/gemma"
        payload = {
            "messages": chat_histories[chat_user],
            "tier": "beginner"
        }
        res = requests.post(url, json=payload, timeout=30)
        if res.status_code == 200:
            reply = res.json().get("text", "")
            chat_histories[chat_user].append({"role": "assistant", "content": reply})
            return reply
        else:
            return f"Error: Local Gemma API returned status {res.status_code} ({res.text})"
    except Exception as e:
        print(f"[ERROR] Failed to contact local Gemma API: {e}")
        return f"Error: Failed to contact local Gemma API ({str(e)}). Please verify your Next.js server is running."

def submit_to_nextjs_api(data: dict):
    # Log directly to local PostgreSQL via Next.js endpoint
    url = "http://localhost:3000/api/invoices"
    try:
        response = requests.post(url, json=data, timeout=15)
        if response.status_code == 200:
            return response.json().get("invoice"), None
        else:
            return None, f"Database insert failed (status {response.status_code}): {response.text}"
    except Exception as e:
        return None, f"Network error connecting to Next.js server: {str(e)}"

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

# Initialize WhatsApp client
client = NewClient("whatsapp_session.db")

@client.event(ConnectedEv)
def on_connected(_: NewClient, __: ConnectedEv):
    print("\n[OK] Successfully connected to WhatsApp! Bot is active.")

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
            print(f"[INFO] Received document: {doc.title} ({doc.mimetype})")
            try:
                file_bytes = cl.download_any(msg_body)
                if file_bytes:
                    if doc.mimetype == "application/pdf" or (doc.title and doc.title.lower().endswith(".pdf")):
                        extracted = extract_text_from_pdf_bytes(file_bytes)
                        if extracted:
                            text = f"Document Title: {doc.title}\nExtracted Text:\n{extracted}"
                        else:
                            text = f"Document Title: {doc.title}\n(Empty or scanned PDF. Could not extract text.)"
                    else:
                        text = f"Received non-PDF document: {doc.title} ({doc.mimetype})"
                else:
                    text = f"Received document attachment: {doc.title}"
            except Exception as download_err:
                print(f"[ERROR] Failed to download document: {download_err}")
                text = f"Received document: {doc.title} (download failed)"
        elif msg_body.imageMessage:
            img = msg_body.imageMessage
            text = f"Received image attachment: {img.caption or 'Untitled image'}"

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

        # Avoid loops
        if is_from_me or text_stripped in sent_messages_cache:
            return

        print(f"\n[MSG] Message from {sender_user}: {text_stripped}")

        # Get response from Gemma SME Assistant
        reply = get_ai_reply_with_history(text_stripped, chat_user)
        
        # Check if reply contains the submit invoice command
        if "[SUBMIT_INVOICE]" in reply:
            try:
                parts = reply.split("[SUBMIT_INVOICE]")
                confirm_prefix = parts[0].strip()
                json_str = parts[1].strip()
                
                if confirm_prefix:
                    cl.send_message(chat_jid, confirm_prefix)
                    sent_messages_cache.append(confirm_prefix)
                
                invoice_data = json.loads(json_str)
                
                # Submit to Next.js database API
                res, err = submit_to_nextjs_api(invoice_data)
                if err:
                    err_msg = f"Failed to log invoice to database: {err}"
                    print(f"[ERROR] {err_msg}")
                    cl.send_message(chat_jid, f"⚠️ {err_msg}")
                    sent_messages_cache.append(f"⚠️ {err_msg}")
                else:
                    success_msg = (
                        f"🎉 *Invoice Logged Directly to Database!*\n\n"
                        f"🏢 *Supplier:* {res.get('supplierName')}\n"
                        f"🛠️ *Material:* {res.get('materialName')}\n"
                        f"💰 *Amount:* ₹{res.get('amount')}\n"
                        f"📅 *Due Date:* {res.get('dueDate') or 'Not Specified'}\n\n"
                        f"Gemma has updated your cash flow projection context."
                    )
                    print(f"[AI] {success_msg}")
                    cl.send_message(chat_jid, success_msg)
                    sent_messages_cache.append(success_msg)
                    # Reset conversation history after submission
                    chat_histories[chat_user] = []
            except Exception as ex:
                error_msg = "⚠️ Error processing invoice details. Please restart by typing reset."
                cl.send_message(chat_jid, error_msg)
                sent_messages_cache.append(error_msg)
        else:
            print(f"[AI] {reply}")
            sent_messages_cache.append(reply)
            cl.send_message(chat_jid, reply)

    except Exception as e:
        print(f"[ERROR] Error handling message: {e}", file=sys.stderr)

if __name__ == "__main__":
    print("[INFO] Starting WhatsApp Gemma SME Assistant...")
    client.connect()

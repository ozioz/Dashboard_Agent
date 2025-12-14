from fastapi import FastAPI, UploadFile, File, HTTPException, Body, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import os
import json
import asyncio
import base64
from dotenv import load_dotenv
from pydantic import BaseModel
from typing import List, Optional, Dict, Any

from utils.common import load_manifesto, configure_genai, parse_manifesto_to_rules, save_manifesto_from_rules, save_manifesto
from utils.auditor import audit_dashboard, generate_dashboard_simulation, get_chat_response
from utils.builder import generate_assets, revise_assets
from utils.gemini_live import GeminiLiveSession

# Load environment variables
load_dotenv()

# Configure Gemini (non-blocking - allow server to start even without API key)
try:
    configure_genai()
except Exception as e:
    print(f"Warning: Gemini API not configured: {e}. Server will start but AI features may not work.")

app = FastAPI(title="Power BI Auditor API", version="1.0.0")

# CORS Configuration
# Get allowed origins from environment variable or use defaults
ALLOWED_ORIGINS = os.getenv(
    "ALLOWED_ORIGINS",
    "http://localhost:3000,https://dashboardmasteragent.netlify.app"
).split(",")

app.add_middleware(
    CORSMiddleware,
    allow_origins=ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load Manifesto
MANIFESTO_TEXT = load_manifesto()

# Global variable to track manifesto changes
def reload_manifesto():
    """Reloads the manifesto from file."""
    global MANIFESTO_TEXT
    MANIFESTO_TEXT = load_manifesto()
    return MANIFESTO_TEXT

# --- Pydantic Models ---
class SimulateRequest(BaseModel):
    audit_result: Dict[str, Any]
    user_feedback: Optional[str] = None

class ReviseRequest(BaseModel):
    current_assets: Dict[str, Any]
    user_feedback: str

class ChatRequest(BaseModel):
    chat_history: List[Dict[str, str]]
    user_input: str
    audit_result: Dict[str, Any]
    dashboard_image: Optional[str] = None  # Base64 encoded image for re-auditing
    dashboard_image: Optional[str] = None  # Base64 encoded image for re-auditing

class RuleUpdateRequest(BaseModel):
    section_id: int
    rule_id: Optional[int] = None
    name: Optional[str] = None
    description: Optional[str] = None
    sub_rules: Optional[List[str]] = None

class RuleAddRequest(BaseModel):
    section_id: int
    name: str
    description: str
    sub_rules: Optional[List[str]] = None

class RuleDeleteRequest(BaseModel):
    section_id: int
    rule_id: int

# --- Endpoints ---

@app.get("/")
async def root():
    return {"message": "Power BI Auditor API is running"}

@app.post("/audit")
async def audit_endpoint(file: UploadFile = File(...)):
    """
    Audits an uploaded dashboard image.
    """
    if not MANIFESTO_TEXT:
        raise HTTPException(status_code=500, detail="Manifesto not found")
    
    try:
        contents = await file.read()
        result = audit_dashboard(contents, MANIFESTO_TEXT)
        if not result:
            raise HTTPException(status_code=500, detail="Audit failed")
        
        # Generate initial assets (theme, action list)
        assets = generate_assets(result, MANIFESTO_TEXT)
        
        return {
            "audit_result": result,
            "assets": assets
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/simulate")
async def simulate_endpoint(request: SimulateRequest):
    """
    Generates a simulated SVG of the future state.
    """
    if not MANIFESTO_TEXT:
        raise HTTPException(status_code=500, detail="Manifesto not found")
        
    svg = generate_dashboard_simulation(MANIFESTO_TEXT, request.audit_result, request.user_feedback)
    if not svg:
        raise HTTPException(status_code=500, detail="Simulation failed")
    
    return {"svg": svg}

@app.post("/revise")
async def revise_endpoint(request: ReviseRequest):
    """
    Revises assets based on user feedback.
    """
    if not MANIFESTO_TEXT:
        raise HTTPException(status_code=500, detail="Manifesto not found")
        
    updated_assets = revise_assets(request.current_assets, request.user_feedback, MANIFESTO_TEXT)
    if not updated_assets:
        raise HTTPException(status_code=500, detail="Revision failed")
        
    return updated_assets

async def handle_auditor_command(rule_description: str, audit_result: Dict[str, Any], dashboard_image: Optional[str] = None):
    """
    Handles /auditor command: Analyzes rule description, adds to manifesto if valid, and optionally re-audits.
    """
    import google.generativeai as genai
    
    model = genai.GenerativeModel("models/gemini-2.5-flash")
    
    # Step 1: Analyze if the rule description is valid and should be added
    analysis_prompt = f"""
    Sen bir Power BI Manifesto Kuralları Uzmanısın.
    
    Kullanıcı şu kural açıklamasını eklemek istiyor:
    "{rule_description}"
    
    Mevcut Manifesto özeti:
    {MANIFESTO_TEXT[:2000]}
    
    GÖREV:
    1. Bu kural açıklaması geçerli ve manifesto'ya uygun mu?
    2. Eğer uygunsa, hangi bölüme (section) eklenmeli? (Bölüm numarası ver)
    3. Kural adı (name) ve açıklaması (description) ne olmalı?
    
    ÇIKTI FORMATI (SADECE JSON):
    {{
        "is_valid": true/false,
        "reason": "<neden>",
        "section_id": <bölüm_numarası>,
        "rule_name": "<kural_adı>",
        "rule_description": "<kural_açıklaması>"
    }}
    """
    
    try:
        analysis_response = model.generate_content(
            analysis_prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        analysis = json.loads(analysis_response.text)
        
        if not analysis.get("is_valid", False):
            return {
                "response": f"❌ Kural geçersiz: {analysis.get('reason', 'Bilinmeyen neden')}",
                "command": "auditor",
                "requires_reaudit": False
            }
        
        # Step 2: Add rule to manifesto
        rules = parse_manifesto_to_rules(MANIFESTO_TEXT)
        
        # Find the section
        section = next((s for s in rules if s["id"] == analysis["section_id"]), None)
        if not section:
            return {
                "response": f"❌ Bölüm {analysis['section_id']} bulunamadı.",
                "command": "auditor",
                "requires_reaudit": False
            }
        
        # Add new rule
        new_rule_id = len(section["rules"]) + 1
        section["rules"].append({
            "id": new_rule_id,
            "name": analysis["rule_name"],
            "description": analysis["rule_description"]
        })
        
        # Save updated manifesto
        updated_manifesto = save_manifesto_from_rules(rules)
        save_manifesto(updated_manifesto)
        reload_manifesto()
        
        # Step 3: Re-audit if image provided
        reaudit_result = None
        if dashboard_image:
            try:
                image_bytes = base64.b64decode(dashboard_image)
                reaudit_result = audit_dashboard(image_bytes, MANIFESTO_TEXT)
            except Exception as e:
                print(f"Re-audit error: {e}")
        
        response_msg = f"✅ Kural eklendi: **{analysis['rule_name']}**\n\n{analysis['rule_description']}\n\nBölüm {analysis['section_id']}: {section['title']}"
        
        if reaudit_result:
            response_msg += f"\n\n🔄 Yeniden değerlendirme tamamlandı. Yeni puan: {reaudit_result.get('score', 'N/A')}/100"
            return {
                "response": response_msg,
                "command": "auditor",
                "requires_reaudit": True,
                "new_audit_result": reaudit_result
            }
        else:
            response_msg += "\n\n💡 Dashboard'u yeniden değerlendirmek için lütfen dashboard görselini yükleyin."
            return {
                "response": response_msg,
                "command": "auditor",
                "requires_reaudit": False
            }
            
    except Exception as e:
        return {
            "response": f"❌ Hata: {str(e)}",
            "command": "auditor",
            "requires_reaudit": False
        }

@app.post("/chat")
async def chat_endpoint(request: ChatRequest):
    """
    Chat with the consultant. Supports special commands:
    - /auditor <rule_description>: Add a new rule to manifesto and re-audit dashboard
    """
    if not MANIFESTO_TEXT:
        raise HTTPException(status_code=500, detail="Manifesto not found")
    
    user_input = request.user_input.strip()
    
    # Check for commands
    if user_input.startswith("/auditor"):
        # Extract rule description after /auditor
        rule_description = user_input.replace("/auditor", "").strip()
        if not rule_description:
            return {
                "response": "❌ Lütfen bir kural açıklaması girin. Örnek: /auditor Dashboard'ta tüm metinler en az 12pt font boyutunda olmalıdır.",
                "command": "auditor",
                "requires_reaudit": False
            }
        
        # Process /auditor command
        return await handle_auditor_command(rule_description, request.audit_result, request.dashboard_image)
    
    # Normal chat response
    response = get_chat_response(request.chat_history, user_input, MANIFESTO_TEXT, request.audit_result)
    return {"response": response, "command": None, "requires_reaudit": False}

@app.get("/manifesto/rules")
async def get_manifesto_rules():
    """
    Returns the manifesto rules in structured format.
    """
    rules = parse_manifesto_to_rules(MANIFESTO_TEXT)
    return {"rules": rules}

@app.post("/manifesto/rules/update")
async def update_manifesto_rule(request: RuleUpdateRequest):
    """
    Updates a specific rule in the manifesto.
    """
    try:
        rules = parse_manifesto_to_rules(MANIFESTO_TEXT)
        
        # Find and update the rule
        for section in rules:
            if section["id"] == request.section_id:
                if request.rule_id:
                    for rule in section["rules"]:
                        if rule["id"] == request.rule_id:
                            if request.name:
                                rule["name"] = request.name
                            if request.description:
                                rule["description"] = request.description
                            if request.sub_rules is not None:
                                rule["sub_rules"] = request.sub_rules
                            break
                break
        
        # Convert back to text and save
        new_manifesto = save_manifesto_from_rules(rules)
        if save_manifesto(new_manifesto):
            reload_manifesto()
            return {"success": True, "message": "Rule updated successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save manifesto")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/manifesto/rules/add")
async def add_manifesto_rule(request: RuleAddRequest):
    """
    Adds a new rule to a section.
    """
    try:
        rules = parse_manifesto_to_rules(MANIFESTO_TEXT)
        
        # Find the section and add the rule
        for section in rules:
            if section["id"] == request.section_id:
                new_rule = {
                    "id": len(section["rules"]) + 1,
                    "name": request.name,
                    "description": request.description,
                    "sub_rules": request.sub_rules or []
                }
                section["rules"].append(new_rule)
                break
        
        # Convert back to text and save
        new_manifesto = save_manifesto_from_rules(rules)
        if save_manifesto(new_manifesto):
            reload_manifesto()
            return {"success": True, "message": "Rule added successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save manifesto")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/manifesto/rules/delete")
async def delete_manifesto_rule(request: RuleDeleteRequest):
    """
    Deletes a rule from a section.
    """
    try:
        rules = parse_manifesto_to_rules(MANIFESTO_TEXT)
        
        # Find and remove the rule
        for section in rules:
            if section["id"] == request.section_id:
                section["rules"] = [r for r in section["rules"] if r["id"] != request.rule_id]
                # Re-number rules
                for idx, rule in enumerate(section["rules"], 1):
                    rule["id"] = idx
                break
        
        # Convert back to text and save
        new_manifesto = save_manifesto_from_rules(rules)
        if save_manifesto(new_manifesto):
            reload_manifesto()
            return {"success": True, "message": "Rule deleted successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to save manifesto")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.websocket("/ws/live")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        await websocket.close(code=1008, reason="API Key not found")
        return

    session = None
    receive_task = None
    
    try:
        # Send connection status
        await websocket.send_json({
            "type": "status",
            "message": "Connecting to Gemini Live API..."
        })
        
        # Context will be received in the main loop, initialize session first
        try:
            session = GeminiLiveSession(api_key=api_key, audit_context=None)
            await session.connect()
        except Exception as e:
            error_msg = str(e)
            print(f"Gemini connection error: {error_msg}")
            error_detail = "Gemini Live API bağlantı hatası. "
            if "Invalid status code" in error_msg or "401" in error_msg:
                error_detail += "API anahtarı geçersiz olabilir veya Gemini Live API etkin değil."
            elif "timeout" in error_msg.lower():
                error_detail += "Bağlantı zaman aşımına uğradı. API anahtarınızı kontrol edin."
            elif "Connection closed" in error_msg:
                error_detail += "Bağlantı kapandı. API anahtarı veya endpoint sorunlu olabilir."
            else:
                error_detail += error_msg
            
            await websocket.send_json({
                "type": "error",
                "message": error_detail
            })
            await websocket.close(code=1011, reason="Gemini connection failed")
            return
        
        if not session.ws:
            await websocket.send_json({
                "type": "error",
                "message": "Failed to connect to Gemini Live API. Please check your API key."
            })
            await websocket.close(code=1011, reason="Gemini connection failed")
            return
        
        # Send success status
        await websocket.send_json({
            "type": "status",
            "message": "Connected successfully"
        })
        
        # Task to receive from Gemini and send to Frontend
        async def receive_from_gemini():
            try:
                print("🎧 Starting to receive audio from Gemini...")
                audio_received_count = 0
                async for audio_chunk in session.receive_audio():
                    audio_received_count += 1
                    print(f"✅ Received audio chunk #{audio_received_count} from Gemini, size: {len(audio_chunk)} bytes")
                    if websocket.client_state.name == "CONNECTED":
                        # Send audio chunk to frontend (base64 encoded)
                        await websocket.send_json({
                            "type": "audio",
                            "data": base64.b64encode(audio_chunk).decode("utf-8")
                        })
                        print(f"📤 Sent audio chunk #{audio_received_count} to frontend")
                    else:
                        print("⚠️ WebSocket not connected, cannot send audio to frontend")
                print(f"🎧 Finished receiving audio from Gemini (total: {audio_received_count} chunks)")
            except Exception as e:
                print(f"❌ Error in receive_from_gemini: {e}")
                import traceback
                traceback.print_exc()
                if websocket.client_state.name == "CONNECTED":
                    await websocket.send_json({
                        "type": "error",
                        "message": f"Error receiving audio: {str(e)}"
                    })

        # Start background task for receiving
        receive_task = asyncio.create_task(receive_from_gemini())

        # Main loop: Receive from Frontend and send to Gemini
        audio_chunk_count = 0
        context_received = False
        pending_turn_complete = False  # Flag to mark last chunk with turn_complete
        while True:
            try:
                data = await websocket.receive_json()
                if data.get("type") == "context" and "audit_result" in data and not context_received:
                    # Update session with audit context for token optimization
                    audit_context = data.get("audit_result")
                    session.audit_context = audit_context
                    print(f"[CONTEXT] Received audit context: Score {audit_context.get('score')}, {audit_context.get('violations_count')} violations")
                    print("[INFO] Note: Context received after connection. System instruction already sent. Context will be used in future turns.")
                    context_received = True
                    await websocket.send_json({
                        "type": "log",
                        "message": f"Audit context loaded: {audit_context.get('score')}/100 score, {audit_context.get('violations_count')} violations"
                    })
                elif data.get("type") == "audio":
                    # Audio data from frontend (base64)
                    try:
                        audio_bytes = base64.b64decode(data.get("data"))
                        audio_chunk_count += 1
                        
                        # Check if frontend marked this as the final chunk
                        turn_complete = data.get("turn_complete", False)
                        
                        # Log occasionally to avoid spam
                        if audio_chunk_count % 10 == 0 or turn_complete:
                            print(f"[AUDIO] Received audio chunk #{audio_chunk_count}, size: {len(audio_bytes)} bytes, turn_complete={turn_complete}")
                            await websocket.send_json({
                                "type": "log",
                                "message": f"Audio chunk #{audio_chunk_count} received ({len(audio_bytes)} bytes)"
                            })
                        
                        if session and session.ws:
                            if turn_complete:
                                print(f"[INFO] Sending final audio chunk #{audio_chunk_count} with turn_complete=True")
                            await session.send_audio_chunk(audio_bytes, turn_complete=turn_complete)
                        else:
                            print("[WARNING] Session or WebSocket not available")
                    except Exception as e:
                        print(f"[ERROR] Error processing audio chunk: {e}")
                        import traceback
                        traceback.print_exc()
                elif data.get("type") == "turn_complete":
                    # Fallback: if frontend didn't send turn_complete with last chunk
                    print("[INFO] Turn complete signal received from frontend (fallback)")
                    if session and session.ws:
                        try:
                            # Send empty turn with turn_complete=True
                            print("[INFO] Sending turn_complete signal (empty turn) to Gemini")
                            await session.send_turn_complete()
                            
                            print("[OK] Turn complete sent to Gemini - waiting for response...")
                            await websocket.send_json({
                                "type": "log",
                                "message": "Turn complete signal sent to Gemini, waiting for response..."
                            })
                        except Exception as e:
                            print(f"[ERROR] Error sending turn_complete: {e}")
                            import traceback
                            traceback.print_exc()
                            await websocket.send_json({
                                "type": "error",
                                "message": f"Error sending turn_complete: {str(e)}"
                            })
                    else:
                        print("[WARNING] Session or WebSocket not available for turn_complete")
                elif data.get("type") == "stop":
                    print("🛑 Stop signal received")
                    break
            except Exception as e:
                print(f"❌ Error in WebSocket loop: {e}")
                import traceback
                traceback.print_exc()
                break
                
    except WebSocketDisconnect:
        print("Client disconnected")
    except Exception as e:
        print(f"WebSocket error: {e}")
        import traceback
        traceback.print_exc()
        if websocket.client_state.name == "CONNECTED":
            try:
                await websocket.send_json({
                    "type": "error",
                    "message": f"WebSocket error: {str(e)}"
                })
            except:
                pass
    finally:
        if session:
            try:
                await session.close()
            except:
                pass
        if receive_task:
            receive_task.cancel()
            try:
                await receive_task
            except asyncio.CancelledError:
                pass

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

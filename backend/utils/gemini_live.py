import asyncio
import json
import base64
import websockets

class GeminiLiveSession:
    def __init__(self, api_key, model="gemini-2.0-flash-exp", audit_context=None):
        self.api_key = api_key
        # Remove "models/" prefix if present
        self.model = model.replace("models/", "") if model.startswith("models/") else model
        # The endpoint for AI Studio WebSocket is different.
        # Constructing the URI with the API Key as a query parameter.
        self.uri = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={self.api_key}"
        self.ws = None
        self.audit_context = audit_context  # Store audit context for token optimization

    async def connect(self):
        """Establishes the WebSocket connection."""
        try:
            print(f"Attempting to connect to Gemini Live API: {self.uri[:50]}...")
            self.ws = await websockets.connect(
                self.uri,
                ping_interval=None,  # Disable ping/pong for Gemini
                close_timeout=10
            )
            print("WebSocket connection established")
            
            # Initial setup message - Gemini Live API format
            setup_msg = {
                "setup": {
                    "model": f"models/{self.model}",
                    "generation_config": {
                        "response_modalities": ["AUDIO"],
                        "speech_config": {
                            "voice_config": {
                                "prebuilt_voice_config": {
                                    "voice_name": "Aoede"
                                }
                            }
                        }
                    },
                    "system_instruction": {
                        "parts": [{"text": self._build_system_instruction()}]
                    }
                }
            }
            print(f"Using model: models/{self.model}")
            print("Sending setup message:", json.dumps(setup_msg, indent=2))
            await self.ws.send(json.dumps(setup_msg))
            print("Setup message sent. Waiting for response...")
            
            # Wait for setup response with longer timeout
            try:
                response = await asyncio.wait_for(self.ws.recv(), timeout=15.0)
                response_data = json.loads(response)
                print(f"Setup response received: {json.dumps(response_data, indent=2)}")
                
                # Check for errors in response
                if "error" in response_data:
                    error_detail = response_data.get("error", {})
                    error_msg = error_detail.get("message", "Unknown error")
                    raise Exception(f"Gemini API error: {error_msg}")
                
                # Check for serverContent with error
                if "serverContent" in response_data:
                    server_content = response_data["serverContent"]
                    if "error" in server_content:
                        error_detail = server_content["error"]
                        error_msg = error_detail.get("message", "Unknown error")
                        raise Exception(f"Gemini API error: {error_msg}")
                
                # Consume initial turn_complete if present (sometimes sent after setup)
                # This prevents the first turn from being confused
                # Loop until no more immediate messages or until a real turn starts
                # But careful not to block. For now, we assume setup response is enough.
                
                print("Successfully connected to Gemini Live API")
            except asyncio.TimeoutError:
                # If no response, assume connection is OK and continue
                print("No setup response received, but connection seems OK. Continuing...")
        except asyncio.TimeoutError:
            error_msg = "Connection timeout - Gemini API did not respond. API key may be invalid or endpoint may have changed."
            print(error_msg)
            raise Exception(error_msg)
        except websockets.exceptions.InvalidStatusCode as e:
            error_msg = f"Invalid status code: {e.status_code} - Check your API key and ensure Gemini Live API is enabled"
            print(error_msg)
            raise Exception(error_msg)
        except websockets.exceptions.ConnectionClosed as e:
            error_msg = f"Connection closed: {e.code} - {e.reason or 'Unknown reason'}"
            print(error_msg)
            raise Exception(error_msg)
        except Exception as e:
            error_msg = f"Failed to connect to Live API: {str(e)}"
            print(f"Full error details: {type(e).__name__}: {error_msg}")
            import traceback
            print(traceback.format_exc())
            raise Exception(error_msg)
    
    def _build_system_instruction(self):
        """Builds optimized system instruction with audit context if available."""
        base_instruction = "You are a Ruthless but Helpful Senior Data Viz Expert. You strictly follow the Manifesto."
        
        if self.audit_context:
            # Token optimization: Only include key audit information
            score = self.audit_context.get('score', 'N/A')
            summary = self.audit_context.get('summary', '')
            violations = self.audit_context.get('top_violations', [])
            
            context_text = f"""
            
CURRENT DASHBOARD AUDIT CONTEXT (for token optimization):
- Score: {score}/100
- Summary: {summary}
- Top Violations: {', '.join([v.get('issue', '')[:50] for v in violations[:3]])}

Use this context to provide more relevant and specific advice. Focus on the violations mentioned above.
"""
            return base_instruction + context_text
        else:
            return base_instruction + "\n\nNote: No dashboard audit context available. User may ask general questions about Power BI best practices."

    async def send_audio_chunk(self, audio_bytes, turn_complete=False):
        """Sends audio bytes to the model.
        
        Args:
            audio_bytes: Audio data in PCM format
            turn_complete: If True, marks this as the last chunk of the turn
        """
        if not self.ws:
            print("[WARNING] WebSocket not available for sending audio")
            return
        
        try:
            msg = {
                "client_content": {
                    "turns": [{
                        "role": "user",
                        "parts": [{
                            "inline_data": {
                                "mime_type": "audio/pcm;rate=16000",  # PCM format, 16kHz
                                "data": base64.b64encode(audio_bytes).decode("utf-8")
                            }
                        }]
                    }],
                    "turn_complete": turn_complete
                }
            }
            await self.ws.send(json.dumps(msg))
            if turn_complete:
                print("[INFO] Sent final audio chunk with turn_complete=True")
        except Exception as e:
            print(f"[ERROR] Error sending audio chunk: {e}")
            import traceback
            traceback.print_exc()
            raise
    
    async def send_turn_complete(self):
        """Sends turn_complete signal with an empty turn.
        Note: This should only be used when no audio chunks were sent.
        Otherwise, use send_audio_chunk(..., turn_complete=True) instead.
        """
        if not self.ws:
            print("[WARNING] WebSocket not available for sending turn_complete")
            return
        
        try:
            # Send turn_complete with an empty turn (parts array is empty)
            msg = {
                "client_content": {
                    "turns": [{
                        "role": "user",
                        "parts": []
                    }],
                    "turn_complete": True
                }
            }
            print("[SEND] Sending turn_complete (empty turn) to Gemini:", json.dumps(msg))
            await self.ws.send(json.dumps(msg))
            print("[OK] Turn complete sent to Gemini")
        except Exception as e:
            print(f"[ERROR] Error sending turn_complete: {e}")
            import traceback
            traceback.print_exc()
            raise

    async def receive_audio(self):
        """Generator that yields audio chunks from the model."""
        if not self.ws:
            print("[WARNING] WebSocket not available for receiving audio")
            return

        try:
            message_count = 0
            print("[INFO] Starting to listen for messages from Gemini...")
            print("[DEBUG] WebSocket state:", self.ws.state if hasattr(self.ws, 'state') else "unknown")
            
            async for message in self.ws:
                try:
                    message_count += 1
                    response = json.loads(message)
                    
                    # Log ALL messages for debugging (first 10)
                    if message_count <= 10:
                        print(f"[RECV] Message #{message_count} from Gemini: {list(response.keys())}")
                        if "serverContent" in response:
                            print(f"   Has serverContent: {bool(response.get('serverContent'))}")
                            server_content = response.get("serverContent")
                            if server_content:
                                print(f"   serverContent keys: {list(server_content.keys())}")
                    
                    # Log response structure occasionally
                    if message_count % 10 == 0:
                        print(f"[RECV] Received message #{message_count} from Gemini")
                    
                    server_content = response.get("serverContent")
                    if server_content:
                        model_turn = server_content.get("modelTurn")
                        if model_turn:
                            parts = model_turn.get("parts", [])
                            print(f"[AUDIO] Model turn has {len(parts)} parts")
                            for part in parts:
                                if "inlineData" in part:
                                    inline_data = part["inlineData"]
                                    mime_type = inline_data.get("mime_type", "unknown")
                                    audio_data = base64.b64decode(inline_data["data"])
                                    print(f"[AUDIO] Yielding audio chunk: {len(audio_data)} bytes, format: {mime_type}")
                                    yield audio_data
                                elif "text" in part:
                                    # Sometimes Gemini sends text instead of audio
                                    text_content = part.get("text", "")
                                    print(f"[TEXT] Gemini sent text instead of audio: {text_content[:100]}")
                        else:
                            if message_count <= 10:
                                print(f"[DEBUG] Model turn not found in serverContent. Keys: {list(server_content.keys())}")
                                print(f"[DEBUG] Full serverContent: {json.dumps(server_content, indent=2)[:500]}")
                    else:
                        # Check for other message types
                        if "error" in response:
                            error_detail = response.get("error", {})
                            print(f"[ERROR] Gemini error: {error_detail}")
                        elif message_count <= 10:
                            print(f"[DEBUG] Response structure (no serverContent): {list(response.keys())}")
                            if "setupComplete" in response:
                                print("   Setup complete message received")
                            else:
                                print(f"[DEBUG] Full response (first 500 chars): {json.dumps(response, indent=2)[:500]}")
                except json.JSONDecodeError as e:
                    print(f"[ERROR] Error parsing message: {e}")
                    print(f"Raw message: {message[:200]}")
                except Exception as e:
                    print(f"[ERROR] Error processing audio response: {e}")
                    import traceback
                    traceback.print_exc()
        except websockets.exceptions.ConnectionClosed as e:
            print(f"[ERROR] WebSocket connection closed: {e.code} - {e.reason}")
            raise
        except Exception as e:
            print(f"[ERROR] Error in receive_audio: {e}")
            import traceback
            traceback.print_exc()

    async def close(self):
        if self.ws:
            await self.ws.close()


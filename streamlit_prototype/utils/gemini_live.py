import asyncio
import json
import base64
import websockets
import streamlit as st

# Note: The Gemini Live API via WebSockets for the free tier (AI Studio) 
# uses a different endpoint and authentication mechanism (API Key).
# This is a simplified implementation.

class GeminiLiveSession:
    def __init__(self, api_key, model="models/gemini-2.5-flash"):
        self.api_key = api_key
        self.model = model
        # The endpoint for AI Studio WebSocket is different.
        # Constructing the URI with the API Key as a query parameter.
        self.uri = f"wss://generativelanguage.googleapis.com/ws/google.ai.generativelanguage.v1alpha.GenerativeService.BidiGenerateContent?key={self.api_key}"
        self.ws = None

    async def connect(self):
        """Establishes the WebSocket connection."""
        try:
            self.ws = await websockets.connect(self.uri)
            
            # Initial setup message
            setup_msg = {
                "setup": {
                    "model": f"models/{self.model}",
                    "generation_config": {
                        "response_modalities": ["AUDIO"]
                    },
                    "system_instruction": {
                        "parts": [{"text": "You are a Ruthless but Helpful Senior Data Viz Expert. You strictly follow the Manifesto."}]
                    }
                }
            }
            await self.ws.send(json.dumps(setup_msg))
            print("Connected to Gemini Live API (AI Studio)")
        except Exception as e:
            st.error(f"Failed to connect to Live API: {e}")

    async def send_audio_chunk(self, audio_bytes):
        """Sends audio bytes to the model."""
        if not self.ws:
            return
        
        msg = {
            "client_content": {
                "turns": [{
                    "role": "user",
                    "parts": [{"inline_data": {"mime_type": "audio/pcm;rate=16000", "data": base64.b64encode(audio_bytes).decode("utf-8")}}]
                }],
                "turn_complete": False
            }
        }
        await self.ws.send(json.dumps(msg))

    async def receive_audio(self):
        """Generator that yields audio chunks from the model."""
        if not self.ws:
            return

        async for message in self.ws:
            response = json.loads(message)
            server_content = response.get("serverContent")
            if server_content:
                model_turn = server_content.get("modelTurn")
                if model_turn:
                    for part in model_turn.get("parts", []):
                        if "inlineData" in part:
                            yield base64.b64decode(part["inlineData"]["data"])

    async def close(self):
        if self.ws:
            await self.ws.close()

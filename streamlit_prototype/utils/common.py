import os
import streamlit as st
import google.generativeai as genai

def load_manifesto():
    """Reads the manifesto.md file from the project root."""
    try:
        with open("manifesto.md", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        st.error("manifesto.md not found. Please ensure it is in the project root.")
        return ""

def configure_genai(api_key):
    """Configures the Google Generative AI SDK."""
    try:
        genai.configure(api_key=api_key)
        return True
    except Exception as e:
        st.error(f"Failed to configure Gemini API: {e}")
        return False

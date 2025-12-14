import google.generativeai as genai
import os

# Get API key from environment or user input
api_key = input("Enter your API Key: ")
genai.configure(api_key=api_key)

print("Listing available models...")
for m in genai.list_models():
  if 'generateContent' in m.supported_generation_methods:
    print(m.name)

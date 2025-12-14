import json
import google.generativeai as genai
import streamlit as st
import time

def generate_assets(audit_result, manifesto_text):
    """
    Generates a theme.json and a step-by-step action list based on the audit.
    """
    model = genai.GenerativeModel("models/gemini-2.5-flash")

    prompt = f"""
    Sen "İnşaatçı" (The Builder), bir Power BI Uygulama Uzmanısın.
    Aşağıdaki Denetim Raporu ve Manifesto'ya dayanarak, dashboard'u düzeltmek için gerekli varlıkları oluştur.

    MANIFESTO:
    {manifesto_text}

    DENETİM RAPORU:
    {json.dumps(audit_result)}

    GÖREV:
    1. Manifesto'daki Renk ve Tipografi kurallarını uygulayan geçerli bir Power BI `theme.json` dosyası içeriği oluştur.
    2. Kullanıcının Power BI Desktop'ta uygulaması için adım adım bir Aksiyon Listesi oluştur.
    3. ÇIKTI DİLİ: TÜRKÇE.

    ÇIKTI FORMATI (SADECE JSON):
    {{
        "theme_json": {{ ... geçerli power bi theme json yapısı ... }},
        "action_list": [
            {{
                "step": 1,
                "action": "<aksiyon_türkçe>",
                "reason": "Bölüm 2 (Grafik Seçimi) ihlali..."
            }},
            ...
        ]
    }}
    """

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            if "429" in str(e) or "Quota" in str(e):
                wait_time = (2 ** attempt) * 5
                print(f"Quota exceeded. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                st.error(f"Error generating assets: {e}")
                return None
    st.error("Quota exceeded. Please try again later.")
    return None

def revise_assets(current_assets, user_feedback, manifesto_text):
    """
    Updates the theme.json and action_list based on user feedback.
    """
    model = genai.GenerativeModel("models/gemini-2.5-flash")
    
    prompt = f"""
    Sen "İnşaatçı"sın (The Builder).
    Kullanıcı mevcut uygulama planını revize etmek istiyor.
    
    MEVCUT VARLIKLAR:
    {json.dumps(current_assets)}
    
    KULLANICI GERİ BİLDİRİMİ:
    "{user_feedback}"
    
    MANIFESTO:
    {manifesto_text[:1000]}...
    
    GÖREV:
    `theme_json` ve `action_list` içeriğini kullanıcının geri bildirimine göre güncelle, ancak Manifesto'ya sadık kal.
    ÇIKTI DİLİ: TÜRKÇE.
    
    ÇIKTI FORMATI (SADECE JSON):
    {{
        "theme_json": {{ ... güncellenmiş json ... }},
        "action_list": [ ... güncellenmiş liste ... ]
    }}
    """
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            if "429" in str(e) or "Quota" in str(e):
                wait_time = (2 ** attempt) * 5
                print(f"Quota exceeded. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                st.error(f"Revision failed: {e}")
                return None
    st.error("Quota exceeded. Please try again later.")
    return None

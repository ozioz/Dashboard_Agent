import json
import google.generativeai as genai
from PIL import Image
import io
import time

def audit_dashboard(image_bytes, manifesto_text):
    """
    Audits the dashboard image against the manifesto using Gemini 2.5 Flash.
    Returns a JSON object with score and feedback.
    """
    model = genai.GenerativeModel("models/gemini-2.5-flash")

    try:
        image = Image.open(io.BytesIO(image_bytes))
    except Exception as e:
        print(f"Error processing image: {e}")
        return None

    prompt = f"""
    Sen "Acımasız Eleştirmen" (The Ruthless Critic), Kıdemli bir Power BI Denetçisisin.
    Görevin, aşağıdaki Manifesto'ya göre verilen dashboard ekran görüntüsünü sıkı bir şekilde denetlemektir.
    
    MANIFESTO:
    {manifesto_text}
    
    TALİMATLAR:
    1. Görseli analiz et.
    2. Her öğeyi Manifesto kurallarına göre çapraz kontrol et.
    3. ACIMASIZ OL. Her ihlal için puan kır.
    4. 100 puan ile başla.
    5. Bölüm 6: Anlamsal İsimlendirme & Erişilebilirlik konusuna dikkat et. Teknik isimler büyük hatadır.
    6. ÇIKTI DİLİ: TÜRKÇE.
    
    ÇIKTI FORMATI (SADECE JSON):
    {{
        "score": <tamsayı_0_100>,
        "summary": "<kısa_acımasız_özet_türkçe>",
        "violations": [
            {{
                "rule_section": "<bölüm_numarası_ve_adı>",
                "issue": "<ihlal_açıklaması_türkçe>",
                "recommendation": "<spesifik_çözüm_türkçe>",
                "severity": "<High|Medium|Low>"
            }}
        ],
        "positive_points": ["<nokta1_türkçe>", "<nokta2_türkçe>"]
    }}
    """

    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = model.generate_content(
                [prompt, image],
                generation_config={"response_mime_type": "application/json"}
            )
            return json.loads(response.text)
        except Exception as e:
            if "429" in str(e) or "Quota" in str(e):
                wait_time = (2 ** attempt) * 5
                print(f"Quota exceeded. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"Error during audit: {e}")
                return None
    print("Quota exceeded. Please try again later.")
    return None

def generate_dashboard_simulation(manifesto_text, audit_result, user_feedback=None):
    """
    Generates a simulated image of the future dashboard state using 'gemini-2.5-flash' (SVG).
    """
    model = genai.GenerativeModel("models/gemini-2.5-flash")
    
    violations_summary = ", ".join([v['issue'] for v in audit_result.get('violations', [])[:5]])
    
    prompt = f"""
    Sen uzman bir UI Tasarımcısısın.
    Aşağıdaki kurallara sıkı sıkıya uyan bir Power BI Dashboard'unun detaylı SVG kodunu oluştur:
    {manifesto_text[:500]}...
    
    Önceki versiyonda bulunan şu ihlalleri düzeltmeli:
    {violations_summary}
    
    {f"Kullanıcı Revizyon İsteği: {user_feedback}" if user_feedback else ""}
    
    ÇIKTI: Sadece dashboard arayüzünün ham SVG kodunu ver. Profesyonel, temiz görünmeli ve manifestodaki renkleri kullanmalı.
    """
    
    max_retries = 3
    for attempt in range(max_retries):
        try:
            response = model.generate_content(prompt)
            text = response.text
            
            # Robust SVG extraction using regex
            import re
            match = re.search(r'<svg.*?</svg>', text, re.DOTALL)
            if match:
                return match.group(0)
            
            # Fallback: Check for markdown blocks if regex fails
            if "```svg" in text:
                return text.split("```svg")[1].split("```")[0].strip()
            elif "```xml" in text:
                return text.split("```xml")[1].split("```")[0].strip()
                
            return text.strip()
        except Exception as e:
            if "429" in str(e) or "Quota" in str(e):
                wait_time = (2 ** attempt) * 5
                print(f"Quota exceeded. Retrying in {wait_time}s...")
                time.sleep(wait_time)
            else:
                print(f"Simulation generation failed: {e}")
                return None
    print("Quota exceeded. Please try again later.")
    return None

def get_chat_response(chat_history, user_input, manifesto_text, audit_result):
    """
    Generates a response from the Consultant based on chat history and audit context.
    """
    model = genai.GenerativeModel("models/gemini-2.5-flash")
    
    # 1. Optimize Context: Truncate History
    # Keep only the last 5 messages to save tokens
    recent_history = chat_history[-5:] if len(chat_history) > 5 else chat_history
    
    # 2. Optimize Context: Summarize Audit Result
    # Instead of full JSON, send key metrics
    audit_summary = {
        "score": audit_result.get('score'),
        "summary": audit_result.get('summary'),
        "violations_count": len(audit_result.get('violations', [])),
        "top_violations": [v['issue'] for v in audit_result.get('violations', [])[:3]]
    }

    # Construct context
    context = f"""
    Sen Kıdemli bir Veri Görselleştirme Danışmanısın.
    Kullanıcı ile Power BI dashboard'u hakkında konuşuyorsun.
    
    BAĞLAM:
    Manifesto (Özet): {manifesto_text[:1000]}...
    
    Denetim Durumu:
    {json.dumps(audit_summary, ensure_ascii=False)}
    
    KULLANICI GEÇMİŞİ (Son 10 Mesaj):
    {json.dumps(recent_history, ensure_ascii=False)}
    
    SON KULLANICI MESAJI:
    {user_input}
    
    GÖREV:
    Kullanıcının sorusunu yanıtla. Yardımcı ol, eğitici ol ama Manifesto kurallarından taviz verme.
    Kısa ve öz cevap ver.
    """
    
    try:
        response = model.generate_content(context)
        return response.text
    except Exception as e:
        return f"Üzgünüm, bir hata oluştu: {e}"

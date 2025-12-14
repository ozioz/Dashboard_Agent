import json
import google.generativeai as genai
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

    ÖNEMLİ KURALLAR - AKSİYON LİSTESİ İÇİN:
    - SADECE ihlale yönelik, spesifik aksiyonlar üret. Her aksiyon bir violation'a direkt bağlı olmalı.
    - Pre-operations (ön hazırlık) adımları EKLEME: "Power BI Desktop'ı açın", "Tema dosyasını yükleyin", "Görünüm sekmesine gidin" gibi genel setup adımları.
    - Kullanıcı zaten Power BI Desktop'ta çalışıyor varsay. Sadece dashboard içindeki spesifik değişikliklere odaklan.
    - Her aksiyon, denetim raporundaki bir violation'ı düzeltmeye yönelik olmalı.
    - Aksiyonlar, dashboard içindeki görsel, renk, tipografi, isimlendirme gibi spesifik değişiklikleri içermeli.
    - Örnek İYİ aksiyon: "'Region Overview' görselini seçin ve 'Kümelenmiş Yatay Çubuk Grafik'ten 'Yatay Çubuk Grafik'e dönüştürün."
    - Örnek KÖTÜ aksiyon: "Power BI Desktop'ı açın" veya "Tema dosyasını yükleyin" (bunlar pre-operations).

    ÇIKTI FORMATI (SADECE JSON):
    {{
        "theme_json": {{ ... geçerli power bi theme json yapısı ... }},
        "action_list": [
            {{
                "step": 1,
                "action": "<ihlale_yönelik_spesifik_aksiyon_türkçe>",
                "reason": "<violation_rule_section> ihlali: <violation_issue>"
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
                print(f"Error generating assets: {e}")
                return None
    print("Quota exceeded. Please try again later.")
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
    
    ÖNEMLİ KURALLAR - AKSİYON LİSTESİ İÇİN:
    - SADECE ihlale yönelik, spesifik aksiyonlar üret. Her aksiyon bir violation'a direkt bağlı olmalı.
    - Pre-operations (ön hazırlık) adımları EKLEME: "Power BI Desktop'ı açın", "Tema dosyasını yükleyin", "Görünüm sekmesine gidin" gibi genel setup adımları.
    - Kullanıcı zaten Power BI Desktop'ta çalışıyor varsay. Sadece dashboard içindeki spesifik değişikliklere odaklan.
    - Her aksiyon, dashboard içindeki görsel, renk, tipografi, isimlendirme gibi spesifik değişiklikleri içermeli.
    
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
                print(f"Revision failed: {e}")
                return None
    print("Quota exceeded. Please try again later.")
    return None

import streamlit as st
import os
import json
import base64
from utils.common import load_manifesto, configure_genai
from utils.auditor import audit_dashboard, generate_future_state, generate_dashboard_simulation, get_chat_response
from utils.builder import generate_assets, revise_assets

# Page Config
st.set_page_config(page_title="Power BI Akıllı Denetçi", layout="wide")

# Sidebar
st.sidebar.title("Ayarlar")

# Check for secrets
if "GOOGLE_API_KEY" in st.secrets:
    st.sidebar.success("API Anahtarı Sistemden Yüklendi (Secrets)")
    api_key = st.secrets["GOOGLE_API_KEY"]
    if configure_genai(api_key):
        st.session_state['genai_configured'] = True
        st.session_state['api_key'] = api_key
else:
    api_key = st.sidebar.text_input("Google AI Studio API Anahtarı", type="password")
    if st.sidebar.button("Gemini API'yi Başlat"):
        if api_key:
            if configure_genai(api_key):
                st.sidebar.success("Gemini API Bağlandı")
                st.session_state['genai_configured'] = True
                st.session_state['api_key'] = api_key
        else:
            st.sidebar.error("Lütfen bir API Anahtarı girin.")

# Main Title
st.title("Power BI Akıllı Denetim & İyileştirme Asistanı")
st.markdown("### Gemini 2.5 Flash ile Güçlendirilmiştir")

# Instructions
with st.expander("ℹ️ Nasıl Kullanılır? (Adım Adım Kılavuz)", expanded=True):
    st.markdown("""
    1.  **Görsel Yükleme:** 'Statik Denetim' sekmesinden Power BI dashboard ekran görüntüsünü yükleyin.
    2.  **Denetim Başlat:** 'Denetimi Başlat' butonuna basarak yapay zekanın raporunu bekleyin.
    3.  **Sonuçlar & Aksiyon:** Puanınızı inceleyin, 'Aksiyon Planı' sekmesinden düzeltmeleri seçip simülasyonu görün.
    4.  **Canlı Danışman:** Denetim bittikten sonra 'Canlı Danışman' sekmesine geçin.
        *   *Neden?* Danışman, dashboard'unuzu ve hatalarınızı öğrenmek için önce denetim raporuna ihtiyaç duyar.
    5.  **Sohbet:** Danışmana sesli veya yazılı olarak sorularınızı sorun (Örn: "Puanımı nasıl yükseltirim?").
    """)

# Load Manifesto
manifesto_text = load_manifesto()
if not manifesto_text:
    st.stop()

# Tabs
tab1, tab2 = st.tabs(["📊 Statik Denetim", "🎙️ Canlı Danışman"])

# --- TAB 1: STATIC AUDIT ---
with tab1:
    st.header("Faz 1: Acımasız Eleştirmen")
    
    uploaded_file = st.file_uploader("Dashboard Ekran Görüntüsü Yükle", type=["png", "jpg", "jpeg"])
    
    if uploaded_file is not None:
        st.image(uploaded_file, caption="Yüklenen Dashboard", use_container_width=True)
        
        if st.button("Denetimi Başlat"):
            if 'genai_configured' not in st.session_state:
                st.error("Lütfen önce sol menüden Gemini API'yi yapılandırın.")
            else:
                with st.spinner("Acımasız Eleştirmen dashboard'unuzu inceliyor..."):
                    # Read image bytes
                    image_bytes = uploaded_file.getvalue()
                    
                    # 1. Audit
                    audit_result = audit_dashboard(image_bytes, manifesto_text)
                    
                    if audit_result:
                        st.session_state['audit_result'] = audit_result
                        st.session_state['image_bytes'] = image_bytes
                        st.session_state['assets'] = None # Reset assets on new audit
                        st.session_state['show_simulation'] = False # Reset simulation
                        st.session_state['simulation_svg'] = None

        # --- RESULTS DASHBOARD ---
        if 'audit_result' in st.session_state:
            audit_result = st.session_state['audit_result']
            
            st.divider()
            st.markdown("## 📊 Denetim Raporu Sonuçları")
            
            # Extract Score
            score = audit_result.get('score', 0)
            
            # Top Level Metrics
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric(label="Uyumluluk Puanı", value=f"{score}/100", delta=score-100)
            with col2:
                violation_count = len(audit_result.get('violations', []))
                st.metric(label="Toplam İhlal", value=violation_count, delta=-violation_count, delta_color="inverse")
            with col3:
                st.metric(label="Durum", value="Geliştirilmeli" if score < 80 else "İyi")

            # Detailed Feedback Tabs
            res_tab1, res_tab2, res_tab3 = st.tabs(["📝 Acımasız Geri Bildirim", "🚫 İhlal Detayları", "🛠️ Aksiyon Planı"])
            
            with res_tab1:
                st.info(audit_result.get('summary', ''))
                if 'positive_points' in audit_result:
                    st.success(f"**Pozitif Yönler:** {', '.join(audit_result['positive_points'])}")

            with res_tab2:
                for v in audit_result.get('violations', []):
                    severity_color = "red" if v.get('severity') == 'High' else "orange"
                    with st.expander(f":{severity_color}[{v.get('severity')}] {v.get('issue')}"):
                        st.markdown(f"**📜 Kural:** `{v.get('rule_section')}`")
                        st.markdown(f"**💡 Öneri:** {v.get('recommendation')}")

            with res_tab3:
                st.subheader("Uygulama Varlıkları")
                with st.spinner("İnşaatçı (The Builder) varlıkları hazırlıyor..."):
                    # Check if assets are already in session state
                    if 'assets' not in st.session_state or st.session_state['assets'] is None:
                        assets = generate_assets(audit_result, manifesto_text)
                        st.session_state['assets'] = assets
                    else:
                        assets = st.session_state['assets']

                    if assets:
                        # 1. Action List Form
                        with st.form("action_list_form"):
                            st.write("### 1. Adım Adım Düzeltmeler")
                            for i, item in enumerate(assets.get('action_list', [])):
                                st.checkbox(f"**{item.get('action')}** — _{item.get('reason')}_", key=f"action_{i}")
                            
                            submitted = st.form_submit_button("Onayla & Gelecek Durumu Simüle Et")
                        
                        if submitted:
                            st.session_state['show_simulation'] = True

                        # 2. Simulation & Revision
                        if st.session_state.get('show_simulation'):
                            st.divider()
                            st.write("### 2. Simüle Edilmiş Gelecek Durum")
                            
                            if 'simulation_svg' not in st.session_state or st.session_state['simulation_svg'] is None:
                                with st.spinner("'gemini-2.5-flash' ile simülasyon oluşturuluyor..."):
                                    svg_code = generate_dashboard_simulation(manifesto_text, audit_result)
                                    st.session_state['simulation_svg'] = svg_code
                            
                            if st.session_state.get('simulation_svg'):
                                try:
                                    # Ensure SVG is valid base64
                                    svg_b64 = base64.b64encode(st.session_state['simulation_svg'].encode()).decode()
                                    st.image(f"data:image/svg+xml;base64,{svg_b64}", use_container_width=True)
                                except Exception as e:
                                    st.error(f"Simülasyon çizilemedi: {e}")
                                    st.code(st.session_state['simulation_svg'])
                                
                                # Revision Form
                                st.write("### 3. İyileştir & İndir")
                                with st.form("revision_form"):
                                    user_feedback = st.text_area("Değişiklik İste (Örn: 'Arka planı daha koyu yap')", placeholder="Geri bildiriminizi buraya girin...")
                                    revise_btn = st.form_submit_button("Varlıkları ve Simülasyonu Revize Et")
                                    
                                    if revise_btn and user_feedback:
                                        with st.spinner("Revize ediliyor..."):
                                            # Revise Assets
                                            new_assets = revise_assets(assets, user_feedback, manifesto_text)
                                            if new_assets:
                                                st.session_state['assets'] = new_assets
                                                assets = new_assets # Update local var
                                            
                                            # Revise Simulation
                                            new_svg = generate_dashboard_simulation(manifesto_text, audit_result, user_feedback)
                                            if new_svg:
                                                st.session_state['simulation_svg'] = new_svg
                                            
                                            st.rerun()

                        # 3. Download JSON
                        if st.session_state.get('show_simulation'):
                            st.write("### 4. Final Dışa Aktarım")
                            theme_json_str = json.dumps(assets.get('theme_json', {}), indent=2)
                            st.download_button(
                                label="theme.json İndir",
                                data=theme_json_str,
                                file_name="theme.json",
                                mime="application/json"
                            )
                            with st.expander("Theme JSON Dosyasını Görüntüle"):
                                st.json(assets.get('theme_json', {}))

# --- TAB 2: LIVE CONSULTATION ---
with tab2:
    st.header("Faz 2: Canlı Danışman Modu")
    st.markdown("Dashboard'unuz hakkında **Kıdemli Veri Görselleştirme Uzmanı** ile konuşun.")
    
    if 'audit_result' not in st.session_state:
        st.warning("Lütfen önce Statik Denetimi tamamlayın, böylece asistan bağlamı öğrenebilir.")
    else:
        # Initialize chat history
        if "chat_history" not in st.session_state:
            st.session_state.chat_history = []

        # Display chat messages from history on app rerun
        for message in st.session_state.chat_history:
            with st.chat_message(message["role"]):
                st.markdown(message["content"])

        # React to user input
        if prompt := st.chat_input("Sorunuzu buraya yazın..."):
            # Display user message in chat message container
            st.chat_message("user").markdown(prompt)
            # Add user message to chat history
            st.session_state.chat_history.append({"role": "user", "content": prompt})

            # Get response
            with st.spinner("Danışman düşünüyor..."):
                response = get_chat_response(
                    st.session_state.chat_history, 
                    prompt, 
                    manifesto_text, 
                    st.session_state['audit_result']
                )
            
            # Display assistant response in chat message container
            with st.chat_message("assistant"):
                st.markdown(response)
            # Add assistant response to chat history
            st.session_state.chat_history.append({"role": "assistant", "content": response})

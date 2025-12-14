# DashboardMaster - Mimari Dokümantasyon

## 📋 Genel Bakış

DashboardMaster, Power BI dashboard'larını yapay zeka (Google Gemini 2.5 Flash) kullanarak otomatik olarak denetleyen ve iyileştirme önerileri sunan bir full-stack web uygulamasıdır.

## 🏗️ Mimari Yapı

### Teknoloji Stack

**Frontend:**
- Framework: Next.js 16.0.10
- Language: TypeScript
- UI Library: React 19.2.1
- Styling: Tailwind CSS 4
- UI Components: Radix UI
- Icons: Lucide React
- Port: 3000

**Backend:**
- Framework: FastAPI
- Language: Python
- AI Model: Google Gemini 2.5 Flash (text), Gemini 2.0 Flash Exp (voice - temporarily disabled)
- Server: Uvicorn
- WebSocket: Yes (for live audio consultation - temporarily disabled)
- Port: 8000

## 📁 Proje Yapısı

```
DashboardMaster/
├── frontend/                 # Next.js frontend uygulaması
│   ├── src/
│   │   ├── app/             # Next.js App Router sayfaları
│   │   │   ├── page.tsx     # Ana denetim sayfası
│   │   │   ├── rules/       # Manifesto kuralları yönetim sayfası
│   │   │   │   └── page.tsx
│   │   │   └── live/        # Canlı danışman sayfası (legacy)
│   │   │       └── page.tsx
│   │   ├── components/      # React bileşenleri
│   │   │   ├── AudioVisualizer.tsx
│   │   │   └── ui/          # Radix UI bileşenleri
│   │   └── lib/             # Yardımcı fonksiyonlar
│   │       ├── api.ts       # Backend API çağrıları
│   │       └── utils.ts
│   └── package.json
│
├── backend/                  # FastAPI backend uygulaması
│   ├── main.py              # FastAPI uygulaması ve endpoint'ler
│   ├── manifesto.md         # Denetim kuralları (Power BI UI/UX Manifesto)
│   ├── requirements.txt     # Python bağımlılıkları
│   └── utils/
│       ├── common.py        # Ortak yardımcı fonksiyonlar
│       ├── auditor.py       # Dashboard denetim mantığı
│       ├── builder.py       # Theme ve aksiyon listesi oluşturma
│       └── gemini_live.py   # WebSocket audio streaming (voice - temporarily disabled)
│
└── streamlit_prototype/     # Prototip uygulama (eski versiyon)
```

## 🔄 Çalışma Mantığı

### 1. Dashboard Denetim Süreci

```
Kullanıcı → Frontend (Image Upload)
    ↓
Backend API (/audit)
    ↓
auditor.py → audit_dashboard()
    ↓
Gemini 2.5 Flash API
    ↓
Manifesto kurallarına göre analiz
    ↓
JSON Response (score, violations, positive_points)
    ↓
builder.py → generate_assets()
    ↓
Theme JSON + Action List oluşturma (sadece ihlale yönelik aksiyonlar)
    ↓
Frontend'e sonuçların gösterilmesi
```

### 2. Simülasyon Oluşturma

```
Kullanıcı → Seçili aksiyonlar + Feedback
    ↓
Backend API (/simulate)
    ↓
auditor.py → generate_dashboard_simulation()
    ↓
Gemini 2.5 Flash API
    ↓
SVG formatında gelecek durum simülasyonu
    ↓
Frontend'de görselleştirme
```

### 3. Canlı Danışman (Text Chat)

```
Kullanıcı → Text mesajı
    ↓
Backend API (/chat)
    ↓
auditor.py → get_chat_response()
    ↓
Gemini 2.5 Flash API
    ↓
Context-aware yanıt (denetim sonuçları + manifesto)
    ↓
Frontend'de gösterim
```

### 4. Komut Sistemi (/auditor)

```
Kullanıcı → /auditor <kural açıklaması>
    ↓
Backend API (/chat) → handle_auditor_command()
    ↓
Gemini 2.5 Flash API (kural analizi)
    ↓
Manifesto'ya kural ekleme
    ↓
Opsiyonel: Dashboard yeniden değerlendirme
    ↓
Frontend'e yeni sonuçlar
```

### 5. Manifesto Kuralları Yönetimi

```
Kullanıcı → /rules sayfası
    ↓
Backend API (/manifesto/rules)
    ↓
common.py → parse_manifesto_to_rules()
    ↓
CRUD işlemleri (GET, POST, UPDATE, DELETE)
    ↓
manifesto.md güncelleme
    ↓
Frontend'de gösterim
```

## 📡 API Endpoints

### REST Endpoints

| Method | Endpoint | Açıklama | Request | Response |
|--------|----------|----------|---------|----------|
| GET | `/` | Health check | - | `{"message": "Power BI Auditor API is running"}` |
| POST | `/audit` | Dashboard denetimi | `FormData` (file) | `{audit_result, assets}` |
| POST | `/simulate` | Simülasyon oluştur | `{audit_result, user_feedback?}` | `{svg: string}` |
| POST | `/revise` | Varlıkları revize et | `{current_assets, user_feedback}` | `Assets` |
| POST | `/chat` | Metin tabanlı sohbet | `{chat_history, user_input, audit_result, dashboard_image?}` | `{response, command?, requires_reaudit?, new_audit_result?}` |
| GET | `/manifesto/rules` | Manifesto kurallarını getir | - | `{rules: ManifestoSection[]}` |
| POST | `/manifesto/rules/update` | Kural güncelle | `{section_id, rule_id, name?, description?, sub_rules?}` | `{success: boolean}` |
| POST | `/manifesto/rules/add` | Yeni kural ekle | `{section_id, name, description, sub_rules?}` | `{success: boolean}` |
| POST | `/manifesto/rules/delete` | Kural sil | `{section_id, rule_id}` | `{success: boolean}` |

### WebSocket Endpoints

| Endpoint | Açıklama | Durum |
|----------|----------|-------|
| `/ws/live` | Canlı audio danışman | Temporarily disabled |

## 🧠 AI Agent Mimarisi

### Agent Rolleri

1. **Acımasız Eleştirmen (The Ruthless Critic)** - `auditor.py`
   - Model: `gemini-2.5-flash`
   - Görev: Dashboard'u manifesto kurallarına göre denetlemek
   - Çıktı: Score (0-100), violations, positive_points

2. **İnşaatçı (The Builder)** - `builder.py`
   - Model: `gemini-2.5-flash`
   - Görev: Theme JSON ve aksiyon listesi oluşturmak
   - Çıktı: `theme_json`, `action_list` (sadece ihlale yönelik aksiyonlar)
   - Özellik: Pre-operations adımları (Power BI Desktop açma vb.) üretmez

3. **Simülasyon Mimarı** - `auditor.py` (generate_dashboard_simulation)
   - Model: `gemini-2.5-flash`
   - Görev: İyileştirilmiş dashboard'un SVG simülasyonunu oluşturmak
   - Çıktı: SVG string

4. **Canlı Danışman** - `auditor.py` (get_chat_response)
   - Model: `gemini-2.5-flash`
   - Görev: Text tabanlı sohbet ile kullanıcıya yardımcı olmak
   - Özellik: Denetim sonuçlarını context olarak kullanır (token optimizasyonu)
   - Komutlar: `/auditor <kural açıklaması>` - Manifesto'ya yeni kural ekler

5. **Kural Uzmanı** - `main.py` (handle_auditor_command)
   - Model: `gemini-2.5-flash`
   - Görev: Kullanıcının önerdiği kuralı analiz edip manifesto'ya eklemek
   - Çıktı: Güncellenmiş manifesto ve opsiyonel yeniden değerlendirme

6. **Sesli Danışman** - `gemini_live.py` (GeminiLiveSession)
   - Model: `gemini-2.0-flash-exp`
   - Görev: Sesli görüşme ile kullanıcıya yardımcı olmak
   - Durum: Temporarily disabled (audio issues)

## 📄 Manifesto Yapısı

Manifesto (`backend/manifesto.md`) 6 ana bölümden oluşur:

1. **Layout & Grid Architecture**
   - Grid alignment kuralları
   - Whitespace gereksinimleri
   - Z-Pattern narrative flow

2. **Data Visualization Best Practices (IBCS Standards)**
   - Data-ink ratio
   - Chart selection rules
   - Legend placement

3. **Typography & Hierarchy**
   - Font consistency
   - Hierarchy scale
   - Readability rules

4. **Color Palette & Semantics**
   - 3-Color Rule
   - Semantic integrity (Green/Red usage)
   - WCAG AA contrast

5. **Interaction & Usability**
   - Slicer panel organization
   - Visual interactions
   - Tooltip requirements

6. **Semantic Naming & Accessibility**
   - Descriptive titles
   - Business-friendly field names

## 🎨 UI/UX Özellikleri

### Kullanıcı Deneyimi
- **Multi-tab Interface**: Denetim Sonuçları, Aksiyon Planı & Simülasyon, Canlı Danışman
- **Agent Visualization**: Yapay zeka ajanlarının çalışma durumunu görselleştirme
- **Progress Indicators**: Loading states ve progress bars
- **Responsive Design**: Mobil ve desktop uyumlu
- **Auto-scroll Chat**: Mesajlar geldiğinde otomatik scroll
- **Multi-line Input**: Shift+Enter ile yeni satır, Enter ile gönder
- **Tab Persistence**: Aktif tab localStorage'da saklanır

### İyileştirmeler
- Pre-operations adımları aksiyon listesinden kaldırıldı
- Sadece ihlale yönelik spesifik aksiyonlar üretiliyor
- Token optimizasyonu: Denetim sonuçları context olarak kullanılıyor
- Komut sistemi: `/auditor` ile manifesto'ya dinamik kural ekleme

## 🔐 Güvenlik ve Yapılandırma

### Environment Variables

- `GOOGLE_API_KEY`: Google Gemini API anahtarı (gerekli)
- `.env` dosyası `.gitignore`'da (güvenlik)

### CORS Yapılandırması

Backend, development için tüm origin'lere açık (`allow_origins=["*"]`). Production'da kısıtlanmalıdır.

### Güvenlik Önlemleri
- API key'ler environment variable'lardan alınır (hardcoded değil)
- `.env` dosyaları git'e commit edilmez
- Console.log'lar production'da conditional (development mode kontrolü)

## 🚀 Deployment

### Frontend
```bash
cd frontend
npm install
npm run build
npm start
```

### Backend
```bash
cd backend
pip install -r requirements.txt
# .env dosyası oluştur: GOOGLE_API_KEY=your_key_here
uvicorn main:app --host 0.0.0.0 --port 8000
```

## 📊 Veri Akışı

### Audit Request Flow
```
User uploads image
  → Frontend: FormData creation
  → Backend: File upload handling
  → auditor.py: Image processing + Gemini API call
  → Manifesto: Rule checking
  → Response: JSON with score and violations
  → builder.py: Asset generation (only violation-specific actions)
  → Frontend: Display results
```

### Chat Flow
```
User sends message
  → Frontend: API call with chat history + audit context
  → Backend: /chat endpoint
  → Command check: /auditor?
  → If command: handle_auditor_command()
  → Else: get_chat_response()
  → Gemini 2.5 Flash API
  → Response with context-aware answer
  → Frontend: Display response
```

### WebSocket Audio Flow (Temporarily Disabled)
```
User activates microphone
  → Frontend: MediaRecorder captures audio
  → WebSocket: Base64 encoded audio chunks
  → Backend: gemini_live.py processes audio
  → Gemini Live API: Real-time audio processing
  → Backend: Receives audio response
  → WebSocket: Sends audio to frontend
  → Frontend: Audio playback via Web Audio API
```

## 🎯 Özellikler

1. **Otomatik Dashboard Denetimi**
   - Görsel analiz
   - Manifesto kurallarına göre puanlama
   - İhlal tespiti ve öneriler

2. **İyileştirme Önerileri**
   - Theme JSON oluşturma
   - Adım adım aksiyon listesi (sadece ihlale yönelik)
   - Simülasyon görselleştirme

3. **Canlı Danışman (Text Chat)**
   - Gemini 2.5 Flash ile metin tabanlı sohbet
   - Denetim sonuçlarını context olarak kullanma
   - Komut sistemi: `/auditor` ile manifesto'ya kural ekleme
   - Multi-line input desteği
   - Auto-scroll

4. **Manifesto Yönetimi**
   - Kuralları görüntüleme, düzenleme, ekleme, silme
   - Dinamik manifesto güncelleme
   - CRUD API endpoints

5. **Kullanıcı Deneyimi**
   - Agent görselleştirme
   - Progress indicators
   - Responsive design
   - Tab persistence
   - Loading states

## 🔧 Gelecek Geliştirmeler

- [ ] Sesli görüşme özelliğinin düzeltilmesi ve aktifleştirilmesi
- [ ] Kural önceliklendirme sistemi
- [ ] Denetim geçmişi ve raporlama
- [ ] Çoklu dil desteği
- [ ] Export/Import özellikleri
- [ ] Batch dashboard denetimi
- [ ] Dashboard karşılaştırma özelliği

## 📝 Notlar

- Sesli görüşme özelliği şu anda devre dışı (audio streaming sorunları)
- Text chat aktif ve çalışıyor
- Model: Text işlemler için `gemini-2.5-flash`, ses için `gemini-2.0-flash-exp` (gelecekte)
- Aksiyon listesi sadece ihlale yönelik spesifik adımlar içerir (pre-operations yok)

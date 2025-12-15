# 🎯 DashboardMaster - AI-Powered Power BI Auditor

<div align="center">

![Power BI](https://img.shields.io/badge/Power%20BI-F2C811?style=for-the-badge&logo=power-bi&logoColor=black)
![Next.js](https://img.shields.io/badge/Next.js-000000?style=for-the-badge&logo=next.js&logoColor=white)
![FastAPI](https://img.shields.io/badge/FastAPI-005571?style=for-the-badge&logo=fastapi)
![Gemini](https://img.shields.io/badge/Google%20Gemini-4285F4?style=for-the-badge&logo=google&logoColor=white)

**Power BI dashboard'larınızı yapay zeka ile otomatik denetleyin, ihlalleri tespit edin ve iyileştirme önerileri alın.**

[🚀 Canlı Demo](https://dashboardmasteragent.netlify.app) • [📖 Dokümantasyon](./ARCHITECTURE.md) • [🐛 Issues](https://github.com/ozioz/Dashboard_Agent/issues)

</div>

---

## ✨ Özellikler

### 🤖 AI-Powered Dashboard Audit
- **Google Gemini 2.5 Flash** ile otomatik dashboard analizi
- **Manifesto-based evaluation** - Power BI UI/UX & Data Visualization Manifesto kurallarına göre değerlendirme
- **Detaylı ihlal raporu** - Severity (High/Medium/Low) ile kategorize edilmiş ihlaller
- **Puanlama sistemi** - 0-100 arası otomatik puanlama

### 🎨 Automated Theme Generation
- Otomatik **Power BI theme.json** oluşturma
- İhlallere yönelik **spesifik aksiyon listesi**
- **SVG simülasyon** - İyileştirilmiş dashboard'un görsel önizlemesi

### 💬 Live AI Consultant
- **Text-based chat** - Gemini 2.5 Flash ile sohbet
- **Context-aware** - Denetim sonuçlarını context olarak kullanır (token optimizasyonu)
- **Command system** - `/auditor` komutu ile manifesto'ya dinamik kural ekleme
- **Re-audit** - Yeni kural eklendikten sonra otomatik yeniden değerlendirme

### 📋 Rules Management
- Manifesto kurallarını **görüntüleme, düzenleme, ekleme, silme**
- **6 ana bölüm** - Layout, Visualization, Typography, Color, Interaction, Accessibility
- **Real-time updates** - Değişiklikler anında manifesto'ya yansır

### 📱 Mobile-First Design
- **Tam responsive** - Mobil, tablet ve desktop için optimize edilmiş
- **Modern UI/UX** - Tailwind CSS ve Radix UI ile geliştirilmiş
- **Smooth animations** - Kullanıcı deneyimini artıran animasyonlar

---

## 🚀 Hızlı Başlangıç

### Gereksinimler

- **Node.js** 20+ ve npm
- **Python** 3.11+
- **Google Gemini API Key** ([Almak için tıklayın](https://aistudio.google.com/app/apikey))

### Kurulum

1. **Repository'yi klonlayın:**
```bash
git clone https://github.com/ozioz/Dashboard_Agent.git
cd Dashboard_Agent
```

2. **Backend'i kurun:**
```bash
cd backend
pip install -r requirements.txt
```

3. **Environment variable'ı ayarlayın:**
```bash
# backend/.env dosyası oluşturun
echo "GOOGLE_API_KEY=your_api_key_here" > backend/.env
```

4. **Frontend'i kurun:**
```bash
cd ../frontend
npm install
```

### Çalıştırma

**Backend:**
```bash
cd backend
uvicorn main:app --host 0.0.0.0 --port 8000
```

**Frontend:**
```bash
cd frontend
npm run dev
```

Uygulama `http://localhost:3000` adresinde çalışacaktır.

---

## 📖 Kullanım

### 1. Dashboard Yükleme
Ana sayfada Power BI dashboard'unuzun ekran görüntüsünü (PNG/JPG) yükleyin.

### 2. Otomatik Denetim
Yapay zeka dashboard'unuzu **Power BI UI/UX & Data Visualization Manifesto** kurallarına göre denetler ve:
- **Puan** verir (0-100)
- **İhlalleri** tespit eder (High/Medium/Low severity)
- **Öneriler** sunar

### 3. Sonuçları İnceleme
- İhlalleri ve önerileri görüntüleyin
- Puanınızı ve özet değerlendirmeyi inceleyin

### 4. Aksiyon Planı
- İhlale yönelik **spesifik aksiyonları** seçin
- **Theme.json** dosyasını indirin
- **Simülasyon** oluşturarak iyileştirilmiş dashboard'u görün

### 5. Canlı Danışman
Text chat ile AI danışmanla konuşun:
- Denetim sonuçları hakkında sorular sorun
- Öneriler alın
- `/auditor` komutu ile manifesto'ya yeni kural ekleyin

### 6. Kuralları Yönet
`/rules` sayfasından manifesto kurallarını:
- Görüntüleyin
- Düzenleyin
- Ekleyin
- Silin

---

## 🎯 Komutlar

### `/auditor` Komutu

Text chat'te manifesto'ya yeni kural eklemek için:

```
/auditor Dashboard'ta tüm metinler en az 12pt font boyutunda olmalıdır
```

Bu komut:
1. Kural açıklamasını analiz eder
2. Uygun bölüme ekler
3. Manifesto'yu günceller
4. Dashboard görseli varsa **yeniden değerlendirme** yapar

---

## 🏗️ Mimari

### Tech Stack

- **Frontend:**
  - Next.js 16 (React 19)
  - TypeScript
  - Tailwind CSS
  - Radix UI Components
  
- **Backend:**
  - FastAPI (Python)
  - Uvicorn (ASGI Server)
  - WebSocket support
  
- **AI:**
  - Google Gemini 2.5 Flash (text operations)
  - Google Gemini 2.0 Flash Exp (voice - temporarily disabled)

### Proje Yapısı

```
DashboardMaster/
├── frontend/          # Next.js frontend
│   ├── src/
│   │   ├── app/      # Pages (main, rules)
│   │   ├── components/  # UI components
│   │   └── lib/      # API client, utilities
│   └── public/       # Static assets
│
├── backend/          # FastAPI backend
│   ├── main.py      # API endpoints, WebSocket
│   ├── utils/       # Business logic
│   │   ├── auditor.py    # Dashboard auditing
│   │   ├── builder.py    # Theme & action generation
│   │   ├── common.py     # Manifesto utilities
│   │   └── gemini_live.py # Live API (disabled)
│   └── manifesto.md # Power BI Manifesto
│
└── streamlit_prototype/  # Legacy prototype (kept for reference)
```

Detaylı mimari dokümantasyon için [ARCHITECTURE.md](./ARCHITECTURE.md) dosyasına bakın.

---

## 📄 Manifesto

DashboardMaster, **Power BI UI/UX & Data Visualization Manifesto**'ya göre çalışır. Manifesto 6 ana bölümden oluşur:

1. **Layout & Grid Architecture** - Grid sistemleri, alignment, spacing
2. **Data Visualization Best Practices (IBCS Standards)** - Chart types, data representation
3. **Typograph & Hierarchy** - Font sizes, weights, hierarchy
4. **Color Palette & Semantics** - Color usage, accessibility
5. **Interaction & Usability** - User interactions, navigation
6. **Semantic Naming & Accessibility** - Naming conventions, accessibility standards

Manifesto kurallarını `/rules` sayfasından görüntüleyebilir ve düzenleyebilirsiniz.

---

## 🌐 Deployment

### Frontend (Netlify)

1. Netlify'a bağlayın
2. Environment variable ekleyin: `NEXT_PUBLIC_API_BASE_URL`
3. Deploy edin

Detaylı deployment rehberi için [DEPLOYMENT.md](./DEPLOYMENT.md) dosyasına bakın.

### Backend (Railway/Render)

1. Railway veya Render'a deploy edin
2. Environment variables ekleyin:
   - `GOOGLE_API_KEY`
   - `ALLOWED_ORIGINS`
3. Backend URL'ini Netlify'a ekleyin

Detaylı backend deployment rehberi için [BACKEND_DEPLOYMENT_GUIDE.md](./BACKEND_DEPLOYMENT_GUIDE.md) dosyasına bakın.

---

## 🔒 Güvenlik

- ✅ API key'ler **environment variable**'lardan alınır
- ✅ `.env` dosyaları **git'e commit edilmez** (`.gitignore` ile korunur)
- ✅ Production'da **CORS** ayarları kısıtlanmıştır
- ✅ **Public repository** için güvenlik best practices uygulanmıştır

**Önemli:** Production'da kullanmadan önce:
- API key'lerinizi environment variable'larda saklayın
- CORS ayarlarınızı kontrol edin
- Rate limiting ekleyin (opsiyonel)

---

## 🤝 Katkıda Bulunma

Katkılarınızı bekliyoruz! 

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

---

## 📝 Lisans

Bu proje özel bir projedir.

---

## 🐛 Bilinen Sorunlar

- ⚠️ **Sesli görüşme** özelliği şu anda devre dışı (audio streaming sorunları)
- ✅ **Text chat** aktif ve çalışıyor
- ✅ **Tüm diğer özellikler** production'da çalışıyor

---

## 📞 İletişim & Destek

- 🐛 **Bug report:** [Issues](https://github.com/ozioz/Dashboard_Agent/issues)
- 💡 **Feature request:** [Issues](https://github.com/ozioz/Dashboard_Agent/issues)
- 📧 **Questions:** Issue açabilirsiniz

---

## 🙏 Teşekkürler

- [Google Gemini](https://ai.google.dev/) - AI capabilities
- [Next.js](https://nextjs.org/) - Frontend framework
- [FastAPI](https://fastapi.tiangolo.com/) - Backend framework
- [Radix UI](https://www.radix-ui.com/) - UI components

---

<div align="center">

**⭐ Projeyi beğendiyseniz yıldız vermeyi unutmayın!**

Made with ❤️ using AI

</div>

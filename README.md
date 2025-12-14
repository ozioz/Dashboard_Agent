# DashboardMaster 🎯

Power BI dashboard'larını yapay zeka ile otomatik denetleyen ve iyileştirme önerileri sunan full-stack web uygulaması.

## ✨ Özellikler

- 🤖 **AI-Powered Audit**: Google Gemini 2.5 Flash ile otomatik dashboard denetimi
- 📊 **Manifesto-Based Evaluation**: Power BI UI/UX & Data Visualization Manifesto kurallarına göre değerlendirme
- 🎨 **Theme Generation**: Otomatik Power BI theme.json oluşturma
- 📝 **Action Plan**: İhlale yönelik spesifik aksiyon listesi
- 🖼️ **Simulation**: İyileştirilmiş dashboard'un SVG simülasyonu
- 💬 **Live Consultant**: Text tabanlı AI danışman (Gemini 2.5 Flash)
- ⚡ **Command System**: `/auditor` komutu ile manifesto'ya dinamik kural ekleme
- 📋 **Rules Management**: Manifesto kurallarını görüntüleme, düzenleme, ekleme, silme

## 🚀 Hızlı Başlangıç

### Gereksinimler

- Node.js 18+ ve npm
- Python 3.9+
- Google Gemini API Key

### Kurulum

1. **Repository'yi klonlayın:**
```bash
git clone <repository-url>
cd DashboardMaster
```

2. **Backend'i kurun:**
```bash
cd backend
pip install -r requirements.txt
```

3. **Environment variable'ı ayarlayın:**
```bash
# backend/.env dosyası oluşturun
echo "GOOGLE_API_KEY=your_api_key_here" > .env
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

## 📖 Kullanım

1. **Dashboard Yükleme**: Ana sayfada dashboard ekran görüntüsünü (PNG/JPG) yükleyin
2. **Denetim**: Yapay zeka dashboard'unuzu manifesto kurallarına göre denetler
3. **Sonuçları İnceleme**: İhlalleri ve önerileri görüntüleyin
4. **Aksiyon Planı**: İhlale yönelik aksiyonları seçin ve simülasyon oluşturun
5. **Canlı Danışman**: Text chat ile AI danışmanla konuşun
6. **Kuralları Yönet**: `/rules` sayfasından manifesto kurallarını düzenleyin

## 🎯 Komutlar

### `/auditor` Komutu

Text chat'te manifesto'ya yeni kural eklemek için:

```
/auditor Dashboard'ta tüm metinler en az 12pt font boyutunda olmalıdır
```

Bu komut:
- Kural açıklamasını analiz eder
- Uygun bölüme ekler
- Manifesto'yu günceller
- Dashboard görseli varsa yeniden değerlendirme yapar

## 🏗️ Mimari

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: FastAPI, Python
- **AI Model**: Google Gemini 2.5 Flash (text), Gemini 2.0 Flash Exp (voice - temporarily disabled)

Detaylı mimari dokümantasyon için [ARCHITECTURE.md](./ARCHITECTURE.md) dosyasına bakın.

## 📄 Manifesto

DashboardMaster, Power BI UI/UX & Data Visualization Manifesto'ya göre çalışır. Manifesto 6 ana bölümden oluşur:

1. Layout & Grid Architecture
2. Data Visualization Best Practices (IBCS Standards)
3. Typography & Hierarchy
4. Color Palette & Semantics
5. Interaction & Usability
6. Semantic Naming & Accessibility

Manifesto kurallarını `/rules` sayfasından görüntüleyebilir ve düzenleyebilirsiniz.

## 🔒 Güvenlik

- API key'ler environment variable'lardan alınır
- `.env` dosyaları git'e commit edilmez
- Production'da CORS ayarları kısıtlanmalıdır

## 🤝 Katkıda Bulunma

1. Fork edin
2. Feature branch oluşturun (`git checkout -b feature/amazing-feature`)
3. Commit edin (`git commit -m 'Add amazing feature'`)
4. Push edin (`git push origin feature/amazing-feature`)
5. Pull Request açın

## 📝 Lisans

Bu proje özel bir projedir.

## 🐛 Bilinen Sorunlar

- Sesli görüşme özelliği şu anda devre dışı (audio streaming sorunları)
- Text chat aktif ve çalışıyor

## 📞 İletişim

Sorularınız için issue açabilirsiniz.

---

**Not**: Bu proje Google Gemini API kullanır. API key'inizin geçerli olduğundan ve yeterli quota'nız olduğundan emin olun.


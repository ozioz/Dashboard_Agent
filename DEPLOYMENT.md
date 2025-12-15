# 🚀 Deployment Guide

Bu rehber, DashboardMaster'ı production'a deploy etmek için gerekli tüm adımları içerir.

## 📋 Genel Bakış

- **Frontend:** Netlify'da deploy edilir
- **Backend:** Railway veya Render'da deploy edilir
- **Database:** Gerekmez (stateless API)

---

## 🌐 Frontend Deployment (Netlify)

### Adım 1: Netlify'a Bağla

1. [Netlify](https://app.netlify.com) hesabınızla giriş yapın
2. **"Add new site"** → **"Import an existing project"**
3. GitHub repository'nizi seçin: `ozioz/Dashboard_Agent`
4. Netlify otomatik olarak Next.js'i algılayacak

### Adım 2: Build Ayarları

Netlify otomatik olarak şu ayarları kullanır (zaten `netlify.toml` dosyasında tanımlı):

- **Base directory:** `frontend`
- **Build command:** `npm run build`
- **Publish directory:** `.next`
- **Node version:** 20

### Adım 3: Environment Variables

Backend deploy edildikten sonra:

1. Netlify dashboard → **Site settings** → **Environment variables**
2. Şu değişkeni ekleyin:
   ```
   Key: NEXT_PUBLIC_API_BASE_URL
   Value: https://your-backend-url.railway.app
   ```
   (Backend URL'inizi yapıştırın)

3. **"Save"** → **"Trigger deploy"** → **"Clear cache and deploy site"**

### ✅ Frontend Hazır!

Frontend artık https://dashboardmasteragent.netlify.app adresinde çalışıyor.

---

## 🔧 Backend Deployment

### Seçenek 1: Railway (Önerilen)

#### Adım 1: Railway Hesabı Oluştur

1. [Railway](https://railway.app) adresine gidin
2. GitHub hesabınızla giriş yapın
3. **"New Project"** → **"Deploy from GitHub repo"**
4. Repository'nizi seçin: `ozioz/Dashboard_Agent`

#### Adım 2: Root Directory Ayarla

1. Railway dashboard → **Settings** → **Root Directory**
2. **"Set Root Directory"** → `backend` yazın
3. **"Save"**

#### Adım 3: Environment Variables

1. Railway dashboard → **Variables** sekmesi
2. Şu değişkenleri ekleyin:

```
GOOGLE_API_KEY = [Google Gemini API anahtarınız]
ALLOWED_ORIGINS = https://dashboardmasteragent.netlify.app,http://localhost:3000
```

**Google API Key Nasıl Alınır:**
- https://aistudio.google.com/app/apikey adresine gidin
- **"Create API Key"** butonuna tıklayın
- Oluşturulan key'i kopyalayın

#### Adım 4: Deploy

1. Railway otomatik olarak deploy başlatacak
2. Deploy tamamlandığında **Settings** → **"Generate Domain"**
3. Backend URL'inizi kopyalayın (örn: `https://your-app.up.railway.app`)

#### Adım 5: Netlify'a Backend URL'ini Ekle

1. Netlify dashboard → **Environment variables**
2. `NEXT_PUBLIC_API_BASE_URL` değişkenini backend URL'inizle güncelleyin
3. Netlify'ı yeniden deploy edin

### Seçenek 2: Render

#### Adım 1: Render Hesabı Oluştur

1. [Render](https://render.com) adresine gidin
2. GitHub hesabınızla giriş yapın
3. **"New +"** → **"Web Service"**
4. Repository'nizi bağlayın

#### Adım 2: Service Ayarları

- **Name:** `dashboardmaster-backend`
- **Root Directory:** `backend`
- **Environment:** `Python 3`
- **Build Command:** `pip install -r requirements.txt`
- **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

#### Adım 3: Environment Variables

```
GOOGLE_API_KEY = [Google Gemini API anahtarınız]
ALLOWED_ORIGINS = https://dashboardmasteragent.netlify.app,http://localhost:3000
```

#### Adım 4: Deploy

Render otomatik olarak deploy edecek. Backend URL'inizi alın ve Netlify'a ekleyin.

---

## ✅ Deployment Sonrası Kontrol

### Backend Health Check

Backend URL'inize gidin (örn: `https://your-app.up.railway.app`):

```json
{"message":"Power BI Auditor API is running"}
```

Bu mesajı görüyorsanız backend çalışıyor! ✅

### Frontend Test

1. https://dashboardmasteragent.netlify.app adresine gidin
2. Bir dashboard görüntüsü yükleyin
3. Denetim işlemi başlamalı ve sonuç gelmeli

---

## 🔧 Troubleshooting

### Frontend API Bağlantı Hatası

- `NEXT_PUBLIC_API_BASE_URL` environment variable'ının doğru ayarlandığından emin olun
- Backend'in çalıştığını health check ile doğrulayın
- Browser console'da CORS hatası var mı kontrol edin

### Backend CORS Hatası

- `ALLOWED_ORIGINS` environment variable'ında Netlify URL'inin olduğundan emin olun
- Backend'i yeniden deploy edin

### API Key Hatası

- `GOOGLE_API_KEY` environment variable'ının doğru ayarlandığından emin olun
- API key'in başında/sonunda boşluk olmadığından emin olun
- Google Cloud Console'da Generative Language API'nin enable olduğundan emin olun

### Build Hatası

**Netlify:**
- Node.js versiyonunun 20 olduğundan emin olun
- `netlify.toml` dosyasının doğru olduğundan emin olun

**Railway:**
- Root directory'nin `backend` olduğundan emin olun
- `requirements.txt` dosyasının `backend` klasöründe olduğundan emin olun

---

## 📋 Deployment Checklist

- [ ] Frontend Netlify'da deploy edildi
- [ ] Backend Railway/Render'da deploy edildi
- [ ] `GOOGLE_API_KEY` backend'e eklendi
- [ ] `ALLOWED_ORIGINS` backend'e eklendi
- [ ] `NEXT_PUBLIC_API_BASE_URL` Netlify'a eklendi
- [ ] Frontend yeniden deploy edildi
- [ ] Backend health check başarılı
- [ ] Frontend'ten dashboard yükleme test edildi
- [ ] Denetim işlemi çalışıyor
- [ ] Chat özelliği çalışıyor

---

## 🎉 Başarılı Deployment!

Tüm adımlar tamamlandıktan sonra:

- ✅ Frontend Netlify'da çalışıyor
- ✅ Backend Railway/Render'da çalışıyor
- ✅ İkisi birbirine bağlı
- ✅ Tüm özellikler çalışıyor

**Sisteminiz production'da ve kullanıma hazır! 🚀**

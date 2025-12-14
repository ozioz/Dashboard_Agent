# Deployment Guide

## Netlify Deployment (Frontend) ✅

Frontend başarıyla deploy edildi: https://dashboardmasteragent.netlify.app

### Environment Variables (Netlify)

Netlify dashboard'unda **Site settings > Environment variables** bölümüne şu değişkeni ekleyin:

```
NEXT_PUBLIC_API_BASE_URL = https://your-backend-url.com
```

**Önemli:** Backend deploy edildikten sonra bu URL'i güncelleyin.

---

## Backend Deployment

Backend'i deploy etmek için aşağıdaki platformlardan birini seçin:

### Option 1: Railway (Önerilen)

1. **Railway'a kaydolun:** https://railway.app
2. **Yeni proje oluşturun:** "New Project" > "Deploy from GitHub repo"
3. **Repository'yi seçin:** `ozioz/Dashboard_Agent`
4. **Root directory:** `backend` olarak ayarlayın
5. **Environment Variables ekleyin:**
   ```
   GOOGLE_API_KEY = your_google_api_key_here
   ALLOWED_ORIGINS = https://dashboardmasteragent.netlify.app,http://localhost:3000
   PORT = 8000 (Railway otomatik ayarlar, gerekirse)
   ```
6. **Deploy:** Railway otomatik olarak deploy edecek
7. **Backend URL'ini alın:** Railway size bir URL verecek (örn: `https://your-app.railway.app`)

### Option 2: Render

1. **Render'a kaydolun:** https://render.com
2. **Yeni Web Service oluşturun:** "New" > "Web Service"
3. **GitHub repository'yi bağlayın**
4. **Ayarlar:**
   - **Name:** `dashboardmaster-backend`
   - **Root Directory:** `backend`
   - **Environment:** `Python 3`
   - **Build Command:** `pip install -r requirements.txt`
   - **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. **Environment Variables:**
   ```
   GOOGLE_API_KEY = your_google_api_key_here
   ALLOWED_ORIGINS = https://dashboardmasteragent.netlify.app,http://localhost:3000
   ```
6. **Deploy:** Render otomatik olarak deploy edecek

### Option 3: Heroku

1. **Heroku CLI'yı yükleyin**
2. **Heroku'ya login:** `heroku login`
3. **Yeni app oluşturun:** `heroku create dashboardmaster-backend`
4. **Backend dizinine gidin:** `cd backend`
5. **Environment variables ekleyin:**
   ```bash
   heroku config:set GOOGLE_API_KEY=your_key_here
   heroku config:set ALLOWED_ORIGINS=https://dashboardmasteragent.netlify.app,http://localhost:3000
   ```
6. **Deploy:** `git push heroku main`

---

## Deployment Sonrası Adımlar

### 1. Backend URL'ini Netlify'a Ekleyin

Backend deploy edildikten sonra:

1. Netlify dashboard'una gidin
2. **Site settings > Environment variables**
3. `NEXT_PUBLIC_API_BASE_URL` değişkenini güncelleyin:
   ```
   NEXT_PUBLIC_API_BASE_URL = https://your-backend-url.railway.app
   ```
   (veya Render/Heroku URL'iniz)

4. **Deploy settings > Trigger deploy** ile yeniden deploy edin

### 2. Backend CORS Kontrolü

Backend'de `ALLOWED_ORIGINS` environment variable'ının doğru ayarlandığından emin olun:

```
ALLOWED_ORIGINS = https://dashboardmasteragent.netlify.app,http://localhost:3000
```

### 3. Test

1. **Frontend:** https://dashboardmasteragent.netlify.app
2. **Backend Health Check:** `https://your-backend-url.com/`
3. **Dashboard yükleyip test edin**

---

## Troubleshooting

### Frontend API Bağlantı Hatası

- `NEXT_PUBLIC_API_BASE_URL` environment variable'ının doğru ayarlandığından emin olun
- Backend'in çalıştığından emin olun
- Browser console'da CORS hatası var mı kontrol edin

### Backend CORS Hatası

- `ALLOWED_ORIGINS` environment variable'ında Netlify URL'inin olduğundan emin olun
- Backend'i yeniden deploy edin

### Build Hatası

- Node.js versiyonunun 20 olduğundan emin olun
- `netlify.toml` dosyasının doğru olduğundan emin olun

---

## Hızlı Başlangıç Checklist

- [x] Frontend Netlify'da deploy edildi
- [ ] Backend deploy edildi (Railway/Render/Heroku)
- [ ] `GOOGLE_API_KEY` backend'e eklendi
- [ ] `ALLOWED_ORIGINS` backend'e eklendi
- [ ] `NEXT_PUBLIC_API_BASE_URL` Netlify'a eklendi
- [ ] Frontend yeniden deploy edildi (environment variable değişikliği için)
- [ ] Test edildi

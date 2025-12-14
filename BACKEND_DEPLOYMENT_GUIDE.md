# Backend Deployment Rehberi - Adım Adım

Bu rehber, DashboardMaster backend'ini deploy edip Netlify frontend'i ile bağlamak için gerekli tüm adımları içerir.

---

## 🎯 Genel Bakış

1. **Backend'i Railway/Render'a deploy et**
2. **Environment variables ekle**
3. **Backend URL'ini al**
4. **Netlify'a backend URL'ini ekle**
5. **Test et**

---

## 📋 Seçenek 1: Railway (Önerilen - En Kolay)

### Adım 1: Railway Hesabı Oluştur

1. https://railway.app adresine gidin
2. **"Start a New Project"** veya **"Login"** butonuna tıklayın
3. GitHub hesabınızla giriş yapın (önerilir)

### Adım 2: Yeni Proje Oluştur

1. Railway dashboard'unda **"New Project"** butonuna tıklayın
2. **"Deploy from GitHub repo"** seçeneğini seçin
3. GitHub repository'nizi seçin: `ozioz/Dashboard_Agent`
4. Railway otomatik olarak repository'nizi görecek

### Adım 3: Backend Dizinini Ayarla

1. Railway projenizde **"Settings"** sekmesine gidin
2. **"Root Directory"** bölümünü bulun
3. **"Set Root Directory"** butonuna tıklayın
4. `backend` yazın ve kaydedin
5. Bu, Railway'ın `backend` klasöründeki dosyaları kullanmasını sağlar

### Adım 4: Environment Variables Ekle

1. Railway projenizde **"Variables"** sekmesine gidin
2. **"New Variable"** butonuna tıklayın
3. Şu değişkenleri tek tek ekleyin:

#### 4.1. Google API Key
```
Variable Name: GOOGLE_API_KEY
Value: [Google Gemini API anahtarınız]
```
**Nasıl alınır:**
- https://aistudio.google.com/app/apikey adresine gidin
- Google hesabınızla giriş yapın
- "Create API Key" butonuna tıklayın
- Oluşturulan anahtarı kopyalayıp Railway'a yapıştırın

#### 4.2. Allowed Origins (CORS)
```
Variable Name: ALLOWED_ORIGINS
Value: https://dashboardmasteragent.netlify.app,http://localhost:3000
```
**Not:** Virgülle ayrılmış liste. Netlify URL'iniz farklıysa güncelleyin.

#### 4.3. Port (Opsiyonel - Railway otomatik ayarlar)
```
Variable Name: PORT
Value: 8000
```
**Not:** Railway genellikle otomatik port atar, bu değişken opsiyoneldir.

### Adım 5: Deploy

1. Railway otomatik olarak deploy başlatacak
2. **"Deployments"** sekmesinde deploy durumunu görebilirsiniz
3. Deploy tamamlandığında **"Settings"** sekmesine gidin
4. **"Generate Domain"** butonuna tıklayın (veya zaten bir domain varsa kullanın)
5. Backend URL'inizi kopyalayın (örn: `https://your-app-name.up.railway.app`)

### Adım 6: Backend URL'ini Netlify'a Ekle

1. Netlify dashboard'una gidin: https://app.netlify.com
2. `dashboardmasteragent` sitesini seçin
3. **"Site settings"** > **"Environment variables"** sekmesine gidin
4. **"Add a variable"** butonuna tıklayın
5. Şu değişkeni ekleyin:
   ```
   Key: NEXT_PUBLIC_API_BASE_URL
   Value: https://your-app-name.up.railway.app
   ```
   (Railway'dan aldığınız URL'i yapıştırın)
6. **"Save"** butonuna tıklayın

### Adım 7: Netlify'ı Yeniden Deploy Et

1. Netlify dashboard'unda **"Deploys"** sekmesine gidin
2. **"Trigger deploy"** > **"Clear cache and deploy site"** seçeneğini seçin
3. Bu, yeni environment variable'ı kullanarak frontend'i yeniden build edecek

### Adım 8: Test Et

1. **Backend Health Check:**
   - Tarayıcınızda backend URL'inize gidin: `https://your-app-name.up.railway.app`
   - `{"message":"Power BI Auditor API is running"}` mesajını görmelisiniz

2. **Frontend Test:**
   - https://dashboardmasteragent.netlify.app adresine gidin
   - Bir dashboard görüntüsü yükleyin
   - Denetim işleminin çalıştığını kontrol edin

---

## 📋 Seçenek 2: Render (Alternatif)

### Adım 1: Render Hesabı Oluştur

1. https://render.com adresine gidin
2. **"Get Started for Free"** butonuna tıklayın
3. GitHub hesabınızla giriş yapın

### Adım 2: Yeni Web Service Oluştur

1. Render dashboard'unda **"New +"** butonuna tıklayın
2. **"Web Service"** seçeneğini seçin
3. GitHub repository'nizi bağlayın: `ozioz/Dashboard_Agent`

### Adım 3: Service Ayarları

1. **Name:** `dashboardmaster-backend` (veya istediğiniz bir isim)
2. **Region:** En yakın bölgeyi seçin (örn: Frankfurt)
3. **Branch:** `main`
4. **Root Directory:** `backend`
5. **Runtime:** `Python 3`
6. **Build Command:** `pip install -r requirements.txt`
7. **Start Command:** `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Adım 4: Environment Variables

1. **"Environment"** sekmesine gidin
2. **"Add Environment Variable"** butonuna tıklayın
3. Şu değişkenleri ekleyin:

```
GOOGLE_API_KEY = [Google Gemini API anahtarınız]
ALLOWED_ORIGINS = https://dashboardmasteragent.netlify.app,http://localhost:3000
```

### Adım 5: Deploy

1. **"Create Web Service"** butonuna tıklayın
2. Render otomatik olarak build ve deploy başlatacak
3. Deploy tamamlandığında, Render size bir URL verecek (örn: `https://dashboardmaster-backend.onrender.com`)

### Adım 6-8: Netlify'a Ekleme ve Test

Railway'daki **Adım 6-8** ile aynı, sadece Render URL'ini kullanın.

---

## 🔧 Troubleshooting (Sorun Giderme)

### Problem 1: Backend'e Bağlanamıyorum

**Çözüm:**
- Backend URL'inin doğru olduğundan emin olun
- Browser console'da hata mesajlarını kontrol edin
- Backend'in çalıştığını health check ile doğrulayın: `https://your-backend-url.com/`

### Problem 2: CORS Hatası

**Hata:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Çözüm:**
1. Backend'deki `ALLOWED_ORIGINS` environment variable'ını kontrol edin
2. Netlify URL'inin listede olduğundan emin olun
3. Backend'i yeniden deploy edin

### Problem 3: API Key Hatası

**Hata:** `API key not found` veya `Invalid API key`

**Çözüm:**
1. Railway/Render'da `GOOGLE_API_KEY` environment variable'ının doğru ayarlandığından emin olun
2. API key'in başında/sonunda boşluk olmadığından emin olun
3. Backend'i yeniden deploy edin

### Problem 4: Build Hatası

**Railway:**
- `requirements.txt` dosyasının `backend` klasöründe olduğundan emin olun
- Python versiyonunun 3.9+ olduğundan emin olun

**Render:**
- Build command'ın doğru olduğundan emin olun: `pip install -r requirements.txt`
- Start command'ın doğru olduğundan emin olun: `uvicorn main:app --host 0.0.0.0 --port $PORT`

### Problem 5: Port Hatası

**Hata:** `Port already in use` veya `Port binding failed`

**Çözüm:**
- Railway/Render otomatik port atar, `$PORT` environment variable'ını kullanın
- `Procfile` veya start command'da `--port $PORT` kullandığınızdan emin olun

---

## ✅ Deployment Checklist

Backend deploy işlemini tamamladıktan sonra bu checklist'i kontrol edin:

- [ ] Railway/Render hesabı oluşturuldu
- [ ] GitHub repository bağlandı
- [ ] Root directory `backend` olarak ayarlandı
- [ ] `GOOGLE_API_KEY` environment variable eklendi
- [ ] `ALLOWED_ORIGINS` environment variable eklendi (Netlify URL'i dahil)
- [ ] Backend başarıyla deploy edildi
- [ ] Backend URL'i alındı
- [ ] Netlify'a `NEXT_PUBLIC_API_BASE_URL` eklendi
- [ ] Netlify yeniden deploy edildi
- [ ] Backend health check başarılı (`/` endpoint)
- [ ] Frontend'ten dashboard yükleme test edildi
- [ ] Denetim işlemi çalışıyor
- [ ] Chat özelliği çalışıyor

---

## 📞 Yardım

Eğer sorun yaşarsanız:

1. **Backend Logs:** Railway/Render dashboard'unda **"Logs"** sekmesini kontrol edin
2. **Frontend Console:** Browser developer tools'da console hatalarını kontrol edin
3. **Network Tab:** Browser developer tools'da Network sekmesinde API isteklerini kontrol edin

---

## 🎉 Başarılı Deployment Sonrası

Backend başarıyla deploy edildikten sonra:

- ✅ Frontend Netlify'da çalışıyor
- ✅ Backend Railway/Render'da çalışıyor
- ✅ İkisi birbirine bağlı
- ✅ Tüm özellikler çalışıyor

**Artık sisteminiz production'da! 🚀**

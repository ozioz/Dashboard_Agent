# Backend Deployment Rehberi - Adım Adım

Bu rehber, DashboardMaster backend'ini deploy etmek için gerekli tüm adımları içerir.

## 🎯 Hangi Platform?

**Önerilen:** Railway (en kolay ve hızlı)
**Alternatif:** Render (ücretsiz tier mevcut)

---

## 📋 ÖN HAZIRLIK

### 1. Google Gemini API Key'inizi Hazırlayın

1. [Google AI Studio](https://makersuite.google.com/app/apikey) adresine gidin
2. API key oluşturun veya mevcut key'inizi kopyalayın
3. Bu key'i güvenli bir yerde saklayın (bir sonraki adımda kullanacağız)

### 2. Netlify Frontend URL'inizi Not Edin

- Frontend URL'iniz: `https://dashboardmasteragent.netlify.app`
- Bu URL'i backend CORS ayarlarında kullanacağız

---

## 🚂 YÖNTEM 1: Railway ile Deploy (ÖNERİLEN)

### Adım 1: Railway Hesabı Oluşturma

1. **Railway'a gidin:** https://railway.app
2. **"Start a New Project"** butonuna tıklayın
3. **"Login with GitHub"** seçeneğini seçin
4. GitHub hesabınızla giriş yapın ve Railway'a erişim izni verin

### Adım 2: Proje Oluşturma

1. Railway dashboard'unda **"New Project"** butonuna tıklayın
2. **"Deploy from GitHub repo"** seçeneğini seçin
3. Repository listesinden **`ozioz/Dashboard_Agent`** seçin
4. **"Deploy Now"** butonuna tıklayın

### Adım 3: Root Directory Ayarlama

1. Deploy başladıktan sonra, service'in üzerine tıklayın
2. **"Settings"** sekmesine gidin
3. **"Root Directory"** bölümünü bulun
4. **`backend`** yazın ve kaydedin
5. Railway otomatik olarak yeniden deploy edecek

### Adım 4: Environment Variables Ekleme

1. Service'in **"Variables"** sekmesine gidin
2. **"New Variable"** butonuna tıklayın
3. Şu değişkenleri tek tek ekleyin:

#### Variable 1: GOOGLE_API_KEY
```
Name: GOOGLE_API_KEY
Value: [Google Gemini API key'iniz]
```

#### Variable 2: ALLOWED_ORIGINS
```
Name: ALLOWED_ORIGINS
Value: https://dashboardmasteragent.netlify.app,http://localhost:3000
```

**Not:** Virgülle ayrılmış, boşluk olmadan yazın.

### Adım 5: Deploy Kontrolü

1. **"Deployments"** sekmesine gidin
2. Deploy'un başarılı olduğunu kontrol edin (yeşil tick işareti)
3. **"Settings"** sekmesinde **"Generate Domain"** butonuna tıklayın
4. Railway size bir URL verecek (örn: `https://your-app.up.railway.app`)
5. Bu URL'i kopyalayın - backend URL'iniz bu!

### Adım 6: Backend URL'ini Test Etme

1. Tarayıcınızda backend URL'inize gidin (örn: `https://your-app.up.railway.app`)
2. Şu mesajı görmelisiniz:
   ```json
   {"message": "Power BI Auditor API is running"}
   ```
3. Eğer bu mesajı görüyorsanız, backend başarıyla deploy edilmiş demektir! ✅

---

## 🌐 YÖNTEM 2: Render ile Deploy (ALTERNATİF)

### Adım 1: Render Hesabı Oluşturma

1. **Render'a gidin:** https://render.com
2. **"Get Started for Free"** butonuna tıklayın
3. **"Sign Up with GitHub"** seçeneğini seçin
4. GitHub hesabınızla giriş yapın

### Adım 2: Yeni Web Service Oluşturma

1. Render dashboard'unda **"New +"** butonuna tıklayın
2. **"Web Service"** seçeneğini seçin
3. **"Connect GitHub"** ile repository'nizi bağlayın
4. **`ozioz/Dashboard_Agent`** repository'sini seçin

### Adım 3: Service Ayarları

Aşağıdaki ayarları yapın:

```
Name: dashboardmaster-backend
Region: Frankfurt (EU) veya en yakın bölge
Branch: main
Root Directory: backend
Runtime: Python 3
Build Command: pip install -r requirements.txt
Start Command: uvicorn main:app --host 0.0.0.0 --port $PORT
```

### Adım 4: Environment Variables

**"Environment Variables"** bölümüne şunları ekleyin:

```
GOOGLE_API_KEY = [Google Gemini API key'iniz]
ALLOWED_ORIGINS = https://dashboardmasteragent.netlify.app,http://localhost:3000
```

### Adım 5: Deploy

1. **"Create Web Service"** butonuna tıklayın
2. Render otomatik olarak deploy edecek (5-10 dakika sürebilir)
3. Deploy tamamlandığında, Render size bir URL verecek (örn: `https://dashboardmaster-backend.onrender.com`)
4. Bu URL'i kopyalayın - backend URL'iniz bu!

---

## 🔗 NETLIFY'DA FRONTEND AYARLARI

Backend deploy edildikten sonra, frontend'in backend'e bağlanabilmesi için Netlify'da ayar yapmanız gerekiyor.

### Adım 1: Netlify Environment Variable Ekleme

1. **Netlify Dashboard'a gidin:** https://app.netlify.com
2. **`dashboardmasteragent`** sitesini seçin
3. **"Site settings"** > **"Environment variables"** sekmesine gidin
4. **"Add a variable"** butonuna tıklayın
5. Şu değişkeni ekleyin:

```
Key: NEXT_PUBLIC_API_BASE_URL
Value: https://your-backend-url.railway.app
```

**Önemli:** 
- Railway kullandıysanız: `https://your-app.up.railway.app`
- Render kullandıysanız: `https://dashboardmaster-backend.onrender.com`

### Adım 2: Frontend'i Yeniden Deploy Etme

1. Netlify dashboard'unda **"Deploys"** sekmesine gidin
2. **"Trigger deploy"** > **"Clear cache and deploy site"** seçeneğini seçin
3. Bu, environment variable değişikliğini uygulamak için gereklidir

---

## ✅ TEST ADIMLARI

### 1. Backend Health Check

Tarayıcınızda backend URL'inize gidin:
```
https://your-backend-url.railway.app/
```

Şu mesajı görmelisiniz:
```json
{"message": "Power BI Auditor API is running"}
```

### 2. Frontend Test

1. **Frontend'e gidin:** https://dashboardmasteragent.netlify.app
2. Browser Developer Tools'u açın (F12)
3. **Console** sekmesine gidin
4. Bir dashboard yükleyin
5. Console'da hata olmamalı
6. Network sekmesinde backend'e isteklerin gittiğini kontrol edin

### 3. CORS Kontrolü

Eğer CORS hatası alırsanız:

1. Backend environment variables'da `ALLOWED_ORIGINS` değerini kontrol edin
2. Netlify URL'inin doğru olduğundan emin olun
3. Backend'i yeniden deploy edin

---

## 🐛 SORUN GİDERME

### Problem: Backend deploy başarısız

**Çözüm:**
- `requirements.txt` dosyasının `backend` klasöründe olduğundan emin olun
- Railway'da Root Directory'nin `backend` olduğunu kontrol edin
- Build logs'u kontrol edin

### Problem: "Module not found" hatası

**Çözüm:**
- `requirements.txt` dosyasında tüm bağımlılıkların olduğundan emin olun
- Backend'i yeniden deploy edin

### Problem: CORS hatası

**Çözüm:**
1. Backend environment variables'da `ALLOWED_ORIGINS` değerini kontrol edin
2. Netlify URL'inin doğru yazıldığından emin olun (https:// ile başlamalı)
3. Backend'i yeniden deploy edin

### Problem: API key hatası

**Çözüm:**
- `GOOGLE_API_KEY` environment variable'ının doğru eklendiğinden emin olun
- API key'in geçerli olduğundan emin olun
- Backend'i yeniden deploy edin

### Problem: Frontend backend'e bağlanamıyor

**Çözüm:**
1. Netlify'da `NEXT_PUBLIC_API_BASE_URL` environment variable'ının doğru olduğundan emin olun
2. Frontend'i yeniden deploy edin (Clear cache ile)
3. Browser console'da hata mesajlarını kontrol edin

---

## 📝 HIZLI KONTROL LİSTESİ

Backend deploy işlemi tamamlandığında:

- [ ] Railway/Render hesabı oluşturuldu
- [ ] Repository bağlandı
- [ ] Root directory `backend` olarak ayarlandı
- [ ] `GOOGLE_API_KEY` environment variable eklendi
- [ ] `ALLOWED_ORIGINS` environment variable eklendi
- [ ] Backend başarıyla deploy edildi
- [ ] Backend URL'i alındı
- [ ] Backend health check başarılı
- [ ] Netlify'da `NEXT_PUBLIC_API_BASE_URL` eklendi
- [ ] Frontend yeniden deploy edildi
- [ ] Frontend'den backend'e bağlantı test edildi
- [ ] Dashboard yükleme test edildi

---

## 🎉 BAŞARILI!

Tüm adımlar tamamlandığında, sisteminiz production'da çalışıyor olacak:

- **Frontend:** https://dashboardmasteragent.netlify.app
- **Backend:** https://your-backend-url.railway.app (veya Render URL'iniz)

Herhangi bir sorunla karşılaşırsanız, yukarıdaki "Sorun Giderme" bölümüne bakın.


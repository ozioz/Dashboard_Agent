# Netlify Setup - Backend Bağlantısı

Backend başarıyla Railway'da deploy edildi! Şimdi Netlify'da frontend'i backend'e bağlamak için şu adımları takip edin:

---

## 🎯 Adım 1: Backend URL'ini Al

1. Railway dashboard'unuza gidin: https://railway.app
2. Projenizi seçin
3. **"Settings"** sekmesine gidin
4. **"Generate Domain"** butonuna tıklayın (eğer henüz domain oluşturmadıysanız)
5. Backend URL'inizi kopyalayın (örn: `https://your-app-name.up.railway.app`)

**Önemli:** URL'in başında `https://` olduğundan emin olun!

---

## 🎯 Adım 2: Netlify Environment Variable Ekle

1. Netlify dashboard'unuza gidin: https://app.netlify.com
2. `dashboardmasteragent` sitesini seçin (veya sitenizin adını seçin)
3. Sol menüden **"Site settings"** sekmesine tıklayın
4. **"Environment variables"** sekmesine gidin
5. **"Add a variable"** butonuna tıklayın
6. Şu bilgileri girin:
   ```
   Key: NEXT_PUBLIC_API_BASE_URL
   Value: https://your-app-name.up.railway.app
   ```
   (Railway'dan aldığınız backend URL'ini yapıştırın)
7. **"Save"** butonuna tıklayın

**Önemli:** 
- Key'in tam olarak `NEXT_PUBLIC_API_BASE_URL` olduğundan emin olun (büyük/küçük harf duyarlı)
- Value'da sonunda `/` (slash) olmamalı

---

## 🎯 Adım 3: Netlify'ı Yeniden Deploy Et

Environment variable ekledikten sonra frontend'i yeniden deploy etmeniz gerekiyor:

1. Netlify dashboard'unda **"Deploys"** sekmesine gidin
2. **"Trigger deploy"** butonuna tıklayın
3. **"Clear cache and deploy site"** seçeneğini seçin
4. Deploy işleminin tamamlanmasını bekleyin (2-3 dakika)

**Alternatif:** Eğer GitHub'a yeni bir commit push ederseniz, Netlify otomatik olarak deploy edecektir.

---

## 🎯 Adım 4: Test Et

### 4.1. Backend Health Check

1. Tarayıcınızda backend URL'inize gidin: `https://your-app-name.up.railway.app`
2. Şu mesajı görmelisiniz:
   ```json
   {"message":"Power BI Auditor API is running"}
   ```
3. Eğer bu mesajı görüyorsanız, backend çalışıyor! ✅

### 4.2. Frontend Test

1. Netlify sitenize gidin: https://dashboardmasteragent.netlify.app
2. Browser Developer Tools'u açın (F12)
3. **Console** sekmesine gidin
4. Bir dashboard görüntüsü yükleyin
5. Console'da hata olmamalı
6. Denetim işlemi başlamalı ve sonuç gelmeli

### 4.3. Network Kontrolü

1. Browser Developer Tools'da **Network** sekmesine gidin
2. Dashboard yükleyin
3. `/api/audit` veya benzeri bir API isteği görmelisiniz
4. İsteğin **Status** kodu `200` olmalı
5. İsteğin **URL**'i backend URL'inizi içermeli

---

## ✅ Başarı Kontrol Listesi

Tüm adımları tamamladıktan sonra kontrol edin:

- [ ] Backend URL'i Railway'dan alındı
- [ ] `NEXT_PUBLIC_API_BASE_URL` Netlify'a eklendi
- [ ] Netlify yeniden deploy edildi
- [ ] Backend health check başarılı (`/` endpoint)
- [ ] Frontend'ten dashboard yükleme çalışıyor
- [ ] Denetim sonuçları geliyor
- [ ] Console'da hata yok
- [ ] Network tab'da API istekleri başarılı (200)

---

## 🔧 Sorun Giderme

### Problem 1: Frontend Backend'e Bağlanamıyor

**Hata:** `Failed to fetch` veya `Network error`

**Çözüm:**
1. Backend URL'inin doğru olduğundan emin olun
2. Backend'in çalıştığını health check ile doğrulayın
3. `NEXT_PUBLIC_API_BASE_URL` environment variable'ının doğru ayarlandığından emin olun
4. Netlify'ı yeniden deploy edin

### Problem 2: CORS Hatası

**Hata:** `Access to fetch at '...' from origin '...' has been blocked by CORS policy`

**Çözüm:**
1. Railway'da `ALLOWED_ORIGINS` environment variable'ını kontrol edin
2. Netlify URL'inin listede olduğundan emin olun:
   ```
   ALLOWED_ORIGINS = https://dashboardmasteragent.netlify.app,http://localhost:3000
   ```
3. Railway'ı yeniden deploy edin

### Problem 3: Environment Variable Çalışmıyor

**Hata:** Frontend hala eski URL'i kullanıyor

**Çözüm:**
1. Netlify'da environment variable'ın doğru eklendiğinden emin olun
2. **"Clear cache and deploy site"** ile yeniden deploy edin
3. Browser cache'ini temizleyin (Ctrl+Shift+Delete)
4. Hard refresh yapın (Ctrl+F5)

### Problem 4: API Key Hatası

**Hata:** `API key not found` veya `Invalid API key`

**Çözüm:**
1. Railway'da `GOOGLE_API_KEY` environment variable'ının doğru ayarlandığından emin olun
2. API key'in başında/sonunda boşluk olmadığından emin olun
3. Railway'ı yeniden deploy edin

---

## 🎉 Başarılı Bağlantı Sonrası

Tüm adımlar tamamlandıktan ve testler başarılı olduktan sonra:

- ✅ Frontend Netlify'da çalışıyor
- ✅ Backend Railway'da çalışıyor
- ✅ İkisi birbirine bağlı
- ✅ Tüm özellikler çalışıyor

**Sisteminiz production'da ve kullanıma hazır! 🚀**

---

## 📞 Yardım

Eğer sorun yaşarsanız:

1. **Netlify Logs:** Netlify dashboard'unda **"Functions"** veya **"Deploys"** sekmesinde log'ları kontrol edin
2. **Railway Logs:** Railway dashboard'unda **"Deployments"** sekmesinde log'ları kontrol edin
3. **Browser Console:** Browser developer tools'da console hatalarını kontrol edin
4. **Network Tab:** Browser developer tools'da Network sekmesinde API isteklerini kontrol edin


# Railway Setup - Root Directory Sorunu Çözümü

## 🔴 Sorun
Railway, projenin root dizininde Python dosyası bulamadığı için build edemiyor. Backend `backend/` klasöründe olduğu için Railway'a bunu söylememiz gerekiyor.

## ✅ Çözüm: Railway Dashboard'da Root Directory Ayarla

### Adım 1: Railway Dashboard'a Git
1. Railway dashboard'unuzda projenize gidin
2. Projenizi seçin (veya yeni proje oluşturun)

### Adım 2: Service Ayarlarına Git
1. Sol menüden **"Settings"** sekmesine tıklayın
2. Aşağı kaydırın ve **"Root Directory"** bölümünü bulun

### Adım 3: Root Directory Ayarla
1. **"Set Root Directory"** butonuna tıklayın
2. `backend` yazın (sadece `backend`, `/backend` değil)
3. **"Save"** butonuna tıklayın

### Adım 4: Yeniden Deploy
1. Railway otomatik olarak yeniden deploy başlatacak
2. Veya manuel olarak **"Deployments"** sekmesinden **"Redeploy"** yapabilirsiniz

## ✅ Alternatif: Railway.json ile (Eğer Dashboard'da Ayarlayamazsanız)

Eğer Railway dashboard'unda root directory ayarlayamazsanız, proje root dizinine bir `railway.json` dosyası ekleyebilirsiniz:

```json
{
  "$schema": "https://railway.app/railway.schema.json",
  "build": {
    "builder": "NIXPACKS",
    "buildCommand": "cd backend && pip install -r requirements.txt"
  },
  "deploy": {
    "startCommand": "cd backend && uvicorn main:app --host 0.0.0.0 --port $PORT"
  }
}
```

**Ancak bu yöntem önerilmez.** Dashboard'dan ayarlamak daha temiz ve güvenilirdir.

## 📋 Kontrol Listesi

Deploy başarılı oldu mu kontrol edin:

- [ ] Root directory `backend` olarak ayarlandı
- [ ] Railway build log'larında Python algılandı
- [ ] `requirements.txt` dosyası bulundu
- [ ] `main.py` dosyası bulundu
- [ ] Build başarılı
- [ ] Deploy başarılı
- [ ] Backend URL'i çalışıyor

## 🔍 Build Log'larını Kontrol Et

Railway dashboard'unda **"Deployments"** sekmesine gidin ve build log'larını kontrol edin. Şunları görmelisiniz:

```
✓ Detected Python
✓ Installing dependencies from requirements.txt
✓ Starting uvicorn...
```

Eğer hala sorun varsa, build log'larını paylaşın.


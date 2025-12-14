# Netlify Deployment Guide

## Netlify Ayarları

### 1. Build Settings

Netlify dashboard'unda şu ayarları yapın:

**Base directory:** `frontend`
**Build command:** `npm install && npm run build`
**Publish directory:** `.next`

### 2. Environment Variables

Netlify dashboard'unda **Site settings > Environment variables** bölümüne şu değişkeni ekleyin:

```
NEXT_PUBLIC_API_BASE_URL = https://your-backend-url.com
```

**Önemli:** Backend'inizi de deploy etmeniz gerekiyor (örneğin Railway, Render, veya başka bir platform).

### 3. Backend Deployment

Backend'i ayrı bir platforma deploy edin ve CORS ayarlarını güncelleyin:

```python
# backend/main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "https://dashboardmasteragent.netlify.app",
        "http://localhost:3000"  # Development için
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### 4. Netlify Plugin

Netlify otomatik olarak `@netlify/plugin-nextjs` plugin'ini kullanacak. Bu plugin Next.js App Router için gerekli.

### 5. Troubleshooting

**404 Hatası:**
- `netlify.toml` dosyasının root dizinde olduğundan emin olun
- Build log'larını kontrol edin
- Next.js plugin'inin yüklendiğinden emin olun

**API Bağlantı Hatası:**
- `NEXT_PUBLIC_API_BASE_URL` environment variable'ının doğru ayarlandığından emin olun
- Backend'in CORS ayarlarını kontrol edin
- Backend'in çalıştığından emin olun


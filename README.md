# TariffAI — Pakistan Customs HS Code Classifier

AI-powered HS / PCT code classifier for Pakistan Customs, optimized for Sialkot exporters (sports goods, surgical instruments, textiles, leather).

## Features
- Accepts English or Roman Urdu product descriptions
- Returns 1–3 ranked HS/PCT codes with confidence, duty rate estimates, and notes
- Powered by Google Gemini

## Deploy
1. Import this repo on Vercel
2. Add environment variable: `GEMINI_API_KEY`
3. Deploy

## Local
```bash
# Requires Node 18+
# Set GEMINI_API_KEY
vercel dev
```

Live: https://tariffai.vercel.app

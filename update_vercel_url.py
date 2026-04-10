#!/usr/bin/env python3
"""
Script per aggiornare vercel.json con l'URL del backend Render
Usage: python update_vercel_url.py <render-backend-url>
Example: python update_vercel_url.py https://projecto-backend-abc123.onrender.com
"""

import json
import sys
import os

def update_vercel_json(backend_url):
    # Rimuovi trailing slash se presente
    backend_url = backend_url.rstrip('/')
    
    # Verifica che l'URL sia valido
    if not backend_url.startswith('http'):
        print("❌ Errore: L'URL deve iniziare con http:// o https://")
        sys.exit(1)
    
    # Aggiorna vercel.json nella root
    vercel_root = {
        "buildCommand": "cd frontend && npm install && npm run build",
        "outputDirectory": "frontend/dist",
        "framework": "vite",
        "rewrites": [
            { "source": "/api/(.*)", "destination": f"{backend_url}/api/$1" },
            { "source": "/(.*)", "destination": "/index.html" }
        ]
    }
    
    # Aggiorna frontend/vercel.json
    vercel_frontend = {
        "buildCommand": "npm run build",
        "outputDirectory": "dist",
        "rewrites": [
            { "source": "/api/(.*)", "destination": f"{backend_url}/api/$1" },
            { "source": "/(.*)", "destination": "/index.html" }
        ],
        "framework": "vite"
    }
    
    # Scrivi i file
    try:
        with open('vercel.json', 'w') as f:
            json.dump(vercel_root, f, indent=2)
        print(f"✅ Aggiornato: vercel.json (root)")
        
        with open('frontend/vercel.json', 'w') as f:
            json.dump(vercel_frontend, f, indent=2)
        print(f"✅ Aggiornato: frontend/vercel.json")
        
        print(f"\n🎉 Backend URL configurato: {backend_url}")
        print(f"\n📝 Ora fai il commit e push:")
        print(f"   git add vercel.json frontend/vercel.json")
        print(f"   git commit -m 'Update backend URL to Render'")
        print(f"   git push origin main")
        
    except Exception as e:
        print(f"❌ Errore: {e}")
        sys.exit(1)

if __name__ == '__main__':
    if len(sys.argv) != 2:
        print("Usage: python update_vercel_url.py <render-backend-url>")
        print("Example: python update_vercel_url.py https://projecto-backend-abc123.onrender.com")
        sys.exit(1)
    
    update_vercel_json(sys.argv[1])

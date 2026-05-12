# 🚀 React Admin Dashboard

Bu layihə, **React** və **React Router v6** istifadə edərək hazırlanmış, giriş və idarəetmə panelini özündə birləşdirən müasir veb tətbiqidir.

---

## 🛠 Xəta Həlli (Troubleshooting)

Layihənin inkişafı zamanı yaranan `Invalid hook call` xətasını aradan qaldırmaq üçün asılılıqlar yenilənmişdir. Əgər lokal mühitdə problem davam edərsə, aşağıdakı əmrləri ardıcıllıqla icra edin:

```bash
# 1. Mövcud paketləri və kilid fayllarını silin
rm -rf node_modules package-lock.json

# 2. Ən son stabil versiyaları quraşdırın
npm install react@latest react-dom@latest react-router-dom@latest

# 3. Layihəni yenidən başladın
npm run dev
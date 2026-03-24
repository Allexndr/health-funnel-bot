# 🤖 Телеграм Бот — Воронка Вздутие

Webhook-бот для воронки Ларисы. На `/start` — приветствие с видео, через **5 минут** — дожим с оффером и кнопкой «ЗАПИСАТЬСЯ».

---

## ⚡ Быстрый старт (деплой на Vercel)

### 1. Upstash QStash (для 5-минутного дожима)
1. Зайди на [console.upstash.com](https://console.upstash.com) → создай аккаунт (бесплатно)
2. Перейди в раздел **QStash** → скопируй:
   - `QSTASH_TOKEN`
   - `QSTASH_CURRENT_SIGNING_KEY`
   - `QSTASH_NEXT_SIGNING_KEY`

### 2. Деплой на Vercel
```bash
npm install
vercel --prod
```

### 3. Переменные окружения на Vercel
В Dashboard → Settings → Environment Variables добавь:

| Переменная | Значение |
|---|---|
| `BOT_TOKEN` | `8497044367:AAFPkcg_XNLCKsatMcSlJuv-ZafqPXTZHBk` |
| `QSTASH_TOKEN` | из Upstash Console |
| `QSTASH_CURRENT_SIGNING_KEY` | из Upstash Console |
| `QSTASH_NEXT_SIGNING_KEY` | из Upstash Console |
| `WEBHOOK_URL` | `https://YOUR_APP.vercel.app/api/webhook` |
| `DOJIM_URL` | `https://YOUR_APP.vercel.app/api/send-dojim` |

### 4. Привязать вебхук к боту
После деплоя открой в браузере:
```
https://api.telegram.org/bot<BOT_TOKEN>/setWebhook?url=https://YOUR_APP.vercel.app/api/webhook
```
Должен прийти ответ `{"ok":true}`.

---

## 📁 Структура

```
/
├── api/
│   ├── webhook.js      # Основной обработчик Telegram
│   └── send-dojim.js   # Дожим (вызывается QStash через 5 мин)
├── offer.png           # Картинка до/после для дожима
├── vercel.json         # Настройки Vercel
├── package.json
└── .env.example
```

---

## 🔄 Флоу воронки

```
Пользователь → /start
  └─ Бот: видео + приветствие от Ларисы
       └─ QStash: ставит таймер 5 минут
            └─ [через 5 мин] send-dojim:
                 ├─ картинка до/после
                 ├─ текст оффера
                 └─ кнопка [✍️ ЗАПИСАТЬСЯ] → t.me/elittetradegroup
```

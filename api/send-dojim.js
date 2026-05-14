// api/send-dojim.js — Дожим (вызывается QStash через 5 мин и 60 мин)
import { Bot, InlineKeyboard } from "grammy";
import { track } from "../lib/track.js";

const bot = new Bot(process.env.BOT_TOKEN);

// ─── Тексты дожима ───────────────────────────────────────────────────────────

const DOJIM_CAPTION = `✨ *Это не просто «до/после» — это про качество жизни\\.*

📅 *Январь 2023:* 74 кг, вздутия, отёки, тяга к сладкому, запоры, постоянная усталость\\.

📅 *Январь 2024:* 56 кг, лёгкость, энергия, чистый живот, никаких отёков и проблем с ЖКТ\\.
*Без жёстких диет\\. Без откатов\\.*

Я выстроила систему, которая работает — и сейчас помогаю другим женщинам прийти к такому же состоянию\\.`;

const OFFER_TEXT = `🌿 *Жить без Вздутия, Тяжести, Отёков, Запоров можно и нужно в любом возрасте\\!*

Возьму *30 человек* для индивидуального подбора БАДов и витаминов:
▫️ скидка 10% на продукцию
▫️ бесплатное 3\\-месячное сопровождение
▫️ работа в связке с южнокорейскими специалистами

*Как я работаю:*
Смотрю на ситуацию комплексно и подбираю схему под конкретного человека\\.

Собираем информацию: образ жизни, привычки, сон, питание, анализы — и выстраиваем личный план с нужными БАДами, чек\\-листом и при необходимости — 3\\-месячным наблюдением\\.

👇 *Запишитесь на бесплатный диагностический разбор* — места ограничены\\!`;

// ─── Основной обработчик ─────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  const body = req.body;
  const chatId = body?.chatId;
  const step = body?.step; // Какая сейчас стадия воронки? (1 или 2)

  if (!chatId) {
    return res.status(400).json({ ok: false, error: "Missing chatId" });
  }

  const keyboard = new InlineKeyboard().url(
    "✍️ ЗАПИСАТЬСЯ",
    "https://t.me/elittetradegroup"
  );

  try {
    if (step === 1) {
      // ШАГ 1: Через 5 минут отправляем ТОЛЬКО текстовый оффер про 30 мест
      await bot.api.sendMessage(chatId, OFFER_TEXT, {
        parse_mode: "MarkdownV2",
        reply_markup: keyboard,
      });
      await track({ userId: chatId, bot: "main", action: "dojim_1" });

    } else if (step === 2) {
      // ШАГ 2: Через 60 минут отправляем дожим с фото и рассказом о похудении
      // URL картинки из Vercel public-папки
      const imageUrl = `${process.env.WEBHOOK_URL.replace("/api/webhook", "")}/offer.png`;
      await bot.api.sendPhoto(chatId, imageUrl, {
        caption: DOJIM_CAPTION,
        parse_mode: "MarkdownV2",
        reply_markup: keyboard,
      });
      await track({ userId: chatId, bot: "main", action: "dojim_2" });
    }

    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("send-dojim error:", e);
    return res.status(500).json({ ok: false, error: String(e) });
  }
}

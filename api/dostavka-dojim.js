// api/dostavka-dojim.js — Дожим для бота Доставка
import { Bot, InlineKeyboard } from "grammy";
import { CONTACTS } from "../dostavka/content.js";

const bot = new Bot(process.env.BOT_TOKEN_DOSTAVKA);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true });
  }

  const { chatId, step } = req.body;

  if (!chatId) return res.status(400).json({ error: "No chatId" });

  const keyboard = new InlineKeyboard().url("🛍️ Оформить заказ", CONTACTS.TELEGRAM);

  try {
    if (step === 1) {
      await bot.api.sendMessage(chatId, "👋 Вы интересовались условиями доставки и нашими продуктами\\. Подсказать вам что-то по выбору или помочь оформить заказ?", {
        parse_mode: "MarkdownV2",
        reply_markup: keyboard,
      });
    }
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error("Dostavka dojim error:", e);
    return res.status(500).json({ error: String(e) });
  }
}

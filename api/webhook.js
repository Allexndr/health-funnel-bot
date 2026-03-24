// api/webhook.js — Главный обработчик вебхука Telegram
import { Bot, webhookCallback, InlineKeyboard } from "grammy";
import { Client } from "@upstash/qstash";

const bot = new Bot(process.env.BOT_TOKEN);
const qstash = new Client({ token: process.env.QSTASH_TOKEN });

// ─── Тексты ────────────────────────────────────────────────────────────────

const WELCOME_TEXT = `
👋 *Привет\\! Меня зовут Лариса\\.* Живу в Корее\\.

Показываю изнутри систему профилактики здоровья, молодости и красоты\\.

В 44 года, став мамой второго ребёнка, взялась за своё здоровье — оно просто *«ссыпалось»*\\. Сейчас мне 47 — и я в лучшей форме как внутри, так и снаружи\\.

🎥 В этом видео расскажу, как *избавиться от вздутия* и решить сопутствующие проблемы со здоровьем\\.

👇 Смотри и обязательно посмотри до конца\\!
`.trim();

// ─── Команда /start ─────────────────────────────────────────────────────────

bot.command("start", async (ctx) => {
  const chatId = ctx.chat.id;

  try {
    // 1. Отправляем видео YouTube
    await ctx.replyWithVideo(
      "https://youtu.be/NRISLtQkpDk?si=xUjEWiqXeqNpbRBU",
      {
        caption: WELCOME_TEXT,
        parse_mode: "MarkdownV2",
      }
    );
  } catch {
    // YouTube ссылка может не работать как файл — шлём как текст со ссылкой
    const keyboard = new InlineKeyboard().url(
      "▶️ Смотреть видео",
      "https://youtu.be/NRISLtQkpDk?si=xUjEWiqXeqNpbRBU"
    );
    await ctx.reply(WELCOME_TEXT, {
      parse_mode: "MarkdownV2",
      reply_markup: keyboard,
    });
  }

  // 2. Ставим задачу в QStash — первый дожим через 5 минут (шаг 1)
  try {
    await qstash.publishJSON({
      url: process.env.DOJIM_URL,
      delay: 300, // 300 секунд = 5 минут
      body: { chatId: String(chatId), step: 1 },
    });
    // 3. Ставим задачу в QStash — второй дожим через 60 минут (шаг 2)
    await qstash.publishJSON({
      url: process.env.DOJIM_URL,
      delay: 3600, // 3600 секунд = 60 минут
      body: { chatId: String(chatId), step: 2 },
    });
  } catch (e) {
    console.error("QStash error:", e);
  }
});

// ─── Экспорт обработчика ────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, message: "Webhook is alive!" });
  }
  return webhookCallback(bot, "next-js")(req, res);
}

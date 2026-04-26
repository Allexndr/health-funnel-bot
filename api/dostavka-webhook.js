// api/dostavka-webhook.js — Обработчик вебхука для бота Доставка
import { Bot, webhookCallback, InlineKeyboard } from "grammy";
import { Client } from "@upstash/qstash";
import { WELCOME_TEXT, DESC_LIFE_PRIME, DESC_META_GREEN, BUTTONS, CONTACTS } from "../dostavka/content.js";

const bot = new Bot(process.env.BOT_TOKEN_DOSTAVKA);
const qstash = new Client({ token: process.env.QSTASH_TOKEN });

// ─── Обработка кнопок ──────────────────────────────────────────────────────

const getMainKeyboard = () => new InlineKeyboard()
  .text(BUTTONS.DESC_LIFE, "desc_life").row()
  .text(BUTTONS.DESC_META, "desc_meta").row()
  .text(BUTTONS.MORE_INFO, "more_info").row()
  .url(BUTTONS.ORDER, CONTACTS.TELEGRAM);

const getBackKeyboard = () => new InlineKeyboard().text("⬅️ Назад", "main_menu");

bot.command("start", async (ctx) => {
  await ctx.reply(WELCOME_TEXT, {
    parse_mode: "MarkdownV2",
    reply_markup: getMainKeyboard(),
  });

  // Ставим дожим (опционально, по аналогии с первым ботом)
  try {
    if (process.env.DOSTAVKA_DOJIM_URL) {
      await qstash.publishJSON({
        url: process.env.DOSTAVKA_DOJIM_URL,
        delay: 3600, // 1 час
        body: { chatId: String(ctx.chat.id), step: 1 },
      });
    }
  } catch (e) {
    console.error("QStash error:", e);
  }
});

bot.callbackQuery("main_menu", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(WELCOME_TEXT, {
    parse_mode: "MarkdownV2",
    reply_markup: getMainKeyboard(),
  });
});

bot.callbackQuery("desc_life", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(DESC_LIFE_PRIME, {
    parse_mode: "MarkdownV2",
    reply_markup: getBackKeyboard(),
  });
});

bot.callbackQuery("desc_meta", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText(DESC_META_GREEN, {
    parse_mode: "MarkdownV2",
    reply_markup: getBackKeyboard(),
  });
});

bot.callbackQuery("more_info", async (ctx) => {
  await ctx.answerCallbackQuery();
  await ctx.editMessageText("Для получения подробной консультации напишите нам в личные сообщения\\:", {
    reply_markup: new InlineKeyboard()
      .url("✍️ Написать менеджеру", CONTACTS.TELEGRAM).row()
      .text("⬅️ Назад", "main_menu"),
  });
});

// ─── Экспорт обработчика ────────────────────────────────────────────────────

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(200).json({ ok: true, message: "Dostavka Webhook is alive!" });
  }
  return webhookCallback(bot, "next-js")(req, res);
}

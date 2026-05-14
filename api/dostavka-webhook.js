// api/dostavka-webhook.js — Обработчик вебхука для бота Доставка
import { Bot, webhookCallback, InlineKeyboard } from "grammy";
import { Client } from "@upstash/qstash";
import { WELCOME_TEXT, DESC_LIFE_PRIME, DESC_META_GREEN, BUTTONS, CONTACTS } from "../dostavka/content.js";
import { track } from "../lib/track.js";
import { createClient } from "@supabase/supabase-js";

const bot = new Bot(process.env.BOT_TOKEN_DOSTAVKA);
const qstash = new Client({ token: process.env.QSTASH_TOKEN });

// ─── Обработка кнопок ──────────────────────────────────────────────────────

const getMainKeyboard = () => new InlineKeyboard()
  .text(BUTTONS.DESC_LIFE, "desc_life").row()
  .text(BUTTONS.DESC_META, "desc_meta").row()
  .text(BUTTONS.MORE_INFO, "more_info").row()
  .url(BUTTONS.ORDER, CONTACTS.TELEGRAM);

const getBackKeyboard = () => new InlineKeyboard().text("⬅️ Назад", "main_menu");

const ADMIN_IDS = new Set([5450018125, 1405929755]);

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const ACTION_LABELS = {
  start:         "🚀 /start",
  dojim_1:       "⏱ Дожим 1 (5 мин)",
  dojim_2:       "⏱ Дожим 2 (60 мин)",
  btn_desc_life: "🧬 Описание Лай Витамина",
  btn_desc_meta: "🌿 Описание Мета ГРИН",
  btn_more_info: "ℹ️ Хочу узнать больше",
  btn_main_menu: "🔙 Назад в меню",
};

function fmtDate(iso) {
  return new Date(iso).toLocaleString("ru-RU", { timeZone: "Asia/Seoul", hour12: false });
}

async function sendAdminStats(ctx) {
  const { data: statsRaw } = await supabase
    .from("user_events")
    .select("action");

  const { count: totalUsers } = await supabase
    .from("user_events")
    .select("user_id", { count: "exact", head: true });

  const { data: uniqueRaw } = await supabase
    .from("user_events")
    .select("user_id");

  const uniqueIds = new Set((uniqueRaw || []).map(r => r.user_id));

  const counts = {};
  for (const row of (statsRaw || [])) {
    counts[row.action] = (counts[row.action] || 0) + 1;
  }

  let text = `📊 *Аналитика воронки*\n`;
  text += `👥 Уникальных пользователей: *${uniqueIds.size}*\n`;
  text += `📝 Всего событий: *${(statsRaw || []).length}*\n\n`;
  text += `*По действиям:*\n`;

  for (const [action, label] of Object.entries(ACTION_LABELS)) {
    text += `${label}: *${counts[action] || 0}*\n`;
  }

  const keyboard = new InlineKeyboard()
    .text("👥 Последние юзеры", "adm_users").row()
    .text("🔄 Обновить", "adm_refresh");

  await ctx.reply(text, { parse_mode: "Markdown", reply_markup: keyboard });
}

async function sendUsersList(ctx) {
  const { data } = await supabase
    .from("user_events")
    .select("user_id, username, first_name, action, created_at")
    .order("created_at", { ascending: false })
    .limit(100);

  const seen = new Map();
  for (const row of (data || [])) {
    if (!seen.has(row.user_id)) seen.set(row.user_id, row);
  }

  const users = [...seen.values()].slice(0, 20);

  if (!users.length) {
    return ctx.reply("Пока нет данных.");
  }

  let text = `👥 *Последние 20 пользователей:*\n\n`;
  for (const u of users) {
    const name = u.first_name || "—";
    const username = u.username ? `@${u.username}` : `id:${u.user_id}`;
    const lastAction = ACTION_LABELS[u.action] || u.action;
    text += `• ${name} (${username})\n  └ ${lastAction} — ${fmtDate(u.created_at)}\n`;
  }

  const keyboard = new InlineKeyboard().text("⬅️ Назад", "adm_refresh");
  await ctx.reply(text, { parse_mode: "Markdown", reply_markup: keyboard });
}

bot.command("admin", async (ctx) => {
  if (!ADMIN_IDS.has(ctx.from.id)) {
    return ctx.reply("⛔️ Нет доступа.");
  }
  await sendAdminStats(ctx);
});

bot.callbackQuery("adm_refresh", async (ctx) => {
  if (!ADMIN_IDS.has(ctx.from.id)) return ctx.answerCallbackQuery();
  await ctx.answerCallbackQuery("Обновлено");
  await sendAdminStats(ctx);
});

bot.callbackQuery("adm_users", async (ctx) => {
  if (!ADMIN_IDS.has(ctx.from.id)) return ctx.answerCallbackQuery();
  await ctx.answerCallbackQuery();
  await sendUsersList(ctx);
});

bot.command("start", async (ctx) => {
  await track({
    userId:    ctx.from.id,
    username:  ctx.from?.username,
    firstName: ctx.from?.first_name,
    bot:       "dostavka",
    action:    "start",
  });

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
  await track({
    userId:    ctx.from.id,
    username:  ctx.from?.username,
    firstName: ctx.from?.first_name,
    bot:       "dostavka",
    action:    "btn_main_menu",
  });
  await ctx.editMessageText(WELCOME_TEXT, {
    parse_mode: "MarkdownV2",
    reply_markup: getMainKeyboard(),
  });
});

bot.callbackQuery("desc_life", async (ctx) => {
  await ctx.answerCallbackQuery();
  await track({
    userId:    ctx.from.id,
    username:  ctx.from?.username,
    firstName: ctx.from?.first_name,
    bot:       "dostavka",
    action:    "btn_desc_life",
  });
  await ctx.editMessageText(DESC_LIFE_PRIME, {
    parse_mode: "MarkdownV2",
    reply_markup: getBackKeyboard(),
  });
});

bot.callbackQuery("desc_meta", async (ctx) => {
  await ctx.answerCallbackQuery();
  await track({
    userId:    ctx.from.id,
    username:  ctx.from?.username,
    firstName: ctx.from?.first_name,
    bot:       "dostavka",
    action:    "btn_desc_meta",
  });
  await ctx.editMessageText(DESC_META_GREEN, {
    parse_mode: "MarkdownV2",
    reply_markup: getBackKeyboard(),
  });
});

bot.callbackQuery("more_info", async (ctx) => {
  await ctx.answerCallbackQuery();
  await track({
    userId:    ctx.from.id,
    username:  ctx.from?.username,
    firstName: ctx.from?.first_name,
    bot:       "dostavka",
    action:    "btn_more_info",
  });
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

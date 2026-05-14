// api/admin.js — Панель аналитики воронки (только для Telegram user 5450018125)
import { Bot } from "grammy";
import { createClient } from "@supabase/supabase-js";

const ADMIN_USER_ID = 5450018125;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ─── Вспомогательные функции ─────────────────────────────────────────────────

function escapeHtml(str) {
  if (str == null) return "—";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  return d.toLocaleString("ru-RU", { timeZone: "Asia/Seoul", hour12: false });
}

function actionLabel(action) {
  const map = {
    start:         "🚀 /start",
    dojim_1:       "⏱ Дожим 1 (5 мин)",
    dojim_2:       "⏱ Дожим 2 (60 мин)",
    btn_desc_life: "🧬 Описание Лай Витамина",
    btn_desc_meta: "🌿 Описание Мета ГРИН",
    btn_more_info: "ℹ️ Хочу узнать больше",
    btn_main_menu: "🔙 Назад в меню",
  };
  return map[action] || action;
}

// ─── Проверка доступа через Telegram Init Data ────────────────────────────────

async function verifyTelegramUser(req) {
  const authHeader = req.headers["x-tg-user-id"];
  if (authHeader && Number(authHeader) === ADMIN_USER_ID) return true;

  const token = req.headers["authorization"]?.replace("Bearer ", "");
  if (!token) return false;

  try {
    const bot = new Bot(process.env.BOT_TOKEN || process.env.BOT_TOKEN_DOSTAVKA);
    const decoded = Buffer.from(token, "base64").toString("utf8");
    const data = JSON.parse(decoded);
    return Number(data.id) === ADMIN_USER_ID;
  } catch {
    return false;
  }
}

// ─── Генерация HTML ───────────────────────────────────────────────────────────

function buildHtml({ events, stats, page, totalPages, bot: botFilter, action: actionFilter }) {
  const bots = ["", "main", "dostavka"];
  const actions = ["", "start", "dojim_1", "dojim_2", "btn_desc_life", "btn_desc_meta", "btn_more_info", "btn_main_menu"];

  const filterQuery = (extra = {}) => {
    const p = { page: 1, bot: botFilter, action: actionFilter, ...extra };
    return Object.entries(p).filter(([, v]) => v != null && v !== "").map(([k, v]) => `${k}=${encodeURIComponent(v)}`).join("&");
  };

  const rows = events.map(e => `
    <tr>
      <td>${e.id}</td>
      <td>${formatDate(e.created_at)}</td>
      <td>${escapeHtml(e.user_id)}</td>
      <td>${escapeHtml(e.first_name)}</td>
      <td>${e.username ? `<a href="https://t.me/${escapeHtml(e.username)}" target="_blank">@${escapeHtml(e.username)}</a>` : "—"}</td>
      <td><span class="badge badge-${escapeHtml(e.bot)}">${escapeHtml(e.bot)}</span></td>
      <td><span class="action">${escapeHtml(actionLabel(e.action))}</span></td>
    </tr>`).join("");

  const statCards = Object.entries(stats).map(([action, count]) => `
    <div class="stat-card">
      <div class="stat-label">${escapeHtml(actionLabel(action))}</div>
      <div class="stat-value">${count}</div>
    </div>`).join("");

  const pagerLinks = Array.from({ length: totalPages }, (_, i) => i + 1).map(p => `
    <a href="?${filterQuery({ page: p })}" class="page-btn${p === page ? " active" : ""}">${p}</a>`).join("");

  return `<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width, initial-scale=1"/>
  <title>Admin — Воронка</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #0f1117; color: #e2e8f0; min-height: 100vh; }
    header { background: #1a1d2e; border-bottom: 1px solid #2d3148; padding: 16px 24px; display: flex; align-items: center; gap: 12px; }
    header h1 { font-size: 20px; font-weight: 700; color: #a78bfa; }
    header span { font-size: 13px; color: #64748b; }
    .container { max-width: 1400px; margin: 0 auto; padding: 24px; }
    .stats { display: flex; flex-wrap: wrap; gap: 12px; margin-bottom: 24px; }
    .stat-card { background: #1a1d2e; border: 1px solid #2d3148; border-radius: 10px; padding: 14px 20px; min-width: 160px; }
    .stat-label { font-size: 12px; color: #94a3b8; margin-bottom: 6px; }
    .stat-value { font-size: 28px; font-weight: 700; color: #a78bfa; }
    .filters { display: flex; gap: 12px; margin-bottom: 16px; flex-wrap: wrap; align-items: center; }
    .filters select, .filters input { background: #1a1d2e; border: 1px solid #2d3148; color: #e2e8f0; padding: 8px 12px; border-radius: 8px; font-size: 14px; outline: none; }
    .filters button { background: #7c3aed; color: #fff; border: none; padding: 8px 18px; border-radius: 8px; cursor: pointer; font-size: 14px; }
    .filters button:hover { background: #6d28d9; }
    table { width: 100%; border-collapse: collapse; background: #1a1d2e; border-radius: 12px; overflow: hidden; }
    th { background: #13152a; color: #94a3b8; font-size: 12px; font-weight: 600; text-transform: uppercase; padding: 12px 14px; text-align: left; }
    td { padding: 11px 14px; border-bottom: 1px solid #1e2235; font-size: 13px; vertical-align: middle; }
    tr:last-child td { border-bottom: none; }
    tr:hover td { background: #1e2235; }
    .badge { display: inline-block; padding: 3px 10px; border-radius: 999px; font-size: 11px; font-weight: 600; }
    .badge-main { background: #312e81; color: #a5b4fc; }
    .badge-dostavka { background: #14532d; color: #86efac; }
    .action { color: #cbd5e1; }
    a { color: #7dd3fc; text-decoration: none; }
    a:hover { text-decoration: underline; }
    .pager { display: flex; gap: 8px; margin-top: 20px; flex-wrap: wrap; }
    .page-btn { background: #1a1d2e; border: 1px solid #2d3148; color: #e2e8f0; padding: 6px 14px; border-radius: 8px; text-decoration: none; font-size: 13px; }
    .page-btn.active { background: #7c3aed; border-color: #7c3aed; color: #fff; }
    .page-btn:hover:not(.active) { background: #262940; }
    .empty { text-align: center; padding: 48px; color: #475569; font-size: 15px; }
  </style>
</head>
<body>
  <header>
    <h1>📊 Воронка — Аналитика</h1>
    <span>Только для администратора</span>
  </header>
  <div class="container">
    <div class="stats">${statCards}</div>

    <form method="get" class="filters">
      <select name="bot">
        <option value="" ${botFilter === "" ? "selected" : ""}>Все боты</option>
        <option value="main" ${botFilter === "main" ? "selected" : ""}>main (вздутие)</option>
        <option value="dostavka" ${botFilter === "dostavka" ? "selected" : ""}>dostavka</option>
      </select>
      <select name="action">
        <option value="">Все действия</option>
        ${actions.filter(Boolean).map(a => `<option value="${a}" ${actionFilter === a ? "selected" : ""}>${escapeHtml(actionLabel(a))}</option>`).join("")}
      </select>
      <button type="submit">Применить</button>
      <a href="/api/admin" style="color:#94a3b8;font-size:13px;margin-left:4px">Сбросить</a>
    </form>

    <table>
      <thead>
        <tr>
          <th>#</th>
          <th>Время (KST)</th>
          <th>User ID</th>
          <th>Имя</th>
          <th>Username</th>
          <th>Бот</th>
          <th>Действие</th>
        </tr>
      </thead>
      <tbody>
        ${rows || `<tr><td colspan="7" class="empty">Событий не найдено</td></tr>`}
      </tbody>
    </table>

    <div class="pager">${pagerLinks}</div>
  </div>
</body>
</html>`;
}

// ─── Основной обработчик ─────────────────────────────────────────────────────

const PAGE_SIZE = 50;

export default async function handler(req, res) {
  // ── Проверка доступа ──
  // Принимаем запрос ТОЛЬКО если в заголовке передан ID = 5450018125
  // ИЛИ если запрос приходит с ?secret=<ADMIN_SECRET> (для удобства в браузере)
  const secret = req.query?.secret;
  const headerUserId = Number(req.headers["x-tg-user-id"] ?? 0);
  const isAdmin =
    headerUserId === ADMIN_USER_ID ||
    (process.env.ADMIN_SECRET && secret === process.env.ADMIN_SECRET);

  if (!isAdmin) {
    return res.status(403).send("403 Forbidden");
  }

  // ── Параметры ──
  const page = Math.max(1, Number(req.query?.page ?? 1));
  const botFilter = req.query?.bot ?? "";
  const actionFilter = req.query?.action ?? "";
  const offset = (page - 1) * PAGE_SIZE;

  // ── Запрос событий ──
  let query = supabase
    .from("user_events")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (botFilter) query = query.eq("bot", botFilter);
  if (actionFilter) query = query.eq("action", actionFilter);

  const { data: events, count, error } = await query;

  if (error) {
    console.error("admin query error:", error);
    return res.status(500).send("DB error: " + error.message);
  }

  // ── Статистика по действиям ──
  const { data: statsRaw } = await supabase
    .from("user_events")
    .select("action")
    .order("action");

  const stats = {};
  for (const row of (statsRaw ?? [])) {
    stats[row.action] = (stats[row.action] ?? 0) + 1;
  }

  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const html = buildHtml({
    events: events ?? [],
    stats,
    page,
    totalPages,
    bot: botFilter,
    action: actionFilter,
  });

  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(html);
}

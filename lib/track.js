// lib/track.js — запись событий пользователя в Supabase
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * @param {object} opts
 * @param {number|string} opts.userId
 * @param {string} [opts.username]
 * @param {string} [opts.firstName]
 * @param {'main'|'dostavka'} [opts.bot]
 * @param {string} opts.action   — 'start' | 'dojim_1' | 'dojim_2' | 'btn_desc_life' | ...
 * @param {object} [opts.payload]
 */
export async function track({ userId, username, firstName, bot = "main", action, payload }) {
  try {
    await supabase.from("user_events").insert({
      user_id:    Number(userId),
      username:   username   ?? null,
      first_name: firstName  ?? null,
      bot,
      action,
      payload:    payload ?? null,
    });
  } catch (e) {
    console.error("track error:", e);
  }
}

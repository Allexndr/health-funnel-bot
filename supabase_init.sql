-- Создать таблицу событий воронки
-- Запустить в Supabase SQL Editor: https://supabase.com/dashboard/project/agodgwhdgjtctyqpfdui/sql

create table if not exists user_events (
  id         bigserial primary key,
  user_id    bigint       not null,
  username   text,
  first_name text,
  bot        text         not null default 'main',  -- 'main' | 'dostavka'
  action     text         not null,                  -- 'start', 'dojim_1', 'dojim_2', 'btn_desc_life', etc.
  payload    jsonb,                                  -- любые доп. данные
  created_at timestamptz  not null default now()
);

create index if not exists user_events_user_id_idx on user_events(user_id);
create index if not exists user_events_created_at_idx on user_events(created_at desc);

-- Разрешить anon читать (для /admin через service_role это не нужно, но пусть будет)
alter table user_events enable row level security;

-- service_role обходит RLS автоматически, anon — нет. Для /admin используем service_role key.

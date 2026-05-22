-- Fatewake — Schema inicial
-- Execute no SQL Editor do Supabase (cole tudo e clique em Run)

-- ── Campanhas (pertence ao GM) ────────────────────────────────────────────────
create table if not exists public.campanhas (
  id            uuid primary key default gen_random_uuid(),
  gm_id         uuid references auth.users(id) on delete cascade not null,
  nome          text not null,
  sistema       text not null default 'daggerheart',
  codigo_sala   text unique not null,   -- 6 chars maiúsculos gerado no cliente
  sessao_ativa  boolean not null default false,
  medo          int not null default 0 check (medo >= 0 and medo <= 12),
  notas_gm      text not null default '',
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ── Personagens na sala (jogadores anônimos) ──────────────────────────────────
create table if not exists public.personagens_sala (
  id            uuid primary key default gen_random_uuid(),
  campanha_id   uuid references public.campanhas(id) on delete cascade not null,
  nome_jogador  text not null,
  session_token uuid not null,   -- gerado no browser do jogador, prova identidade
  personagem    jsonb not null default '{}',
  online        boolean not null default true,
  criado_em     timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);

-- ── Índices ───────────────────────────────────────────────────────────────────
create index if not exists idx_campanhas_gm_id    on public.campanhas(gm_id);
create index if not exists idx_campanhas_codigo   on public.campanhas(codigo_sala);
create index if not exists idx_ps_campanha_id     on public.personagens_sala(campanha_id);

-- ── Trigger: atualiza atualizado_em automaticamente ──────────────────────────
create or replace function public.set_atualizado_em()
returns trigger language plpgsql as $$
begin
  new.atualizado_em = now();
  return new;
end;
$$;

create trigger campanhas_set_atualizado_em
  before update on public.campanhas
  for each row execute function public.set_atualizado_em();

create trigger ps_set_atualizado_em
  before update on public.personagens_sala
  for each row execute function public.set_atualizado_em();

-- ── Row Level Security ────────────────────────────────────────────────────────
alter table public.campanhas         enable row level security;
alter table public.personagens_sala  enable row level security;

-- GM pode criar/ver/editar/apagar suas próprias campanhas
create policy "GM gerencia suas campanhas"
  on public.campanhas for all
  to authenticated
  using  (gm_id = auth.uid())
  with check (gm_id = auth.uid());

-- Qualquer um (incluindo anônimo) pode ler campanha por código
create policy "Leitura pública de campanha por código"
  on public.campanhas for select
  to anon, authenticated
  using (true);

-- Qualquer um pode criar/ler/atualizar personagens na sala
-- (autenticação do jogador é pelo session_token, validada na app)
create policy "Jogadores gerenciam seu personagem na sala"
  on public.personagens_sala for all
  to anon, authenticated
  using (true)
  with check (true);

-- ── Realtime: habilitar para as duas tabelas ─────────────────────────────────
alter publication supabase_realtime add table public.campanhas;
alter publication supabase_realtime add table public.personagens_sala;

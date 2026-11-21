begin;

create table if not exists public.edge_members (
  email text primary key check (email = lower(btrim(email)) and email like '%@%'),
  name text not null check (char_length(btrim(name)) between 1 and 100),
  role text not null default 'member' check (role in ('admin','member')),
  created_at timestamptz not null default now()
);
create table if not exists public.edge_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  scope text not null default 'Shared' check (char_length(scope) between 1 and 100),
  priority text not null default 'Normal' check (priority in ('High','Normal','Low')),
  status text not null default 'To Do' check (status in ('To Do','In Progress','In Review','Done')),
  description text not null default '',
  acceptance text not null default '',
  assignee_email text references public.edge_members(email),
  backend_url text check (backend_url ~* '^https?://[^[:space:]]+$'),
  frontend_url text check (frontend_url ~* '^https?://[^[:space:]]+$'),
  due_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  revision bigint not null default 0
);
alter table public.edge_tasks add column if not exists archived_at timestamptz;

create table if not exists public.edge_history (
  id bigint generated always as identity primary key,
  task_id uuid not null references public.edge_tasks(id),
  field text not null,
  old_value text,
  new_value text,
  actor text,
  created_at timestamptz not null default now()
);
create index if not exists edge_history_task_created on public.edge_history(task_id,created_at desc,id desc);

create table if not exists public.edge_docs (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(btrim(title)) between 1 and 160),
  path text not null unique,
  kind text not null check (kind in ('html','md','pdf')),
  file_name text not null,
  created_at timestamptz not null default now(),
  check (split_part(path,'/',2) = id::text || '.' || kind)
);
create or replace function public.edge_task_history()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  changed_field text;
  before_row jsonb;
  after_row jsonb := to_jsonb(new);
begin
  if tg_op = 'INSERT' then
    insert into public.edge_history(task_id, field, new_value) values (new.id, 'created', new.title);
    if new.assignee_email is not null then
      insert into public.edge_history(task_id, field, new_value) values (new.id, 'assignee_email', new.assignee_email);
    end if;
    return new;
  end if;
  before_row := to_jsonb(old);
  new.updated_at := now();
  new.revision := old.revision + 1;
  foreach changed_field in array array['title','scope','priority','status','description','acceptance',
    'assignee_email','backend_url','frontend_url','due_date','archived_at']
  loop
    if before_row -> changed_field is distinct from after_row -> changed_field then
      insert into public.edge_history(task_id,field,old_value,new_value)
      values(new.id,changed_field,before_row ->> changed_field,after_row ->> changed_field);
    end if;
  end loop;
  return new;
end
$$;
revoke all on function public.edge_task_history() from public, anon, authenticated;
drop trigger if exists edge_audit_tasks on public.edge_tasks;
create trigger edge_audit_tasks before update on public.edge_tasks
  for each row execute function public.edge_task_history();
drop trigger if exists edge_audit_task_insert on public.edge_tasks;
create trigger edge_audit_task_insert after insert on public.edge_tasks
  for each row execute function public.edge_task_history();

alter table public.edge_members enable row level security;
alter table public.edge_tasks enable row level security;
alter table public.edge_history enable row level security;
alter table public.edge_docs enable row level security;
revoke all on public.edge_members, public.edge_tasks, public.edge_history, public.edge_docs from anon, authenticated;
grant select (email,name,role), insert (email,name,role) on public.edge_members to anon, authenticated;
grant select on public.edge_tasks, public.edge_history to anon, authenticated;
grant insert (id,title,scope,priority,status,description,acceptance,assignee_email,backend_url,frontend_url,due_date)
  on public.edge_tasks to anon, authenticated;
grant update (title,scope,priority,status,description,acceptance,assignee_email,backend_url,frontend_url,due_date,archived_at)
  on public.edge_tasks to anon, authenticated;
grant select, insert on public.edge_docs to anon, authenticated;

drop policy if exists edge_members_read on public.edge_members;
create policy edge_members_read on public.edge_members for select to anon, authenticated using (email like '%@roster.invalid');
drop policy if exists edge_members_add on public.edge_members;
create policy edge_members_add on public.edge_members for insert to anon, authenticated
  with check (role = 'member' and email ~ '^[0-9a-f-]{36}@roster[.]invalid$');
drop policy if exists edge_tasks_read on public.edge_tasks;
create policy edge_tasks_read on public.edge_tasks for select to anon, authenticated using (true);
drop policy if exists edge_tasks_add on public.edge_tasks;
create policy edge_tasks_add on public.edge_tasks for insert to anon, authenticated with check (true);
drop policy if exists edge_tasks_edit on public.edge_tasks;
create policy edge_tasks_edit on public.edge_tasks for update to anon, authenticated
  using (archived_at is null) with check (true);
drop policy if exists edge_history_read on public.edge_history;
create policy edge_history_read on public.edge_history for select to anon, authenticated using (true);
drop policy if exists edge_docs_read on public.edge_docs;
create policy edge_docs_read on public.edge_docs for select to anon, authenticated using (split_part(path,'/',1) = 'shared');
drop policy if exists edge_docs_upload on public.edge_docs;
create policy edge_docs_upload on public.edge_docs for insert to anon, authenticated
  with check (split_part(path,'/',1) = 'shared');

insert into storage.buckets (id,name,public,file_size_limit,allowed_mime_types)
values ('gnb-edge-docs','gnb-edge-docs',false,10485760,array['text/html','text/markdown','application/pdf'])
on conflict (id) do nothing;
drop policy if exists edge_storage_read on storage.objects;
create policy edge_storage_read on storage.objects for select to anon, authenticated
  using (bucket_id = 'gnb-edge-docs' and name ~ '^shared/[0-9a-f-]{36}[.](html|md|pdf)$');
drop policy if exists edge_storage_upload on storage.objects;
create policy edge_storage_upload on storage.objects for insert to anon, authenticated
  with check (bucket_id = 'gnb-edge-docs' and name ~ '^shared/[0-9a-f-]{36}[.](html|md|pdf)$');
drop policy if exists edge_storage_rollback on storage.objects;
create policy edge_storage_rollback on storage.objects for delete to anon, authenticated
  using (bucket_id = 'gnb-edge-docs' and name ~ '^shared/[0-9a-f-]{36}[.](html|md|pdf)$'
    and not exists (select 1 from public.edge_docs as d where d.path = storage.objects.name));

-- This workspace is intentionally accessible without login. Use only shareable data.

commit;

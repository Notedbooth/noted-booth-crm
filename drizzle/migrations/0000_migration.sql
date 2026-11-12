
-- ============ ENUMS ============
create type public.app_role as enum ('admin', 'manager', 'sales', 'operations');
create type public.lead_stage as enum ('new_lead','contacted','interested','quote_sent','negotiation','confirmed','in_execution','completed','lost');
create type public.booking_status as enum ('tentative','confirmed','in_preparation','in_progress','completed','cancelled');
create type public.task_priority as enum ('low','medium','high','urgent');
create type public.task_status as enum ('open','in_progress','done','cancelled');
create type public.interaction_type as enum ('call','whatsapp','email','meeting','note');
create type public.request_status as enum ('new','converted','rejected');

-- ============ PROFILES & ROLES ============
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  email text,
  phone text,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;

create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role public.app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.user_roles where user_id = _user_id and role = _role)
$$;

create or replace function public.is_staff(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    join public.user_roles r on r.user_id = p.id
    where p.id = _user_id and p.is_active
  )
$$;

create or replace function public.has_any_role(_user_id uuid, _roles public.app_role[])
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.profiles p
    join public.user_roles r on r.user_id = p.id
    where p.id = _user_id and p.is_active and r.role = any(_roles)
  )
$$;

-- Public: tells the sign-in page whether the first admin still needs to be created
create or replace function public.setup_required()
returns boolean language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.user_roles where role = 'admin')
$$;
grant execute on function public.setup_required() to anon, authenticated;

create policy "Staff can view profiles" on public.profiles for select to authenticated
  using (public.is_staff(auth.uid()) or id = auth.uid());
create policy "Users update own profile, admins update all" on public.profiles for update to authenticated
  using (id = auth.uid() or public.has_any_role(auth.uid(), array['admin']::public.app_role[]))
  with check (id = auth.uid() or public.has_any_role(auth.uid(), array['admin']::public.app_role[]));

create policy "Staff can view roles" on public.user_roles for select to authenticated
  using (public.is_staff(auth.uid()) or user_id = auth.uid());

-- Prevent non-admins from re-activating themselves
create or replace function public.guard_profile_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.is_active is distinct from old.is_active
     and auth.uid() is not null
     and not public.has_role(auth.uid(), 'admin') then
    raise exception 'Only admins can change account status';
  end if;
  if new.email is distinct from old.email and auth.uid() is not null and not public.has_role(auth.uid(), 'admin') then
    new.email := old.email;
  end if;
  new.updated_at := now();
  return new;
end $$;
create trigger trg_guard_profile before update on public.profiles
  for each row execute function public.guard_profile_update();

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)), new.email)
  on conflict (id) do nothing;
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============ SHARED TRIGGER FUNCTIONS ============
create or replace function public.set_audit_fields()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    new.created_by := coalesce(new.created_by, auth.uid());
    new.updated_by := coalesce(auth.uid(), new.created_by);
    new.created_at := coalesce(new.created_at, now());
  else
    new.created_by := old.created_by;
    new.created_at := old.created_at;
    new.updated_by := coalesce(auth.uid(), new.updated_by);
  end if;
  new.updated_at := now();
  return new;
end $$;

-- ============ PACKAGES ============
create table public.packages (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  duration_hours numeric(5,2),
  price numeric(12,2),
  is_active boolean not null default true,
  sort_order int not null default 0,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update, delete on public.packages to authenticated;
grant all on public.packages to service_role;
alter table public.packages enable row level security;
create policy "Staff view packages" on public.packages for select to authenticated using (public.is_staff(auth.uid()));
create policy "Managers insert packages" on public.packages for insert to authenticated with check (public.has_any_role(auth.uid(), array['admin','manager']::public.app_role[]));
create policy "Managers update packages" on public.packages for update to authenticated using (public.has_any_role(auth.uid(), array['admin','manager']::public.app_role[]));
create policy "Managers delete packages" on public.packages for delete to authenticated using (public.has_any_role(auth.uid(), array['admin','manager']::public.app_role[]));

-- ============ CUSTOMERS ============
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  whatsapp text,
  email text,
  company text,
  city text,
  source text,
  notes text,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.customers (created_at desc);
create index on public.customers (phone);
grant select, insert, update, delete on public.customers to authenticated;
grant all on public.customers to service_role;
alter table public.customers enable row level security;
create policy "Staff view customers" on public.customers for select to authenticated using (public.is_staff(auth.uid()));
create policy "Sales insert customers" on public.customers for insert to authenticated with check (public.has_any_role(auth.uid(), array['admin','manager','sales']::public.app_role[]));
create policy "Sales update customers" on public.customers for update to authenticated using (public.has_any_role(auth.uid(), array['admin','manager','sales']::public.app_role[]));
create policy "Managers delete customers" on public.customers for delete to authenticated using (public.has_any_role(auth.uid(), array['admin','manager']::public.app_role[]));

-- ============ LEADS (pipeline) ============
create table public.leads (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  title text not null,
  stage public.lead_stage not null default 'new_lead',
  event_type text,
  event_date date,
  venue text,
  guests int,
  package_id uuid references public.packages(id) on delete set null,
  estimated_value numeric(12,2),
  source text,
  assigned_to uuid references public.profiles(id) on delete set null,
  lost_reason text,
  notes text,
  stage_changed_at timestamptz not null default now(),
  closed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.leads (stage);
create index on public.leads (customer_id);
create index on public.leads (created_at desc);
grant select, insert, update, delete on public.leads to authenticated;
grant all on public.leads to service_role;
alter table public.leads enable row level security;
create policy "Staff view leads" on public.leads for select to authenticated using (public.is_staff(auth.uid()));
create policy "Sales insert leads" on public.leads for insert to authenticated with check (public.has_any_role(auth.uid(), array['admin','manager','sales']::public.app_role[]));
create policy "Staff update leads" on public.leads for update to authenticated using (public.is_staff(auth.uid()));
create policy "Managers delete leads" on public.leads for delete to authenticated using (public.has_any_role(auth.uid(), array['admin','manager']::public.app_role[]));

create or replace function public.lead_stage_tracking()
returns trigger language plpgsql set search_path = public as $$
begin
  if tg_op = 'INSERT' or new.stage is distinct from old.stage then
    new.stage_changed_at := now();
    if new.stage in ('completed','lost') then new.closed_at := now(); else new.closed_at := null; end if;
  end if;
  return new;
end $$;

-- ============ BOOKINGS ============
create sequence public.booking_number_seq start 1001;
create table public.bookings (
  id uuid primary key default gen_random_uuid(),
  booking_number text not null unique default ('NB-' || nextval('public.booking_number_seq')::text),
  customer_id uuid not null references public.customers(id) on delete restrict,
  lead_id uuid references public.leads(id) on delete set null,
  package_id uuid references public.packages(id) on delete set null,
  event_type text,
  event_date date not null,
  start_time time,
  end_time time,
  venue_name text,
  venue_address text,
  city text,
  guests int,
  status public.booking_status not null default 'confirmed',
  total_value numeric(12,2),
  assigned_to uuid references public.profiles(id) on delete set null,
  operational_notes text,
  source text not null default 'manual',
  external_ref text unique,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.bookings (event_date);
create index on public.bookings (status);
create index on public.bookings (customer_id);
grant select, insert, update, delete on public.bookings to authenticated;
grant usage on sequence public.booking_number_seq to authenticated, service_role;
grant all on public.bookings to service_role;
alter table public.bookings enable row level security;
create policy "Staff view bookings" on public.bookings for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff insert bookings" on public.bookings for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "Staff update bookings" on public.bookings for update to authenticated using (public.is_staff(auth.uid()));
create policy "Managers delete bookings" on public.bookings for delete to authenticated using (public.has_any_role(auth.uid(), array['admin','manager']::public.app_role[]));

-- ============ TASKS ============
create table public.tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  due_date timestamptz,
  priority public.task_priority not null default 'medium',
  status public.task_status not null default 'open',
  customer_id uuid references public.customers(id) on delete set null,
  lead_id uuid references public.leads(id) on delete set null,
  booking_id uuid references public.bookings(id) on delete set null,
  assigned_to uuid references public.profiles(id) on delete set null,
  completed_at timestamptz,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.tasks (status, due_date);
create index on public.tasks (assigned_to);
grant select, insert, update, delete on public.tasks to authenticated;
grant all on public.tasks to service_role;
alter table public.tasks enable row level security;
create policy "Staff view tasks" on public.tasks for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff insert tasks" on public.tasks for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "Staff update tasks" on public.tasks for update to authenticated using (public.is_staff(auth.uid()));
create policy "Managers or creators delete tasks" on public.tasks for delete to authenticated
  using (public.has_any_role(auth.uid(), array['admin','manager']::public.app_role[]) or (created_by = auth.uid() and public.is_staff(auth.uid())));

create or replace function public.task_completion_tracking()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.status = 'done' and (tg_op = 'INSERT' or old.status is distinct from 'done') then
    new.completed_at := now();
  elsif new.status <> 'done' then
    new.completed_at := null;
  end if;
  return new;
end $$;

-- ============ CUSTOMER INTERACTIONS ============
create table public.customer_interactions (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  lead_id uuid references public.leads(id) on delete set null,
  type public.interaction_type not null default 'note',
  content text not null,
  occurred_at timestamptz not null default now(),
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.customer_interactions (customer_id, occurred_at desc);
grant select, insert, update, delete on public.customer_interactions to authenticated;
grant all on public.customer_interactions to service_role;
alter table public.customer_interactions enable row level security;
create policy "Staff view interactions" on public.customer_interactions for select to authenticated using (public.is_staff(auth.uid()));
create policy "Staff insert interactions" on public.customer_interactions for insert to authenticated with check (public.is_staff(auth.uid()));
create policy "Owner or manager update interactions" on public.customer_interactions for update to authenticated
  using (public.is_staff(auth.uid()) and (created_by = auth.uid() or public.has_any_role(auth.uid(), array['admin','manager']::public.app_role[])));
create policy "Owner or manager delete interactions" on public.customer_interactions for delete to authenticated
  using (public.is_staff(auth.uid()) and (created_by = auth.uid() or public.has_any_role(auth.uid(), array['admin','manager']::public.app_role[])));

-- ============ BOOKING REQUESTS (from external website) ============
create table public.booking_requests (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  phone text,
  email text,
  event_type text,
  event_date date,
  venue text,
  city text,
  guests int,
  package_name text,
  message text,
  source text not null default 'website',
  external_ref text unique,
  status public.request_status not null default 'new',
  payload jsonb,
  converted_customer_id uuid references public.customers(id) on delete set null,
  converted_lead_id uuid references public.leads(id) on delete set null,
  created_by uuid references public.profiles(id) on delete set null,
  updated_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on public.booking_requests (status, created_at desc);
grant select, insert, update, delete on public.booking_requests to authenticated;
grant all on public.booking_requests to service_role;
alter table public.booking_requests enable row level security;
create policy "Sales view requests" on public.booking_requests for select to authenticated using (public.has_any_role(auth.uid(), array['admin','manager','sales']::public.app_role[]));
create policy "Sales insert requests" on public.booking_requests for insert to authenticated with check (public.has_any_role(auth.uid(), array['admin','manager','sales']::public.app_role[]));
create policy "Sales update requests" on public.booking_requests for update to authenticated using (public.has_any_role(auth.uid(), array['admin','manager','sales']::public.app_role[]));
create policy "Managers delete requests" on public.booking_requests for delete to authenticated using (public.has_any_role(auth.uid(), array['admin','manager']::public.app_role[]));

-- ============ ACTIVITY LOG ============
create table public.activity_log (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references public.profiles(id) on delete set null,
  action text not null,
  entity_type text not null,
  entity_id uuid,
  entity_label text,
  customer_id uuid,
  changes jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);
create index on public.activity_log (created_at desc);
create index on public.activity_log (customer_id, created_at desc);
create index on public.activity_log (actor_id, created_at desc);
create index on public.activity_log (entity_type, entity_id);
grant select on public.activity_log to authenticated;
grant all on public.activity_log to service_role;
alter table public.activity_log enable row level security;
create policy "Staff view activity" on public.activity_log for select to authenticated using (public.is_staff(auth.uid()));

create or replace function public.log_activity()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  v_new jsonb; v_old jsonb; v_row jsonb;
  v_changes jsonb := '{}'::jsonb; k text; v_action text; v_id uuid; v_customer uuid; v_label text;
begin
  if tg_op = 'DELETE' then
    v_old := to_jsonb(old); v_row := v_old; v_action := 'deleted'; v_id := old.id;
  elsif tg_op = 'INSERT' then
    v_new := to_jsonb(new); v_row := v_new; v_action := 'created'; v_id := new.id;
  else
    v_new := to_jsonb(new); v_old := to_jsonb(old); v_row := v_new; v_action := 'updated'; v_id := new.id;
    for k in select jsonb_object_keys(v_new) loop
      if k not in ('updated_at','updated_by','created_at','created_by','stage_changed_at','closed_at','completed_at')
         and (v_new -> k) is distinct from (v_old -> k) then
        v_changes := v_changes || jsonb_build_object(k, jsonb_build_object('from', v_old -> k, 'to', v_new -> k));
      end if;
    end loop;
    if v_changes = '{}'::jsonb then return new; end if;
    if v_changes ? 'stage' or v_changes ? 'status' then v_action := 'status_changed'; end if;
  end if;

  v_label := coalesce(v_row->>'booking_number', v_row->>'full_name', v_row->>'title', v_row->>'name', left(v_row->>'content', 80), '');
  if tg_table_name = 'customers' then
    v_customer := v_id;
  elsif v_row ? 'customer_id' and nullif(v_row->>'customer_id','') is not null then
    v_customer := (v_row->>'customer_id')::uuid;
  elsif v_row ? 'converted_customer_id' and nullif(v_row->>'converted_customer_id','') is not null then
    v_customer := (v_row->>'converted_customer_id')::uuid;
  end if;

  insert into public.activity_log (actor_id, action, entity_type, entity_id, entity_label, customer_id, changes)
  values (case when exists (select 1 from public.profiles where id = auth.uid()) then auth.uid() else null end,
          v_action, tg_table_name, v_id, v_label, v_customer, v_changes);
  return coalesce(new, old);
end $$;

-- ============ ATTACH TRIGGERS ============
do $$
declare t text;
begin
  foreach t in array array['packages','customers','leads','bookings','tasks','customer_interactions','booking_requests'] loop
    execute format('create trigger trg_audit_%1$s before insert or update on public.%1$s for each row execute function public.set_audit_fields()', t);
    execute format('create trigger trg_log_%1$s after insert or update or delete on public.%1$s for each row execute function public.log_activity()', t);
  end loop;
end $$;

create trigger trg_lead_stage before insert or update on public.leads
  for each row execute function public.lead_stage_tracking();
create trigger trg_task_completion before insert or update on public.tasks
  for each row execute function public.task_completion_tracking();

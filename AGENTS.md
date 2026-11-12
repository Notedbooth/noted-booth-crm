<!-- LOVABLE:BEGIN -->
> [!IMPORTANT]
> This project is connected to [Lovable](https://lovable.dev). Avoid rewriting
> published git history — force pushing, or rebasing/amending/squashing commits
> that are already pushed — as it rewrites history on Lovable's side and the
> user will likely lose their project history.
>
> Commits you push to the connected branch sync back to Lovable and show up in
> the editor, so keep the branch in a working state.

## What Lovable manages

Rules outside this block are the project's own. Change the pieces below in
Lovable, not by hand. With the [Lovable MCP](https://mcp.lovable.dev)
connected, `send_message` asks Lovable to do it; otherwise ask the user to
use the editor.

- **Database.** Do not add or edit `supabase/migrations/` or `drizzle/`.
  Ask Lovable to change the schema.
- **Generated files.** Do not edit a file whose header says it is automatically
  generated.
- **AI gateway.** Keep model calls on Lovable's gateway, and keep
  `LOVABLE_API_KEY` out of browser code.
- **Connectors.** Lovable provides native connectors. `list_connectors` shows
  which are enabled; `add_connector` only returns the dashboard link. When a
  connector is enabled, calls go through the connector gateway and need
  `LOVABLE_API_KEY`. When Lovable does not provide one, users can bring their
  own key and store it in Secrets.
- **Secrets.** Lovable manages them. Do not put secret values in the repo.
<!-- LOVABLE:END -->

## Project rules
- CRM data is read/written from the browser Supabase client under RLS; only privileged account work (bootstrap admin, team create/update/password) goes through server functions in `src/lib/team.functions.ts`. Why: RLS enforces role permissions per row, admin API needs the service role.
- Role capabilities live in `src/lib/permissions.ts` and must stay in sync with the RLS helper functions (`is_staff`, `has_any_role`). Why: UI gating and database policies must agree.
- Activity log rows are written only by the `log_activity` database trigger. Why: every create/update/delete is recorded regardless of which client made it.
- External booking websites post to `/api/public/booking-requests` with the `x-api-key` secret; requests land in `booking_requests` for staff to convert. Why: keeps outside traffic out of core CRM tables.
- No accounting, invoicing, expenses or VAT modules. Why: product scope is CRM and operations only.

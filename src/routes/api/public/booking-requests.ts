import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

/**
 * Inbound endpoint for the external booking website.
 * POST JSON with header `x-api-key: <BOOKING_API_KEY>`.
 * Requests land in the "طلبات الموقع" inbox where staff convert them to customers + leads.
 */
const payloadSchema = z.object({
  full_name: z.string().trim().min(1).max(150),
  phone: z.string().trim().max(30).optional(),
  email: z.string().trim().email().max(255).optional(),
  event_type: z.string().trim().max(100).optional(),
  event_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/)
    .optional(),
  venue: z.string().trim().max(255).optional(),
  city: z.string().trim().max(100).optional(),
  guests: z.number().int().min(0).max(100000).optional(),
  package_name: z.string().trim().max(150).optional(),
  message: z.string().trim().max(5000).optional(),
  external_ref: z.string().trim().max(150).optional(),
});

function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

export const Route = createFileRoute("/api/public/booking-requests")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const expected = process.env["BOOKING_API_KEY"];
        const provided = request.headers.get("x-api-key") ?? "";
        if (!expected || !timingSafeEqual(provided, expected)) {
          return Response.json({ error: "unauthorized" }, { status: 401 });
        }
        let body: unknown;
        try {
          body = await request.json();
        } catch {
          return Response.json({ error: "invalid_json" }, { status: 400 });
        }
        const parsed = payloadSchema.safeParse(body);
        if (!parsed.success) {
          return Response.json({ error: "invalid_payload", issues: parsed.error.flatten() }, { status: 422 });
        }
        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const row = { ...parsed.data, source: "website", payload: body as never };
        const { data, error } = parsed.data.external_ref
          ? await supabaseAdmin.from("booking_requests").upsert(row, { onConflict: "external_ref" }).select("id").single()
          : await supabaseAdmin.from("booking_requests").insert(row).select("id").single();
        if (error) {
          console.error("booking request insert failed", error);
          return Response.json({ error: "storage_failed" }, { status: 500 });
        }
        return Response.json({ id: data.id, status: "received" }, { status: 201 });
      },
    },
  },
});

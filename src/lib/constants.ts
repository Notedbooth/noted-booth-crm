import type { Database } from "@/integrations/supabase/types";

export type AppRole = Database["public"]["Enums"]["app_role"];
export type LeadStage = Database["public"]["Enums"]["lead_stage"];
export type BookingStatus = Database["public"]["Enums"]["booking_status"];
export type TaskPriority = Database["public"]["Enums"]["task_priority"];
export type TaskStatus = Database["public"]["Enums"]["task_status"];
export type InteractionType = Database["public"]["Enums"]["interaction_type"];
export type RequestStatus = Database["public"]["Enums"]["request_status"];

export const BRAND_NAME = "NOTED PHOTO BOOTH";
export const CURRENCY_LABEL = "ر.س";

export const ROLE_LABELS: Record<AppRole, string> = {
  admin: "مدير النظام",
  manager: "مدير",
  sales: "مبيعات",
  operations: "عمليات",
};

export const ROLE_DESCRIPTIONS: Record<AppRole, string> = {
  admin: "صلاحيات كاملة بما فيها إدارة الفريق",
  manager: "إدارة كل السجلات والتقارير والحذف",
  sales: "العملاء والفرص والمتابعات والحجوزات",
  operations: "تنفيذ الحجوزات والمهام التشغيلية",
};

export const LEAD_STAGES: LeadStage[] = [
  "new_lead",
  "contacted",
  "interested",
  "quote_sent",
  "negotiation",
  "confirmed",
  "in_execution",
  "completed",
  "lost",
];

export const LEAD_STAGE_LABELS: Record<LeadStage, string> = {
  new_lead: "عميل محتمل جديد",
  contacted: "تم التواصل",
  interested: "مهتم",
  quote_sent: "تم إرسال عرض السعر",
  negotiation: "تفاوض",
  confirmed: "مؤكد",
  in_execution: "قيد التنفيذ",
  completed: "مكتمل",
  lost: "خسارة",
};

/** Stages that count as a won deal for conversion reporting. */
export const WON_STAGES: LeadStage[] = ["confirmed", "in_execution", "completed"];
/** Stages still being worked by sales. */
export const OPEN_STAGES: LeadStage[] = ["new_lead", "contacted", "interested", "quote_sent", "negotiation"];

export const BOOKING_STATUSES: BookingStatus[] = [
  "tentative",
  "confirmed",
  "in_preparation",
  "in_progress",
  "completed",
  "cancelled",
];
export const BOOKING_STATUS_LABELS: Record<BookingStatus, string> = {
  tentative: "مبدئي",
  confirmed: "مؤكد",
  in_preparation: "قيد التجهيز",
  in_progress: "قيد التنفيذ",
  completed: "مكتمل",
  cancelled: "ملغي",
};

export const TASK_PRIORITIES: TaskPriority[] = ["low", "medium", "high", "urgent"];
export const TASK_PRIORITY_LABELS: Record<TaskPriority, string> = {
  low: "منخفضة",
  medium: "متوسطة",
  high: "عالية",
  urgent: "عاجلة",
};
export const TASK_STATUSES: TaskStatus[] = ["open", "in_progress", "done", "cancelled"];
export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  open: "مفتوحة",
  in_progress: "قيد العمل",
  done: "منجزة",
  cancelled: "ملغاة",
};

export const INTERACTION_TYPES: InteractionType[] = ["call", "whatsapp", "email", "meeting", "note"];
export const INTERACTION_LABELS: Record<InteractionType, string> = {
  call: "مكالمة",
  whatsapp: "واتساب",
  email: "بريد إلكتروني",
  meeting: "اجتماع",
  note: "ملاحظة",
};

export const REQUEST_STATUS_LABELS: Record<RequestStatus, string> = {
  new: "جديد",
  converted: "تم التحويل",
  rejected: "مرفوض",
};

export const LEAD_SOURCES = ["انستقرام", "واتساب", "تيك توك", "سناب شات", "الموقع الإلكتروني", "توصية", "معرض", "أخرى"];
export const EVENT_TYPES = ["زفاف", "خطوبة", "تخرج", "حفل شركة", "مؤتمر", "عيد ميلاد", "افتتاح", "مناسبة خاصة", "أخرى"];

export const ENTITY_LABELS: Record<string, string> = {
  customers: "عميل",
  leads: "فرصة بيع",
  bookings: "حجز",
  tasks: "مهمة متابعة",
  packages: "باقة",
  customer_interactions: "تواصل",
  booking_requests: "طلب حجز",
};

export const ACTION_LABELS: Record<string, string> = {
  created: "أنشأ",
  updated: "عدّل",
  deleted: "حذف",
  status_changed: "غيّر حالة",
};

export const FIELD_LABELS: Record<string, string> = {
  full_name: "الاسم",
  phone: "الجوال",
  whatsapp: "واتساب",
  email: "البريد",
  company: "الجهة",
  city: "المدينة",
  source: "المصدر",
  notes: "الملاحظات",
  title: "العنوان",
  stage: "المرحلة",
  status: "الحالة",
  event_type: "نوع المناسبة",
  event_date: "تاريخ المناسبة",
  venue: "المكان",
  venue_name: "القاعة / المكان",
  venue_address: "العنوان",
  guests: "عدد الضيوف",
  package_id: "الباقة",
  estimated_value: "القيمة المتوقعة",
  total_value: "قيمة الحجز",
  assigned_to: "المسؤول",
  lost_reason: "سبب الخسارة",
  start_time: "وقت البدء",
  end_time: "وقت الانتهاء",
  operational_notes: "ملاحظات تشغيلية",
  due_date: "تاريخ الاستحقاق",
  priority: "الأولوية",
  description: "الوصف",
  content: "المحتوى",
  type: "النوع",
  name: "الاسم",
  price: "السعر",
  duration_hours: "المدة",
  is_active: "مفعّل",
  customer_id: "العميل",
  lead_id: "الفرصة",
  booking_id: "الحجز",
};

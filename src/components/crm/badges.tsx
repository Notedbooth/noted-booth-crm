import { cn } from "@/lib/utils";
import {
  BOOKING_STATUS_LABELS,
  LEAD_STAGE_LABELS,
  REQUEST_STATUS_LABELS,
  ROLE_LABELS,
  TASK_PRIORITY_LABELS,
  TASK_STATUS_LABELS,
  type AppRole,
  type BookingStatus,
  type LeadStage,
  type RequestStatus,
  type TaskPriority,
  type TaskStatus,
} from "@/lib/constants";

const base = "inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium";

export const STAGE_TONE: Record<LeadStage, string> = {
  new_lead: "bg-secondary text-secondary-foreground",
  contacted: "bg-mist text-secondary-foreground ring-1 ring-accent",
  interested: "bg-accent/60 text-accent-foreground",
  quote_sent: "bg-accent text-accent-foreground",
  negotiation: "bg-warning/25 text-warning-foreground",
  confirmed: "bg-primary text-primary-foreground",
  in_execution: "bg-primary/80 text-primary-foreground",
  completed: "bg-success/15 text-success",
  lost: "bg-destructive/10 text-destructive",
};

export function StageBadge({ stage, className }: { stage: LeadStage; className?: string }) {
  return <span className={cn(base, STAGE_TONE[stage], className)}>{LEAD_STAGE_LABELS[stage]}</span>;
}

const BOOKING_TONE: Record<BookingStatus, string> = {
  tentative: "bg-muted text-muted-foreground",
  confirmed: "bg-primary text-primary-foreground",
  in_preparation: "bg-accent text-accent-foreground",
  in_progress: "bg-warning/25 text-warning-foreground",
  completed: "bg-success/15 text-success",
  cancelled: "bg-destructive/10 text-destructive",
};
export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  return <span className={cn(base, BOOKING_TONE[status])}>{BOOKING_STATUS_LABELS[status]}</span>;
}

const PRIORITY_TONE: Record<TaskPriority, string> = {
  low: "bg-muted text-muted-foreground",
  medium: "bg-secondary text-secondary-foreground",
  high: "bg-warning/25 text-warning-foreground",
  urgent: "bg-destructive/10 text-destructive",
};
export function PriorityBadge({ priority }: { priority: TaskPriority }) {
  return <span className={cn(base, PRIORITY_TONE[priority])}>{TASK_PRIORITY_LABELS[priority]}</span>;
}

const TASK_TONE: Record<TaskStatus, string> = {
  open: "bg-secondary text-secondary-foreground",
  in_progress: "bg-accent text-accent-foreground",
  done: "bg-success/15 text-success",
  cancelled: "bg-muted text-muted-foreground line-through",
};
export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  return <span className={cn(base, TASK_TONE[status])}>{TASK_STATUS_LABELS[status]}</span>;
}

const REQ_TONE: Record<RequestStatus, string> = {
  new: "bg-accent text-accent-foreground",
  converted: "bg-success/15 text-success",
  rejected: "bg-muted text-muted-foreground",
};
export function RequestStatusBadge({ status }: { status: RequestStatus }) {
  return <span className={cn(base, REQ_TONE[status])}>{REQUEST_STATUS_LABELS[status]}</span>;
}

export function RoleBadge({ role }: { role: AppRole }) {
  return (
    <span className={cn(base, role === "admin" ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground")}>
      {ROLE_LABELS[role]}
    </span>
  );
}

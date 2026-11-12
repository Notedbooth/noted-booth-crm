import { useQuery } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";
import { Check, ChevronsUpDown, Plus } from "lucide-react";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { customersQuery, packagesQuery, teamQuery } from "@/lib/data";
import { CustomerFormDialog } from "./customer-form";

export function Field({
  label,
  required,
  children,
  className,
  hint,
}: {
  label: string;
  required?: boolean;
  children: ReactNode;
  className?: string;
  hint?: string;
}) {
  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-sm font-medium">
        {label}
        {required && <span className="ms-1 text-destructive">*</span>}
      </Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

export const NONE = "__none__";

export function OptionSelect({
  value,
  onChange,
  options,
  placeholder = "اختر",
  allowNone,
  noneLabel = "بدون",
}: {
  value: string | null | undefined;
  onChange: (v: string | null) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  allowNone?: boolean;
  noneLabel?: string;
}) {
  return (
    <Select {...((value ?? (allowNone ? NONE : undefined)) !== undefined ? { value: (value ?? NONE) as string } : {})} onValueChange={(v) => onChange(v === NONE ? null : v)}>
      <SelectTrigger className="w-full">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {allowNone && <SelectItem value={NONE}>{noneLabel}</SelectItem>}
        {options.map((o) => (
          <SelectItem key={o.value} value={o.value}>
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function MemberSelect({ value, onChange }: { value: string | null | undefined; onChange: (v: string | null) => void }) {
  const { data = [] } = useQuery(teamQuery());
  const options = data
    .filter((m) => m.is_active && m.roles.length > 0)
    .map((m) => ({ value: m.id, label: m.full_name || m.email || "—" }));
  return <OptionSelect value={value} onChange={onChange} options={options} allowNone noneLabel="غير مُسند" />;
}

export function PackageSelect({ value, onChange }: { value: string | null | undefined; onChange: (v: string | null) => void }) {
  const { data = [] } = useQuery(packagesQuery());
  const options = data
    .filter((p) => p.is_active || p.id === value)
    .map((p) => ({ value: p.id, label: p.name }));
  return <OptionSelect value={value} onChange={onChange} options={options} allowNone noneLabel="بدون باقة" />;
}

/** Suggests common values but still allows free text. */
export function SuggestInput({
  value,
  onChange,
  suggestions,
  placeholder,
  id,
}: {
  value: string;
  onChange: (v: string) => void;
  suggestions: string[];
  placeholder?: string;
  id: string;
}) {
  return (
    <>
      <input
        list={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
      />
      <datalist id={id}>
        {suggestions.map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
    </>
  );
}

export function CustomerPicker({
  value,
  onChange,
  allowCreate = true,
}: {
  value: string | null | undefined;
  onChange: (id: string | null) => void;
  allowCreate?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [createOpen, setCreateOpen] = useState(false);
  const { data = [] } = useQuery(customersQuery());
  const selected = data.find((c) => c.id === value);
  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" role="combobox" className="w-full justify-between font-normal">
            <span className={cn("truncate", !selected && "text-muted-foreground")}>
              {selected ? `${selected.full_name}${selected.phone ? ` — ${selected.phone}` : ""}` : "ابحث واختر العميل"}
            </span>
            <ChevronsUpDown className="opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-(--radix-popover-trigger-width) p-0" align="start">
          <Command
            filter={(itemValue, search) => (itemValue.toLowerCase().includes(search.toLowerCase()) ? 1 : 0)}
          >
            <CommandInput placeholder="الاسم أو رقم الجوال..." />
            <CommandList>
              <CommandEmpty>لا يوجد عميل مطابق</CommandEmpty>
              <CommandGroup>
                {data.map((c) => (
                  <CommandItem
                    key={c.id}
                    value={`${c.full_name} ${c.phone ?? ""} ${c.company ?? ""} ${c.id}`}
                    onSelect={() => {
                      onChange(c.id);
                      setOpen(false);
                    }}
                  >
                    <Check className={cn("size-4", value === c.id ? "opacity-100" : "opacity-0")} />
                    <span className="truncate">{c.full_name}</span>
                    {c.phone && <span className="ms-auto text-xs text-muted-foreground" dir="ltr">{c.phone}</span>}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
            {allowCreate && (
              <div className="border-t p-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full justify-start"
                  onClick={() => {
                    setOpen(false);
                    setCreateOpen(true);
                  }}
                >
                  <Plus /> إضافة عميل جديد
                </Button>
              </div>
            )}
          </Command>
        </PopoverContent>
      </Popover>
      {allowCreate && (
        <CustomerFormDialog open={createOpen} onOpenChange={setCreateOpen} onSaved={(c) => onChange(c.id)} />
      )}
    </>
  );
}

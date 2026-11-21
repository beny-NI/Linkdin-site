"use client";

import { Plus, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export interface FieldDef<T> {
  key: keyof T & string;
  label: string;
  placeholder?: string;
  multiline?: boolean;
  /** tailwind col-span for the md+ grid (grid has 6 columns) */
  span?: 1 | 2 | 3 | 4 | 6;
}

const SPAN: Record<number, string> = { 1: "md:col-span-1", 2: "md:col-span-2", 3: "md:col-span-3", 4: "md:col-span-4", 6: "md:col-span-6" };

/** Repeating group of fields, e.g. experience: role / org / period / description. */
export function ListEditor<T extends object>({
  value,
  onChange,
  fields,
  empty,
  addLabel,
  emptyText = "Nothing added yet.",
}: {
  value: T[];
  onChange: (next: T[]) => void;
  fields: FieldDef<T>[];
  empty: T;
  addLabel: string;
  emptyText?: string;
}) {
  function update(index: number, key: keyof T & string, v: string) {
    onChange(value.map((item, i) => (i === index ? { ...item, [key]: v } : item)));
  }

  return (
    <div className="space-y-3">
      {value.length === 0 && <p className="text-xs text-muted-foreground">{emptyText}</p>}
      {value.map((item, index) => (
        <div key={index} className="relative rounded-xl border border-border bg-background p-4">
          <button
            type="button"
            onClick={() => onChange(value.filter((_, i) => i !== index))}
            className="absolute right-2 top-2 rounded p-1 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove item"
          >
            <X className="h-4 w-4" />
          </button>
          <div className="grid gap-3 pr-6 md:grid-cols-6">
            {fields.map((f) => {
              const val = String((item as Record<string, unknown>)[f.key] ?? "");
              return (
                <div key={f.key} className={cn("space-y-1", SPAN[f.span ?? 3] ?? "md:col-span-3")}>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.1em] text-muted-foreground">
                    {f.label}
                  </label>
                  {f.multiline ? (
                    <Textarea
                      value={val}
                      onChange={(e) => update(index, f.key, e.target.value)}
                      placeholder={f.placeholder}
                      rows={3}
                    />
                  ) : (
                    <Input value={val} onChange={(e) => update(index, f.key, e.target.value)} placeholder={f.placeholder} />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, { ...empty }])}>
        <Plus aria-hidden /> {addLabel}
      </Button>
    </div>
  );
}

/** Simple list of single-line strings (e.g. achievements). */
export function StringListEditor({
  value,
  onChange,
  addLabel,
  placeholder,
}: {
  value: string[];
  onChange: (next: string[]) => void;
  addLabel: string;
  placeholder?: string;
}) {
  return (
    <div className="space-y-2">
      {value.map((v, i) => (
        <div key={i} className="flex items-center gap-2">
          <Input
            value={v}
            onChange={(e) => onChange(value.map((x, j) => (j === i ? e.target.value : x)))}
            placeholder={placeholder}
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((_, j) => j !== i))}
            className="rounded p-2 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
            aria-label="Remove"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <Button type="button" variant="outline" size="sm" onClick={() => onChange([...value, ""])}>
        <Plus aria-hidden /> {addLabel}
      </Button>
    </div>
  );
}

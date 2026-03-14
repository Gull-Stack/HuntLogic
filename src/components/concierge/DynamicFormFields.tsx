"use client";

import { useState, useCallback, useMemo } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown } from "lucide-react";

/* ------------------------------------------------------------------ */
/*  Types                                                              */
/* ------------------------------------------------------------------ */

export interface FormField {
  name: string;
  type:
    | "text"
    | "date"
    | "select"
    | "checkbox"
    | "ssn"
    | "tel"
    | "email"
    | "number"
    | "textarea";
  label: string;
  required?: boolean;
  pattern?: string;
  placeholder?: string;
  helpText?: string;
  options?: string[]; // for select type
  default?: unknown;
  encrypted?: boolean; // sensitive fields like SSN
  visibleWhen?: { field: string; value: unknown }; // conditional visibility
}

export interface FormSection {
  title: string;
  fields: FormField[];
}

export interface FormSchema {
  sections: FormSection[];
  maxChoices?: number;
  partyApplicationSupported?: boolean;
  maxPartySize?: number;
  requiredDocuments?: string[];
}

interface DynamicFormFieldsProps {
  schema: FormSchema;
  values?: Record<string, unknown>;
  onChange: (formData: Record<string, unknown>) => void;
  className?: string;
}

/* ------------------------------------------------------------------ */
/*  Styles                                                             */
/* ------------------------------------------------------------------ */

const INPUT_BASE =
  "w-full rounded-[8px] border border-brand-sage/20 bg-white px-3 py-2.5 text-sm text-brand-bark transition-colors focus:border-brand-forest focus:outline-none focus:ring-2 focus:ring-brand-forest/20 dark:border-brand-sage/30 dark:bg-brand-bark dark:text-brand-cream min-h-[44px]";

const LABEL_BASE =
  "mb-1.5 block text-sm font-medium text-brand-bark dark:text-brand-cream";

/* ------------------------------------------------------------------ */
/*  SSN Input                                                          */
/* ------------------------------------------------------------------ */

function SsnInput({
  value,
  onChange,
  placeholder,
  required,
}: {
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [isFocused, setIsFocused] = useState(false);

  // Strip non-digits for storage
  const rawDigits = (value || "").replace(/\D/g, "").slice(0, 9);

  // Format for display: either full when focused, or masked when blurred
  const displayValue = useMemo(() => {
    if (isFocused) {
      // Show formatted: XXX-XX-XXXX
      if (rawDigits.length <= 3) return rawDigits;
      if (rawDigits.length <= 5)
        return `${rawDigits.slice(0, 3)}-${rawDigits.slice(3)}`;
      return `${rawDigits.slice(0, 3)}-${rawDigits.slice(3, 5)}-${rawDigits.slice(5)}`;
    }
    // Masked: show only last 4
    if (rawDigits.length === 0) return "";
    if (rawDigits.length <= 4) return rawDigits;
    return `***-**-${rawDigits.slice(5)}`;
  }, [rawDigits, isFocused]);

  return (
    <input
      type={isFocused ? "text" : "password"}
      inputMode="numeric"
      autoComplete="off"
      value={displayValue}
      placeholder={placeholder || "XXX-XX-XXXX"}
      required={required}
      className={INPUT_BASE}
      onFocus={() => setIsFocused(true)}
      onBlur={() => setIsFocused(false)}
      onChange={(e) => {
        const digits = e.target.value.replace(/\D/g, "").slice(0, 9);
        onChange(digits);
      }}
    />
  );
}

/* ------------------------------------------------------------------ */
/*  Field Renderer                                                     */
/* ------------------------------------------------------------------ */

function FieldRenderer({
  field,
  value,
  onFieldChange,
}: {
  field: FormField;
  value: unknown;
  onFieldChange: (name: string, value: unknown) => void;
}) {
  const handleChange = useCallback(
    (v: unknown) => onFieldChange(field.name, v),
    [field.name, onFieldChange]
  );

  switch (field.type) {
    case "text":
    case "email":
    case "tel":
    case "number":
      return (
        <input
          type={field.type}
          value={(value as string) ?? ""}
          placeholder={field.placeholder}
          required={field.required}
          pattern={field.pattern}
          className={INPUT_BASE}
          onChange={(e) =>
            handleChange(
              field.type === "number"
                ? e.target.valueAsNumber || ""
                : e.target.value
            )
          }
        />
      );

    case "date":
      return (
        <input
          type="date"
          value={(value as string) ?? ""}
          required={field.required}
          className={INPUT_BASE}
          onChange={(e) => handleChange(e.target.value)}
        />
      );

    case "textarea":
      return (
        <textarea
          value={(value as string) ?? ""}
          placeholder={field.placeholder}
          required={field.required}
          rows={3}
          className={cn(INPUT_BASE, "min-h-[80px] resize-y")}
          onChange={(e) => handleChange(e.target.value)}
        />
      );

    case "select":
      return (
        <div className="relative">
          <select
            value={(value as string) ?? ""}
            required={field.required}
            className={cn(INPUT_BASE, "appearance-none pr-10")}
            onChange={(e) => handleChange(e.target.value)}
          >
            <option value="">
              {field.placeholder || `Select ${field.label}...`}
            </option>
            {field.options?.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-sage" />
        </div>
      );

    case "checkbox":
      return (
        <label className="flex items-center gap-2 min-h-[44px] cursor-pointer">
          <input
            type="checkbox"
            checked={!!value}
            className="h-4 w-4 rounded border-brand-sage/30 text-brand-forest focus:ring-brand-forest/20"
            onChange={(e) => handleChange(e.target.checked)}
          />
          <span className="text-sm text-brand-bark dark:text-brand-cream">
            {field.placeholder || field.label}
          </span>
        </label>
      );

    case "ssn":
      return (
        <SsnInput
          value={(value as string) ?? ""}
          onChange={(v) => handleChange(v)}
          placeholder={field.placeholder}
          required={field.required}
        />
      );

    default:
      return (
        <input
          type="text"
          value={(value as string) ?? ""}
          placeholder={field.placeholder}
          className={INPUT_BASE}
          onChange={(e) => handleChange(e.target.value)}
        />
      );
  }
}

/* ------------------------------------------------------------------ */
/*  Main Component                                                     */
/* ------------------------------------------------------------------ */

export default function DynamicFormFields({
  schema,
  values = {},
  onChange,
  className,
}: DynamicFormFieldsProps) {
  const [checkedDocs, setCheckedDocs] = useState<Record<string, boolean>>({});

  // Merge defaults from schema into current values
  const currentValues = useMemo(() => {
    const merged: Record<string, unknown> = {};
    for (const section of schema.sections) {
      for (const field of section.fields) {
        if (field.default !== undefined && values[field.name] === undefined) {
          merged[field.name] = field.default;
        }
      }
    }
    return { ...merged, ...values };
  }, [schema, values]);

  const handleFieldChange = useCallback(
    (name: string, value: unknown) => {
      const next = { ...currentValues, [name]: value };
      onChange(next);
    },
    [currentValues, onChange]
  );

  // Determine if a field should be visible based on visibleWhen
  const isFieldVisible = useCallback(
    (field: FormField): boolean => {
      if (!field.visibleWhen) return true;
      const depValue = currentValues[field.visibleWhen.field];
      return depValue === field.visibleWhen.value;
    },
    [currentValues]
  );

  return (
    <div className={cn("space-y-6", className)}>
      {schema.sections.map((section, sIdx) => {
        const visibleFields = section.fields.filter(isFieldVisible);
        if (visibleFields.length === 0) return null;

        return (
          <div key={sIdx}>
            <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-forest dark:text-brand-cream/80">
              {section.title}
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {visibleFields.map((field) => {
                // Checkbox renders its own label inline
                if (field.type === "checkbox") {
                  return (
                    <div key={field.name} className="sm:col-span-2">
                      <FieldRenderer
                        field={field}
                        value={currentValues[field.name]}
                        onFieldChange={handleFieldChange}
                      />
                      {field.helpText && (
                        <p className="mt-1 text-xs text-brand-sage">
                          {field.helpText}
                        </p>
                      )}
                    </div>
                  );
                }

                // Textarea gets full width
                const isFullWidth =
                  field.type === "textarea" || field.type === "ssn";

                return (
                  <div
                    key={field.name}
                    className={isFullWidth ? "sm:col-span-2" : undefined}
                  >
                    <label className={LABEL_BASE}>
                      {field.label}
                      {field.required && (
                        <span className="ml-0.5 text-danger">*</span>
                      )}
                      {field.encrypted && (
                        <span className="ml-1.5 text-[10px] font-normal text-brand-sage">
                          (encrypted)
                        </span>
                      )}
                    </label>
                    <FieldRenderer
                      field={field}
                      value={currentValues[field.name]}
                      onFieldChange={handleFieldChange}
                    />
                    {field.helpText && (
                      <p className="mt-1 text-xs text-brand-sage">
                        {field.helpText}
                      </p>
                    )}
                    {field.pattern && (
                      <p className="mt-1 text-[10px] text-brand-sage/70">
                        Format: {field.pattern}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Party application info */}
      {schema.partyApplicationSupported && (
        <div className="rounded-xl border border-brand-sage/10 bg-brand-sage/5 p-3 dark:border-brand-sage/20 dark:bg-brand-sage/10">
          <p className="text-xs text-brand-sage">
            This state supports party applications
            {schema.maxPartySize
              ? ` (up to ${schema.maxPartySize} members)`
              : ""}
            . You can link applications after adding items.
          </p>
        </div>
      )}

      {/* Max choices info */}
      {schema.maxChoices && schema.maxChoices > 1 && (
        <div className="rounded-xl border border-brand-sage/10 bg-brand-sage/5 p-3 dark:border-brand-sage/20 dark:bg-brand-sage/10">
          <p className="text-xs text-brand-sage">
            You can submit up to {schema.maxChoices} hunt choices for this
            application.
          </p>
        </div>
      )}

      {/* Required documents checklist */}
      {schema.requiredDocuments && schema.requiredDocuments.length > 0 && (
        <div>
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-brand-forest dark:text-brand-cream/80">
            Required Documents
          </h3>
          <div className="space-y-2">
            {schema.requiredDocuments.map((doc, i) => (
              <label
                key={i}
                className="flex items-center gap-2 min-h-[36px] cursor-pointer"
              >
                <input
                  type="checkbox"
                  checked={!!checkedDocs[doc]}
                  className="h-4 w-4 rounded border-brand-sage/30 text-brand-forest focus:ring-brand-forest/20"
                  onChange={(e) =>
                    setCheckedDocs((prev) => ({
                      ...prev,
                      [doc]: e.target.checked,
                    }))
                  }
                />
                <span className="text-sm text-brand-bark dark:text-brand-cream">
                  {doc}
                </span>
              </label>
            ))}
          </div>
          <p className="mt-2 text-[10px] text-brand-sage">
            Please have these documents ready. Our team will request them during
            fulfillment.
          </p>
        </div>
      )}
    </div>
  );
}

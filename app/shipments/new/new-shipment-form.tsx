"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useState, useTransition, type ReactNode } from "react";
import { useForm, type FieldPath, type UseFormRegister, type FieldErrors } from "react-hook-form";
import { FREIGHT_CLASSES, newShipmentSchema, type NewShipmentInput } from "@/lib/schemas";
import { createShipmentAction } from "./actions";

const EMPTY_STOP = { name: "", street1: "", city: "", state: "", postal_code: "", country: "US" as const };

export function NewShipmentForm() {
  const [pending, startTransition] = useTransition();
  const [formError, setFormError] = useState<string>();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors },
  } = useForm<NewShipmentInput>({
    resolver: zodResolver(newShipmentSchema),
    defaultValues: {
      reference: "",
      origin: EMPTY_STOP,
      destination: EMPTY_STOP,
      freight_class: "70",
      hazmat: false,
      special_instructions: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    setFormError(undefined);
    startTransition(async () => {
      const result = await createShipmentAction(values);
      // On success the action redirects and never returns.
      if (result.fieldErrors) {
        for (const [path, message] of Object.entries(result.fieldErrors)) {
          setError(path as FieldPath<NewShipmentInput>, { message });
        }
      }
      setFormError(result.formError);
    });
  });

  return (
    <form onSubmit={onSubmit} className="space-y-6" noValidate>
      <div className="grid gap-6 md:grid-cols-2">
        <StopFields prefix="origin" title="Pickup" register={register} errors={errors} />
        <StopFields prefix="destination" title="Delivery" register={register} errors={errors} />
      </div>

      <fieldset className="card grid gap-4 p-5 sm:grid-cols-2 lg:grid-cols-4">
        <legend className="sr-only">Freight</legend>
        <Field label="Pickup date" error={errors.pickup_date?.message}>
          <input type="date" className="field-input" {...register("pickup_date")} />
        </Field>
        <Field label="Total weight (lb)" error={errors.weight_lbs?.message}>
          <input type="number" min={1} step={1} className="field-input" {...register("weight_lbs", { valueAsNumber: true })} />
        </Field>
        <Field label="Handling units" error={errors.pieces?.message}>
          <input type="number" min={1} step={1} className="field-input" {...register("pieces", { valueAsNumber: true })} />
        </Field>
        <Field label="Freight class" error={errors.freight_class?.message}>
          <select className="field-input" {...register("freight_class")}>
            {FREIGHT_CLASSES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Reference / PO" error={errors.reference?.message}>
          <input className="field-input" placeholder="Optional" {...register("reference")} />
        </Field>
        <label className="flex items-center gap-2 self-end pb-2 text-sm">
          <input type="checkbox" className="h-4 w-4 rounded border-slate-300" {...register("hazmat")} />
          Contains hazardous materials
        </label>
        <div className="sm:col-span-2 lg:col-span-4">
          <Field label="Special instructions" error={errors.special_instructions?.message}>
            <textarea rows={3} className="field-input" placeholder="Dock hours, liftgate, appointment numbers…" {...register("special_instructions")} />
          </Field>
        </div>
      </fieldset>

      {formError && (
        <p role="alert" className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {formError}
        </p>
      )}

      <div className="flex justify-end gap-3">
        <button type="submit" className="btn-primary" disabled={pending}>
          {pending ? "Tendering…" : "Tender shipment"}
        </button>
      </div>
    </form>
  );
}

function StopFields({
  prefix,
  title,
  register,
  errors,
}: {
  prefix: "origin" | "destination";
  title: string;
  register: UseFormRegister<NewShipmentInput>;
  errors: FieldErrors<NewShipmentInput>;
}) {
  const e = errors[prefix];
  return (
    <fieldset className="card space-y-4 p-5">
      <legend className="px-1 text-sm font-semibold text-slate-700">{title}</legend>
      <Field label="Facility" error={e?.name?.message}>
        <input className="field-input" {...register(`${prefix}.name`)} />
      </Field>
      <Field label="Street address" error={e?.street1?.message}>
        <input className="field-input" autoComplete="street-address" {...register(`${prefix}.street1`)} />
      </Field>
      <div className="grid grid-cols-6 gap-3">
        <div className="col-span-3">
          <Field label="City" error={e?.city?.message}>
            <input className="field-input" {...register(`${prefix}.city`)} />
          </Field>
        </div>
        <div className="col-span-1">
          <Field label="State" error={e?.state?.message}>
            <input className="field-input uppercase" maxLength={2} {...register(`${prefix}.state`)} />
          </Field>
        </div>
        <div className="col-span-2">
          <Field label="Postal code" error={e?.postal_code?.message}>
            <input className="field-input" {...register(`${prefix}.postal_code`)} />
          </Field>
        </div>
      </div>
      <Field label="Country" error={e?.country?.message}>
        <select className="field-input" {...register(`${prefix}.country`)}>
          <option value="US">United States</option>
          <option value="CA">Canada</option>
        </select>
      </Field>
    </fieldset>
  );
}

function Field({ label, error, children }: { label: string; error?: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="field-label">{label}</span>
      {children}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

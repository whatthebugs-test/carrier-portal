"use client";

import * as Dialog from "@radix-ui/react-dialog";
import { useState, useTransition } from "react";
import { cancelShipmentAction } from "@/app/shipments/[id]/actions";
import { formatProNumber } from "@/lib/format";

export function CancelShipmentDialog({ shipmentId, proNumber }: { shipmentId: string; proNumber: string }) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();

  function confirm() {
    setError(undefined);
    startTransition(async () => {
      const result = await cancelShipmentAction({ shipmentId, reason });
      if (result.ok) {
        setOpen(false);
        setReason("");
      } else {
        setError(result.error);
      }
    });
  }

  return (
    <Dialog.Root open={open} onOpenChange={setOpen}>
      <Dialog.Trigger asChild>
        <button type="button" className="btn-secondary text-red-700">
          Cancel shipment
        </button>
      </Dialog.Trigger>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 bg-slate-900/40" />
        <Dialog.Content className="card fixed left-1/2 top-1/2 w-full max-w-md -translate-x-1/2 -translate-y-1/2 p-6 focus:outline-none">
          <Dialog.Title className="text-lg font-semibold">Cancel PRO {formatProNumber(proNumber)}?</Dialog.Title>
          <Dialog.Description className="mt-1 text-sm text-ink-muted">
            Dispatch is notified immediately. Cancellations after a driver is assigned may incur a truck-ordered-not-used fee.
          </Dialog.Description>
          <label className="mt-4 block">
            <span className="field-label">Reason</span>
            <textarea rows={3} className="field-input" value={reason} onChange={(e) => setReason(e.target.value)} />
          </label>
          {error && <p className="field-error">{error}</p>}
          <div className="mt-6 flex justify-end gap-3">
            <Dialog.Close asChild>
              <button type="button" className="btn-secondary">
                Keep shipment
              </button>
            </Dialog.Close>
            <button type="button" className="btn-danger" onClick={confirm} disabled={pending}>
              {pending ? "Cancelling…" : "Cancel shipment"}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}

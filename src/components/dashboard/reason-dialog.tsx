"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const errorMessage = (e: unknown, fallback: string) =>
  e instanceof Error ? e.message : fallback;

/* ──────────────────────────────────────────────
   Шалтгаан асуух (хүчингүй болгох, цуцлах) — хэн, яагаад гэдэг нь audit-д үлдэнэ
   ────────────────────────────────────────────── */
export function ReasonDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel,
  onConfirm,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description: string;
  confirmLabel: string;
  onConfirm: (reason: string) => Promise<void>;
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        {open && (
          <ReasonForm
            title={title}
            description={description}
            confirmLabel={confirmLabel}
            onCancel={() => onOpenChange(false)}
            onConfirm={async (reason) => {
              await onConfirm(reason);
              onOpenChange(false);
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function ReasonForm({
  title,
  description,
  confirmLabel,
  onCancel,
  onConfirm,
}: {
  title: string;
  description: string;
  confirmLabel: string;
  onCancel: () => void;
  onConfirm: (reason: string) => Promise<void>;
}) {
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (reason.trim().length < 3) {
      toast.error("Шалтгааныг бичнэ үү");
      return;
    }
    setSubmitting(true);
    try {
      await onConfirm(reason.trim());
    } catch (err) {
      toast.error(errorMessage(err, "Амжилтгүй"));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <>
      <DialogHeader>
        <DialogTitle>{title}</DialogTitle>
        <DialogDescription>{description}</DialogDescription>
      </DialogHeader>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="reason-text">Шалтгаан *</Label>
          <Textarea
            id="reason-text"
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            rows={3}
            maxLength={300}
            required
            autoFocus
            disabled={submitting}
          />
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onCancel} disabled={submitting}>
            Болих
          </Button>
          <Button type="submit" variant="destructive-solid" disabled={submitting}>
            {submitting ? "Түр хүлээнэ үү..." : confirmLabel}
          </Button>
        </DialogFooter>
      </form>
    </>
  );
}

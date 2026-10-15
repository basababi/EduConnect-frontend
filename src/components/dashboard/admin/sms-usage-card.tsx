"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Pill } from "@/components/ui/dashboard-ui";
import { Ban, CheckCircle2, MessageSquareText, XCircle } from "lucide-react";
import { smsApi, type SmsLogItem, type SmsUsage } from "@/lib/api";
import { formatPhone } from "@/lib/phone";

export const SMS_PURPOSE_LABELS: Record<string, string> = {
  otp: "Нэвтрэх код",
  invite: "Нэвтрэх эрхийн урилга",
  payment_due: "Төлбөр ойртсон",
  payment_overdue: "Төлбөр хэтэрсэн",
  attendance: "Тасалсан",
  notification: "Бусад мэдэгдэл",
};

const SMS_ERROR_LABELS: Record<string, string> = {
  provider_disabled: "SMS үйлчилгээ тохируулаагүй",
  monthly_limit: "Сарын хязгаар хэтэрсэн",
  invalid_phone: "Утасны дугаар буруу",
  timeout: "Хариу ирсэнгүй",
  network_error: "Холболтын алдаа",
};

const nf = new Intl.NumberFormat("mn-MN");

/**
 * Төвийн энэ сарын SMS-ийн хэрэглээ: хязгаарт тооцогдох мэдэгдлийн SMS, нэвтрэх код,
 * сүүлийн мессежүүд (хүрээгүй SMS-ийн шалтгаан). Тоо нь сегментээр — төлбөр ингэж бодогдоно.
 */
export function SmsUsageCard() {
  const [usage, setUsage] = useState<SmsUsage | null>(null);
  const [recent, setRecent] = useState<SmsLogItem[]>([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    Promise.all([smsApi.usage(), smsApi.messages(8)])
      .then(([u, r]) => {
        setUsage(u);
        setRecent(r);
      })
      .catch(() => setFailed(true));
  }, []);

  const limit = usage?.monthly_limit ?? 0;
  const used = usage?.notification_segments ?? 0;
  const pct = limit > 0 ? Math.min(100, Math.round((used / limit) * 100)) : 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <MessageSquareText className="h-4 w-4 text-primary" />
          SMS
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {failed ? (
          <p className="text-sm text-muted-foreground">SMS-ийн мэдээллийг ачаалж чадсангүй</p>
        ) : !usage ? (
          <Skeleton className="h-28 w-full rounded-lg" />
        ) : (
          <>
            <div className="flex flex-wrap gap-2 text-xs">
              {usage.provider_enabled ? (
                <Pill tone="emerald" icon={CheckCircle2}>SMS үйлчилгээ холбогдсон</Pill>
              ) : (
                <Pill tone="rose" icon={Ban}>SMS үйлчилгээ тохируулаагүй</Pill>
              )}
              {usage.notifications_enabled ? (
                <Pill tone="emerald" icon={CheckCircle2}>Мэдэгдлийн SMS асаалттай</Pill>
              ) : (
                <Pill tone="slate">Мэдэгдлийн SMS унтраалттай</Pill>
              )}
            </div>
            {!usage.provider_enabled && (
              <p className="text-xs text-muted-foreground">
                SMS тохируулаагүй үед нэвтрэх эрх нээхэд идэвхжүүлэх кодыг танд харуулна — эцэг
                эх, сурагчдаа өөрөө дамжуулна.
              </p>
            )}
            {!usage.notifications_enabled && (
              <p className="text-xs text-muted-foreground">
                Төлбөрийн сануулга, тасалсан тухай SMS-ийг платформын админ асаана. Одоогоор эдгээр
                нь зөвхөн апп доторх мэдэгдлээр очно.
              </p>
            )}

            <div className="space-y-1.5">
              <div className="flex items-baseline justify-between text-sm">
                <span className="text-muted-foreground">Энэ сарын мэдэгдлийн SMS</span>
                <span className="font-semibold text-foreground">
                  {nf.format(used)}
                  {limit > 0 && (
                    <span className="font-normal text-muted-foreground"> / {nf.format(limit)} сегмент</span>
                  )}
                </span>
              </div>
              {limit > 0 && (
                <div
                  className="h-2 overflow-hidden rounded-full bg-muted"
                  role="meter"
                  aria-valuemin={0}
                  aria-valuemax={limit}
                  aria-valuenow={used}
                  aria-label="Сарын хязгаарын хэрэглээ"
                >
                  <div
                    className={pct >= 90 ? "h-full bg-rose-600" : "h-full bg-[var(--chart-series)]"}
                    style={{ width: `${pct}%` }}
                  />
                </div>
              )}
              <p className="text-xs text-muted-foreground">
                Нийт илгээсэн {nf.format(usage.total_segments)} сегмент (нэвтрэх код, урилга хязгаарт
                тооцогдохгүй)
                {usage.failed > 0 && ` · ${usage.failed} амжилтгүй`}
                {usage.skipped > 0 && ` · ${usage.skipped} алгассан`}
              </p>
            </div>

            {usage.by_purpose.some((p) => p.sent > 0) && (
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-xs text-muted-foreground">
                    <th className="pb-1 font-medium">Төрөл</th>
                    <th className="pb-1 text-right font-medium">Илгээсэн</th>
                    <th className="pb-1 text-right font-medium">Сегмент</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {usage.by_purpose.filter((p) => p.sent > 0).map((p) => (
                    <tr key={p.purpose}>
                      <td className="py-1.5">{SMS_PURPOSE_LABELS[p.purpose] ?? p.purpose}</td>
                      <td className="py-1.5 text-right tabular-nums">{nf.format(p.sent)}</td>
                      <td className="py-1.5 text-right tabular-nums">{nf.format(p.segments)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {recent.length > 0 && (
              <div className="space-y-1.5">
                <p className="text-xs font-medium text-muted-foreground">Сүүлийн мессежүүд</p>
                <ul className="divide-y rounded-lg border">
                  {recent.map((m) => (
                    <li key={m.id} className="flex items-start gap-2 p-2 text-xs">
                      {m.status === "sent" ? (
                        <CheckCircle2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-emerald-600" aria-label="Илгээсэн" />
                      ) : m.status === "failed" ? (
                        <XCircle className="mt-0.5 h-3.5 w-3.5 shrink-0 text-rose-600" aria-label="Амжилтгүй" />
                      ) : (
                        <Ban className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" aria-label="Алгассан" />
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="flex flex-wrap gap-x-2 text-muted-foreground">
                          <span className="font-medium tabular-nums text-foreground">{formatPhone(m.to_phone)}</span>
                          <span>{SMS_PURPOSE_LABELS[m.purpose] ?? m.purpose}</span>
                          <span>{new Date(m.created_at).toLocaleString("mn-MN")}</span>
                        </p>
                        <p className="truncate text-foreground/80" title={m.body}>{m.body}</p>
                        {m.error && (
                          <p className="text-rose-700">{SMS_ERROR_LABELS[m.error] ?? m.error}</p>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}

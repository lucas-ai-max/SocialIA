"use client";

import { useState, useMemo } from "react";
import { Loader2, CalendarClock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { apiFetch } from "@/lib/api";
import { Calendar } from "@/components/ui/calendar";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ptBR } from "date-fns/locale";

interface SchedulePickerProps {
  postId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onScheduled: () => void;
}

export function SchedulePicker({
  postId,
  open,
  onOpenChange,
  onScheduled,
}: SchedulePickerProps) {
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(undefined);
  const [hour, setHour] = useState("12");
  const [minute, setMinute] = useState("00");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const hours = Array.from({ length: 24 }, (_, i) =>
    String(i).padStart(2, "0")
  );
  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0")
  );

  const minDate = new Date();
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 75);

  const scheduledDateTime = useMemo(() => {
    if (!selectedDate) return null;
    const dt = new Date(selectedDate);
    dt.setHours(parseInt(hour), parseInt(minute), 0, 0);
    return dt;
  }, [selectedDate, hour, minute]);

  const isValid = useMemo(() => {
    if (!scheduledDateTime) return false;
    return scheduledDateTime <= maxDate;
  }, [scheduledDateTime, maxDate]);

  function formatScheduledDate(dt: Date) {
    const day = String(dt.getDate()).padStart(2, "0");
    const month = String(dt.getMonth() + 1).padStart(2, "0");
    const year = dt.getFullYear();
    const h = String(dt.getHours()).padStart(2, "0");
    const m = String(dt.getMinutes()).padStart(2, "0");
    return `${day}/${month}/${year} as ${h}:${m}`;
  }

  async function handleConfirm() {
    if (!scheduledDateTime || !isValid) return;

    try {
      setLoading(true);
      setError("");

      const res = await apiFetch(`/api/posts/${postId}/schedule`, {
        method: "POST",
        body: JSON.stringify({ scheduledAt: scheduledDateTime.toISOString() }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erro ao agendar post");
      }

      onScheduled();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao agendar post");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CalendarClock className="size-5 text-[#1A73E8]" />
            Agendar Publicacao
          </DialogTitle>
          <DialogDescription>
            Escolha a data e horario para publicar o post.
          </DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          <Calendar
            mode="single"
            selected={selectedDate}
            onSelect={setSelectedDate}
            locale={ptBR}
            disabled={(date) => date < new Date(new Date().setHours(0,0,0,0)) || date > maxDate}
          />

          <div className="flex items-center gap-2">
            <span className="text-sm font-medium">Horario:</span>
            <Select value={hour} onValueChange={(v) => v && setHour(v)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {hours.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <span className="text-lg font-bold">:</span>
            <Select value={minute} onValueChange={(v) => v && setMinute(v)}>
              <SelectTrigger className="w-20">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {minutes.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {scheduledDateTime && (
            <p className="text-sm text-muted-foreground">
              Publicacao agendada para{" "}
              <span className="font-medium text-foreground">
                {formatScheduledDate(scheduledDateTime)}
              </span>
            </p>
          )}

{error && <p className="text-sm text-destructive">{error}</p>}
        </div>

        <DialogFooter>
          <Button
            onClick={handleConfirm}
            disabled={!isValid || loading}
            className="w-full gap-2 bg-[#1A73E8] text-white hover:bg-[#0d5bbd]"
          >
            {loading ? (
              <>
                <Loader2 className="size-4 animate-spin" />
                Agendando...
              </>
            ) : (
              "Confirmar Agendamento"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

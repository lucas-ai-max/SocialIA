import { toast } from "sonner";

export function confirmAction(
  message: string,
  onConfirm: () => void | Promise<void>
) {
  toast(message, {
    duration: 20000,
    position: "top-center",
    style: {
      fontSize: "18px",
      fontWeight: "500",
      padding: "24px 28px",
      borderRadius: "22px",
      boxShadow: "0 12px 48px rgba(0,0,0,0.25)",
      border: "2px solid #1A73E8",
      maxWidth: "500px",
      width: "500px",
      minWidth: "400px",
      whiteSpace: "normal" as const,
      wordBreak: "keep-all" as const,
      lineHeight: "1.5",
      background: "#fff",
      zIndex: 99999,
    },
    action: {
      label: "Sim, confirmar",
      onClick: () => onConfirm(),
    },
    cancel: {
      label: "Cancelar",
      onClick: () => {},
    },
  });
}

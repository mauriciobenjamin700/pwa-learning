import { usePWAUpdate } from "@/providers/PWAUpdateProvider";

export default function UpdateButton() {
  const { canUpdate, updateApp } = usePWAUpdate();
  if (!canUpdate) return null;
  return (
    <button type="button" onClick={updateApp}>
      🔄 Atualizar app
    </button>
  );
}

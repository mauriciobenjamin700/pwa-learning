import { usePWA } from "@/providers/PWAProvider";

export default function InstallButton() {
  const { canInstall, install } = usePWA();
  if (!canInstall) return null;
  return (
    <button type="button" onClick={install}>
      Instalar app
    </button>
  );
}

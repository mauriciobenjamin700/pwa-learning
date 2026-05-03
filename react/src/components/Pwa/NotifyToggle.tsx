import { useState } from "react";
import WebPushManager from "@/services/webpush";
import useUserIsSubscribed from "@/hooks/useUserIsSubscribed";

export default function NotifyToggle() {
  const subscribed = useUserIsSubscribed();
  const [busy, setBusy] = useState(false);
  const [feedback, setFeedback] = useState<string>("");

  async function toggle(): Promise<void> {
    setBusy(true);
    setFeedback("");
    try {
      if (subscribed) {
        await WebPushManager.unsubscribe();
        setFeedback("Notificações desativadas");
      } else {
        const result = await WebPushManager.subscribe();
        setFeedback(result.message);
      }
    } catch (err) {
      setFeedback(`Erro: ${String(err)}`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <button type="button" onClick={toggle} disabled={busy}>
        {subscribed ? "Desativar notificações" : "Ativar notificações"}
      </button>
      {feedback && <p>{feedback}</p>}
    </div>
  );
}

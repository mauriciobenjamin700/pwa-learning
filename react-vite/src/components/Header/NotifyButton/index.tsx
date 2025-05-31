// Pode ser em qualquer componente React
import { subscribeUserToPush } from "@/workers";

export default function NotifyButton() {
  return (
    <button onClick={subscribeUserToPush}>
      Ativar notificações
    </button>
  );
}

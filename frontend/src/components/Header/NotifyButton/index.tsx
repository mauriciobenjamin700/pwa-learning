// Pode ser em qualquer componente React
import registerServiceWorker from "@/workers";

export default function NotifyButton() {
  return (
    <button onClick={registerServiceWorker}>
      Ativar notificações
    </button>
  );
}

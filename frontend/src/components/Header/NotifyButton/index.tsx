// Pode ser em qualquer componente React
import {requestNotifyPermission} from "@/workers";

export default function NotifyButton() {
  return (
    <button onClick={requestNotifyPermission}>
      Ativar notificações
    </button>
  );
}

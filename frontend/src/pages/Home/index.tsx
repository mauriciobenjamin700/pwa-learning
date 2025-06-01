import Header from "@/components/Header";
import { JSX } from "react";


export default function HomePage(): JSX.Element {

    const handleNotificationClick = () => {
    // Verifica se o navegador suporta notificações
    if (!("Notification" in window)) {
      alert("Este navegador não suporta notificações.");
      return;
    }

    // Solicita permissão ao usuário para exibir notificações
    Notification.requestPermission().then((permission) => {
      if (permission === "granted") {
        // Exibe a notificação
        new Notification("Notificação Local", {
          body: "Esta é uma notificação simulada localmente!",
          icon: "/icon.png", // Opcional: caminho para um ícone
        });
        console.log("Notificação enviada com sucesso!");
      } else {
        alert("Permissão para notificações negada.");
      }
    });
  };

  return (
    <div>
      <Header />
      <h1>Bem vindo ao meu PWA</h1>
      <button onClick={handleNotificationClick}>Enviar notificação local</button>
    </div>
  );
}
import InstallButton from "@/components/Pwa/InstallButton";
import UpdateButton from "@/components/Pwa/UpdateButton";
import NotifyToggle from "@/components/Pwa/NotifyToggle";
import { useUserStore } from "@/store/useUserStore";
import { useSSEStore } from "@/store/useSSEStore";

export default function HomePage() {
  const user = useUserStore((s) => s.user);
  const messages = useSSEStore((s) => s.messages);
  const logout = useUserStore((s) => s.logout);

  return (
    <main style={{ maxWidth: 720, margin: "2rem auto", padding: "1rem" }}>
      <header
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <h1>Olá, {user?.name}</h1>
        <button type="button" onClick={logout}>
          Sair
        </button>
      </header>

      <section style={{ marginTop: "2rem" }}>
        <h2>PWA</h2>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          <InstallButton />
          <UpdateButton />
        </div>
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Notificações</h2>
        <NotifyToggle />
      </section>

      <section style={{ marginTop: "2rem" }}>
        <h2>Eventos SSE recentes ({messages.length})</h2>
        <ul style={{ paddingLeft: "1rem" }}>
          {messages.length === 0 && (
            <li>
              <em>Nenhum evento ainda</em>
            </li>
          )}
          {messages.map((m) => (
            <li key={m.message_id}>
              <strong>{m.type}</strong>: {JSON.stringify(m.payload)}
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}

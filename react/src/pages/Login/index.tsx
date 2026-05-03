import { useState } from "react";
import { useNavigate } from "react-router";
import { ROUTES } from "@/core/constants/routes";
import { cookieSet } from "@/core/cookies";
import { useUserStore } from "@/store/useUserStore";
import { useTokenStore } from "@/store/useTokenStore";
import UserService from "@/services/user";

export default function LoginPage() {
  const navigate = useNavigate();
  const setUser = useUserStore((s) => s.setUser);
  const setToken = useTokenStore((s) => s.setToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string>("");

  async function handleSubmit(e: React.FormEvent): Promise<void> {
    e.preventDefault();
    setError("");
    try {
      const user = await UserService.login({ email, password });
      cookieSet("token", user.id);
      setToken(user.id);
      setUser(user);
      navigate(ROUTES.HOME);
    } catch (err) {
      setError(String(err));
    }
  }

  return (
    <main style={{ maxWidth: 360, margin: "4rem auto", padding: "1rem" }}>
      <h1>Login</h1>
      <form
        onSubmit={handleSubmit}
        style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}
      >
        <input
          type="email"
          placeholder="email@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="senha"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button type="submit">Entrar</button>
      </form>
      {error && <p style={{ color: "crimson" }}>{error}</p>}
      <p style={{ marginTop: "1rem", fontSize: "0.9rem", opacity: 0.7 }}>
        <em>
          Mock: qualquer e-mail/senha funciona. O token salvo é o user_id em
          texto plano (ver guia do backend).
        </em>
      </p>
    </main>
  );
}

import settings from "@/core/settings";
import { runMigrations } from "@/db/migrations";
import app from "@/app";

runMigrations();

app.listen(settings.PORT, () => {
  console.log(`Backend Node rodando em http://localhost:${settings.PORT}`);
  console.log(`VAPID pública: ${settings.VAPID_PUBLIC_KEY}`);
});

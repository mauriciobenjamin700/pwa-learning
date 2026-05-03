import { createContext, useContext, useEffect, useState } from "react";
import { registerSW } from "virtual:pwa-register";

type UpdateFn = (reload?: boolean) => Promise<void>;

interface PWAUpdateContextType {
  canUpdate: boolean;
  updateApp: () => Promise<void>;
}

const PWAUpdateContext = createContext<PWAUpdateContextType>({
  canUpdate: false,
  updateApp: async () => {},
});

export function PWAUpdateProvider({ children }: { children: React.ReactNode }) {
  const [canUpdate, setCanUpdate] = useState(false);
  const [updateFn, setUpdateFn] = useState<UpdateFn | null>(null);

  useEffect(() => {
    const fn = registerSW({
      onNeedRefresh() {
        setUpdateFn(() => fn);
        setCanUpdate(true);
      },
      onOfflineReady() {
        if (import.meta.env.DEV) console.log("App pronto para uso offline");
      },
    });
  }, []);

  async function updateApp(): Promise<void> {
    if (!updateFn) return;
    await updateFn(true);
    window.location.reload();
  }

  return (
    <PWAUpdateContext.Provider value={{ canUpdate, updateApp }}>
      {children}
    </PWAUpdateContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components
export function usePWAUpdate() {
  return useContext(PWAUpdateContext);
}

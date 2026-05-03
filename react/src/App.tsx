import { BrowserRouter } from "react-router";
import AllRoutes from "@/routers";
import QueryProvider from "@/providers/queryClientProvider";
import { PWAProvider } from "@/providers/PWAProvider";
import { PWAUpdateProvider } from "@/providers/PWAUpdateProvider";
import SSEProvider from "@/providers/SSEProvider";

export default function App() {
  return (
    <BrowserRouter>
      <QueryProvider>
        <PWAUpdateProvider>
          <PWAProvider>
            <SSEProvider>
              <AllRoutes />
            </SSEProvider>
          </PWAProvider>
        </PWAUpdateProvider>
      </QueryProvider>
    </BrowserRouter>
  );
}

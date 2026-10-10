import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { AppSyncConnectionProvider } from "@/app/contexts/appsync-connection-context.tsx";
import { ConfigProvider } from "@/app/contexts/config-context.tsx";
import { SessionSubscriptionProvider } from "@/domains/session/contexts/session-subscription-context.tsx";
import { SessionPage } from "@/domains/session/pages/session-page.tsx";
import "./styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("root element is missing");
}

createRoot(root).render(
  <StrictMode>
    <ConfigProvider>
      <AppSyncConnectionProvider>
        <SessionSubscriptionProvider>
          <SessionPage />
        </SessionSubscriptionProvider>
      </AppSyncConnectionProvider>
    </ConfigProvider>
  </StrictMode>,
);

import { Authenticator } from "@aws-amplify/ui-react";
import "@aws-amplify/ui-react/styles.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { configureAmplify } from "@/app/amplify.ts";
import { getWebConfig } from "@/app/config.ts";
import { ConfigProvider } from "@/app/contexts/config-context.tsx";
import { SessionSubscriptionProvider } from "@/domains/session/contexts/session-subscription-context.tsx";
import { SessionPage } from "@/domains/session/pages/session-page.tsx";
import "./styles.css";

const root = document.getElementById("root");
if (!root) {
  throw new Error("root element is missing");
}

const config = getWebConfig();
configureAmplify(config);

createRoot(root).render(
  <StrictMode>
    <ConfigProvider config={config}>
      <Authenticator hideSignUp loginMechanisms={["email"]}>
        <SessionSubscriptionProvider>
          <SessionPage />
        </SessionSubscriptionProvider>
      </Authenticator>
    </ConfigProvider>
  </StrictMode>,
);

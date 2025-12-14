import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "https://0954e0fe63995efea01e6945e00301c5@o291777.ingest.us.sentry.io/4510535830011904",
  // Setting this option to true will send default PII data to Sentry.
  // For example, automatic IP address collection on events
  sendDefaultPii: true
});

const container = document.getElementById("app");
const root = createRoot(container);
root.render(<App />);
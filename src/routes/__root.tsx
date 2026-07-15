import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  createRootRouteWithContext,
  useRouter,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { AuthProvider } from "../lib/auth-context";
import { Toaster } from "sonner";

function NotFoundComponent() {
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--background)", color: "var(--foreground)", padding: 16 }}>
      <div style={{ textAlign: "center", maxWidth: 380 }}>
        <div style={{ fontSize: 64, fontWeight: 800, color: "var(--brand)" }}>404</div>
        <div style={{ fontSize: 16, marginTop: 6 }}>Page not found</div>
        <a href="/" style={{ display: "inline-block", marginTop: 18, background: "var(--brand)", color: "var(--brand-foreground)", padding: "9px 16px", borderRadius: 10, textDecoration: "none", fontWeight: 600 }}>Go home</a>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "var(--background)", color: "var(--foreground)", padding: 16 }}>
      <div style={{ textAlign: "center", maxWidth: 420 }}>
        <div style={{ fontSize: 18, fontWeight: 700 }}>Something went wrong</div>
        <p style={{ color: "var(--text-secondary)", fontSize: 13, marginTop: 6 }}>{error.message}</p>
        <button onClick={() => { router.invalidate(); reset(); }} style={{ marginTop: 18, background: "var(--brand)", color: "var(--brand-foreground)", padding: "9px 16px", borderRadius: 10, border: 0, fontWeight: 600, cursor: "pointer" }}>Try again</button>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LinkOps — LinkedIn Content Operations" },
      { name: "description", content: "Production content ops dashboard for LinkedIn automation." },
      { property: "og:title", content: "LinkOps — LinkedIn Content Operations" },
      { property: "og:description", content: "Production content ops dashboard for LinkedIn automation." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "LinkOps — LinkedIn Content Operations" },
      { name: "twitter:description", content: "Production content ops dashboard for LinkedIn automation." },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9f22e50d-0b4a-4337-b74c-8bf84af6c16f/id-preview-f1b35fc8--4d95bf33-4565-4910-9229-20de7e6905ac.lovable.app-1784139453578.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/9f22e50d-0b4a-4337-b74c-8bf84af6c16f/id-preview-f1b35fc8--4d95bf33-4565-4910-9229-20de7e6905ac.lovable.app-1784139453578.png" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Outlet />
        <Toaster
          position="bottom-right"
          duration={4000}
          theme="dark"
          toastOptions={{
            style: {
              background: "var(--surface)",
              border: "1px solid var(--border)",
              color: "var(--foreground)",
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}

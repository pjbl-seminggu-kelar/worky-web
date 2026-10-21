import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useLocation,
  useNavigate,
  useRouter,
  HeadContent,
  Scripts,
  type ErrorComponentProps,
} from "@tanstack/react-router";
import { useEffect, useState, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { AUTH_TOKEN_KEY, ONBOARDING_COMPLETED_KEY } from "../lib/auth";
import { reportLovableError } from "../lib/lovable-error-reporting";

const PUBLIC_PATHS = ["/onboarding", "/login", "/register"];

function isPublicPath(pathname: string) {
  return PUBLIC_PATHS.includes(pathname) || pathname.startsWith("/api/");
}

const AUTH_REDIRECT_SCRIPT = `
  try {
    var path = window.location.pathname;
    var onboardingDone = localStorage.getItem("${ONBOARDING_COMPLETED_KEY}") === "true";
    var hasToken = Boolean(localStorage.getItem("${AUTH_TOKEN_KEY}"));
    var isPublic = ${JSON.stringify(PUBLIC_PATHS)}.includes(path) || path.indexOf("/api/") === 0;

    if (path === "/" && !hasToken) {
      window.location.replace("/register");
    } else if (path === "/" && !onboardingDone) {
      window.location.replace("/onboarding");
    } else if (!isPublic && !hasToken) {
      window.location.replace("/login");
    }
  } catch (_) {}
`;

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Page not found</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}

function ErrorComponent({ error, reset }: ErrorComponentProps) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-xl font-semibold tracking-tight text-foreground">
          This page didn't load
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Something went wrong on our end. You can try refreshing or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90"
          >
            Try again
          </button>
          <a
            href="/"
            className="inline-flex items-center justify-center rounded-md border border-input bg-background px-4 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
          >
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Worky — AI Workout Form Coach" },
      { name: "description", content: "Cek form home workout kamu dengan AI." },
      { property: "og:title", content: "Worky — AI Workout Form Coach" },
      { property: "og:description", content: "Cek form home workout kamu dengan AI." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@600;700;800&family=Manrope:wght@400;500;600;700&display=swap",
      },
      { rel: "icon", href: "/icon.png", type: "image/png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <script dangerouslySetInnerHTML={{ __html: AUTH_REDIRECT_SCRIPT }} />
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const location = useLocation();
  const navigate = useNavigate();
  const publicRoute = isPublicPath(location.pathname);
  const [allowedPath, setAllowedPath] = useState<string | null>(null);

  useEffect(() => {
    if (publicRoute) return;

    if (!localStorage.getItem(AUTH_TOKEN_KEY)) {
      void navigate({ to: "/login", replace: true });
      return;
    }

    setAllowedPath(location.pathname);
  }, [location.pathname, navigate, publicRoute]);

  const canRenderRoute = publicRoute || allowedPath === location.pathname;

  return (
    <QueryClientProvider client={queryClient}>
      <div className="min-h-screen bg-stage">
        <div className="relative mx-auto min-h-screen w-full max-w-[430px] bg-background shadow-2xl">
          {/* Required: nested routes render here. Removing <Outlet /> breaks all child routes. */}
          {canRenderRoute ? (
            <Outlet />
          ) : (
            <div className="grid min-h-dvh place-items-center">
              <p className="font-display text-lg font-bold text-primary">Worky</p>
            </div>
          )}
        </div>
      </div>
    </QueryClientProvider>
  );
}

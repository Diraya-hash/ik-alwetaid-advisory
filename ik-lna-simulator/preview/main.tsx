/**
 * Single-file preview entry. Renders the same views and shell as the Next.js app,
 * routed by location.hash so it can run inside a sandboxed host.
 */
import { AlertTriangle, SearchX } from "lucide-react";
import { Component, useEffect, type ReactNode } from "react";
import { createRoot } from "react-dom/client";
import { getScenario } from "@/content/scenarios";
import type { Locale } from "@/engine/types";
import { useI18n } from "@/components/i18n-provider";
import { AppShell } from "@/components/layout/app-shell";
import { Providers } from "@/components/providers";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/primitives";
import { BriefingView } from "@/components/views/briefing";
import { DashboardView } from "@/components/views/dashboard";
import { AnalyticsView, DevelopmentView, InsightsView, MethodologyView } from "@/components/views/info-pages";
import { LibraryView } from "@/components/views/library";
import { SettingsView } from "@/components/views/settings";
import { PrivacyView } from "@/components/views/privacy";
import { SimulateView } from "@/components/views/simulate";
import { ReportView } from "@/components/views/report";
import { SimulationsView } from "@/components/views/simulations";
import { defaultHash, hashToPath, resolve, useHash } from "./shims/hash-route";

function NotFound() {
  const { t, href } = useI18n();
  return <EmptyState icon={SearchX} title={t.common.notFound} body={t.library.empty} action={<Button href={href("/scenarios")}>{t.dashboard.ctaPrimary}</Button>} />;
}

function Crash({ reset }: { reset: () => void }) {
  const { t } = useI18n();
  return <EmptyState icon={AlertTriangle} title={t.errors.title} body={t.errors.body} action={<Button onClick={reset}>{t.errors.retry}</Button>} />;
}

class ErrorBoundary extends Component<{ children: ReactNode; resetKey: string }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev: { resetKey: string }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  componentDidCatch(error: unknown) {
    console.error(error);
  }
  render() {
    return this.state.failed ? <Crash reset={() => this.setState({ failed: false })} /> : this.props.children;
  }
}

function View({ segments }: { segments: string[] }) {
  const [page, param] = segments;
  switch (page) {
    case undefined:
      return <DashboardView />;
    case "scenarios":
      if (!param) return <LibraryView />;
      return getScenario(param) ? <BriefingView scenarioId={param} /> : <NotFound />;
    case "simulate":
      return <SimulateView />;
    case "report":
      return <ReportView />;
    case "simulations":
      return <SimulationsView />;
    case "insights":
      return <InsightsView />;
    case "analytics":
      return <AnalyticsView />;
    case "development":
      return <DevelopmentView />;
    case "methodology":
      return <MethodologyView />;
    case "settings":
      return <SettingsView />;
    case "privacy":
      return <PrivacyView />;
    default:
      return <NotFound />;
  }
}

function App() {
  const hash = useHash();
  useEffect(() => {
    if (!hashToPath(hash)) window.location.replace(`#${defaultHash()}`);
  }, [hash]);
  const { pathname } = resolve(hash);
  const [locale, ...segments] = pathname.split("/").filter(Boolean) as [Locale, ...string[]];
  return (
    <Providers locale={locale}>
      <AppShell>
        <ErrorBoundary resetKey={hash}>
          <View segments={segments} />
        </ErrorBoundary>
      </AppShell>
    </Providers>
  );
}

createRoot(document.getElementById("root")!).render(<App />);

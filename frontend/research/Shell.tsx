import { Link, useLocation, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import * as Dialog from "@radix-ui/react-dialog";
import {
  Orbit,
  LayoutDashboard,
  FlaskConical,
  ChartColumn,
  MessagesSquare,
  ScanLine,
  Rocket,
  Library,
  Layers,
  Settings,
  PanelLeft,
  Search,
  Menu,
  X,
  Maximize,
  Minimize,
  ArrowUpRight,
} from "lucide-react";
import { SelectionProvider, useMedia } from "./common";
import { usePreference } from "./preferences";
import { useHealth } from "./api";

const groups = [
  {
    name: "Workspace",
    links: [
      ["/", "Dashboard", LayoutDashboard],
      ["/experiments", "Experiments", FlaskConical],
      ["/analytics", "Data comparison", ChartColumn],
      ["/assistant", "AI research assistant", MessagesSquare],
      ["/media", "Media laboratory", ScanLine],
      ["/mission-advisor", "Mission advisor", Rocket],
    ],
  },
  {
    name: "Research library",
    links: [
      ["/media/library", "Visual evidence", Library],
      ["/investigations", "Investigations", Layers],
      ["/sources", "Sources & references", Library],
    ],
  },
] as const;

export default function Shell({ children }: { children: ReactNode }) {
  const [client] = useState(() => new QueryClient());
  return (
    <QueryClientProvider client={client}>
      <SelectionProvider>
        <Workspace>{children}</Workspace>
      </SelectionProvider>
    </QueryClientProvider>
  );
}

function Workspace({ children }: { children: ReactNode }) {
  const path = useLocation().pathname;
  const navigate = useNavigate();
  const health = useHealth();
  const [sidebar, setSidebar] = usePreference("ignis_sidebar_compact", "false");
  const compact = sidebar === "true";
  const [theme] = usePreference("ignis_theme", "dark");
  const [motion] = usePreference("ignis_motion", "system");
  const systemLight = useMedia("(prefers-color-scheme: light)");
  const resolvedTheme = theme === "system" ? (systemLight ? "light" : "dark") : theme;
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  const search = useRef<HTMLInputElement>(null);
  const current =
    groups.flatMap((g) => [...g.links]).find((l) => l[0] === path)?.[1] ||
    (path === "/settings" ? "Settings" : "Experiment detail");

  useEffect(() => {
    const shortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        search.current?.focus();
      }
    };
    const changed = () => setFullscreen(Boolean(document.fullscreenElement));
    window.addEventListener("keydown", shortcut);
    document.addEventListener("fullscreenchange", changed);
    return () => {
      window.removeEventListener("keydown", shortcut);
      document.removeEventListener("fullscreenchange", changed);
    };
  }, []);

  async function toggleFullscreen() {
    setFullscreenError("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFullscreenError("Fullscreen is unavailable in this browser.");
    }
  }

  const navigation = (
    <>
      <Link
        className="brand"
        to="/"
        aria-label="IGNIS AI dashboard"
        onClick={() => setOpen(false)}
      >
        <picture className="site-logo">
          <img src="/logo/ignis-logo.png" alt="IGNIS AI · Flame in Freefall" />
        </picture>
      </Link>
      {groups.map((g) => (
        <nav key={g.name} aria-label={g.name}>
          <small>{g.name}</small>
          {g.links.map(([href, title, Icon]) => (
            <Link
              key={href}
              to={href}
              title={title}
              aria-current={
                href === path ||
                (href === "/experiments" && path.startsWith("/experiments/"))
                  ? "page"
                  : undefined
              }
              onClick={() => setOpen(false)}
            >
              <Icon size={20} strokeWidth={1.7} aria-hidden />
              <span>{title}</span>
            </Link>
          ))}
        </nav>
      ))}
      <div className="sidebar-bottom">
        <Link
          to="/settings"
          className="settings-link"
          title="Settings"
          aria-current={path === "/settings" ? "page" : undefined}
          onClick={() => setOpen(false)}
        >
          <Settings size={20} aria-hidden />
          <span>Settings</span>
        </Link>
        <div className="sidebar-mission">
          <span className="live-dot" />
          <span>Built for discovery</span>
          <ArrowUpRight size={14} aria-hidden />
        </div>
      </div>
    </>
  );

  return (
    <div
      data-theme={resolvedTheme}
      data-motion={motion}
      className={"shell " + (compact ? "compact" : "")}
    >
      <a className="skip" href="#content">
        Skip navigation
      </a>
      <aside>{navigation}</aside>
      <div className="workspace">
        <header className="top">
          <button
            aria-label="Collapse or expand sidebar"
            className="desktop icon-button collapse-button"
            onClick={() => setSidebar(String(!compact))}
          >
            <PanelLeft size={18} />
          </button>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button
                className="mobile icon-button"
                aria-label="Open navigation"
              >
                <Menu size={21} />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="overlay" />
              <Dialog.Content className="drawer" data-theme={resolvedTheme} data-motion={motion} aria-describedby={undefined}>
                <Dialog.Title className="sr-only">Navigation</Dialog.Title>
                <Dialog.Close
                  className="drawer-close icon-button"
                  aria-label="Close"
                >
                  <X size={18} />
                </Dialog.Close>
                {navigation}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <div className="workspace-title">
            <Orbit size={25} strokeWidth={1.5} aria-hidden />
            <span>{path === "/" ? "Scientific Mission Control" : current}</span>
          </div>
          <form
            className="global-search"
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              navigate(
                "/experiments" +
                  (query.trim()
                    ? "?q=" + encodeURIComponent(query.trim())
                    : ""),
              );
            }}
          >
            <Search size={18} aria-hidden />
            <input
              ref={search}
              aria-label="Search experiments"
              placeholder="Search experiments…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <kbd>Ctrl K</kbd>
          </form>
          <div className="tools">
            <Link to="/settings" className="status" title="View service status">
              <i className={health.data ? "online" : ""} />
              {health.isPending
                ? "Checking API"
                : health.error
                  ? "API offline"
                  : "API online"}
            </Link>

            <button
              className="icon-button fullscreen-button"
              aria-label={fullscreen ? "Exit fullscreen" : "Enter fullscreen"}
              onClick={() => void toggleFullscreen()}
            >
              {fullscreen ? <Minimize size={18} /> : <Maximize size={18} />}
            </button>
          </div>
        </header>
        {fullscreenError && (
          <p className="notice" role="status">
            {fullscreenError}
          </p>
        )}
        <main id="content" tabIndex={-1}>
          {children}
        </main>
      </div>
    </div>
  );
}

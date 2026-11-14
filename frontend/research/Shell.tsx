import { usePreference } from "./preferences";
import { Link, useLocation } from "react-router-dom";
import { useState, type ReactNode } from "react";
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
  Sun,
  Moon,
  Search,
  Menu,
  X,
} from "lucide-react";
import { SelectionProvider } from "./common";
import { useHealth } from "./api";
const groups = [
  {
    name: "Workspace",
    links: [
      ["/", "Overview", LayoutDashboard],
      ["/experiments", "Experiments", FlaskConical],
      ["/analytics", "Analytics", ChartColumn],
      ["/assistant", "Research assistant", MessagesSquare],
      ["/media", "Media laboratory", ScanLine],
      ["/mission-advisor", "Mission advisor", Rocket],
    ],
  },
  {
    name: "Library",
    links: [
      ["/media/library", "Visual evidence", Library],
      ["/investigations", "Investigations", Layers],
      ["/sources", "Sources", Library],
      ["/settings", "Settings", Settings],
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
  const health = useHealth();
  const [compact, setCompact] = useState(false),
    [open, setOpen] = useState(false);
  const [theme, setTheme] = usePreference("ignis_theme", "dark");
  const light = theme === "light";
  const current =
    groups.flatMap((g) => [...g.links]).find((l) => l[0] === path)?.[1] ||
    "Experiment detail";
  const navigation = (
    <>
      <div className="brand">
        <Orbit aria-hidden /> IGNIS <em>AI</em>
      </div>
      {groups.map((g) => (
        <nav key={g.name} aria-label={g.name}>
          <small>{g.name}</small>
          {g.links.map(([href, title, Icon]) => (
            <Link
              key={href}
              to={href}
              title={title}
              aria-current={href === path ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              <Icon size={18} />
              <span>{title}</span>
            </Link>
          ))}
        </nav>
      ))}
    </>
  );
  return (
    <div
      data-theme={light ? "light" : "dark"}
      className={"shell " + (compact ? "compact" : "")}
    >
      <a className="skip" href="#content">
        Skip navigation
      </a>
      <aside>{navigation}</aside>
      <div className="workspace">
        <div className="top">
          <button
            aria-label="Collapse or expand sidebar"
            className="desktop"
            onClick={() => setCompact(!compact)}
          >
            <PanelLeft size={18} />
          </button>
          <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
              <button className="mobile" aria-label="Open navigation">
                <Menu />
              </button>
            </Dialog.Trigger>
            <Dialog.Portal>
              <Dialog.Overlay className="overlay" />
              <Dialog.Content className="drawer" aria-describedby={undefined}>
                <Dialog.Title>Navigation</Dialog.Title>
                <Dialog.Close aria-label="Close">
                  <X size={16} />
                </Dialog.Close>
                {navigation}
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
          <span>
            Workspace / <b>{current}</b>
          </span>
          <div className="tools">
            <Link to="/experiments#search" aria-label="Search experiments">
              <Search size={17} />
            </Link>
            <Link to="/settings" className="status">
              <i className={health.data ? "online" : ""} />
              {health.isPending
                ? "Checking API"
                : health.error
                  ? "API offline"
                  : "API online"}
            </Link>
            <button
              aria-label="Switch theme"
              onClick={() => {
                setTheme(light ? "dark" : "light");
              }}
            >
              {light ? <Moon size={17} /> : <Sun size={17} />}
            </button>
          </div>
        </div>
        <main id="content">{children}</main>
      </div>
    </div>
  );
}

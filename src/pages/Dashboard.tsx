import { useState, useEffect, useRef } from "react";
import { Routes, Route, Navigate, useNavigate, useLocation } from "react-router-dom";
import { ArrowLeft, Ticket, ShoppingCart, Gamepad2, Paintbrush, Calculator as CalcIcon, ChevronDown, Key, Globe, Repeat } from "lucide-react";
import type { AppState } from "../types";
import { fetchUniverseInfo } from "../api/roblox";
import { getSessions, saveSession } from "../sessions";
import { Button } from "@/components/ui/button";
import Gamepasses from "./Gamepasses";
import DeveloperProducts from "./DeveloperProducts";
import Subscriptions from "./Subscriptions";
import IconEditor from "./IconEditor";
import Calculator from "./Calculator";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { label: "Gamepasses", icon: Ticket, path: "/dashboard/gamepasses", requiresConfig: true },
  { label: "Dev Products", icon: ShoppingCart, path: "/dashboard/developer-products", requiresConfig: true },
  { label: "Subscriptions", icon: Repeat, path: "/dashboard/subscriptions", requiresConfig: true },
  { label: "Icon Editor", icon: Paintbrush, path: "/dashboard/icon-editor", requiresConfig: false },
  { label: "Tax Calculator", icon: CalcIcon, path: "/dashboard/calculator", requiresConfig: false },
];

interface Props {
  appState: AppState;
  onBack: () => void;
  setAppState: (state: AppState) => void;
}

function NeedSetup({ onGoSetup }: { onGoSetup: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4">
      <div className="h-12 w-12 rounded-2xl bg-primary/15 flex items-center justify-center mb-2">
        <Key className="h-6 w-6 text-primary" />
      </div>
      <p className="text-sm text-muted-foreground text-center max-w-xs">
        Enter an API key and Universe ID to use this feature.
      </p>
      <Button onClick={onGoSetup}>
        <Globe className="h-4 w-4 mr-2" />
        Go to Setup
      </Button>
    </div>
  );
}

export default function Dashboard({ appState, onBack, setAppState }: Props) {
  const navigate = useNavigate();
  const location = useLocation();
  const isConfigured = appState.apiKey !== "" && appState.universeId !== "";

  const [universeInfo, setUniverseInfo] = useState<{ name: string; iconUrl: string }>({ name: "", iconUrl: "" });

  useEffect(() => {
    if (!appState.universeId) return;
    fetchUniverseInfo(appState.universeId)
      .then(setUniverseInfo)
      .catch(() => {});
  }, [appState.universeId]);

  /* ── Game switcher ── */
  const [switcherOpen, setSwitcherOpen] = useState(false);
  const switcherRef = useRef<HTMLDivElement>(null);
  const [sessions, setSessions] = useState(getSessions);
  const [sessionInfo, setSessionInfo] = useState<Map<string, { name: string; iconUrl: string }>>(new Map());

  // Fetch universe info for recent sessions
  useEffect(() => {
    const ids = [...new Set(sessions.map((s) => s.universeId))];
    if (ids.length === 0) return;
    let cancelled = false;
    Promise.all(ids.map((id) => fetchUniverseInfo(id).then((info) => [id, info] as const)))
      .then((entries) => {
        if (cancelled) return;
        const map = new Map<string, { name: string; iconUrl: string }>();
        for (const [id, info] of entries) map.set(id, info);
        setSessionInfo(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [sessions]);

  // Click outside to close switcher
  useEffect(() => {
    if (!switcherOpen) return;
    const handler = (e: MouseEvent) => {
      if (switcherRef.current && !switcherRef.current.contains(e.target as Node)) {
        setSwitcherOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [switcherOpen]);

  const handleSessionSwitch = (session: (typeof sessions)[0]) => {
    const resolvedName = sessionInfo.get(session.universeId)?.name || session.experienceName;
    saveSession({ apiKey: session.apiKey, universeId: session.universeId, experienceName: resolvedName });
    setAppState({ apiKey: session.apiKey, universeId: session.universeId, experienceName: resolvedName });
    setSwitcherOpen(false);
    setSessions(getSessions());
    navigate("/dashboard/gamepasses");
  };

  // Filter sessions — exclude the currently active one
  const otherSessions = sessions.filter(
    (s) => !(s.apiKey === appState.apiKey && s.universeId === appState.universeId),
  );

  return (
    <div className="min-h-screen">
      {/* Top bar */}
      <header className="sticky top-0 z-50 h-14 bg-card/95 backdrop-blur-xl border-b border-border">
        <div className="flex items-center h-full px-4 gap-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-surface-raised transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-4 w-4" />
          </button>

          {/* Game info / switcher */}
          <div className="relative mr-4" ref={switcherRef}>
            <button
              onClick={() => {
                if (otherSessions.length > 0) setSwitcherOpen((v) => !v);
              }}
              className={cn(
                "flex items-center gap-2.5 rounded-lg px-2 py-1 -mx-2 transition-colors",
                otherSessions.length > 0
                  ? "hover:bg-surface-raised cursor-pointer"
                  : "cursor-default",
              )}
            >
              {isConfigured && universeInfo.iconUrl ? (
                <img src={universeInfo.iconUrl} alt="" className="w-7 h-7 rounded-md object-cover" />
              ) : (
                <div className="w-7 h-7 rounded-md bg-surface-raised flex items-center justify-center">
                  <Gamepad2 className="h-3.5 w-3.5 text-muted-foreground" />
                </div>
              )}
              <span className="text-sm font-medium text-foreground truncate max-w-[180px]">
                {isConfigured
                  ? universeInfo.name || appState.experienceName
                  : "No experience"}
              </span>
              {otherSessions.length > 0 && (
                <ChevronDown
                  className={cn(
                    "h-3.5 w-3.5 text-muted-foreground transition-transform",
                    switcherOpen && "rotate-180",
                  )}
                />
              )}
            </button>

            {/* Dropdown */}
            {switcherOpen && otherSessions.length > 0 && (
              <div className="absolute top-full left-0 mt-1.5 w-72 rounded-xl border border-border bg-card shadow-xl shadow-black/30 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
                <div className="p-1.5 max-h-64 overflow-y-auto">
                  {otherSessions.map((s) => (
                    <button
                      key={s.id}
                      onClick={() => handleSessionSwitch(s)}
                      className="flex items-center gap-2.5 w-full rounded-lg px-2.5 py-2 hover:bg-surface-raised transition-colors cursor-pointer text-left"
                    >
                      {sessionInfo.get(s.universeId)?.iconUrl ? (
                        <img
                          src={sessionInfo.get(s.universeId)!.iconUrl}
                          alt=""
                          className="w-7 h-7 rounded-md object-cover shrink-0"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-md bg-surface-raised flex items-center justify-center shrink-0">
                          <Gamepad2 className="h-3.5 w-3.5 text-muted-foreground" />
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {sessionInfo.get(s.universeId)?.name || s.experienceName}
                        </p>
                        <p className="text-[11px] text-muted-foreground">
                          {s.universeId}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Tabs */}
          <div className="flex items-center gap-0.5 rounded-lg bg-secondary p-0.5">
            {NAV_ITEMS.map((item) => {
              const selected = location.pathname === item.path;
              const disabled = item.requiresConfig && !isConfigured;
              return (
                <button
                  key={item.path}
                  onClick={() => !disabled && navigate(item.path)}
                  className={cn(
                    "flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all duration-150",
                    selected
                      ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                      : disabled
                        ? "text-muted-foreground/30 cursor-not-allowed"
                        : "text-muted-foreground hover:text-foreground cursor-pointer",
                  )}
                >
                  <item.icon className="h-3.5 w-3.5" />
                  {item.label}
                </button>
              );
            })}
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="p-4 sm:p-6">
        <Routes>
          <Route index element={<Navigate to={isConfigured ? "gamepasses" : "icon-editor"} replace />} />
          <Route
            path="gamepasses"
            element={isConfigured ? <Gamepasses appState={appState} /> : <NeedSetup onGoSetup={onBack} />}
          />
          <Route
            path="developer-products"
            element={isConfigured ? <DeveloperProducts appState={appState} /> : <NeedSetup onGoSetup={onBack} />}
          />
          <Route
            path="subscriptions"
            element={isConfigured ? <Subscriptions appState={appState} /> : <NeedSetup onGoSetup={onBack} />}
          />
          <Route
            path="icon-editor"
            element={<IconEditor appState={appState} />}
          />
          <Route path="calculator" element={<Calculator />} />
        </Routes>
      </main>
    </div>
  );
}

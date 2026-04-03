import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Eye, EyeOff, ArrowRight, Trash2, ChevronDown, Gamepad2, Key, Globe, Paintbrush } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert } from "@/components/ui/alert";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import type { AppState } from "../types";
import { getSessions, saveSession, deleteSession, getSavedKeys, addSavedKey, deleteSavedKey } from "../sessions";
import { fetchUniverseInfo } from "../api/roblox";
import { cn } from "@/lib/utils";

interface Props {
  appState: AppState;
  setAppState: (state: AppState) => void;
}

export default function Setup({ appState, setAppState }: Props) {
  const navigate = useNavigate();
  const [showKey, setShowKey] = useState(false);
  const [apiKey, setApiKey] = useState(appState.apiKey);
  const [universeId, setUniverseId] = useState(appState.universeId);
  const [experienceName, setExperienceName] = useState(appState.experienceName);
  const [error, setError] = useState("");
  const [sessions, setSessions] = useState(getSessions);
  const [savedKeys, setSavedKeys] = useState(getSavedKeys);
  const [selectedKeyId, setSelectedKeyId] = useState<string>("");
  const [saveKey, setSaveKey] = useState(false);
  const [keyLabel, setKeyLabel] = useState("");
  const [sessionInfo, setSessionInfo] = useState<Map<string, { name: string; iconUrl: string }>>(new Map());
  const [sessionsOpen, setSessionsOpen] = useState(true);
  const nameManuallyEdited = useRef(false);

  useEffect(() => {
    const ids = [...new Set(sessions.map((s) => s.universeId))];
    if (ids.length === 0) return;
    let cancelled = false;
    Promise.all(ids.map((id) => fetchUniverseInfo(id).then((info) => [id, info] as const)))
      .then((entries) => {
        if (cancelled) return;
        const map = new Map<string, { name: string; iconUrl: string }>();
        for (const [id, info] of entries) {
          map.set(id, info);
        }
        setSessionInfo(map);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [sessions]);

  useEffect(() => {
    if (nameManuallyEdited.current) return;
    const id = universeId.trim();
    if (!id || isNaN(Number(id))) return;

    let cancelled = false;
    const timer = setTimeout(() => {
      fetchUniverseInfo(id).then((info) => {
        if (!cancelled && info.name) {
          setExperienceName(info.name);
        }
      }).catch(() => {});
    }, 500);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [universeId]);

  const handleSubmit = () => {
    if (!apiKey.trim()) {
      setError("API key is required.");
      return;
    }
    if (!universeId.trim() || isNaN(Number(universeId))) {
      setError("A valid Universe ID is required.");
      return;
    }
    if (saveKey && !keyLabel.trim()) {
      setError("Please enter a label for the saved key.");
      return;
    }
    setError("");

    if (saveKey) {
      addSavedKey(keyLabel.trim(), apiKey.trim());
      setSavedKeys(getSavedKeys());
      setSaveKey(false);
      setKeyLabel("");
    }

    const name = experienceName.trim() || `Universe ${universeId.trim()}`;
    saveSession({
      apiKey: apiKey.trim(),
      universeId: universeId.trim(),
      experienceName: name,
    });

    setAppState({
      apiKey: apiKey.trim(),
      universeId: universeId.trim(),
      experienceName: name,
    });
    navigate("/dashboard");
  };

  const handleSessionClick = (session: (typeof sessions)[0]) => {
    const resolvedName = sessionInfo.get(session.universeId)?.name || session.experienceName;
    saveSession({
      apiKey: session.apiKey,
      universeId: session.universeId,
      experienceName: resolvedName,
    });
    setAppState({
      apiKey: session.apiKey,
      universeId: session.universeId,
      experienceName: resolvedName,
    });
    navigate("/dashboard");
  };

  const handleDeleteSession = (id: string) => {
    deleteSession(id);
    setSessions(getSessions());
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-md relative z-10">
        {/* Header */}
        <div className="text-center mb-8 animate-[fadeInUp_0.4s_ease-out]">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/15 border border-primary/25 mb-5">
            <Gamepad2 className="h-7 w-7 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground tracking-tight mb-2">
            Roblox Util
          </h1>
          <p className="text-muted-foreground text-sm">
            Bulk manage gamepasses and developer products for your Roblox experiences.
          </p>
        </div>

        {/* Recent Sessions */}
        {sessions.length > 0 && (
          <div className="mb-5 animate-[fadeInUp_0.4s_ease-out_0.1s_both]">
            <button
              onClick={() => setSessionsOpen((v) => !v)}
              className="flex items-center justify-between w-full mb-3 cursor-pointer group"
            >
              <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground group-hover:text-foreground transition-colors">
                Recent Sessions
              </span>
              <ChevronDown
                className={cn(
                  "h-4 w-4 text-muted-foreground transition-transform duration-200",
                  !sessionsOpen && "-rotate-90"
                )}
              />
            </button>
            <div
              className={cn(
                "grid transition-[grid-template-rows] duration-300 ease-out",
                sessionsOpen ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
              )}
            >
              <div className="overflow-hidden">
                <div className="flex flex-col gap-2">
                  {sessions.map((s) => (
                    <Card key={s.id} className="group">
                      <div className="flex items-center">
                        {sessionInfo.get(s.universeId)?.iconUrl ? (
                          <img
                            src={sessionInfo.get(s.universeId)!.iconUrl}
                            alt={s.experienceName}
                            className="w-12 h-12 object-cover m-2.5 rounded-lg shrink-0"
                          />
                        ) : (
                          <div className="w-12 h-12 m-2.5 rounded-lg bg-surface-raised flex items-center justify-center shrink-0">
                            <Gamepad2 className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <button
                          onClick={() => handleSessionClick(s)}
                          className="flex-1 text-left px-2 py-3 hover:bg-surface-raised/50 transition-colors rounded-lg cursor-pointer min-w-0"
                        >
                          <p className="font-medium text-foreground text-sm truncate">
                            {sessionInfo.get(s.universeId)?.name || s.experienceName}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {s.universeId} &middot; {new Date(s.lastUsed).toLocaleDateString()}
                          </p>
                        </button>
                        <button
                          onClick={() => handleDeleteSession(s.id)}
                          className="mx-2 p-2 rounded-lg text-muted-foreground/50 hover:text-destructive transition-colors cursor-pointer opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </Card>
                  ))}
                </div>
                <div className="flex items-center gap-3 mt-4 mb-1">
                  <Separator className="flex-1" />
                  <span className="text-xs text-muted-foreground">or connect new</span>
                  <Separator className="flex-1" />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Connect Form */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-5 animate-[fadeInUp_0.4s_ease-out_0.2s_both]">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
              <Key className="h-4 w-4 text-primary" />
            </div>
            <h2 className="text-base font-semibold text-foreground">Connect Experience</h2>
          </div>

          {savedKeys.length > 0 && (
            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Saved API Key</Label>
              <Select
                value={selectedKeyId || "_manual"}
                onValueChange={(id) => {
                  if (id === "_manual") {
                    setSelectedKeyId("");
                  } else {
                    setSelectedKeyId(id);
                    const key = savedKeys.find((k) => k.id === id);
                    if (key) setApiKey(key.apiKey);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Enter manually" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="_manual">Enter manually</SelectItem>
                  {savedKeys.map((k) => (
                    <SelectItem key={k.id} value={k.id}>
                      <div className="flex items-center justify-between w-full gap-2">
                        <span>{k.label}</span>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            deleteSavedKey(k.id);
                            setSavedKeys(getSavedKeys());
                            if (selectedKeyId === k.id) {
                              setSelectedKeyId("");
                              setApiKey("");
                            }
                          }}
                          className="text-muted-foreground hover:text-destructive cursor-pointer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Open Cloud API Key</Label>
            <div className="relative">
              <Input
                value={apiKey}
                onChange={(e) => {
                  setApiKey(e.target.value);
                  setSelectedKeyId("");
                }}
                type={showKey ? "text" : "password"}
                placeholder="Enter your API key"
              />
              <button
                onClick={() => setShowKey(!showKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground cursor-pointer transition-colors"
              >
                {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <p className="text-xs text-muted-foreground">
              Don't have one?{" "}
              <Link to="/guide" className="text-muted-foreground hover:text-foreground hover:underline transition-colors">
                Learn how to create an API key
              </Link>
            </p>
          </div>

          {!selectedKeyId && apiKey.trim() && (
            <div>
              <div className="flex items-center gap-2">
                <Checkbox
                  id="save-key"
                  checked={saveKey}
                  onCheckedChange={(v) => setSaveKey(v === true)}
                />
                <Label htmlFor="save-key" className="text-xs text-muted-foreground cursor-pointer">
                  Save this API key for later
                </Label>
              </div>
              {saveKey && (
                <Input
                  value={keyLabel}
                  onChange={(e) => setKeyLabel(e.target.value)}
                  placeholder='e.g. "My Main Key"'
                  className="mt-2"
                />
              )}
            </div>
          )}

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Universe ID</Label>
            <div className="relative">
              <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={universeId}
                onChange={(e) => setUniverseId(e.target.value)}
                placeholder="Enter Universe ID"
                className="pl-9"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label className="text-xs text-muted-foreground">Experience Name <span className="text-muted-foreground/50">(optional)</span></Label>
            <Input
              value={experienceName}
              onChange={(e) => {
                setExperienceName(e.target.value);
                nameManuallyEdited.current = true;
              }}
              placeholder="Auto-filled from Roblox"
            />
          </div>

          {error && <Alert variant="destructive">{error}</Alert>}

          <Button size="lg" onClick={handleSubmit} className="mt-1 w-full">
            Launch Manager
            <ArrowRight className="h-4 w-4 ml-1" />
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate("/dashboard/icon-editor")}
            className="w-full"
          >
            <Paintbrush className="h-4 w-4 mr-2" />
            Use Free Tools
          </Button>
          <p className="text-[11px] text-muted-foreground text-center">
            Icon Editor and other tools available without an API key.
          </p>
        </div>
      </div>
    </div>
  );
}

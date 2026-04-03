import { useState, useCallback } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
import Setup from "./pages/Setup";
import Dashboard from "./pages/Dashboard";
import ApiKeyGuide from "./pages/ApiKeyGuide";
import type { AppState } from "./types";

const SESSION_KEY = "app-state";

function loadSessionState(): AppState {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.apiKey && parsed.universeId) return parsed;
    }
  } catch {}
  return { apiKey: "", universeId: "", experienceName: "" };
}

export default function App() {
  const [appState, setAppState] = useState<AppState>(loadSessionState);

  const updateAppState = useCallback((state: AppState) => {
    setAppState(state);
    if (state.apiKey && state.universeId) {
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(state));
    } else {
      sessionStorage.removeItem(SESSION_KEY);
    }
  }, []);

  const navigate = useNavigate();

  const handleBack = useCallback(() => {
    updateAppState({ apiKey: "", universeId: "", experienceName: "" });
    navigate("/");
  }, [navigate, updateAppState]);

  return (
    <Routes>
      <Route
        path="/"
        element={<Setup appState={appState} setAppState={updateAppState} />}
      />
      <Route path="/guide" element={<ApiKeyGuide />} />
      <Route
        path="/dashboard/*"
        element={
          <Dashboard appState={appState} onBack={handleBack} setAppState={updateAppState} />
        }
      />
    </Routes>
  );
}

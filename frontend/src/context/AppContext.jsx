import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { api } from "../apiClient";
import { applyCookieFromQuery } from "../utils/cookies";

const AppContext = createContext(null);

const hydrateResponse = (payload, setState, setMeta, setUserId) => {
  if (!payload) return;
  setUserId(payload.user_id || null);
  setMeta(payload.state?.meta || null);
  setState(payload.state?.data || null);
};

export const AppProvider = ({ children }) => {
  const [state, setState] = useState(null);
  const [meta, setMeta] = useState(null);
  const [userId, setUserId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const refreshState = useCallback(async ({ silent = false } = {}) => {
    if (!silent) {
      setLoading(true);
    }
    setError("");
    try {
      const next = await api.getState();
      hydrateResponse(next, setState, setMeta, setUserId);
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to load state.");
    } finally {
      if (!silent) {
        setLoading(false);
      }
    }
  }, []);

  const replaceState = useCallback(
    async (nextData, { note, meta: nextMeta } = {}) => {
      setError("");
      try {
        const next = await api.replaceState(nextData, note, nextMeta);
        hydrateResponse(next, setState, setMeta, setUserId);
        return next.state?.data || null;
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to replace state.");
        throw err;
      }
    },
    []
  );

  const updateState = useCallback(
    async (partial, { note } = {}) => {
      if (!partial || typeof partial !== "object") return null;
      setState((prev) => {
        if (!prev) return { ...partial };
        return { ...prev, ...partial };
      });
      setError("");
      try {
        const next = await api.patchState(partial, note);
        hydrateResponse(next, setState, setMeta, setUserId);
        return next.state?.data || null;
      } catch (err) {
        console.error(err);
        setError(err.message || "Failed to update state.");
        await refreshState({ silent: true });
        throw err;
      }
    },
    [refreshState]
  );

  const resetState = useCallback(async () => {
    setError("");
    try {
      const next = await api.resetState();
      hydrateResponse(next, setState, setMeta, setUserId);
      return next.state?.data || null;
    } catch (err) {
      console.error(err);
      setError(err.message || "Failed to reset state.");
      throw err;
    }
  }, []);

  useEffect(() => {
    const redirected = applyCookieFromQuery();
    if (redirected) return;
    refreshState();
  }, [refreshState]);

  return (
    <AppContext.Provider
      value={{
        state,
        meta,
        userId,
        loading,
        error,
        refreshState,
        replaceState,
        updateState,
        resetState,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider.");
  }
  return context;
};

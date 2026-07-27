import React, { createContext, useContext, useState } from 'react';

// Lives at the App root (mounted once, forever) — not inside CargoScreen —
// specifically so the list of open WebView tabs, and the tabs themselves
// (rendered by CargoWebViewOverlay, also mounted at the App root), survive
// leaving the Cargo screen entirely. If this state lived inside CargoScreen,
// navigating away would unmount the screen and every open WebView with it.
type CargoSessionsContextValue = {
  sessionIds: string[];
  activeId: string | null;
  overlayVisible: boolean;
  buttonEnabled: boolean;
  openSession: (accountId: string) => void;
  closeSession: (accountId: string) => void;
  setActiveId: (accountId: string) => void;
  showOverlay: () => void;
  hideOverlay: () => void;
  setButtonEnabled: (enabled: boolean) => void;
};

const CargoSessionsContext = createContext<CargoSessionsContextValue | undefined>(undefined);

export function CargoSessionsProvider({ children }: { children: React.ReactNode }) {
  const [sessionIds, setSessionIds] = useState<string[]>([]);
  const [activeId, setActiveIdState] = useState<string | null>(null);
  const [overlayVisible, setOverlayVisible] = useState(false);
  // Lets the user turn the floating "resume" button off entirely (e.g. if
  // they find it distracting) without closing the sessions themselves —
  // independent from overlayVisible.
  const [buttonEnabled, setButtonEnabled] = useState(true);

  const openSession = (accountId: string) => {
    setSessionIds(prev => (prev.includes(accountId) ? prev : [...prev, accountId]));
    setActiveIdState(accountId);
    setOverlayVisible(true);
  };

  const closeSession = (accountId: string) => {
    setSessionIds(prev => {
      const next = prev.filter(id => id !== accountId);
      setActiveIdState(current => (current === accountId ? (next.length ? next[next.length - 1] : null) : current));
      return next;
    });
  };

  const value: CargoSessionsContextValue = {
    sessionIds,
    activeId,
    overlayVisible,
    buttonEnabled,
    openSession,
    closeSession,
    setActiveId: setActiveIdState,
    showOverlay: () => setOverlayVisible(true),
    hideOverlay: () => setOverlayVisible(false),
    setButtonEnabled,
  };

  return <CargoSessionsContext.Provider value={value}>{children}</CargoSessionsContext.Provider>;
}

export function useCargoSessions() {
  const ctx = useContext(CargoSessionsContext);
  if (!ctx) throw new Error('useCargoSessions must be used within CargoSessionsProvider');
  return ctx;
}

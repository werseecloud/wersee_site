import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import type { AiPageContext } from './types';

interface RegistryEntry {
  id: string;
  priority: number;
  value: AiPageContext;
}

interface AiContextValue {
  context: AiPageContext;
  registerContext: (entry: RegistryEntry) => () => void;
}

const WerseeAiContext = createContext<AiContextValue | null>(null);

export const WerseeAiProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [entries, setEntries] = useState<RegistryEntry[]>([]);
  const registerContext = useCallback((entry: RegistryEntry) => {
    setEntries((current) => [...current.filter((item) => item.id !== entry.id), entry]);
    return () => setEntries((current) => current.filter((item) => item.id !== entry.id));
  }, []);
  const context = useMemo(() => entries
    .slice()
    .sort((a, b) => a.priority - b.priority)
    .reduce<AiPageContext>((merged, entry) => ({ ...merged, ...entry.value }), {}), [entries]);
  const value = useMemo(() => ({ context, registerContext }), [context, registerContext]);
  return <WerseeAiContext.Provider value={value}>{children}</WerseeAiContext.Provider>;
};

export const useWerseeAiContext = () => {
  const value = useContext(WerseeAiContext);
  if (!value) throw new Error('useWerseeAiContext must be used inside WerseeAiProvider.');
  return value;
};

export const useAiPageContext = (id: string, value: AiPageContext, priority = 10) => {
  const { registerContext } = useWerseeAiContext();
  const serialized = JSON.stringify(value);
  React.useEffect(() => registerContext({ id, priority, value }), [id, priority, registerContext, serialized]);
};

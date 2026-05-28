"use client";

import { createContext, useContext, useState } from "react";

export const NavigationContext = createContext<{
  pendingHref: string | null;
  setPendingHref: (href: string | null) => void;
}>({ pendingHref: null, setPendingHref: () => {} });

export function NavigationProvider({ children }: { children: React.ReactNode }) {
  const [pendingHref, setPendingHref] = useState<string | null>(null);
  return (
    <NavigationContext.Provider value={{ pendingHref, setPendingHref }}>
      {children}
    </NavigationContext.Provider>
  );
}

export function useNavigation() {
  return useContext(NavigationContext);
}

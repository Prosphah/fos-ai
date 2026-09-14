"use client";

import { createContext, useContext, ReactNode } from "react";

const UserNameContext = createContext<string>("");

export function UserNameProvider({ children, value }: { children: ReactNode; value: string }) {
  return (
    <UserNameContext.Provider value={value}>
      {children}
    </UserNameContext.Provider>
  );
}

export function useUserName(): string {
  return useContext(UserNameContext);
}

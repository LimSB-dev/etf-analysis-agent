"use client";

import type { ReactNode } from "react";
import { SessionProvider } from "next-auth/react";

interface AuthProviderPropsType {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderPropsType) => {
  return <SessionProvider>{children}</SessionProvider>;
};

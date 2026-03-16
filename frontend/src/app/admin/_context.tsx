"use client";

import { createContext, useContext } from "react";

interface AdminAuthContextType {
  token: string;
  onUnauth: () => void;
  handleLogout: () => void;
}

export const AdminAuthContext = createContext<AdminAuthContextType>({
  token: "",
  onUnauth: () => {},
  handleLogout: () => {},
});

export function useAdminAuth() {
  return useContext(AdminAuthContext);
}

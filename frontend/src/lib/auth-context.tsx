"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { api } from "./api";

interface UserProfile {
  id: string;
  nama: string;
  noHp?: string;
  namaBurung?: string;
  email?: string;
  role?: "ADMIN" | "SUPERADMIN";
}

interface AuthContextType {
  user: UserProfile | null;
  userType: "USER" | "ADMIN" | null;
  token: string | null;
  isLoading: boolean;
  loginUser: (token: string, user: UserProfile) => void;
  loginAdmin: (token: string, admin: UserProfile) => void;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [userType, setUserType] = useState<"USER" | "ADMIN" | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem("km_token");
    const savedType = localStorage.getItem("km_type") as "USER" | "ADMIN" | null;

    if (savedToken) {
      setToken(savedToken);
      setUserType(savedType);
      fetchCurrentProfile(savedToken);
    } else {
      setIsLoading(false);
    }
  }, []);

  const fetchCurrentProfile = async (currentToken: string) => {
    try {
      const res = await api.getMe();
      if (res.success) {
        if (res.type === "USER") {
          setUser(res.user);
          setUserType("USER");
        } else if (res.type === "ADMIN") {
          setUser(res.admin);
          setUserType("ADMIN");
        }
      }
    } catch (err) {
      console.warn("Session expired or invalid token");
      logout();
    } finally {
      setIsLoading(false);
    }
  };

  const loginUser = (newToken: string, newUser: UserProfile) => {
    localStorage.setItem("km_token", newToken);
    localStorage.setItem("km_type", "USER");
    setToken(newToken);
    setUser(newUser);
    setUserType("USER");
  };

  const loginAdmin = (newToken: string, newAdmin: UserProfile) => {
    localStorage.setItem("km_token", newToken);
    localStorage.setItem("km_type", "ADMIN");
    setToken(newToken);
    setUser(newAdmin);
    setUserType("ADMIN");
  };

  const logout = () => {
    localStorage.removeItem("km_token");
    localStorage.removeItem("km_type");
    setToken(null);
    setUser(null);
    setUserType(null);
  };

  const refreshProfile = async () => {
    if (token) {
      await fetchCurrentProfile(token);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        userType,
        token,
        isLoading,
        loginUser,
        loginAdmin,
        logout,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

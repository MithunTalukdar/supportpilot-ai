import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { UserProfile, UserMembership, OrgRole } from '../types/auth.js';
import { loginApi, registerApi, logoutApi, getMeApi, createOrgApi } from '../services/auth.api.js';

interface AuthContextType {
  user: UserProfile | null;
  memberships: UserMembership[];
  activeOrg: UserMembership | null;
  role: OrgRole | null;
  accessToken: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => Promise<void>;
  switchOrg: (orgId: string) => void;
  createOrg: (name: string, slug: string, domain?: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const TOKEN_STORAGE_KEY = 'sp_access_token';
const ACTIVE_ORG_STORAGE_KEY = 'sp_active_org_id';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [memberships, setMemberships] = useState<UserMembership[]>([]);
  const [activeOrg, setActiveOrg] = useState<UserMembership | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() => {
    return localStorage.getItem(TOKEN_STORAGE_KEY);
  });
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const initAuth = useCallback(async () => {
    const storedToken = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!storedToken) {
      setIsLoading(false);
      return;
    }

    try {
      const data = await getMeApi(storedToken);
      setUser(data.user);
      setMemberships(data.memberships);

      const storedOrgId = localStorage.getItem(ACTIVE_ORG_STORAGE_KEY);
      const matchedOrg = data.memberships.find((m) => m.organizationId === storedOrgId);
      const selected = matchedOrg || data.memberships[0] || null;

      setActiveOrg(selected);
      if (selected) {
        localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, selected.organizationId);
      }
    } catch {
      // If token expired, clear invalid token
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
      setAccessToken(null);
      setUser(null);
      setMemberships([]);
      setActiveOrg(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    initAuth();
  }, [initAuth]);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const result = await loginApi({ email, password });
      setUser(result.user);
      setMemberships(result.memberships);
      setAccessToken(result.accessToken);
      localStorage.setItem(TOKEN_STORAGE_KEY, result.accessToken);

      const defaultOrg = result.memberships[0] || null;
      setActiveOrg(defaultOrg);
      if (defaultOrg) {
        localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, defaultOrg.organizationId);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const result = await registerApi({ email, password, fullName });
      setUser(result.user);
      setAccessToken(result.accessToken);
      localStorage.setItem(TOKEN_STORAGE_KEY, result.accessToken);
      setMemberships([]);
      setActiveOrg(null);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await logoutApi();
    } catch {
      // proceed even if network fails
    } finally {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(ACTIVE_ORG_STORAGE_KEY);
      setAccessToken(null);
      setUser(null);
      setMemberships([]);
      setActiveOrg(null);
    }
  };

  const switchOrg = (orgId: string) => {
    const found = memberships.find((m) => m.organizationId === orgId);
    if (found) {
      setActiveOrg(found);
      localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, found.organizationId);
    }
  };

  const createOrg = async (name: string, slug: string, domain?: string) => {
    if (!accessToken) throw new Error('Not authenticated');
    const newOrg = await createOrgApi(accessToken, { name, slug, domain });

    const newMembership: UserMembership = {
      organizationId: newOrg.id,
      organizationName: newOrg.name,
      organizationSlug: newOrg.slug,
      role: newOrg.role,
    };

    setMemberships((prev) => [...prev, newMembership]);
    setActiveOrg(newMembership);
    localStorage.setItem(ACTIVE_ORG_STORAGE_KEY, newMembership.organizationId);
  };

  const refreshProfile = async () => {
    if (!accessToken) return;
    const data = await getMeApi(accessToken);
    setUser(data.user);
    setMemberships(data.memberships);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        memberships,
        activeOrg,
        role: activeOrg?.role || null,
        accessToken,
        isLoading,
        isAuthenticated: !!user && !!accessToken,
        login,
        register,
        logout,
        switchOrg,
        createOrg,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

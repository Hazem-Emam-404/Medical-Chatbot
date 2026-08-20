import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { authApi, getToken, setToken, removeToken } from "../services/api";

const AuthContext = createContext(null);

const clearGuestCache = () => {
  localStorage.removeItem("clinicianmind_guest_conversations");
  localStorage.removeItem("clinicianmind_guest_active_id");
  localStorage.removeItem("clinicianmind_guest_chat");
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setTokenState] = useState(getToken());
  const [isLoading, setIsLoading] = useState(true);

  // Initialize session on mount
  useEffect(() => {
    const initializeAuth = async () => {
      const storedToken = getToken();
      if (!storedToken) {
        setIsLoading(false);
        return;
      }

      try {
        const userData = await authApi.getMe();
        setUser(userData);
      } catch (err) {
        console.warn("Auth validation error:", err.message);

        // ONLY clear token if the backend explicitly rejects the token as 401/403
        if (err.status === 401 || err.status === 403) {
          removeToken();
          setTokenState(null);
          setUser(null);
        } else {
          // If it's a server 500 error or network glitch, do NOT log out the user.
          // Restore user identity from JWT payload to preserve the authenticated session.
          try {
            const base64Url = storedToken.split(".")[1];
            if (base64Url) {
              const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
              const jsonPayload = decodeURIComponent(
                atob(base64)
                  .split("")
                  .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
                  .join("")
              );
              const decoded = JSON.parse(jsonPayload);
              if (decoded && (decoded.sub || decoded.email)) {
                setUser({
                  id: decoded.user_id || 1,
                  email: decoded.email || decoded.sub,
                  full_name: decoded.full_name || decoded.sub || "Clinician",
                });
              }
            }
          } catch {
            // Only if the token is corrupted
            removeToken();
            setTokenState(null);
            setUser(null);
          }
        }
      } finally {
        setIsLoading(false);
      }
    };

    initializeAuth();
  }, []);

  const login = useCallback(async ({ email, password }) => {
    const res = await authApi.login({ email, password });
    clearGuestCache();
    setToken(res.access_token);
    setTokenState(res.access_token);
    setUser(res.user);
    return res;
  }, []);

  const signup = useCallback(async ({ fullName, email, password }) => {
    const res = await authApi.signup({ fullName, email, password });
    clearGuestCache();
    setToken(res.access_token);
    setTokenState(res.access_token);
    setUser(res.user);
    return res;
  }, []);

  const logout = useCallback(() => {
    removeToken();
    localStorage.removeItem("clinicianmind_active_chat_id");
    clearGuestCache();
    setTokenState(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (data) => {
    const updated = await authApi.updateProfile(data);
    setUser(updated);
    return updated;
  }, []);

  const value = {
    user,
    token,
    isAuthenticated: Boolean(user && token),
    isLoading,
    login,
    signup,
    logout,
    updateProfile,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

import { ROUTES } from "@/constants/routes";
import {
  getAccessToken,
  removeAccessToken,
  removeRefreshToken,
  setAccessToken,
  setRefreshToken,
} from "@/lib/cookies";
import {
  useLazyGetMyProfileQuery,
  useLoginMutation,
  type AuthUser,
} from "@/redux/api/authApi";

interface AuthContextValue {
  user: AuthUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  // Seeded to `true` on both server and client so the pre-effect render is
  // identical either way — `getAccessToken()` reads `document.cookie`, which
  // is unavailable during SSR, so branching on it here would make the
  // server's HTML disagree with the client's first paint and trigger a
  // hydration mismatch in anything that renders differently while loading.
  const [isLoading, setIsLoading] = useState(true);
  const [loginMutation] = useLoginMutation();
  const [getMyProfile] = useLazyGetMyProfileQuery();

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      Promise.resolve().then(() => setIsLoading(false));
      return;
    }

    getMyProfile()
      .unwrap()
      .then(setUser)
      .catch((error: unknown) => {
        // Only treat a genuine 401 as "this token is invalid" — anything
        // else (network hiccup, CORS, a transient 500) shouldn't log the
        // user out of an otherwise-valid session.
        const status = (error as { status?: unknown } | null)?.status;
        if (status === 401) {
          removeAccessToken();
          setUser(null);
        }
      })
      .finally(() => setIsLoading(false));
  }, [getMyProfile]);

  const login = useCallback(
    async (email: string, password: string) => {
      const {
        accessToken,
        refreshToken,
        id,
        name,
        email: userEmail,
        role,
        avatar,
        status,
      } = await loginMutation({ email, password }).unwrap();
      setAccessToken(accessToken);
      setRefreshToken(refreshToken);
      setUser({ id, name, email: userEmail, role, avatar, status });
    },
    [loginMutation]
  );

  const logout = useCallback(() => {
    removeAccessToken();
    removeRefreshToken();
    setUser(null);
    router.push(ROUTES.LOGIN);
  }, [router]);

  return (
    <AuthContext.Provider
      value={{ user, isLoading, isAuthenticated: !!user, login, logout }}
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

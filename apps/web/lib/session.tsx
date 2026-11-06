"use client";
/** Session partagée par l’espace connecté : une seule lecture du profil, mise à jour après connexion. */
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { api, type Profile } from "./student-api";

type Session = { profile: Profile | null; ready: boolean; setProfile: (profile: Profile | null) => void; refresh: () => Promise<void> };
const SessionContext = createContext<Session>({ profile: null, ready: false, setProfile: () => {}, refresh: async () => {} });
export const useSession = () => useContext(SessionContext);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [ready, setReady] = useState(false);
  const refresh = useCallback(async () => {
    try { setProfile(await api<Profile>("auth/profile/")); }
    catch { setProfile(null); }
    finally { setReady(true); }
  }, []);
  useEffect(() => { refresh(); }, [refresh]);
  // La vérification se fait souvent dans un autre onglet : relire le profil au retour.
  useEffect(() => {
    const onVisible = () => { if (document.visibilityState === "visible") refresh(); };
    document.addEventListener("visibilitychange", onVisible);
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [refresh]);
  return <SessionContext.Provider value={{ profile, ready, setProfile, refresh }}>{children}</SessionContext.Provider>;
}

export function initials(profile: Profile | null) {
  const source = profile?.display_name || profile?.email || "";
  return source.split(/[\s@._-]+/).filter(Boolean).slice(0, 2).map(part => part[0]!.toUpperCase()).join("") || "?";
}

"use client";
/** Panneau repliable dont le choix est mémorisé sur l’appareil (menu de gauche, colonnes d’outils à droite). */
import { useCallback, useEffect, useState } from "react";

export function useFoldable(key: string) {
  const [folded, setFolded] = useState(false);
  // Lu après le premier rendu : le serveur ne connaît pas le choix de l’appareil.
  useEffect(() => { try { setFolded(localStorage.getItem(key) === "1"); } catch { /* stockage indisponible */ } }, [key]);
  const fold = useCallback((value: boolean) => {
    setFolded(value);
    try { localStorage.setItem(key, value ? "1" : "0"); } catch { /* stockage indisponible */ }
  }, [key]);
  return [folded, fold] as const;
}

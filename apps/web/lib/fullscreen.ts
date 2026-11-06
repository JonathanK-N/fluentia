/** Plein écran de la séance : à appeler pendant le clic, le navigateur exige un geste. */
export function enterFullscreen() {
  if (typeof document === "undefined" || !document.fullscreenEnabled || document.fullscreenElement) return;
  document.documentElement.requestFullscreen({ navigationUI: "hide" }).catch(() => {});
}

export function exitFullscreen() {
  if (typeof document !== "undefined" && document.fullscreenElement) document.exitFullscreen().catch(() => {});
}

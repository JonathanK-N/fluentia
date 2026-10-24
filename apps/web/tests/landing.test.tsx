/** Régressions de la démo, sans audio/IA. Propriétaire : Jonathan Kakesa. */
import { expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { VoiceDemo } from "../features/landing/voice-demo";
import { CoachDemo } from "../features/landing/coach-demo";
vi.mock("../features/landing/orb", () => ({
  VoiceOrb: () => <div aria-hidden="true" />,
}));
it("conserve l’étape Voice lors d’une pause, gère erreur et redémarrage", async () => {
  const user = userEvent.setup();
  render(<VoiceDemo />);
  await user.click(screen.getByRole("button", { name: /Lancer la démo/ }));
  expect(screen.getByRole("status")).toHaveAttribute(
    "data-voice-state",
    "listening",
  );
  await user.click(screen.getByRole("button", { name: /Étape suivante/ }));
  await user.click(screen.getByRole("button", { name: "Mettre en pause" }));
  expect(screen.getByRole("status")).toHaveAttribute(
    "data-voice-state",
    "paused",
  );
  await user.click(screen.getByRole("button", { name: "Reprendre la démo" }));
  expect(screen.getByRole("status")).toHaveAttribute(
    "data-voice-state",
    "analysis",
  );
  await user.click(screen.getByRole("button", { name: "Simuler une erreur" }));
  expect(screen.getByRole("status")).toHaveAttribute(
    "data-voice-state",
    "error",
  );
  await user.click(screen.getByRole("button", { name: /Réessayer/ }));
  await user.click(screen.getByRole("button", { name: "Terminer la démo" }));
  expect(screen.getByRole("button", { name: /Recommencer/ })).toHaveFocus();
  await user.click(screen.getByRole("button", { name: /Recommencer/ }));
  expect(screen.getByRole("status")).toHaveAttribute(
    "data-voice-state",
    "listening",
  );
});
it("termine la séquence manuelle et conserve le focus du bouton principal", async () => {
  const user = userEvent.setup();
  render(<VoiceDemo />);
  await user.click(screen.getByRole("button", { name: /Lancer/ }));
  for (let i = 0; i < 3; i++)
    await user.click(screen.getByRole("button", { name: /Étape suivante/ }));
  expect(screen.getByRole("status")).toHaveAttribute(
    "data-voice-state",
    "ended",
  );
  expect(screen.getByRole("button", { name: /Recommencer/ })).toHaveFocus();
});
it("révèle puis réinitialise un conseil explicitement prédéfini", async () => {
  const user = userEvent.setup();
  render(<CoachDemo />);
  await user.click(screen.getByRole("button", { name: /Voir le conseil/ }));
  expect(screen.getByRole("status")).toHaveTextContent("Retour prédéfini");
  await user.click(screen.getByRole("button", { name: /Revoir la phrase/ }));
  expect(screen.getByRole("status")).not.toHaveTextContent("Retour prédéfini");
});

/** Accueil : aperçu animé de l’oral et contenus clés. Propriétaire : Jonathan Kakesa. */
import { afterEach, expect, it, vi } from "vitest";
import { act, render, screen, within } from "@testing-library/react";
import Home from "../app/page";
import { SessionPreview } from "../features/landing/session-preview";
import { sampleConversation } from "../features/landing/content";

vi.mock("../features/landing/home.css", () => ({}));
vi.mock("../components/animations/reveal", () => ({ Reveal: ({ children }: { children: React.ReactNode }) => children }));
afterEach(() => vi.useRealTimers());

it("fait défiler l’exemple d’échange puis recommence", () => {
  vi.useFakeTimers();
  render(<SessionPreview />);
  const lines = () => within(screen.getByRole("list", { name: /Exemple d’échange/ })).getAllByRole("listitem");
  expect(lines()).toHaveLength(1);
  act(() => vi.advanceTimersByTime(3400 * (sampleConversation.length - 1)));
  expect(lines()).toHaveLength(sampleConversation.length);
  act(() => vi.advanceTimersByTime(3400 * 2));
  expect(lines()).toHaveLength(1);
});

it("présente les quatre épreuves, les deux offres et des liens d’inscription réels", () => {
  render(<Home />);
  expect(screen.getByRole("heading", { level: 1 })).toHaveTextContent("Préparez le TCF Canada");
  for (const title of ["Compréhension orale", "Compréhension écrite", "Expression écrite", "Expression orale"])
    expect(screen.getByRole("heading", { level: 3, name: title })).toBeInTheDocument();
  expect(screen.getByText("19,99 $")).toBeInTheDocument();
  expect(screen.getByText("0 $", { selector: ".plan-price strong" })).toBeInTheDocument();
  const signups = screen.getAllByRole("link", { name: /Créer mon compte gratuit/ });
  expect(signups.length).toBeGreaterThan(1);
  for (const link of signups) expect(link).toHaveAttribute("href", "/etudiant/compte#inscription");
  expect(screen.getByRole("link", { name: "Passer à Premium" }).getAttribute("href")).toMatch(/^mailto:support@fluentia\.ca/);
  expect(screen.queryByText(/en développement|à confirmer|en préparation/i)).toBeNull();
});

/** États utiles du pilote, sans données personnelles. Propriétaire : Jonathan Kakesa. */
import { expect, it } from "vitest";
import { render, screen, within } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { StudentDashboard } from "../features/human-centered/student-dashboard";
it("distingue premier accès et exemple fictif, puis revient à un état vide", async () => {
  const user = userEvent.setup();
  render(<StudentDashboard />);
  expect(screen.getByRole("main")).toHaveAttribute("data-scenario", "empty");
  expect(screen.getByText("Pas encore d’activité")).toBeVisible();
  await user.click(screen.getByText("Options de l’aperçu"));
  await user.click(screen.getByRole("button", { name: "Exemple rempli" }));
  expect(screen.getByRole("main")).toHaveAttribute("data-scenario", "example");
  expect(screen.getByText("Exemple rempli · Données fictives")).toBeVisible();
  expect(screen.getByRole("table")).toHaveAccessibleName(
    "Activités de démonstration — aucun résultat personnel",
  );
  await user.click(screen.getByRole("button", { name: "Premier accès" }));
  expect(screen.queryByRole("table")).not.toBeInTheDocument();
});
it("retourne de l’indisponibilité et garde les fonctions de démonstration", async () => {
  const user = userEvent.setup();
  render(<StudentDashboard />);
  await user.click(screen.getByText("Options de l’aperçu"));
  const trigger = screen.getByRole("button", {
    name: "Afficher l’état indisponible",
  });
  await user.click(trigger);
  expect(screen.getByRole("alert")).toBeVisible();
  await user.click(screen.getByRole("button", { name: "Réessayer" }));
  expect(screen.queryByRole("alert")).not.toBeInTheDocument();
  expect(trigger).toHaveFocus();
  await user.click(trigger);
  const options = screen.getByText("Options de l’aperçu");
  await user.click(options);
  await user.click(screen.getByRole("button", { name: "Réessayer" }));
  expect(options).toHaveFocus();
  const main = within(screen.getByRole("main"));
  const activity = main.getByRole("button", {
    name: "Voir les activités — Compréhension écrite",
  });
  await user.click(activity);
  expect(screen.getByRole("dialog")).toHaveAccessibleName(
    "Compréhension écrite",
  );
  await user.keyboard("{Escape}");
  expect(activity).toHaveFocus();
});

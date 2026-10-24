/** Régressions des comportements et de l’accessibilité. Propriétaire : Jonathan Kakesa. */
import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { Button, Progress } from "../components/ui/primitives";
import { Showcase } from "../features/design-system/showcase";
describe("Primitives Fluentia", () => {
  it("empêche une action pendant le chargement", async () => {
    const click = vi.fn();
    render(
      <Button loading onClick={click}>
        Enregistrer
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(click).not.toHaveBeenCalled();
    expect(screen.getByRole("button")).toHaveAttribute("aria-busy", "true");
  });
  it.each([
    [-20, 0],
    [125, 100],
    [NaN, 0],
  ])("borne la progression %s à %s", (input, expected) => {
    render(<Progress value={input} label="Objectif" />);
    expect(screen.getByRole("progressbar")).toHaveAttribute(
      "value",
      String(expected),
    );
  });
  it("valide un prénom vide puis accepte une saisie sans réseau", async () => {
    const user = userEvent.setup();
    render(<Showcase />);
    await user.click(
      screen.getByRole("button", { name: "Valider la démonstration" }),
    );
    expect(screen.getByLabelText("Prénom")).toHaveAttribute(
      "aria-invalid",
      "true",
    );
    await user.type(screen.getByLabelText("Prénom"), "Camille");
    await user.click(
      screen.getByRole("button", { name: "Valider la démonstration" }),
    );
    expect(
      screen.getByText("Formulaire de démonstration validé localement."),
    ).toBeVisible();
  });
  it("ouvre une modale et restitue le focus après Échap", async () => {
    const user = userEvent.setup();
    render(<Showcase />);
    const trigger = screen.getByRole("button", { name: "Ouvrir la fenêtre" });
    await user.click(trigger);
    expect(screen.getByRole("dialog")).toHaveAccessibleName(
      "Votre espace prend forme",
    );
    await user.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
  it("permet de naviguer dans les onglets au clavier", async () => {
    const user = userEvent.setup();
    render(<Showcase />);
    screen.getByRole("tab", { name: "Vue d’ensemble" }).focus();
    await user.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "Accessibilité" })).toHaveFocus();
    await user.keyboard("{Enter}");
    expect(screen.getByRole("tabpanel")).toHaveTextContent(
      "Utilisez les flèches",
    );
  });
});

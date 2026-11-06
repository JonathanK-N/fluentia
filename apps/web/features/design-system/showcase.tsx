"use client";
/** Catalogue interactif local : validation, onglets et modale. Propriétaire : Jonathan Kakesa. */
import { useState } from "react";
import {
  Button,
  Card,
  Badge,
  Field,
  Alert,
  Progress,
  Skeleton,
  EmptyState,
  DataTable,
  BarChart,
} from "../../components/ui/primitives";
import { Dialog } from "../../components/ui/dialog";
import { Tabs } from "../../components/ui/tabs";
import { Notification } from "../../components/ui/notification";
export function Showcase() {
  const [name, setName] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [notice, setNotice] = useState("");
  const [value, setValue] = useState(35);
  const error =
    submitted && !name.trim()
      ? "Saisissez un prénom pour essayer la démonstration."
      : undefined;
  return (
    <div className="showcase">
      <section aria-labelledby="palette">
        <h2 id="palette">Couleurs & typographie</h2>
        <div className="swatches">
          {[
            { name: "Bleu nuit", hex: "#081B35" },
            { name: "Bleu électrique", hex: "#1769E0" },
            { name: "Cyan lumineux", hex: "#21D4F4" },
            { name: "Blanc cassé", hex: "#F7FAFF" },
            { name: "Bleu très sombre", hex: "#061B3D" },
          ].map((c) => (
            <div key={c.hex}>
              <span style={{ background: c.hex }} />
              <strong>{c.name}</strong>
              <code>{c.hex}</code>
            </div>
          ))}
        </div>
        <p>Poppins · 400 / 500 / 600 / 700 · Police hébergée localement</p>
      </section>
      <section aria-labelledby="actions">
        <h2 id="actions">Actions & états</h2>
        <div className="actions">
          <Button
            onClick={() => setNotice("Action de démonstration effectuée.")}
          >
            Action principale
          </Button>
          <Button variant="secondary">Action secondaire</Button>
          <Button variant="ghost">Action discrète</Button>
          <Button disabled>Indisponible</Button>
          <Button loading>Chargement</Button>
          <Badge>En préparation</Badge>
        </div>
        <Notification message={notice} onDismiss={() => setNotice("")} />
      </section>
      <section aria-labelledby="forms">
        <h2 id="forms">Formulaires & retours</h2>
        <div className="demo-grid">
          <Card>
            <h3>Essayez un formulaire</h3>
            <form
              noValidate
              onSubmit={(e) => {
                e.preventDefault();
                setSubmitted(true);
                if (name.trim())
                  setNotice("Formulaire de démonstration validé localement.");
              }}
            >
              <Field
                id="demo-name"
                label="Prénom"
                autoComplete="given-name"
                maxLength={80}
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                error={error}
                hint="Démonstration locale, sans inscription."
              />
              <Button type="submit">Valider la démonstration</Button>
            </form>
          </Card>
          <div className="stack">
            <Alert title="Un cadre pour progresser">
              Les parcours pédagogiques ne sont pas encore disponibles.
            </Alert>
            <Alert error title="Exemple d’erreur">
              Le service est indisponible. Veuillez réessayer plus tard.
            </Alert>
          </div>
        </div>
      </section>
      <section aria-labelledby="navigation">
        <h2 id="navigation">Navigation & dialogue</h2>
        <Tabs
          label="Exemples de contenu"
          items={[
            {
              id: "overview",
              label: "Vue d’ensemble",
              content: (
                <p>
                  Une interface lisible, des composants réutilisables et des
                  états explicites.
                </p>
              ),
            },
            {
              id: "accessibility",
              label: "Accessibilité",
              content: (
                <p>
                  Utilisez les flèches pour changer d’onglet. Le focus reste
                  visible.
                </p>
              ),
            },
          ]}
        />
        <Dialog
          title="Votre espace prend forme"
          description="Cette fenêtre illustre une interaction du design system."
          trigger={<Button variant="secondary">Ouvrir la fenêtre</Button>}
        >
          <p>
            Les inscriptions et les entraînements seront intégrés dans une
            prochaine étape.
          </p>
        </Dialog>
      </section>
      <section aria-labelledby="progress">
        <h2 id="progress">Progression & données</h2>
        <div className="demo-grid">
          <Card>
            <h3>Progression de démonstration</h3>
            <Progress value={value} label="Objectif illustratif" />
            <div className="actions">
              <Button
                variant="secondary"
                onClick={() => setValue(Math.max(0, value - 10))}
                disabled={value === 0}
                aria-label="− 10 : diminuer la progression"
              >
                − 10
              </Button>
              <Button
                onClick={() => setValue(Math.min(100, value + 10))}
                disabled={value === 100}
                aria-label="+ 10 : augmenter la progression"
              >
                + 10
              </Button>
            </div>
          </Card>
          <Card>
            <BarChart
              title="Données fictives · répartition illustrative"
              values={[
                { label: "Écoute", value: 60 },
                { label: "Lecture", value: 40 },
                { label: "Expression", value: 25 },
              ]}
            />
          </Card>
        </div>
        <DataTable
          caption="État des modules · démonstration"
          rows={[
            { label: "Compréhension orale", status: "Non implémenté" },
            { label: "Expression écrite", status: "Non implémenté" },
          ]}
        />
      </section>
      <section aria-labelledby="states">
        <h2 id="states">Chargement & états vides</h2>
        <div className="demo-grid">
          <Card>
            <h3>Chargement illustratif</h3>
            <Skeleton />
          </Card>
          <Card>
            <EmptyState title="Votre parcours commence ici">
              Aucun entraînement disponible pour le moment.
            </EmptyState>
          </Card>
        </div>
      </section>
    </div>
  );
}

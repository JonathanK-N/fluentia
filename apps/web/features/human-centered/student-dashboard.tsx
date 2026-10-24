"use client";
/** Deux scénarios fictifs de revue, sans persistance ni logique métier. Propriétaire : Jonathan Kakesa. */
import Link from "next/link";
import { useRef, useState } from "react";
import { Logo } from "../../components/branding/logo";
import {
  Card,
  Button,
  Alert,
  EmptyState,
} from "../../components/ui/primitives";
import { Dialog } from "../../components/ui/dialog";
import { SkillIcon } from "../../components/ui/skill-icon";
import { brand, competencies } from "../../lib/brand";
const skills = [
  competencies[1],
  competencies[0],
  competencies[2],
  competencies[3],
];
function ActivityPreview({
  label,
  id,
  navigation = false,
}: {
  label: string;
  id?: string;
  navigation?: boolean;
}) {
  return (
    <Dialog
      className="human-pilot"
      title={label}
      description="Présentation de l’activité — aucun exercice réel n’est lancé depuis cet aperçu."
      trigger={
        <Button
          variant="ghost"
          className={navigation ? "student-nav-link" : "student-action"}
        >
          {navigation ? label : "Voir les activités"}
          {!navigation && <span className="sr-only"> — {label}</span>}
        </Button>
      }
    >
      <p>
        Les consignes, les exercices et leurs corrections sont encore en
        préparation. Cette maquette présente leur accès, sans note ni
        enregistrement.
      </p>
      {id === "parole" && (
        <Link className="button button-primary" href="/#voice">
          Découvrir la démo Voice
        </Link>
      )}
    </Dialog>
  );
}
function StudentNavigation({ onNavigate }: { onNavigate: () => void }) {
  return (
    <nav aria-label="Navigation étudiante" className="student-navigation">
      <div>
        <h2>Général</h2>
        <a href="#contenu" aria-current="page" onClick={onNavigate}>
          Tableau de bord
        </a>
        <a href="#progression" onClick={onNavigate}>
          Progression
        </a>
        <Dialog
          className="human-pilot"
          title="Mon compte"
          description="Aucun compte n’est connecté dans cet aperçu."
          trigger={
            <Button variant="ghost" className="student-nav-link">
              Mon compte
            </Button>
          }
        >
          <p>
            La gestion du profil et de l’inscription n’est pas ouverte. Aucune
            information personnelle n’est demandée dans ce pilote.
          </p>
        </Dialog>
      </div>
      <div>
        <h2>Compréhension</h2>
        {skills
          .filter((item) => ["lecture", "ecoute"].includes(item.id))
          .map((item) => (
            <ActivityPreview
              key={item.id}
              label={item.title}
              id={item.id}
              navigation
            />
          ))}
      </div>
      <div>
        <h2>Expression</h2>
        {skills
          .filter((item) => ["redaction", "parole"].includes(item.id))
          .map((item) => (
            <ActivityPreview
              key={item.id}
              label={item.title}
              id={item.id}
              navigation
            />
          ))}
      </div>
      <div>
        <h2>Apprentissage</h2>
        <Link href="/#coach">Coach — présentation</Link>
        <Dialog
          className="human-pilot"
          title="Examens blancs"
          description="L’espace d’examen est en préparation."
          trigger={
            <Button variant="ghost" className="student-nav-link">
              Examens blancs
            </Button>
          }
        >
          <p>
            Aucun examen chronométré n’est démarré ici. Les exemples ne
            constituent pas une évaluation officielle du TCF.
          </p>
        </Dialog>
        <a href="#programme" onClick={onNavigate}>
          Plan d’étude
        </a>
      </div>
    </nav>
  );
}
export function StudentDashboard() {
  const [example, setExample] = useState(false);
  const [unavailable, setUnavailable] = useState(false);
  const menu = useRef<HTMLDetailsElement>(null);
  const errorTrigger = useRef<HTMLButtonElement>(null);
  function closeMenu() {
    if (menu.current) menu.current.open = false;
  }
  return (
    <div className="human-pilot student-preview">
      <header className="student-header">
        <Logo appearance="light" />
        <span>Aperçu étudiant</span>
        <Link href="/">Retour à l’accueil</Link>
        <details
          className="student-mobile-menu"
          ref={menu}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              closeMenu();
              menu.current?.querySelector("summary")?.focus();
            }
          }}
        >
          <summary>Menu étudiant</summary>
          <StudentNavigation onNavigate={closeMenu} />
        </details>
      </header>
      <section
        className="student-review-bar"
        aria-label="Options de présentation"
      >
        <div>
          <strong>Maquette de conception</strong>
          <span>Aucune donnée personnelle, aucun compte connecté.</span>
        </div>
        <details>
          <summary>Options de l’aperçu</summary>
          <div className="student-review-options">
            <div role="group" aria-label="Scénario étudiant">
              <Button
                variant={example ? "secondary" : "primary"}
                aria-pressed={!example}
                onClick={() => setExample(false)}
              >
                Premier accès
              </Button>
              <Button
                variant={example ? "primary" : "secondary"}
                aria-pressed={example}
                onClick={() => setExample(true)}
              >
                Exemple rempli
              </Button>
            </div>
            <Button
              ref={errorTrigger}
              variant="ghost"
              onClick={() => setUnavailable(true)}
            >
              Afficher l’état indisponible
            </Button>
          </div>
        </details>
      </section>
      <div className="student-layout">
        <aside className="student-sidebar">
          <StudentNavigation onNavigate={() => {}} />
        </aside>
        <main
          id="contenu"
          tabIndex={-1}
          className="student-main"
          data-scenario={example ? "example" : "empty"}
        >
          <div className="student-welcome">
            <div>
              <p className="eyebrow">Votre espace d’apprentissage</p>
              <h1>Bienvenue sur Fluentia.</h1>
              <p>Qu’aimeriez-vous travailler aujourd’hui ?</p>
            </div>
            {example && (
              <span className="student-example-badge">
                Exemple rempli · Données fictives
              </span>
            )}
          </div>
          {unavailable ? (
            <div className="student-unavailable">
              <Alert
                error
                title="Les activités sont momentanément indisponibles."
              >
                Cet état est un exemple de présentation. Aucune requête serveur
                n’a échoué.
              </Alert>
              <Button
                onClick={() => {
                  setUnavailable(false);
                  errorTrigger.current?.focus();
                }}
              >
                Réessayer
              </Button>
            </div>
          ) : (
            <>
              <section id="progression" aria-labelledby="progress-title">
                <h2 id="progress-title">Vos repères</h2>
                <div className="student-stat-grid">
                  {[
                    [
                      "Activités réalisées",
                      example ? "6 activités" : "Pas encore d’activité",
                    ],
                    [
                      "Temps de pratique",
                      example ? "40 min" : "À votre rythme",
                    ],
                    [
                      "Prochaine compétence",
                      example ? "Compréhension orale" : "À choisir",
                    ],
                  ].map(([label, value]) => (
                    <Card key={label}>
                      <span>{label}</span>
                      <strong>{value}</strong>
                      {example && (
                        <small>Valeur fictive de démonstration</small>
                      )}
                    </Card>
                  ))}
                </div>
              </section>
              <section id="competences" aria-labelledby="competences-title">
                <div className="student-section-heading">
                  <h2 id="competences-title">Choisissez une compétence</h2>
                  <span>Quatre façons de pratiquer</span>
                </div>
                <div className="student-skill-grid">
                  {skills.map((item) => (
                    <Card key={item.id}>
                      <SkillIcon id={item.id} />
                      <h3>{item.title}</h3>
                      <p>{item.detail}</p>
                      <ActivityPreview label={item.title} id={item.id} />
                    </Card>
                  ))}
                </div>
              </section>
              <div className="student-next-grid" id="programme">
                <section
                  aria-labelledby="recommendation-title"
                  className="student-panel"
                >
                  <p className="eyebrow">Votre prochaine étape</p>
                  <h2 id="recommendation-title">
                    {example
                      ? "Prendre le temps d’écouter"
                      : "Un bon point de départ"}
                  </h2>
                  <p>
                    {example
                      ? "Exemple : comprendre l’intention d’une courte annonce et relire ses indices."
                      : "Choisissez une compétence pour découvrir l’organisation des activités. Vous pourrez ensuite construire votre rythme de pratique."}
                  </p>
                  {example ? (
                    <ActivityPreview label="Activité recommandée — exemple" />
                  ) : (
                    <a className="button button-primary" href="#competences">
                      Choisir une compétence
                    </a>
                  )}
                  <small>
                    Les activités réelles ne sont pas encore ouvertes.
                  </small>
                </section>
                <section
                  className="student-panel"
                  aria-labelledby="resume-title"
                >
                  <p className="eyebrow">Continuer</p>
                  <h2 id="resume-title">Reprendre une activité</h2>
                  {example ? (
                    <>
                      <p>
                        Comprendre une annonce · Exemple de séance interrompue.
                      </p>
                      <Dialog
                        className="human-pilot"
                        title="Reprise d’une activité — exemple"
                        description="Aucune séance réelle n’est enregistrée."
                        trigger={
                          <Button variant="secondary">
                            Voir l’exemple de reprise
                          </Button>
                        }
                      >
                        <p>
                          Le futur parcours permettra de retrouver les consignes
                          et les réponses enregistrées. Cet aperçu n’effectue
                          aucune sauvegarde.
                        </p>
                      </Dialog>
                    </>
                  ) : (
                    <EmptyState title="Votre première séance est à venir.">
                      Une activité commencée apparaîtra ici. Pour l’instant,
                      explorez les compétences.
                    </EmptyState>
                  )}
                </section>
              </div>
              <section
                className="student-panel"
                aria-labelledby="history-title"
              >
                <div className="student-section-heading">
                  <h2 id="history-title">Historique récent</h2>
                  {example && <span>Données fictives</span>}
                </div>
                {example ? (
                  <div
                    className="table-scroll"
                    tabIndex={0}
                    role="region"
                    aria-label="Historique des activités de démonstration"
                  >
                    <table>
                      <caption>
                        Activités de démonstration — aucun résultat personnel
                      </caption>
                      <thead>
                        <tr>
                          <th scope="col">Activité</th>
                          <th scope="col">Compétence</th>
                          <th scope="col">État illustratif</th>
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          <th scope="row">Repérer une information</th>
                          <td>Compréhension écrite</td>
                          <td>Terminée</td>
                        </tr>
                        <tr>
                          <th scope="row">Comprendre une annonce</th>
                          <td>Compréhension orale</td>
                          <td>À reprendre</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="student-history-empty">
                    Pas d’historique à afficher. Vos activités pourront être
                    retrouvées ici lorsque le parcours sera disponible.
                  </p>
                )}
              </section>
            </>
          )}
        </main>
      </div>
      <footer className="student-footer">
        © {new Date().getFullYear()} Fluentia · {brand.owner}
        <span>Pilote de présentation · Aucun score officiel</span>
      </footer>
    </div>
  );
}

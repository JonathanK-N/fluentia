/** Vitrine du socle frontend ; aucun parcours d’examen simulé. Propriétaire : Jonathan Kakesa. */
import Image from "next/image";
import Link from "next/link";
import { brand, competencies } from "../lib/brand";
import { Card, Badge } from "../components/ui/primitives";
import { Reveal } from "../components/animations/reveal";
export default function Home() {
  return (
    <main id="contenu">
      <section className="hero">
        <div className="container hero-grid">
          <div>
            <p className="eyebrow">
              <span className="status-dot" /> LE FRANÇAIS OUVRE DES PORTES
            </p>
            <h1>
              Votre voix.
              <br />
              Votre avenir.
              <br />
              <span>Sans limites.</span>
            </h1>
            <p className="lead">
              {brand.slogan} Une préparation au TCF pensée pour votre projet au
              Québec, à votre rythme.
            </p>
            <div className="actions">
              <a className="button button-primary" href="#modules">
                Découvrir les compétences <span aria-hidden="true">↗</span>
              </a>
              <a className="text-link" href="#approche">
                L’approche Fluentia <span aria-hidden="true">↓</span>
              </a>
            </div>
            <p className="hero-note">
              Plateforme en développement · Les entraînements seront disponibles
              ultérieurement.
            </p>
          </div>
          <div className="hero-art" aria-hidden="true">
            <div className="orbit orbit-one" />
            <div className="orbit orbit-two" />
            <div className="voice-core">
              <Image
                src="/branding/01_Logos_PNG/fluentia-symbole-transparent-512.png"
                alt=""
                width={260}
                height={260}
                priority
                unoptimized
              />
            </div>
            <div className="floating-label label-top">Chaque mot compte.</div>
            <div className="floating-label label-bottom">
              <span className="status-dot" /> L’élan d’aller plus loin
            </div>
            <div className="voice-bars">
              {[22, 38, 58, 32, 76, 100, 68, 44, 84, 58, 30, 48, 22].map(
                (h, i) => (
                  <i key={i} style={{ height: `${h}%` }} />
                ),
              )}
            </div>
          </div>
        </div>
        <div className="container hero-foot">
          <span>UNE PRÉPARATION, QUATRE COMPÉTENCES</span>
          <span>Écouter · Lire · Écrire · Parler</span>
        </div>
      </section>
      <section className="section container" id="modules">
        <Reveal>
          <div className="section-heading">
            <div>
              <p className="eyebrow">LES FONDATIONS DE VOTRE RÉUSSITE</p>
              <h2>
                Quatre compétences.
                <br />
                <span>Un nouvel horizon.</span>
              </h2>
            </div>
            <p>
              Un espace cohérent pour préparer chaque dimension du français,
              avec clarté et confiance.
            </p>
          </div>
          <div className="competency-grid">
            {competencies.map((item) => (
              <Card key={item.id} className="competency">
                <div className="card-top">
                  <span>{item.number}</span>
                  <Badge>À venir</Badge>
                </div>
                <h3>{item.title}</h3>
                <p>{item.detail}</p>
                <div className="card-label">
                  {item.label}
                  <span aria-hidden="true">↗</span>
                </div>
              </Card>
            ))}
          </div>
        </Reveal>
      </section>
      <section id="approche" className="approach">
        <div className="container approach-grid">
          <div>
            <p className="eyebrow">PLUS QU’UNE PRÉPARATION</p>
            <h2>
              Une méthode claire.
              <br />
              <span>Votre propre élan.</span>
            </h2>
            <p className="lead">
              Avancez avec une direction, des objectifs lisibles et une
              expérience qui vous laisse la place d’apprendre.
            </p>
          </div>
          <ol className="steps">
            <li>
              <span>01</span>
              <div>
                <h3>Comprendre votre objectif</h3>
                <p>Faire le point sur les compétences à développer.</p>
              </div>
            </li>
            <li>
              <span>02</span>
              <div>
                <h3>Construire vos habitudes</h3>
                <p>Progresser régulièrement, à votre rythme.</p>
              </div>
            </li>
            <li>
              <span>03</span>
              <div>
                <h3>Prendre confiance</h3>
                <p>Se préparer à communiquer avec assurance.</p>
              </div>
            </li>
          </ol>
        </div>
      </section>
      <section className="section container final-cta">
        <p className="eyebrow">LES PREMIÈRES FONDATIONS SONT LÀ</p>
        <h2>
          Une expérience qui
          <br />
          <span>prend forme.</span>
        </h2>
        <p>
          Explorez les composants et les interactions qui composent Fluentia.
        </p>
        <Link href="/design-system" className="button button-primary">
          Explorer le design system <span aria-hidden="true">↗</span>
        </Link>
      </section>
    </main>
  );
}

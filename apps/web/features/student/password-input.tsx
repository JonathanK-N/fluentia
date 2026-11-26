"use client";
/** Champ mot de passe avec un œil pour afficher ou masquer ce qui est tapé. */
import { useState, type InputHTMLAttributes } from "react";
import { Icon } from "../../components/app-shell/icons";

/** Adresse tapée à la connexion, reprise sur « Mot de passe oublié » (stockage de l’onglet, jamais dans l’URL). */
export const FORGOT_EMAIL = "fluentia-forgot-email";

export function PasswordInput(props: Omit<InputHTMLAttributes<HTMLInputElement>, "type">) {
  const [visible, setVisible] = useState(false);
  return <span className="password-field">
    <input {...props} type={visible ? "text" : "password"} />
    <button type="button" className="password-toggle" aria-pressed={visible} aria-label={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"}
      title={visible ? "Masquer le mot de passe" : "Afficher le mot de passe"} onClick={() => setVisible(!visible)}>
      <Icon name={visible ? "eyeOff" : "eye"} size={18} />
    </button>
  </span>;
}

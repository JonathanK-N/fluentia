/** Primitives sémantiques Fluentia : présentation et états natifs. Propriétaire : Jonathan Kakesa. */
import type {
  ButtonHTMLAttributes,
  HTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
  Ref,
} from "react";
export function Button({
  variant = "primary",
  loading = false,
  children,
  disabled,
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  ref?: Ref<HTMLButtonElement>;
}) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      aria-busy={loading || undefined}
      className={`button button-${variant} ${className}`}
    >
      {loading && <span className="spinner" aria-hidden="true" />}
      {children}
    </button>
  );
}
export function Card({
  className = "",
  ...props
}: HTMLAttributes<HTMLElement>) {
  return <article {...props} className={`card ${className}`} />;
}
export function Badge({ children }: { children: ReactNode }) {
  return <span className="badge">{children}</span>;
}
export function Field({
  label,
  error,
  hint,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  id: string;
  label: string;
  error?: string;
  hint?: string;
}) {
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <input
        {...props}
        id={id}
        aria-invalid={!!error}
        aria-describedby={
          error ? `${id}-error` : hint ? `${id}-hint` : undefined
        }
      />
      {hint && <small id={`${id}-hint`}>{hint}</small>}
      {error && (
        <small className="field-error" id={`${id}-error`} role="alert">
          {error}
        </small>
      )}
    </div>
  );
}
export function Alert({
  title,
  children,
  error = false,
}: {
  title: string;
  children: ReactNode;
  error?: boolean;
}) {
  return (
    <div
      className={`alert ${error ? "alert-error" : ""}`}
      role={error ? "alert" : "status"}
    >
      <strong>{title}</strong>
      <p>{children}</p>
    </div>
  );
}
export function Progress({ value, label }: { value: number; label: string }) {
  const safe = Number.isFinite(value) ? Math.min(100, Math.max(0, value)) : 0;
  return (
    <div className="progress-group">
      <div>
        <span>{label}</span>
        <strong>{safe} %</strong>
      </div>
      <progress max={100} value={safe} aria-label={label} />
    </div>
  );
}
export function Skeleton({
  label = "Chargement en cours",
}: {
  label?: string;
}) {
  return (
    <div className="skeleton" role="status">
      <span className="sr-only">{label}</span>
    </div>
  );
}
export function EmptyState({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">◎</span>
      <h3>{title}</h3>
      <p>{children}</p>
    </div>
  );
}
export function DataTable({
  caption,
  rows,
}: {
  caption: string;
  rows: readonly { label: string; status: string }[];
}) {
  return (
    <div className="table-scroll">
      <table>
        <caption>{caption}</caption>
        <thead>
          <tr>
            <th scope="col">Compétence</th>
            <th scope="col">État</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.label}>
              <th scope="row">{row.label}</th>
              <td>{row.status}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
export function BarChart({
  title,
  values,
}: {
  title: string;
  values: readonly { label: string; value: number }[];
}) {
  return (
    <figure className="chart">
      <figcaption>{title}</figcaption>
      {values.map((item) => (
        <Progress key={item.label} label={item.label} value={item.value} />
      ))}
    </figure>
  );
}

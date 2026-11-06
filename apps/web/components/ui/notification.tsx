"use client";
/** Notification locale persistante et refermable. Propriétaire : Jonathan Kakesa. */
import { Button } from "./primitives";
export function Notification({
  message,
  onDismiss,
}: {
  message: string;
  onDismiss: () => void;
}) {
  return (
    <div className="notice" role="status" aria-live="polite" aria-atomic="true">
      {message && (
        <>
          <span>{message}</span>
          <Button
            variant="ghost"
            onClick={onDismiss}
            aria-label="Fermer la notification"
          >
            ×
          </Button>
        </>
      )}
    </div>
  );
}

"use client";
/** Modale Radix : focus piégé, fermeture Échap et restitution du focus. Propriétaire : Jonathan Kakesa. */
import * as DialogPrimitive from "@radix-ui/react-dialog";
import type { ReactNode } from "react";
export function Dialog({
  trigger,
  title,
  description,
  children,
  className = "",
}: {
  trigger: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger asChild>{trigger}</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="dialog-overlay" />
        <DialogPrimitive.Content className={`dialog-content ${className}`}>
          <DialogPrimitive.Title>{title}</DialogPrimitive.Title>
          <DialogPrimitive.Description>
            {description}
          </DialogPrimitive.Description>
          {children}
          <DialogPrimitive.Close className="button button-secondary">
            Fermer
          </DialogPrimitive.Close>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}

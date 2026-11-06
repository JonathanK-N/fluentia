"use client";
/** Onglets Radix : navigation fléchée et panneaux associés. Propriétaire : Jonathan Kakesa. */
import * as TabsPrimitive from "@radix-ui/react-tabs";
import type { ReactNode } from "react";
export function Tabs({
  label,
  items,
}: {
  label: string;
  items: readonly { id: string; label: string; content: ReactNode }[];
}) {
  if (!items.length) return null;
  return (
    <TabsPrimitive.Root defaultValue={items[0].id}>
      <TabsPrimitive.List className="tabs-list" aria-label={label}>
        {items.map((item) => (
          <TabsPrimitive.Trigger key={item.id} value={item.id}>
            {item.label}
          </TabsPrimitive.Trigger>
        ))}
      </TabsPrimitive.List>
      {items.map((item) => (
        <TabsPrimitive.Content
          className="tabs-panel"
          key={item.id}
          value={item.id}
        >
          {item.content}
        </TabsPrimitive.Content>
      ))}
    </TabsPrimitive.Root>
  );
}

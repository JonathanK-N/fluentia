/** Icônes fonctionnelles des compétences. Propriétaire : Jonathan Kakesa. */
export function SkillIcon({ id }: { id: string }) {
  return (
    <svg
      width="28"
      height="28"
      viewBox="0 0 28 28"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {id === "ecoute" ? (
        <>
          <path d="M7 16v-5a7 7 0 0 1 14 0c0 5-5 5-5 9a3 3 0 0 1-6 0" />
          <path d="M11 12a3 3 0 0 1 6 0c0 2-3 2-3 5" />
        </>
      ) : id === "lecture" ? (
        <>
          <path d="M3 5c4-1 8 0 11 2 3-2 7-3 11-2v17c-4-1-8 0-11 2-3-2-7-3-11-2Z" />
          <path d="M14 7v17M7 10l3 1M18 11l3-1M7 15l3 1M18 16l3-1" />
        </>
      ) : id === "parole" ? (
        <>
          <rect x="10" y="3" width="8" height="14" rx="4" />
          <path d="M6 12v2a8 8 0 0 0 16 0v-2M14 22v4M10 26h8" />
        </>
      ) : (
        <>
          <path d="m5 19-1 6 6-1L24 10l-5-5ZM16 8l5 5M5 19l5 5" />
          <path d="M15 25h10" />
        </>
      )}
    </svg>
  );
}

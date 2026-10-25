/** Logos PNG officiels fournis, sans reconstruction. Propriétaire : Jonathan Kakesa. */
import Image from "next/image";
import Link from "next/link";
export function Logo({
  appearance = "auto",
}: {
  appearance?: "auto" | "light" | "dark";
}) {
  return (
    <Link href="/" className="brand" aria-label="Fluentia — accueil">
      {appearance !== "dark" && (
        <Image
          className={appearance === "auto" ? "logo-light" : ""}
          src="/branding/01_Logos_PNG/logo-horizontal-light.png"
          alt="Fluentia"
          width={183}
          height={48}
          priority
          unoptimized
        />
      )}
      {appearance !== "light" && (
        <Image
          className={appearance === "auto" ? "logo-dark" : ""}
          src="/branding/01_Logos_PNG/logo-horizontal-dark.png"
          alt="Fluentia"
          width={183}
          height={48}
          priority
          unoptimized
        />
      )}
    </Link>
  );
}

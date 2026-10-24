/** Logos PNG officiels fournis, sans reconstruction. Propriétaire : Jonathan Kakesa. */
import Image from "next/image";
import Link from "next/link";
export function Logo() {
  return (
    <Link href="/" className="brand" aria-label="Fluentia — accueil">
      <Image
        className="logo-light"
        src="/branding/01_Logos_PNG/logo-horizontal-light.png"
        alt="Fluentia"
        width={183}
        height={48}
        priority
        unoptimized
      />
      <Image
        className="logo-dark"
        src="/branding/01_Logos_PNG/logo-horizontal-dark.png"
        alt="Fluentia"
        width={183}
        height={48}
        priority
        unoptimized
      />
    </Link>
  );
}

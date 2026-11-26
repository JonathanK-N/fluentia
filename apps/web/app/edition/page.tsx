import { redirect } from "next/navigation";
/** V1 : l’espace éditorial commence par l’import des séries ; l’ancienne banque question par question est retirée. */
export default function EditorialHome() { redirect("/edition/import"); }

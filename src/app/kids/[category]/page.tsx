import { redirect } from "next/navigation";

/**
 * The kids section used to have per-category pages.
 * It is now a single landing page focused on the free download.
 * Any old category URL redirects back to /kids.
 */
export default function KidsCategoryRedirect() {
  redirect("/kids");
}
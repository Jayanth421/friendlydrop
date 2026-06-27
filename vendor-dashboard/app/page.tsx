import { redirect } from "next/navigation";

export default function VendorHomePage() {
  // Always redirect to dashboard for vendor app
  redirect("/dashboard");
}
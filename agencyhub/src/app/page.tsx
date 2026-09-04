import { redirect } from "next/navigation";
import { defaultRoute } from "@/lib/features";

export default function Home() {
  redirect(defaultRoute());
}

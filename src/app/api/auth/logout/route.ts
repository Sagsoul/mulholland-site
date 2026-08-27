import { clearAdminSessionResponse } from "@/lib/admin-auth-route";

export async function POST() {
  return clearAdminSessionResponse();
}

import { get } from "./api";

export function fetchDashboard() {
  return get("/dashboard");
}

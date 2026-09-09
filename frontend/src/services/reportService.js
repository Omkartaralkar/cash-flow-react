import { get } from "./api";

export function fetchReports() {
  return get("/reports");
}

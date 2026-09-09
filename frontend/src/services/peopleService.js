import { get } from "./api";

export function fetchPeople() {
  return get("/api/people");
}

export function fetchPerson(name) {
  return get(`/api/people/${encodeURIComponent(name)}`);
}
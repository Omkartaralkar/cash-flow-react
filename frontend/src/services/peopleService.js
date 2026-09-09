import { get } from "./api";

export function fetchPeople() {
  return get("/people");
}

export function fetchPerson(name) {
  return get(`/people/${encodeURIComponent(name)}`);
}

import { get, post } from "./api";

export function fetchSession() {
  return get("/auth/session");
}

export function login(username, password) {
  return post("/auth/login", { username, password });
}

export function signup(username, password) {
  return post("/auth/signup", { username, password });
}

export function logout() {
  return post("/auth/logout");
}

import { get, post, put, del } from "./api";

export function fetchTransactions(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters || {}).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, String(value).trim());
    }
  });

  const qs = params.toString();
  return get(`/api/transactions${qs ? `?${qs}` : ""}`);
}

export function fetchTransaction(id) {
  return get(`/api/transactions/${id}`);
}

export function addTransaction(payload) {
  return post("/api/transactions", payload);
}

export function updateTransaction(id, payload) {
  return put(`/api/transactions/${id}`, payload);
}

export function deleteTransaction(id) {
  return del(`/api/transactions/${id}`);
}
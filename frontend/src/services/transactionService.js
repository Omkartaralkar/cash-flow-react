import { get, post, put, del } from "./api";

export function fetchTransactions(filters = {}) {
  const params = new URLSearchParams();

  Object.entries(filters).forEach(([key, value]) => {
    if (value) params.set(key, value);
  });

  const qs = params.toString();
  return get(`/transactions${qs ? `?${qs}` : ""}`);
}

export function fetchTransaction(id) {
  return get(`/transactions/${id}`);
}

export function addTransaction(payload) {
  return post("/transactions", payload);
}

export function updateTransaction(id, payload) {
  return put(`/transactions/${id}`, payload);
}

export function deleteTransaction(id) {
  return del(`/transactions/${id}`);
}

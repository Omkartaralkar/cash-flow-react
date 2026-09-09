const BASE = import.meta.env.VITE_API_URL || "";

async function parseBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    if (text.trim().startsWith("<")) {
      throw new Error("API route returned HTML instead of JSON. Ensure endpoint starts with /api/.");
    }
    return null;
  }
}

async function request(path, options = {}) {
  const res = await fetch(BASE + path, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
    ...options,
  });

  const data = await parseBody(res);

  if (!res.ok) {
    const message = (data && data.error) || `Request failed with status ${res.status}`;
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}

export function get(path) {
  return request(path);
}

export function post(path, body) {
  return request(path, { method: "POST", body: JSON.stringify(body || {}) });
}

export function put(path, body) {
  return request(path, { method: "PUT", body: JSON.stringify(body || {}) });
}

export function del(path) {
  return request(path, { method: "DELETE" });
}

export async function upload(path, formData) {
  const res = await fetch(BASE + path, {
    method: "POST",
    credentials: "include",
    body: formData,
  });

  const data = await parseBody(res);

  if (!res.ok) {
    const message = (data && data.error) || "Upload failed.";
    const error = new Error(message);
    error.status = res.status;
    throw error;
  }

  return data;
}
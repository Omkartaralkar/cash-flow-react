const BASE = import.meta.env.VITE_API_URL || "";

async function parseBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    // If the server returned HTML (Vercel rewrite fallback), throw instead of returning null
    if (text.trim().startsWith("<")) {
      throw new Error("API endpoint not found; received HTML instead of JSON.");
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

export const get = (path) => request(path);
export const post = (path, body) => request(path, { method: "POST", body: JSON.stringify(body || {}) });
export const put = (path, body) => request(path, { method: "PUT", body: JSON.stringify(body || {}) });
export const del = (path) => request(path, { method: "DELETE" });
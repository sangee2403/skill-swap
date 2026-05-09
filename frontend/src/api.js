const BASE = "http://localhost:5000/api";

export const api = async (path, opts = {}) => {
  const token = localStorage.getItem("token");
  const res = await fetch(`${BASE}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(token ? { "x-auth-token": token } : {}),
    },
    ...opts,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.msg || data.error || "Request failed");
  return data;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "/api";

type RequestOptions = {
  method?: string;
  body?: unknown;
  headers?: Record<string, string>;
};

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: options.method || "GET",
      headers: {
        "Content-Type": "application/json",
        ...(options.headers || {}),
      },
      credentials: "include",
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    });
  } catch {
    throw new Error("Server unavailable. Check backend is running and API proxy/CORS is configured.");
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const message = payload?.error || payload?.message || "Request failed";
    throw new Error(message);
  }

  return payload as T;
}

export { API_BASE_URL };

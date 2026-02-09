async function apiClient<T = unknown>(
  url: string,
  options?: RequestInit
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;

  const headers: HeadersInit = {
    "Content-Type": "application/json",
    ...(options?.headers as Record<string, string>),
  };

  if (token) {
    (headers as Record<string, string>)["Authorization"] = `Bearer ${token}`;
  }

  const res = await fetch(url, {
    ...options,
    headers,
  });

  if (!res.ok) {
    const error = await res.json().catch(() => ({ error: "요청 실패" }));
    throw new Error(error.error || `HTTP ${res.status}`);
  }

  return res.json();
}

export const api = {
  get<T = unknown>(url: string): Promise<T> {
    return apiClient<T>(url, { method: "GET" });
  },

  post<T = unknown>(url: string, body?: unknown): Promise<T> {
    return apiClient<T>(url, {
      method: "POST",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  put<T = unknown>(url: string, body?: unknown): Promise<T> {
    return apiClient<T>(url, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    });
  },

  delete<T = unknown>(url: string): Promise<T> {
    return apiClient<T>(url, { method: "DELETE" });
  },
};

export default apiClient;

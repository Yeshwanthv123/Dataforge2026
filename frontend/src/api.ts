export const PUBLIC_DEMO = import.meta.env.VITE_PUBLIC_DEMO === "true";

export async function api<T>(
  path: string,
  method = "GET",
  body?: unknown,
  signal?: AbortSignal,
): Promise<T> {
  if (PUBLIC_DEMO) {
    const { publicApi } = await import("./publicApi");
    return publicApi<T>(path, method, body, signal);
  }
  const response = await fetch("/api" + path, {
    method,
    credentials: "include",
    headers: body ? { "Content-Type": "application/json" } : {},
    body: body ? JSON.stringify(body) : undefined,
    signal,
  });
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const detail = data?.detail;
    throw new Error(
      typeof detail === "string"
        ? detail
        : Array.isArray(detail)
          ? detail.map((v: { msg: string }) => v.msg).join(". ")
          : `Request failed (${response.status}). Please try again.`,
    );
  }
  return data as T;
}

/** Browser-side helper used by every admin screen. */
export class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function adminFetch<T = unknown>(
  url: string,
  init: Omit<RequestInit, "body"> & { json?: unknown; body?: BodyInit | null } = {}
): Promise<T> {
  const { json, body, headers: rawHeaders, ...rest } = init;
  const headers = new Headers(rawHeaders);
  let finalBody: BodyInit | null | undefined = body;
  if (json !== undefined) {
    headers.set("Content-Type", "application/json");
    finalBody = JSON.stringify(json);
  }
  const res = await fetch(url, {
    ...rest,
    headers,
    body: finalBody,
    credentials: "same-origin",
    cache: "no-store",
  });

  if (res.status === 401 && typeof window !== "undefined") {
    window.location.assign("/admin/login");
    throw new ApiError("Session expired", 401);
  }

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const message =
      (data && typeof data === "object" && "error" in data && typeof (data as { error: unknown }).error === "string"
        ? (data as { error: string }).error
        : null) ?? `Request failed (${res.status})`;
    throw new ApiError(message, res.status);
  }
  return data as T;
}

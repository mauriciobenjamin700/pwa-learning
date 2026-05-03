type Body = object | undefined;

async function parseError(response: Response): Promise<string> {
  try {
    const data = (await response.json()) as { detail?: string };
    return data.detail ?? `Erro ${response.status}`;
  } catch {
    return `Erro ${response.status}`;
  }
}

function authHeaders(token?: string): Record<string, string> {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function jsonHeaders(token?: string): Record<string, string> {
  return { "Content-Type": "application/json", ...authHeaders(token) };
}

export default class RequestHandler {
  static async get<T>(url: string, token?: string): Promise<T> {
    const res = await fetch(url, { headers: jsonHeaders(token) });
    if (!res.ok) throw await parseError(res);
    return res.json() as Promise<T>;
  }

  static async post<T>(url: string, body?: Body, token?: string): Promise<T> {
    const res = await fetch(url, {
      method: "POST",
      headers: jsonHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw await parseError(res);
    return res.json() as Promise<T>;
  }

  static async put<T>(url: string, body?: Body, token?: string): Promise<T> {
    const res = await fetch(url, {
      method: "PUT",
      headers: jsonHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw await parseError(res);
    return res.json() as Promise<T>;
  }

  static async patch<T>(url: string, body?: Body, token?: string): Promise<T> {
    const res = await fetch(url, {
      method: "PATCH",
      headers: jsonHeaders(token),
      body: body ? JSON.stringify(body) : undefined,
    });
    if (!res.ok) throw await parseError(res);
    return res.json() as Promise<T>;
  }

  static async delete<T>(url: string, token?: string): Promise<T> {
    const res = await fetch(url, {
      method: "DELETE",
      headers: jsonHeaders(token),
    });
    if (!res.ok) throw await parseError(res);
    return res.json() as Promise<T>;
  }

  static async getStream(
    url: string,
    token?: string,
    options?: { signal?: AbortSignal },
  ): Promise<ReadableStream<Uint8Array>> {
    const res = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "text/event-stream",
        "Cache-Control": "no-cache",
        ...authHeaders(token),
      },
      signal: options?.signal,
    });
    if (!res.ok || !res.body) {
      throw new Error(`SSE: status ${res.status}`);
    }
    return res.body;
  }
}

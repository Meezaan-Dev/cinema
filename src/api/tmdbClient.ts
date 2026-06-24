import { z } from "zod";

import { AppError, type AppErrorCode } from "@/lib/errors";

export class TmdbError extends AppError {
  constructor(code: AppErrorCode, message: string, status?: number) {
    super(code, message, status);
    this.name = "TmdbError";
  }
}

function isProxyError(
  body: unknown,
): body is { error: { message: string; code: string; status: number } } {
  return typeof body === "object" && body !== null && "error" in body;
}

function isProxySuccess<T>(body: unknown): body is { data: T } {
  return typeof body === "object" && body !== null && "data" in body;
}

export async function tmdbRequest<T>(
  endpoint: string,
  params: Record<string, string | number | boolean | undefined> = {},
  schema: z.ZodType<T>,
): Promise<T> {
  const cleanParams: Record<string, string> = {};
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== "") {
      cleanParams[key] = String(value);
    }
  });

  let response: Response;
  try {
    response = await fetch("/api/tmdb", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ endpoint, params: cleanParams }),
    });
  } catch {
    throw new TmdbError("network", "The app could not reach the server API.");
  }

  let body: unknown;
  try {
    body = await response.json();
  } catch {
    throw new TmdbError(
      "invalid-json",
      "The server returned an invalid response.",
    );
  }

  if (isProxyError(body)) {
    const { message, code, status } = body.error;
    throw new TmdbError(code as AppErrorCode, message, status);
  }

  if (!isProxySuccess<T>(body) || body.data === undefined) {
    throw new TmdbError(
      "invalid-data",
      "The server returned an unexpected response shape.",
    );
  }

  const json = body.data;

  const parsed = schema.safeParse(json);
  if (!parsed.success) {
    console.warn("TMDB response validation failed", {
      endpoint,
      issues: parsed.error.issues,
    });
    throw new TmdbError(
      "invalid-data",
      "TMDB returned data in an unexpected format.",
    );
  }

  return parsed.data;
}

import { type ApiRequest, type ApiResponse } from "./serverUtils.js";
import { isBlockedCrawlerUserAgent } from "./crawlerGuards.js";

function env(name: string): string | undefined {
  const proc = (globalThis as Record<string, unknown>).process;
  if (
    typeof proc === "object" &&
    proc !== null &&
    typeof (proc as Record<string, unknown>).env === "object"
  ) {
    return ((proc as Record<string, unknown>).env as Record<string, string | undefined>)[name];
  }
  return undefined;
}

const ENDPOINT_PATTERNS = [
  /^\/trending\/(movie|all)\/week$/,
  /^\/movie\/(popular|now_playing|top_rated|upcoming)$/,
  /^\/tv\/(popular|on_the_air|top_rated)$/,
  /^\/search\/(movie|tv|person)$/,
  /^\/discover\/(movie|tv)$/,
  /^\/genre\/(movie|tv)\/list$/,
  /^\/movie\/\d+\/(credits|videos|recommendations)$/,
  /^\/tv\/\d+\/(credits|videos|recommendations|external_ids)$/,
  /^\/movie\/\d+$/,
  /^\/tv\/\d+$/,
  /^\/person\/\d+$/,
  /^\/person\/\d+\/combined_credits$/,
];

const MAX_PAGE = 500;
const MAX_QUERY_LENGTH = 200;

const DISALLOWED_PARAM_PATTERN = /[<>&"']/;

const SAFE_PARAM_KEYS = new Set([
  "append_to_response",
  "query",
  "include_adult",
  "page",
  "primary_release_year",
  "first_air_date_year",
  "with_genres",
  "vote_average.gte",
  "sort_by",
  "with_runtime.lte",
  "language",
  "region",
]);

const SAFE_APPEND_TO_RESPONSE_VALUES = new Set([
  "credits",
  "videos",
  "recommendations",
  "external_ids",
]);

export function isValidEndpoint(endpoint: string): boolean {
  return ENDPOINT_PATTERNS.some((pattern) => pattern.test(endpoint));
}

export function validateParams(
  params: Record<string, unknown>,
): Record<string, string> | null {
  const valid: Record<string, string> = {};

  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === "" || value === null) continue;

    if (!SAFE_PARAM_KEYS.has(key)) return null;

    const str = String(value);
    if (DISALLOWED_PARAM_PATTERN.test(str)) return null;

    if (key === "page") {
      const page = Number(str);
      if (!Number.isInteger(page) || page < 1 || page > MAX_PAGE) return null;
    }

    if (key === "query") {
      valid[key] = str.slice(0, MAX_QUERY_LENGTH);
      continue;
    }

    if (key === "append_to_response") {
      const values = str.split(",");
      if (
        values.length === 0 ||
        values.some((value) => !SAFE_APPEND_TO_RESPONSE_VALUES.has(value))
      ) {
        return null;
      }
    }

    if (key === "include_adult") {
      if (str !== "true" && str !== "false") return null;
    }

    if (key === "sort_by") {
      if (!/^[a-z_]+\.[a-z]+$/.test(str)) return null;
    }

    valid[key] = str;
  }

  return valid;
}

function requestHeader(req: ApiRequest, name: string) {
  const value = req.headers?.[name] ?? req.headers?.[name.toLowerCase()];
  return Array.isArray(value) ? value.join(" ") : value;
}

function getRequestSearchParams(req: ApiRequest) {
  const rawUrl = req.url ?? "";
  if (rawUrl.startsWith("?")) return new URLSearchParams(rawUrl.slice(1));

  try {
    return new URL(rawUrl || "/", "http://absolute-cinema.local").searchParams;
  } catch {
    return new URLSearchParams();
  }
}

function paramsFromSearch(searchParams: URLSearchParams) {
  const endpoint = searchParams.get("endpoint");
  const params: Record<string, string> = {};

  for (const [key, value] of searchParams.entries()) {
    if (key === "endpoint") continue;
    params[key] = value;
  }

  return { endpoint, params };
}

function cachePolicyForEndpoint(endpoint: string) {
  if (/^\/genre\/(movie|tv)\/list$/.test(endpoint)) {
    return { maxAge: 86_400, staleWhileRevalidate: 604_800 };
  }

  if (/^\/(movie|tv|person)\/\d+$/.test(endpoint)) {
    return { maxAge: 21_600, staleWhileRevalidate: 86_400 };
  }

  if (
    /^\/(movie|tv)\/\d+\/(credits|videos|recommendations|external_ids)$/.test(
      endpoint,
    ) ||
    /^\/person\/\d+\/combined_credits$/.test(endpoint)
  ) {
    return { maxAge: 21_600, staleWhileRevalidate: 86_400 };
  }

  if (
    /^\/trending\/(movie|all)\/week$/.test(endpoint) ||
    /^\/(movie|tv)\/(popular|now_playing|top_rated|upcoming|on_the_air)$/.test(
      endpoint,
    ) ||
    /^\/discover\/(movie|tv)$/.test(endpoint)
  ) {
    return { maxAge: 900, staleWhileRevalidate: 3_600 };
  }

  if (/^\/search\/(movie|tv|person)$/.test(endpoint)) {
    return { maxAge: 60, staleWhileRevalidate: 300 };
  }

  return { maxAge: 300, staleWhileRevalidate: 900 };
}

function setCacheHeaders(res: ApiResponse, endpoint: string) {
  const { maxAge, staleWhileRevalidate } = cachePolicyForEndpoint(endpoint);
  res.setHeader("Cache-Control", "public, max-age=0, must-revalidate");
  res.setHeader(
    "Vercel-CDN-Cache-Control",
    `public, max-age=${maxAge}, stale-while-revalidate=${staleWhileRevalidate}`,
  );
}

function setUncachedHeaders(res: ApiResponse) {
  res.setHeader("Cache-Control", "no-store");
}

type TmdbErrorResponse = {
  error: { message: string; code: string; status: number };
};

type TmdbSuccessResponse = {
  data: unknown;
};

function errorResponse(
  message: string,
  code: string,
  status: number,
): TmdbErrorResponse {
  return { error: { message, code, status } };
}

export default async function handler(req: ApiRequest, res: ApiResponse) {
  if (isBlockedCrawlerUserAgent(requestHeader(req, "user-agent"))) {
    setUncachedHeaders(res);
    res
      .status(403)
      .json(errorResponse("Crawler is not allowed.", "blocked-crawler", 403));
    return;
  }

  if (req.method !== "GET") {
    setUncachedHeaders(res);
    res.status(405).json(errorResponse("Method not allowed", "method", 405));
    return;
  }

  const apiKey = env("TMDB_API_KEY");
  const baseUrl = (env("TMDB_BASE_URL") || "https://api.themoviedb.org/3").replace(
    /\/+$/,
    "",
  );

  if (!apiKey) {
    setUncachedHeaders(res);
    console.error(
      "TMDB proxy: Missing TMDB_API_KEY server environment variable.",
    );
    res
      .status(501)
      .json(
        errorResponse(
          "TMDB is not configured on the server.",
          "configuration",
          501,
        ),
      );
    return;
  }

  const { endpoint, params = {} } = paramsFromSearch(getRequestSearchParams(req));

  if (
    typeof endpoint !== "string" ||
    !endpoint.startsWith("/") ||
    !isValidEndpoint(endpoint)
  ) {
    setUncachedHeaders(res);
    res
      .status(400)
      .json(errorResponse("Invalid TMDB endpoint.", "invalid-endpoint", 400));
    return;
  }

  const safeParams = validateParams(params);
  if (!safeParams) {
    setUncachedHeaders(res);
    res
      .status(400)
      .json(
        errorResponse("Invalid request parameters.", "invalid-params", 400),
      );
    return;
  }

  const url = new URL(`${baseUrl}${endpoint}`);
  url.searchParams.set("api_key", apiKey);

  for (const [key, value] of Object.entries(safeParams)) {
    url.searchParams.set(key, value);
  }

  let tmdbResponse: Response;
  try {
    tmdbResponse = await fetch(url.toString());
  } catch (err) {
    setUncachedHeaders(res);
    console.error("TMDB proxy: Network error", {
      endpoint,
      error: String(err),
    });
    res
      .status(502)
      .json(errorResponse("The app could not reach TMDB.", "network", 502));
    return;
  }

  if (!tmdbResponse.ok) {
    setUncachedHeaders(res);
    const errorCode =
      tmdbResponse.status === 401 || tmdbResponse.status === 403
        ? "auth"
        : tmdbResponse.status === 404
          ? "not-found"
          : tmdbResponse.status === 429
            ? "rate-limit"
            : "http";

    console.error("TMDB proxy: Request failed", {
      endpoint,
      status: tmdbResponse.status,
      code: errorCode,
      statusText: tmdbResponse.statusText,
    });

    const userMessage =
      errorCode === "auth"
        ? "TMDB rejected the API key."
        : errorCode === "not-found"
          ? "The requested resource was not found."
          : errorCode === "rate-limit"
            ? "TMDB rate limit reached. Wait a moment and try again."
            : "TMDB returned an error.";

    res
      .status(tmdbResponse.status)
      .json(errorResponse(userMessage, errorCode, tmdbResponse.status));
    return;
  }

  let json: unknown;
  try {
    json = await tmdbResponse.json();
  } catch {
    setUncachedHeaders(res);
    console.error("TMDB proxy: Invalid JSON response", { endpoint });
    res
      .status(502)
      .json(errorResponse("TMDB returned invalid data.", "invalid-data", 502));
    return;
  }

  const successResponse: TmdbSuccessResponse = { data: json };
  setCacheHeaders(res, endpoint);
  res.status(200).json(successResponse);
}

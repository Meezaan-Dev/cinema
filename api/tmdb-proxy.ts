import {
  parseJsonRequestBody,
  type ApiRequest,
  type ApiResponse,
} from "./serverUtils.js";

const ENDPOINT_PATTERNS = [
  /^\/trending\/(movie|all)\/week$/,
  /^\/movie\/(popular|now_playing|top_rated|upcoming)$/,
  /^\/tv\/(popular|on_the_air|top_rated)$/,
  /^\/search\/(movie|tv)$/,
  /^\/discover\/(movie|tv)$/,
  /^\/genre\/(movie|tv)\/list$/,
  /^\/movie\/\d+\/(credits|videos|recommendations)$/,
  /^\/tv\/\d+\/(credits|videos|recommendations|external_ids)$/,
  /^\/movie\/\d+$/,
  /^\/tv\/\d+$/,
];

const MAX_PAGE = 500;
const MAX_QUERY_LENGTH = 200;

const DISALLOWED_PARAM_PATTERN = /[<>&"']/;

const SAFE_PARAM_KEYS = new Set([
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
  res.setHeader("Cache-Control", "no-store");

  if (req.method !== "POST") {
    res.status(405).json(errorResponse("Method not allowed", "method", 405));
    return;
  }

  const apiKey = process.env.TMDB_API_KEY;
  const baseUrl = (
    process.env.TMDB_BASE_URL || "https://api.themoviedb.org/3"
  ).replace(/\/+$/, "");

  if (!apiKey) {
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

  const parsed = parseJsonRequestBody<{
    endpoint?: unknown;
    params?: Record<string, unknown>;
  }>(req.body);
  if (!parsed.ok) {
    res
      .status(parsed.status)
      .json(errorResponse(parsed.error, "invalid-request", parsed.status));
    return;
  }

  const { endpoint, params = {} } = parsed.data;

  if (
    typeof endpoint !== "string" ||
    !endpoint.startsWith("/") ||
    !isValidEndpoint(endpoint)
  ) {
    res
      .status(400)
      .json(errorResponse("Invalid TMDB endpoint.", "invalid-endpoint", 400));
    return;
  }

  const safeParams = validateParams(params);
  if (!safeParams) {
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
    console.error("TMDB proxy: Invalid JSON response", { endpoint });
    res
      .status(502)
      .json(errorResponse("TMDB returned invalid data.", "invalid-data", 502));
    return;
  }

  const successResponse: TmdbSuccessResponse = { data: json };
  res.status(200).json(successResponse);
}

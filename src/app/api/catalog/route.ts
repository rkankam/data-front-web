import { authorizeB2, getB2Config, getDownloadAuthorization } from "@/lib/api/b2";
import { getCorsHeaders } from "@/lib/api/cors";
import { toApiError } from "@/lib/api/errors";
import { fetchWithRetry } from "@/lib/api/http";
import { logEvent } from "@/lib/observability/logger";
import { fail, ok } from "@/lib/api/response";
import { catalogQuerySchema } from "@/lib/api/validation";
import { catalogFullSchema, catalogLiteSchema } from "@/lib/contracts";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const originalOrigin = request.headers.get("origin") ?? "*";
  try {
    const { searchParams } = new URL(request.url);
    const parsed = catalogQuerySchema.safeParse({
      file: searchParams.get("file") ?? undefined,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid query params";
      const status = firstError === "File not allowed" ? 403 : 400;
      return fail(status, firstError, originalOrigin);
    }

    const { file: fileName } = parsed.data;
    logEvent("info", "catalog_requested", { fileName });

    const { keyId, appKey, bucketId, bucketName } = getB2Config();
    const auth = await authorizeB2(keyId, appKey);

    const downloadAuth = await getDownloadAuthorization(
      auth.apiUrl,
      auth.authorizationToken,
      bucketId,
      fileName,
      300
    );

    const signedUrl = `${auth.downloadUrl}/file/${bucketName}/${fileName}?Authorization=${downloadAuth.authorizationToken}`;
    const catalogResponse = await fetchWithRetry(signedUrl, {}, { retries: 2, timeoutMs: 8_000 });
    if (!catalogResponse.ok) {
      throw new Error(`Catalog fetch failed: ${catalogResponse.status}`);
    }

    const data = await catalogResponse.json();
    const validatedData = fileName.includes("catalog-lite")
      ? catalogLiteSchema.parse(data)
      : catalogFullSchema.parse(data);

    return ok(validatedData, originalOrigin, {
      "Cache-Control": "public, max-age=300, s-maxage=300",
    });
  } catch (error) {
    const apiError = toApiError(error);
    logEvent("error", "catalog_request_failed", { status: apiError.status, message: apiError.message });
    return fail(apiError.status, apiError.message, originalOrigin);
  }
}

export async function OPTIONS(request: Request) {
  const origin = request.headers.get("origin") ?? "*";
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(origin),
  });
}

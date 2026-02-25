import { signUrlSuccessSchema } from "@/lib/contracts";
import { authorizeB2, getB2Config, getDownloadAuthorization } from "@/lib/api/b2";
import { getCorsHeaders } from "@/lib/api/cors";
import { toApiError } from "@/lib/api/errors";
import { logEvent } from "@/lib/observability/logger";
import { fail, ok } from "@/lib/api/response";
import { signQuerySchema } from "@/lib/api/validation";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const originalOrigin = request.headers.get("origin") ?? "*";
  try {
    const { searchParams } = new URL(request.url);
    const parsed = signQuerySchema.safeParse({
      file: searchParams.get("file"),
      expiresIn: searchParams.get("expiresIn") ?? undefined,
    });

    if (!parsed.success) {
      const firstError = parsed.error.issues[0]?.message ?? "Invalid query params";
      const status = firstError === "File not allowed" ? 403 : 400;
      return fail(status, firstError, originalOrigin);
    }

    const { file: fileName, expiresIn } = parsed.data;
    logEvent("info", "b2_sign_requested", { fileName, expiresIn });

    const { keyId, appKey, bucketId, bucketName } = getB2Config();
    const auth = await authorizeB2(keyId, appKey);

    const downloadAuth = await getDownloadAuthorization(
      auth.apiUrl,
      auth.authorizationToken,
      bucketId,
      fileName,
      expiresIn
    );

    const signedUrl = `${auth.downloadUrl}/file/${bucketName}/${fileName}?Authorization=${downloadAuth.authorizationToken}`;

    const payload = signUrlSuccessSchema.parse({ url: signedUrl, expiresIn, file: fileName });

    return ok(payload, originalOrigin);
  } catch (error) {
    const apiError = toApiError(error);
    logEvent("error", "b2_sign_failed", { status: apiError.status, message: apiError.message });
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

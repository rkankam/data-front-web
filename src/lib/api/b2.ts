import { ApiError } from "./errors";
import { fetchJson } from "./http";

type B2AuthResponse = {
  apiUrl: string;
  authorizationToken: string;
  downloadUrl: string;
};

type B2DownloadAuthResponse = {
  authorizationToken: string;
};

const getEnv = (key: string) => {
  const value = process.env[key];
  if (!value) {
    throw new ApiError(500, "MISSING_ENV", `Missing ${key}`);
  }
  return value;
};

const toBasicAuth = (id: string, key: string) => {
  const token = Buffer.from(`${id}:${key}`, "utf-8").toString("base64");
  return `Basic ${token}`;
};

export const getB2Config = () => ({
  keyId: getEnv("B2_KEY_ID"),
  appKey: getEnv("B2_APPLICATION_KEY"),
  bucketId: getEnv("B2_BUCKET_ID"),
  bucketName: getEnv("B2_BUCKET_NAME"),
});

export const authorizeB2 = async (keyId: string, appKey: string) => {
  return fetchJson<B2AuthResponse>(
    "https://api.backblazeb2.com/b2api/v2/b2_authorize_account",
    {
      headers: {
        Authorization: toBasicAuth(keyId, appKey),
      },
    }
  );
};

export const getDownloadAuthorization = async (
  apiUrl: string,
  authorizationToken: string,
  bucketId: string,
  fileNamePrefix: string,
  validDurationInSeconds: number
) => {
  return fetchJson<B2DownloadAuthResponse>(
    `${apiUrl}/b2api/v2/b2_get_download_authorization`,
    {
      method: "POST",
      headers: {
        Authorization: authorizationToken,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        bucketId,
        fileNamePrefix,
        validDurationInSeconds,
      }),
    }
  );
};

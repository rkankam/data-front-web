import { beforeEach, describe, expect, it, vi } from "vitest";

import catalogLiteInvalid from "../fixtures/catalog-lite.invalid.json";
import catalogLiteValid from "../fixtures/catalog-lite.valid.json";
import { GET } from "../../src/app/api/catalog/route";

const mockEnv = () => {
  process.env.B2_KEY_ID = "key-id";
  process.env.B2_APPLICATION_KEY = "app-key";
  process.env.B2_BUCKET_ID = "bucket-id";
  process.env.B2_BUCKET_NAME = "bucket-name";
};

const jsonResponse = (payload: unknown, status = 200) =>
  new Response(JSON.stringify(payload), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("GET /api/catalog", () => {
  beforeEach(() => {
    mockEnv();
    vi.restoreAllMocks();
  });

  it("returns 403 when file is outside index/", async () => {
    const response = await GET(new Request("http://localhost/api/catalog?file=audio/track.mp3"));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({ error: "File not allowed" });
  });

  it("returns validated catalog on success", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          apiUrl: "https://api.example.com",
          authorizationToken: "auth-token",
          downloadUrl: "https://download.example.com",
        })
      )
      .mockResolvedValueOnce(jsonResponse({ authorizationToken: "download-token" }))
      .mockResolvedValueOnce(jsonResponse(catalogLiteValid));

    const response = await GET(new Request("http://localhost/api/catalog?file=index/catalog-lite.json"));
    const payload = await response.json();

    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(response.status).toBe(200);
    expect(payload).toEqual(catalogLiteValid);
  });

  it("returns 500 when upstream catalog fetch fails", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          apiUrl: "https://api.example.com",
          authorizationToken: "auth-token",
          downloadUrl: "https://download.example.com",
        })
      )
      .mockResolvedValueOnce(jsonResponse({ authorizationToken: "download-token" }))
      .mockResolvedValueOnce(jsonResponse({ error: "bad" }, 500));

    const response = await GET(new Request("http://localhost/api/catalog?file=index/catalog-lite.json"));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Internal server error" });
  });

  it("returns 500 when catalog payload is invalid", async () => {
    vi.spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          apiUrl: "https://api.example.com",
          authorizationToken: "auth-token",
          downloadUrl: "https://download.example.com",
        })
      )
      .mockResolvedValueOnce(jsonResponse({ authorizationToken: "download-token" }))
      .mockResolvedValueOnce(jsonResponse(catalogLiteInvalid));

    const response = await GET(new Request("http://localhost/api/catalog?file=index/catalog-lite.json"));
    const payload = await response.json();

    expect(response.status).toBe(500);
    expect(payload).toEqual({ error: "Internal server error" });
  });
});

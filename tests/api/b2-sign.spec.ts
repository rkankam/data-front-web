import { beforeEach, describe, expect, it, vi } from "vitest";

import { GET } from "../../src/app/api/b2/sign/route";

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

describe("GET /api/b2/sign", () => {
  beforeEach(() => {
    mockEnv();
    vi.restoreAllMocks();
  });

  it("returns 400 when file query param is missing", async () => {
    const response = await GET(new Request("http://localhost/api/b2/sign"));
    const payload = await response.json();

    expect(response.status).toBe(400);
    expect(payload.error).toContain("Invalid input");
  });

  it("returns 403 when file prefix is not allowed", async () => {
    const response = await GET(new Request("http://localhost/api/b2/sign?file=private/data.mp3"));
    const payload = await response.json();

    expect(response.status).toBe(403);
    expect(payload).toEqual({ error: "File not allowed" });
  });

  it("returns signed URL payload on success", async () => {
    const fetchMock = vi
      .spyOn(globalThis, "fetch")
      .mockResolvedValueOnce(
        jsonResponse({
          apiUrl: "https://api.example.com",
          authorizationToken: "auth-token",
          downloadUrl: "https://download.example.com",
        })
      )
      .mockResolvedValueOnce(jsonResponse({ authorizationToken: "download-token" }));

    const response = await GET(
      new Request("http://localhost/api/b2/sign?file=mp3/track.mp3&expiresIn=300")
    );
    const payload = await response.json();

    expect(fetchMock).toHaveBeenCalledTimes(2);
    expect(response.status).toBe(200);
    expect(payload).toEqual({
      url: "https://download.example.com/file/bucket-name/mp3/track.mp3?Authorization=download-token",
      expiresIn: 300,
      file: "mp3/track.mp3",
    });
  });

  it("returns 502 when upstream authorization fails", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      jsonResponse({ message: "upstream failed" }, 500)
    );

    const response = await GET(new Request("http://localhost/api/b2/sign?file=mp3/track.mp3"));
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload.error).toContain("Upstream request failed: 500");
  });
});

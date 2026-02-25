import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import nock from "nock";

import { fetchJson, fetchWithRetry } from "../../src/lib/api/http";

describe("HTTP utilities with Nock", () => {
  beforeAll(() => {
    nock.disableNetConnect();
  });

  afterEach(() => {
    nock.cleanAll();
  });

  afterAll(() => {
    nock.enableNetConnect();
  });

  it("retries transient status and succeeds", async () => {
    nock("https://retry.example.com")
      .get("/resource")
      .reply(503, { error: "temp" })
      .get("/resource")
      .reply(200, { ok: true });

    const response = await fetchWithRetry("https://retry.example.com/resource", {}, { retries: 2, timeoutMs: 2000 });
    const payload = await response.json();

    expect(response.status).toBe(200);
    expect(payload).toEqual({ ok: true });
  });

  it("throws on non-2xx fetchJson response", async () => {
    nock("https://retry.example.com")
      .get("/fail")
      .times(3)
      .reply(500, { error: "boom" });

    await expect(
      fetchJson<{ ok: boolean }>("https://retry.example.com/fail", {}, { retries: 2, timeoutMs: 2000 })
    ).rejects.toThrow("Upstream request failed: 500");
  });
});

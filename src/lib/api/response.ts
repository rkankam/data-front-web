import { NextResponse } from "next/server";

import { getCorsHeaders } from "./cors";

export const ok = (data: unknown, origin: string, extraHeaders?: Record<string, string>) => {
  return NextResponse.json(data, {
    headers: {
      ...getCorsHeaders(origin),
      ...(extraHeaders ?? {}),
    },
  });
};

export const fail = (status: number, message: string, origin?: string) => {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: origin ? getCorsHeaders(origin) : undefined,
    }
  );
};

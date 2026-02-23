export interface CalculateRequest {
  a: number;
  b: number;
  operation: string;
}

export interface CalculateResponse {
  result: number;
}

export interface CalculateError {
  error: string;
}

const API_URL = "/calculate";

export async function calculate(
  req: CalculateRequest
): Promise<CalculateResponse> {
  const res = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(req),
  });

  if (!res.ok) {
    const body = (await res.json().catch(() => ({
      error: "Unexpected server error",
    }))) as CalculateError;
    throw new Error(body.error || `Server error: ${res.status}`);
  }

  return res.json() as Promise<CalculateResponse>;
}

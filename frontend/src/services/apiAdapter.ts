/**
 * Base API Adapter
 * Handles network delay simulation and error wrapping.
 * When connecting to FastAPI later, this adapter can be pointed to real Axios/Fetch endpoints.
 */

export interface ApiResponse<T> {
  data: T;
  status: number;
  message?: string;
}

const DEFAULT_DELAY_MS = 250;

export async function mockFetch<T>(data: T, delayMs: number = DEFAULT_DELAY_MS): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delayMs);
  });
}

export async function mockPost<T>(data: T, delayMs: number = 350): Promise<T> {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(data);
    }, delayMs);
  });
}

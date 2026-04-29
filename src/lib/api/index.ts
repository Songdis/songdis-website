/**
 * lib/api/index.ts
 * Always re-exports from auth.mock.ts.
 * The mock itself checks NEXT_PUBLIC_USE_MOCK_AUTH at runtime
 * and delegates to the real auth.ts when the flag is false.
 */
export * from "./auth.mock";
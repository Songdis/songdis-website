/**
 * app/(auth)/layout.tsx
 *
 * Route group layout for all auth pages.
 * The (auth) folder is a Next.js route group — it doesn't affect the URL.
 * Routes will be: /sign-in, /sign-up, /forgot-password, /verify-email, /reset-password
 *
 * This layout renders children directly — the visual shell
 * is handled by <AuthLayout> inside each page, which gives
 * each screen control over heroImage and other per-page props.
 */

export default function AuthGroupLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
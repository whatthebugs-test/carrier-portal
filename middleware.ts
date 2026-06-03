import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: { signIn: "/login" },
});

export const config = {
  // Public: login, next-auth endpoints, ALB health check, shipper-facing tracking.
  matcher: ["/((?!login|api/auth|api/health|api/tracking|tracking|_next/static|_next/image|favicon.ico).*)"],
};

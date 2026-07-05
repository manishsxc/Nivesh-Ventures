import { NextRequest, NextResponse } from "next/server";
import { checkRateLimit } from "@/lib/rate-limit";

export const config = {
  matcher: ["/api/:path*"],
};

export function middleware(req: NextRequest) {
  const ip =
    req.headers.get("x-forwarded-for")?.split(",")[0].trim() ||
    req.headers.get("x-real-ip") ||
    "unknown";

  const pathname = req.nextUrl.pathname;

  // Strict rate limit for auth/login endpoints
  if (pathname.includes("/api/auth/login") || pathname.includes("/api/auth/signin")) {
    const result = checkRateLimit(`login:${ip}`, 5, 900_000);
    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Too many login attempts. Please try again later.", retryAfter: result.retryAfter }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(result.retryAfter || 900),
            "X-RateLimit-Limit": "5",
            "X-RateLimit-Remaining": "0",
            "X-RateLimit-Reset": String(result.resetAt),
          },
        }
      );
    }
  }

  // Heavy admin operations rate limit
  if (pathname.includes("/api/admin/monthly-closing")) {
    const result = checkRateLimit(`heavy:${ip}`, 10, 60_000);
    if (!result.allowed) {
      return new NextResponse(
        JSON.stringify({ error: "Rate limit exceeded for this operation.", retryAfter: result.retryAfter }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": String(result.retryAfter || 60),
            "X-RateLimit-Limit": "10",
            "X-RateLimit-Remaining": "0",
          },
        }
      );
    }
  }

  // General API rate limit per IP
  const result = checkRateLimit(`api:${ip}`, 200, 60_000);
  if (!result.allowed) {
    return new NextResponse(
      JSON.stringify({ error: "Too many requests. Please slow down.", retryAfter: result.retryAfter }),
      {
        status: 429,
        headers: {
          "Content-Type": "application/json",
          "Retry-After": String(result.retryAfter || 60),
          "X-RateLimit-Limit": "200",
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(result.resetAt),
        },
      }
    );
  }

  // Security headers
  const response = NextResponse.next();
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("X-RateLimit-Remaining", String(result.remaining));

  return response;
}

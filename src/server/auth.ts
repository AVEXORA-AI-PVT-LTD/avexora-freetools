import NextAuth, { type NextAuthConfig } from "next-auth";
import { PrismaAdapter } from "@auth/prisma-adapter";
import Google from "next-auth/providers/google";
import Facebook from "next-auth/providers/facebook";
import Resend from "next-auth/providers/resend";
import Nodemailer from "next-auth/providers/nodemailer";
import { prisma } from "@/server/db";

/**
 * Auth.js v5 for Brand Studio (spec 22 §8).
 *
 * Providers are env-gated the same way the AI route gates on
 * ANTHROPIC_API_KEY: an unconfigured provider is simply absent from the
 * sign-in page rather than throwing at boot. `signInMethods` lets the UI
 * render honestly instead of offering a button that cannot work.
 */

export const googleEnabled = Boolean(
  process.env.AUTH_GOOGLE_ID && process.env.AUTH_GOOGLE_SECRET,
);
export const facebookEnabled = Boolean(
  process.env.AUTH_FACEBOOK_ID && process.env.AUTH_FACEBOOK_SECRET,
);
export const resendEnabled = Boolean(process.env.AUTH_RESEND_KEY && process.env.EMAIL_FROM);
export const smtpEnabled = Boolean(process.env.EMAIL_SERVER && process.env.EMAIL_FROM);
export const emailEnabled = resendEnabled || smtpEnabled;
export const authConfigured = googleEnabled || emailEnabled;

/** Cookie the proxy checks for its optimistic redirect. */
export const SESSION_COOKIE =
  process.env.NODE_ENV === "production"
    ? "__Secure-authjs.session-token"
    : "authjs.session-token";

const providers: NextAuthConfig["providers"] = [];

if (googleEnabled) {
  providers.push(
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
    }),
  );
}

if (facebookEnabled) {
  providers.push(
    Facebook({
      clientId: process.env.AUTH_FACEBOOK_ID,
      clientSecret: process.env.AUTH_FACEBOOK_SECRET,
    }),
  );
}

if (resendEnabled) {
  providers.push(
    Resend({
      apiKey: process.env.AUTH_RESEND_KEY,
      from: process.env.EMAIL_FROM,
    }),
  );
} else if (smtpEnabled) {
  providers.push(
    Nodemailer({
      server: process.env.EMAIL_SERVER,
      from: process.env.EMAIL_FROM,
    }),
  );
}

const useSecureCookies = process.env.NODE_ENV === "production";
const cookiePrefix = useSecureCookies ? "__Secure-" : "";

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers,
  session: { strategy: "database" },
  cookies: {
    sessionToken: {
      name: `${cookiePrefix}authjs.session-token`,
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: useSecureCookies,
        // Share cookies across subdomains (e.g. admin.localhost or admin.tools.avexora.in)
        domain: process.env.NODE_ENV === "production" ? ".avexora.in" : ".localhost",
      },
    },
  },
  pages: {
    signIn: "/studio/signin",
    verifyRequest: "/studio/signin/check-email",
    error: "/studio/signin",
  },
  callbacks: {
    session({ session, user }) {
      if (session.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
  events: {
    /**
     * Free-tool → paid attribution (spec 21 §6 phase 0). A visitor who left
     * their email on one of the 120 free tools and later signs up is the whole
     * funnel thesis — record which tool brought them so it is measurable.
     */
    async createUser({ user }) {
      if (!user.email || !user.id) return;
      try {
        const firstLead = await prisma.lead.findFirst({
          where: { email: user.email },
          orderBy: { createdAt: "asc" },
        });
        if (firstLead) {
          await prisma.lead.create({
            data: {
              event: "cta_click",
              email: user.email,
              toolSlug: firstLead.toolSlug,
              category: firstLead.category,
              utmSource: "studio",
              utmMedium: "signup",
              utmCampaign: "free-tool-attribution",
            },
          });
        }
      } catch {
        // Attribution is best-effort — never block a signup on it.
      }
    },
  },
});

/** The signed-in user's id, or null. Use in server components and handlers. */
export async function currentUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

/** Throws if unauthenticated — for route handlers that must have a user. */
export async function requireUserId(): Promise<string> {
  const id = await currentUserId();
  if (!id) throw new Error("UNAUTHENTICATED");
  return id;
}

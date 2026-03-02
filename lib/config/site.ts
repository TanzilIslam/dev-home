export const siteConfig = {
  name: "Dev Home",
  description:
    "Organize your clients, projects, codebases, and links with a clean dashboard built for developers.",
  url: process.env.NEXT_PUBLIC_SITE_URL || "https://dev-home-link.vercel.app",
  locale: "en_US",
  creator: "Dev Home",
} as const;

import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const passwordHash = await hashPassword("password123");

  const user = await prisma.user.upsert({
    where: { email: "demo@devhome.local" },
    update: {},
    create: {
      email: "demo@devhome.local",
      name: "Demo User",
      passwordHash,
    },
  });

  console.log(`Seeded user: ${user.email}`);

  const acmeCorp = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Acme Corp",
      engagementType: "TIME_BASED",
      workingDaysPerWeek: 5,
      workingHoursPerDay: 8,
      notes: "Primary enterprise client. Weekly syncs on Mondays.",
    },
  });

  const stellarLabs = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Stellar Labs",
      engagementType: "PROJECT_BASED",
      notes: "Startup client, project-based engagements.",
    },
  });

  console.log(`Seeded clients: ${acmeCorp.name}, ${stellarLabs.name}`);

  const acmePortal = await prisma.project.create({
    data: {
      clientId: acmeCorp.id,
      name: "Customer Portal",
      description: "Self-service portal for Acme customers.",
      status: "ACTIVE",
    },
  });

  const acmeApi = await prisma.project.create({
    data: {
      clientId: acmeCorp.id,
      name: "Internal API Platform",
      description: "Microservices API platform.",
      status: "ACTIVE",
    },
  });

  const stellarMobile = await prisma.project.create({
    data: {
      clientId: stellarLabs.id,
      name: "Mobile App v2",
      description: "Cross-platform mobile app rewrite.",
      status: "ACTIVE",
    },
  });

  const stellarLegacy = await prisma.project.create({
    data: {
      clientId: stellarLabs.id,
      name: "Legacy Migration",
      description: "Migrating legacy PHP system to Next.js.",
      status: "PAUSED",
    },
  });

  console.log(`Seeded ${4} projects`);

  const portalWeb = await prisma.codebase.create({
    data: {
      projectId: acmePortal.id,
      name: "portal-frontend",
      type: "WEB",
      description: "Next.js frontend for the customer portal.",
    },
  });

  const portalApi = await prisma.codebase.create({
    data: {
      projectId: acmePortal.id,
      name: "portal-api",
      type: "API",
      description: "Express REST API serving the portal.",
    },
  });

  const apiGateway = await prisma.codebase.create({
    data: {
      projectId: acmeApi.id,
      name: "api-gateway",
      type: "API",
      description: "Kong API gateway configuration.",
    },
  });

  const mobileAndroid = await prisma.codebase.create({
    data: {
      projectId: stellarMobile.id,
      name: "stellar-android",
      type: "MOBILE_ANDROID",
      description: "Kotlin Android app.",
    },
  });

  await prisma.codebase.create({
    data: {
      projectId: stellarMobile.id,
      name: "stellar-infra",
      type: "INFRA",
      description: "Terraform infrastructure for mobile backend.",
    },
  });

  console.log(`Seeded ${5} codebases`);

  const linksData = [
    {
      userId: user.id,
      projectId: acmePortal.id,
      codebaseId: portalWeb.id,
      title: "Portal Frontend Repo",
      url: "https://github.com/acme/portal-frontend",
      category: "REPOSITORY" as const,
    },
    {
      userId: user.id,
      projectId: acmePortal.id,
      codebaseId: portalApi.id,
      title: "Portal API Repo",
      url: "https://github.com/acme/portal-api",
      category: "REPOSITORY" as const,
    },
    {
      userId: user.id,
      projectId: acmePortal.id,
      title: "Portal Staging",
      url: "https://staging.portal.acme.com",
      category: "SERVER" as const,
      notes: "Staging environment, deploys on merge to develop.",
    },
    {
      userId: user.id,
      projectId: acmePortal.id,
      title: "Portal Figma Designs",
      url: "https://figma.com/file/acme-portal",
      category: "DESIGN" as const,
    },
    {
      userId: user.id,
      projectId: acmeApi.id,
      codebaseId: apiGateway.id,
      title: "API Gateway Repo",
      url: "https://github.com/acme/api-gateway",
      category: "REPOSITORY" as const,
    },
    {
      userId: user.id,
      projectId: acmeApi.id,
      title: "API Documentation",
      url: "https://docs.api.acme.com",
      category: "DOCUMENTATION" as const,
    },
    {
      userId: user.id,
      projectId: stellarMobile.id,
      codebaseId: mobileAndroid.id,
      title: "Android Repo",
      url: "https://github.com/stellar/android-app",
      category: "REPOSITORY" as const,
    },
    {
      userId: user.id,
      projectId: stellarMobile.id,
      title: "Stellar Slack Channel",
      url: "https://stellar-labs.slack.com/channels/mobile-v2",
      category: "COMMUNICATION" as const,
    },
    {
      userId: user.id,
      projectId: stellarMobile.id,
      title: "Sprint Board",
      url: "https://linear.app/stellar/project/mobile-v2",
      category: "TRACKING" as const,
    },
    {
      userId: user.id,
      projectId: stellarLegacy.id,
      title: "Migration Runbook",
      url: "https://notion.so/stellar/legacy-migration",
      category: "DOCUMENTATION" as const,
      notes: "Step-by-step migration guide.",
    },
  ];

  await prisma.link.createMany({ data: linksData });
  console.log(`Seeded ${linksData.length} links`);

  console.log("Seed complete.");
}

main()
  .catch((e) => {
    console.error("Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

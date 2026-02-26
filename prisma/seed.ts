import "dotenv/config";
import { prisma } from "../lib/prisma";
import { hashPassword } from "../lib/auth/password";

async function main() {
  const existing = await prisma.user.findUnique({
    where: { email: "demo@devhome.local" },
    select: { id: true },
  });

  if (existing) {
    await prisma.user.delete({ where: { id: existing.id } });
    console.log("Cleaned up existing demo user data.");
  }

  const passwordHash = await hashPassword("password123");

  const user = await prisma.user.create({
    data: {
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
      email: "contact@acmecorp.com",
      phone: "+1-555-0100",
      whatsapp: "+1-555-0101",
      address: "123 Enterprise Blvd, Suite 400, San Francisco, CA 94105",
      notes: "Primary enterprise client. Weekly syncs on Mondays.",
    },
  });

  const stellarLabs = await prisma.client.create({
    data: {
      userId: user.id,
      name: "Stellar Labs",
      engagementType: "PROJECT_BASED",
      email: "team@stellarlabs.io",
      phone: "+1-555-0200",
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
      description: "Next.js frontend for the customer portal.",
    },
  });

  const portalApi = await prisma.codebase.create({
    data: {
      projectId: acmePortal.id,
      name: "portal-api",
      description: "Express REST API serving the portal.",
    },
  });

  const apiGateway = await prisma.codebase.create({
    data: {
      projectId: acmeApi.id,
      name: "api-gateway",
      description: "Kong API gateway configuration.",
    },
  });

  const mobileAndroid = await prisma.codebase.create({
    data: {
      projectId: stellarMobile.id,
      name: "stellar-android",
      description: "Kotlin Android app.",
    },
  });

  await prisma.codebase.create({
    data: {
      projectId: stellarMobile.id,
      name: "stellar-infra",
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
    },
    {
      userId: user.id,
      projectId: acmePortal.id,
      codebaseId: portalApi.id,
      title: "Portal API Repo",
      url: "https://github.com/acme/portal-api",
    },
    {
      userId: user.id,
      projectId: acmePortal.id,
      title: "Portal Staging",
      url: "https://staging.portal.acme.com",
    },
    {
      userId: user.id,
      projectId: acmePortal.id,
      title: "Portal Figma Designs",
      url: "https://figma.com/file/acme-portal",
    },
    {
      userId: user.id,
      projectId: acmeApi.id,
      codebaseId: apiGateway.id,
      title: "API Gateway Repo",
      url: "https://github.com/acme/api-gateway",
    },
    {
      userId: user.id,
      projectId: acmeApi.id,
      title: "API Documentation",
      url: "https://docs.api.acme.com",
    },
    {
      userId: user.id,
      projectId: stellarMobile.id,
      codebaseId: mobileAndroid.id,
      title: "Android Repo",
      url: "https://github.com/stellar/android-app",
    },
    {
      userId: user.id,
      projectId: stellarMobile.id,
      title: "Stellar Slack Channel",
      url: "https://stellar-labs.slack.com/channels/mobile-v2",
    },
    {
      userId: user.id,
      projectId: stellarMobile.id,
      title: "Sprint Board",
      url: "https://linear.app/stellar/project/mobile-v2",
    },
    {
      userId: user.id,
      projectId: stellarLegacy.id,
      title: "Migration Runbook",
      url: "https://notion.so/stellar/legacy-migration",
    },
    {
      userId: user.id,
      clientId: acmeCorp.id,
      title: "Acme Corp Website",
      url: "https://www.acmecorp.com",
    },
    {
      userId: user.id,
      clientId: stellarLabs.id,
      title: "Stellar Labs Slack Workspace",
      url: "https://stellar-labs.slack.com",
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

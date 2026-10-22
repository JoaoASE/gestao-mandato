/*
  Warnings:

  - You are about to drop the `Cidadao` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Demanda` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Demanda" DROP CONSTRAINT "Demanda_cidadaoId_fkey";

-- DropTable
DROP TABLE "Cidadao";

-- DropTable
DROP TABLE "Demanda";

-- CreateTable
CREATE TABLE "Candidate" (
    "id" TEXT NOT NULL,
    "clerkUserId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "plan" TEXT NOT NULL DEFAULT 'candidato',
    "planExpiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Candidate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CitizenDemand" (
    "id" TEXT NOT NULL,
    "candidateId" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "sentiment" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CitizenDemand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "City" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "state" TEXT NOT NULL,
    "ibgeCode" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "City_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectoralResult" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "candidateName" TEXT,
    "votesCount" INTEGER NOT NULL,

    CONSTRAINT "ElectoralResult_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Neighborhood" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "totalVoters" INTEGER,
    "averageIncome" DOUBLE PRECISION,
    "leisureAreasCount" INTEGER,
    "securityIncidents" INTEGER,
    "sanitationCoverage" DOUBLE PRECISION,
    "transportLines" INTEGER,

    CONSTRAINT "Neighborhood_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "LeisureArea" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "street" TEXT,
    "neighborhoodId" TEXT NOT NULL,

    CONSTRAINT "LeisureArea_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ElectionProjection" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "year" INTEGER NOT NULL DEFAULT 2022,
    "position" TEXT NOT NULL,
    "candidateName" TEXT NOT NULL,
    "projectedVotes" INTEGER NOT NULL,
    "confidence" DOUBLE PRECISION,

    CONSTRAINT "ElectionProjection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NeighborhoodMetric" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER,
    "metricType" TEXT NOT NULL,
    "value" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "NeighborhoodMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "HealthFacility" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "currentQueueSize" INTEGER,
    "averageWaitTime" INTEGER,

    CONSTRAINT "HealthFacility_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_clerkUserId_key" ON "Candidate"("clerkUserId");

-- CreateIndex
CREATE UNIQUE INDEX "Candidate_slug_key" ON "Candidate"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "City_ibgeCode_key" ON "City"("ibgeCode");

-- AddForeignKey
ALTER TABLE "Candidate" ADD CONSTRAINT "Candidate_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitizenDemand" ADD CONSTRAINT "CitizenDemand_candidateId_fkey" FOREIGN KEY ("candidateId") REFERENCES "Candidate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CitizenDemand" ADD CONSTRAINT "CitizenDemand_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectoralResult" ADD CONSTRAINT "ElectoralResult_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Neighborhood" ADD CONSTRAINT "Neighborhood_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "LeisureArea" ADD CONSTRAINT "LeisureArea_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ElectionProjection" ADD CONSTRAINT "ElectionProjection_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NeighborhoodMetric" ADD CONSTRAINT "NeighborhoodMetric_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "HealthFacility" ADD CONSTRAINT "HealthFacility_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

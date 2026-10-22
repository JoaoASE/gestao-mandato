-- CreateTable
CREATE TABLE "CrimeOccurrence" (
    "id" TEXT NOT NULL,
    "neighborhoodId" TEXT NOT NULL,
    "cityId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "crimeType" TEXT NOT NULL,
    "count" INTEGER NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'SSP-MG',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CrimeOccurrence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CrimeOccurrence_neighborhoodId_year_month_idx" ON "CrimeOccurrence"("neighborhoodId", "year", "month");

-- CreateIndex
CREATE INDEX "CrimeOccurrence_cityId_year_month_idx" ON "CrimeOccurrence"("cityId", "year", "month");

-- CreateIndex
CREATE UNIQUE INDEX "CrimeOccurrence_neighborhoodId_year_month_crimeType_key" ON "CrimeOccurrence"("neighborhoodId", "year", "month", "crimeType");

-- AddForeignKey
ALTER TABLE "CrimeOccurrence" ADD CONSTRAINT "CrimeOccurrence_neighborhoodId_fkey" FOREIGN KEY ("neighborhoodId") REFERENCES "Neighborhood"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CrimeOccurrence" ADD CONSTRAINT "CrimeOccurrence_cityId_fkey" FOREIGN KEY ("cityId") REFERENCES "City"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

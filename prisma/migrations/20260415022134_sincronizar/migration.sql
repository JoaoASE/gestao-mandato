-- CreateTable
CREATE TABLE "Cidadao" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "whatsapp" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cidadao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Demanda" (
    "id" TEXT NOT NULL,
    "titulo" TEXT NOT NULL,
    "descricao" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDENTE',
    "categoria" TEXT NOT NULL,
    "bairro" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "cidadaoId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Demanda_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Cidadao_whatsapp_key" ON "Cidadao"("whatsapp");

-- AddForeignKey
ALTER TABLE "Demanda" ADD CONSTRAINT "Demanda_cidadaoId_fkey" FOREIGN KEY ("cidadaoId") REFERENCES "Cidadao"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

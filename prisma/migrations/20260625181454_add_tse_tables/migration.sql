-- CreateTable
CREATE TABLE "TseCandidato" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "sequencial" TEXT NOT NULL,
    "numero" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "nomeUrna" TEXT NOT NULL,
    "numeroPartido" TEXT NOT NULL,
    "siglaPartido" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "situacao" TEXT NOT NULL,
    "genero" TEXT,
    "idade" INTEGER,
    "instrucao" TEXT,
    "ocupacao" TEXT,
    "estadoCivil" TEXT,
    "raca" TEXT,
    "email" TEXT,

    CONSTRAINT "TseCandidato_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TseResultadoSecao" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "turno" INTEGER NOT NULL,
    "zona" TEXT NOT NULL,
    "secao" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "siglaPartido" TEXT NOT NULL,
    "numeroCandidato" TEXT NOT NULL,
    "sequencialCandidato" TEXT NOT NULL,
    "votos" INTEGER NOT NULL,

    CONSTRAINT "TseResultadoSecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TseDetalhesSecao" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "turno" INTEGER NOT NULL,
    "zona" TEXT NOT NULL,
    "secao" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "aptos" INTEGER NOT NULL,
    "comparecimento" INTEGER NOT NULL,
    "abstencoes" INTEGER NOT NULL,
    "votosNominais" INTEGER NOT NULL,
    "votosBrancos" INTEGER NOT NULL,
    "votosNulos" INTEGER NOT NULL,
    "proporcaoComparecimento" DOUBLE PRECISION,

    CONSTRAINT "TseDetalhesSecao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TsePerfilEleitorado" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "turno" INTEGER NOT NULL,
    "zona" TEXT NOT NULL,
    "secao" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "tipo" TEXT,
    "endereco" TEXT,
    "bairro" TEXT,
    "latitude" DOUBLE PRECISION,
    "longitude" DOUBLE PRECISION,
    "eleitores" INTEGER NOT NULL,

    CONSTRAINT "TsePerfilEleitorado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TsePartido" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "sigla" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "cargo" TEXT NOT NULL,
    "situacaoLegenda" TEXT,
    "nomeColigacao" TEXT,

    CONSTRAINT "TsePartido_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PopulacaoMunicipio" (
    "id" TEXT NOT NULL,
    "ano" INTEGER NOT NULL,
    "grupoIdade" TEXT NOT NULL,
    "sexo" TEXT NOT NULL,
    "corRaca" TEXT NOT NULL,
    "populacao" INTEGER NOT NULL,

    CONSTRAINT "PopulacaoMunicipio_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TseCandidato_ano_cargo_idx" ON "TseCandidato"("ano", "cargo");

-- CreateIndex
CREATE INDEX "TseCandidato_siglaPartido_idx" ON "TseCandidato"("siglaPartido");

-- CreateIndex
CREATE UNIQUE INDEX "TseCandidato_ano_sequencial_key" ON "TseCandidato"("ano", "sequencial");

-- CreateIndex
CREATE INDEX "TseResultadoSecao_ano_cargo_idx" ON "TseResultadoSecao"("ano", "cargo");

-- CreateIndex
CREATE INDEX "TseResultadoSecao_numeroCandidato_ano_idx" ON "TseResultadoSecao"("numeroCandidato", "ano");

-- CreateIndex
CREATE INDEX "TseDetalhesSecao_ano_zona_idx" ON "TseDetalhesSecao"("ano", "zona");

-- CreateIndex
CREATE INDEX "TsePerfilEleitorado_ano_bairro_idx" ON "TsePerfilEleitorado"("ano", "bairro");

-- CreateIndex
CREATE INDEX "TsePerfilEleitorado_bairro_idx" ON "TsePerfilEleitorado"("bairro");

-- CreateIndex
CREATE INDEX "TsePartido_ano_sigla_idx" ON "TsePartido"("ano", "sigla");

-- CreateIndex
CREATE INDEX "PopulacaoMunicipio_ano_idx" ON "PopulacaoMunicipio"("ano");

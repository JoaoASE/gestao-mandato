import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search')?.toLowerCase() || '';

  if (!file || !file.endsWith('.csv')) {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 });
  }

  // Prevent directory traversal
  const safeFile = path.basename(file);
  const filePath = path.join(process.cwd(), safeFile);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
  }

  const results: any[] = [];
  let totalRows = 0;
  const skip = (page - 1) * limit;

  return new Promise((resolve) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        // Filter logic
        let matches = true;
        if (search) {
          matches = Object.values(data).some((val: any) => 
            String(val).toLowerCase().includes(search)
          );
        }

        if (matches) {
          if (totalRows >= skip && totalRows < skip + limit) {
            results.push(data);
          }
          totalRows++;
        }
      })
      .on('end', () => {
        resolve(NextResponse.json({
          data: results,
          totalRows,
          page,
          totalPages: Math.ceil(totalRows / limit)
        }));
      })
      .on('error', (err) => {
        console.error(err);
        resolve(NextResponse.json({ error: 'Erro ao processar arquivo' }, { status: 500 }));
      });
  });
}

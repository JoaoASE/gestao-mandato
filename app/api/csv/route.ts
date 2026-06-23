import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';

export async function GET(request: Request): Promise<Response> {
  const { searchParams } = new URL(request.url);
  const file = searchParams.get('file');
  const page = parseInt(searchParams.get('page') || '1');
  const limit = parseInt(searchParams.get('limit') || '100');
  const search = searchParams.get('search')?.toLowerCase() || '';
  const filtersParam = searchParams.get('filters');
  let filters: Record<string, string> = {};
  if (filtersParam) {
    try { filters = JSON.parse(decodeURIComponent(filtersParam)); } catch(e) {}
  }

  if (!file || !file.endsWith('.csv')) {
    return NextResponse.json({ error: 'Arquivo inválido' }, { status: 400 });
  }

  const safeFile = path.basename(file);
  const filePath = path.join(process.cwd(), safeFile);

  if (!fs.existsSync(filePath)) {
    return NextResponse.json({ error: 'Arquivo não encontrado' }, { status: 404 });
  }

  const results: any[] = [];
  let totalRows = 0;
  const skip = (page - 1) * limit;

  return new Promise<Response>((resolve) => {
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => {
        let matches = true;
        if (search) {
          matches = Object.values(data).some((val: any) =>
            String(val).toLowerCase().includes(search)
          );
        }

        if (matches && Object.keys(filters).length > 0) {
          for (const key of Object.keys(filters)) {
            if (filters[key]) {
              const cellVal = String(data[key] || '').toLowerCase();
              const filterVal = filters[key].toLowerCase();
              if (!cellVal.includes(filterVal)) {
                matches = false;
                break;
              }
            }
          }
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

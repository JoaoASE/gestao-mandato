import { NextResponse } from 'next/server';
import path from 'path';
import fs from 'fs';

export async function GET() {
  try {
    const demoPath = path.join(process.cwd(), 'public', 'uberlandia_demographics.json');
    if (fs.existsSync(demoPath)) {
      const d = JSON.parse(fs.readFileSync(demoPath, 'utf-8'));
      return NextResponse.json(d);
    }
    
    return NextResponse.json({ total: 0 });
  } catch (error: any) {
    console.error("Erro em /api/demografia:", error);
    return NextResponse.json({ error: "Erro" }, { status: 200 });
  }
}
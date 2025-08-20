import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const statsPath = path.join(process.cwd(), 'public', 'visitorStats.json');

export async function GET() {
	let count = 0;
	try {
		if (fs.existsSync(statsPath)) {
			const data = fs.readFileSync(statsPath, 'utf-8');
			count = JSON.parse(data).count || 0;
		}
	} catch (e) {
		// fallback
		count = 0;
	}
	count++;
	fs.writeFileSync(statsPath, JSON.stringify({ count }), 'utf-8');
	return NextResponse.json({ count });
}

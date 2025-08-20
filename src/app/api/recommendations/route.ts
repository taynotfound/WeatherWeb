export async function GET(request: Request) {
	return new Response(JSON.stringify({ message: 'Recommendations API is working.' }), {
		headers: { 'Content-Type': 'application/json' },
	});
}

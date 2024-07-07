import type { APIRoute } from 'astro';


export const GET: APIRoute = ({ params, request }) => {
  return new Response("GET is not accepted", { status: 400 });
}

export const POST: APIRoute = async ({ params, request }) => {
    console.log("Request received. Analyzing weather data...")
    const body = await request.json();

    const clothingResponse = await fetch(`https://api.webraft.in/v1/chat/completions`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.AI_KEY}`
        },
        body: JSON.stringify({
            "model":"gpt-3.5-turbo",
            "messages": [
                {
                    "role": "system",
                    "content": "The user is asking for clothing suggestions based on the weather. Please answer in ONE Sentence no longer than 100 characters. Thank you! Please start the sentence like this: Based on the current weather, you should wear:"
                },
                {
                    "role": "user",
                    "content": `What should I wear in ${body.location} with ${body.temp}°C and ${body.condition} and Wind: ${body.wind} km/h Feels like ${body.feelslike}?`
                }
            ],
        })
    }).catch((error) => {
        console.error("Error: ", error);
        return new Response(JSON.stringify({error: "Internal Server Error"}), {status: 500});
    });
    const clothingData = await clothingResponse.json();
    //If Error
    if (clothingData.error) {
        console.error("Error: ", clothingData.error);
        return new Response(JSON.stringify(clothingData), {status: 500});
    }
    console.log("Weather data analyzed. Responding with clothing suggestions...")
    return new Response(JSON.stringify(clothingData), {status: 200});
}
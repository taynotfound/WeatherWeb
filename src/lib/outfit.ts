export interface OutfitInput {
  tempC?: number;
  feelsLikeC: number;
  precipProb: number;
  windKmh: number;
  uvIndex: number;
  isDay: boolean;
  code: number;
}

export interface OutfitSuggestion {
  layers: string[];
  accessories: string[];
  footwear: string;
  vibe: string;
}

const isSnow = (c: number) => [71, 73, 75, 77, 85, 86].includes(c);
const isRain = (c: number) => [51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82].includes(c);
const isThunder = (c: number) => [95, 96, 99].includes(c);

export function suggestOutfit(i: OutfitInput): OutfitSuggestion {
  const t = i.feelsLikeC;
  const layers: string[] = [];
  const accessories: string[] = [];
  let footwear = 'sneakers';
  let vibe = '';

  if (t >= 28) {
    layers.push('light tee', 'shorts or skirt');
    accessories.push('sunglasses');
    footwear = 'sandals or breathable sneakers';
    vibe = 'minimal & breezy';
  } else if (t >= 22) {
    layers.push('t-shirt', 'light pants or jeans');
    footwear = 'sneakers';
    vibe = 'classic warm day';
  } else if (t >= 15) {
    layers.push('long-sleeve shirt', 'jeans', 'light cardigan or overshirt');
    vibe = 'sweet spot weather';
  } else if (t >= 8) {
    layers.push('long sleeve', 'sweater', 'light jacket', 'jeans');
    accessories.push('thin scarf');
    vibe = 'sweater season';
  } else if (t >= 0) {
    layers.push('base layer', 'sweater', 'warm jacket', 'thermal pants');
    accessories.push('scarf', 'gloves', 'beanie');
    footwear = 'closed boots';
    vibe = 'bundle up, it bites';
  } else {
    layers.push('thermal base', 'fleece', 'heavy coat', 'thermal trousers');
    accessories.push('thick scarf', 'gloves', 'beanie', 'wool socks');
    footwear = 'insulated boots';
    vibe = 'arctic mode';
  }

  if (isSnow(i.code)) {
    accessories.push('waterproof gloves');
    footwear = 'waterproof boots';
    vibe = 'snow day';
  } else if (isThunder(i.code)) {
    layers.push('rain jacket');
    vibe = 'thunderstorm — maybe stay in?';
  } else if (isRain(i.code) || i.precipProb >= 50) {
    layers.push('waterproof jacket');
    accessories.push('umbrella');
    if (t < 18) footwear = 'water-resistant shoes';
  }

  if (i.windKmh >= 30) accessories.push('windbreaker layer');
  if (i.uvIndex >= 6 && i.isDay) accessories.push('SPF 30+', 'cap or hat');
  if (!i.isDay && t < 15) accessories.push('reflective element if cycling');

  return {
    layers: Array.from(new Set(layers)),
    accessories: Array.from(new Set(accessories)),
    footwear,
    vibe,
  };
}

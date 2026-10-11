// Tomato's take without an LLM: three lines built straight from the forecast, used when both AI providers fail.
// Input is weatherContext() output, so numbers are already rounded and in the user's units.
import type { weatherContext } from './aiContext';

type Ctx = NonNullable<ReturnType<typeof weatherContext>>;

const at = (startsAt: string | undefined, i: number) => {
  const h = parseInt(startsAt ?? '', 10);
  return isFinite(h) ? `${String((h + i) % 24).padStart(2, '0')}:00` : `in ${i}h`;
};

export function fallbackTake(ctx: Ctx | null, alerts?: { event?: string; headline?: string; title?: string }[]): string[] {
  if (!ctx) return [];
  const u = ctx.units.temp.replace('°', '');
  const deg = (v: number | null | undefined) => (v == null ? '?' : `${v}°${u}`);
  const { now, today, nextHours: nh } = ctx;
  const rain = (nh.rainChance ?? []) as (number | null)[];
  const temps = (nh.temp ?? []) as (number | null)[];
  const wind = (nh.wind ?? []) as (number | null)[];
  const lines: string[] = [];

  const hour = parseInt(ctx.localTime ?? '12', 10);
  const evening = hour >= 18 || hour < 4;
  const peak = rain.length ? Math.max(...rain.map(p => p ?? 0)) : 0;
  const peakIdx = rain.findIndex(p => (p ?? 0) === peak);
  const wetNow = (rain[0] ?? 0) >= 50 || (now.precipMm ?? 0) > 0.1;

  // 1. Headline
  const alert = alerts?.[0];
  const alertName = alert?.event || alert?.headline || alert?.title;
  if (alertName) lines.push(`Heads up: ${alertName} is in effect.`);
  else if (evening) lines.push(`Tonight bottoms out near ${deg(Math.min(...temps.filter((t): t is number => t != null), now.temp ?? 99))}; tomorrow reaches ${deg(ctx.tomorrow.high)}` +
    ((ctx.tomorrow.rainChance ?? 0) >= 30 ? ` with a ${ctx.tomorrow.rainChance}% rain chance.` : ' and looks mostly dry.'));
  else if (peak >= 60) lines.push(`Rain is the story today, up to ${peak}% chance. High of ${deg(today.high)}.`);
  else if (peak >= 30) lines.push(`Mostly dry with a ${peak}% shot at showers; tops out at ${deg(today.high)}.`);
  else lines.push(`Dry for the rest of the day, topping out at ${deg(today.high)}.`);

  // 2. What changes in the next hours
  const start = wetNow ? -1 : rain.findIndex(p => (p ?? 0) >= 50);
  const stop = rain[0] != null && rain[0] >= 30 ? rain.findIndex(p => (p ?? 100) < 15) : -1;
  const gustIdx = wind.findIndex((w, i) => i > 0 && w != null && wind[0] != null && w - (wind[0] as number) >= 12);
  const valid = temps.filter((t): t is number => t != null);
  const coolest = valid.length ? Math.min(...valid) : null;
  const tempDrop = coolest != null && now.temp != null ? now.temp - coolest : 0;
  if (start > 0) lines.push(`Rain likely from about ${at(nh.startsAt, start)} (${rain[start]}%).`);
  else if (stop > 0) lines.push(`Rain chances fade after ${at(nh.startsAt, stop)}.`);
  else if (peak >= 30 && peakIdx > 0) lines.push(`Shower chance peaks at ${peak}% around ${at(nh.startsAt, peakIdx)}.`);
  else if (gustIdx > 0) lines.push(`Wind picks up to ${wind[gustIdx]} ${ctx.units.wind} around ${at(nh.startsAt, gustIdx)}.`);
  else if (tempDrop >= (u === 'F' ? 7 : 4)) lines.push(`Cooling to ${deg(coolest)} by ${at(nh.startsAt, temps.indexOf(coolest))}.`);
  else lines.push(`No big changes over the next few hours.`);

  // 3. One practical tip
  const feels = now.feelsLike ?? now.temp ?? 15;
  const cold = u === 'F' ? feels < 41 : feels < 5;
  const warm = u === 'F' ? feels > 82 : feels > 28;
  if (wetNow || peak >= 40) lines.push(`Keep an umbrella handy. Rabbits hate wet fur, and so will you.`);
  else if ((now.uv ?? 0) >= 6) lines.push(`UV is ${now.uv}, so sunscreen before you head out.`);
  else if (cold) lines.push(`Feels like ${deg(feels)}: warm coat, and gloves wouldn't hurt.`);
  else if (warm) lines.push(`Feels like ${deg(feels)}. Water bottle, shade, light clothes.`);
  else if (tempDrop >= (u === 'F' ? 9 : 5)) lines.push(`Bring a layer if you're out late, it drops to ${deg(coolest)}.`);
  else if (evening) lines.push(`Nothing to worry about tonight.`);
  else lines.push(`Good day to get outside for a bit.`);
  return lines;
}

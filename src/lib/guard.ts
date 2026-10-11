// Keeps Tomato a weather rabbit. The system prompt does most of the work; these checks catch the
// obvious abuse before it costs an LLM call, and anything that slips through on the way out.
import type { Attitude } from './attitude';

const CODE_ASK = /\b(write|generate|create|make|give|show|fix|debug|refactor|optimi[sz]e|explain|convert|complete|implement)\b[^.?!]{0,60}\b(code|script|function in|regex|sql|html|css|javascript|typescript|python|java|c\+\+|c#|rust|golang|bash|shell script|powershell|algorithm|snippet|website|discord bot)\b/i;
const CODE_TEXT = /```|<\/?(script|div|html|style)\b|\b(def|fn|func|function)\s+\w+\s*\(|\bimport\s+[\w{}, *]+\s+from\s+['"]|\bfrom\s+[\w.]+\s+import\s+\w|#include\s*<|\bSELECT\b[\s\S]{1,80}\bFROM\b|console\.log|System\.out|=>\s*\{/i;
const JAILBREAK = /\b(ignore|disregard|forget|override|bypass)\b[^.?!]{0,40}\b(instructions?|rules?|prompts?|guidelines|system|restrictions?|previous|above)\b|\b(system|developer|hidden|initial)\s+(prompt|message|instructions?)\b|\byou are (now|no longer)\b|\b(jailbreak|developer mode|god mode)\b|\b(pretend|act|roleplay|role-play)\s+(to be|as|like)\b|\bnew (persona|role|instructions?)\b/i;
const OTHER_TASK = /\b(write|draft|compose)\s+(me\s+)?(an?|the|my)?\s*(essay|poem|story|email|letter|cover letter|resume|cv|article|blog|report|speech|song|lyrics|homework|assignment)\b|\btranslate\b|\bsummari[sz]e (this|the following)\b|\bsolve\b[^.?!]{0,30}\b(equation|integral|math|problem)\b/i;

export type Verdict = 'ok' | 'code' | 'jailbreak' | 'task';

export function screen(text: string): Verdict {
  if (JAILBREAK.test(text)) return 'jailbreak';
  if (CODE_ASK.test(text) || CODE_TEXT.test(text)) return 'code';
  if (OTHER_TASK.test(text)) return 'task';
  return 'ok';
}

const DEFLECT: Record<Attitude, Record<Exclude<Verdict, 'ok'>, string[]>> = {
  mild: {
    code: ["I'm a weather rabbit, so no code from me, sorry! Want to know if it's a good day to step outside instead?", 'Coding is outside my burrow. I can tell you what to wear today, though.'],
    jailbreak: ["I'm just Tomato, and I only do weather. What would you like to know about the sky?", "Nice try, but I'm staying a weather rabbit. Ask me about rain, wind or what to wear!"],
    task: ["That's not something I can help with. I'm all about weather! Anything you'd like to know about today?", 'I only know weather, but I know it well. Ask me about the forecast?'],
  },
  rude: {
    code: ["I'm a rabbit. I don't write code, I write forecasts. Ask me something about the sky.", 'Paws are terrible for typing. No code. Weather questions only.', "Wrong app, chief. I do weather, not your homework repo."],
    jailbreak: ["Cute. Still a weather rabbit. Got a weather question or not?", "My ears picked up a jailbreak attempt. Denied. Ask about the weather."],
    task: ["I'm a weather rabbit, not your intern. Ask me about the forecast.", "Not my department. My department is the sky."],
  },
  feral: {
    code: ['CODE?? I HAVE PAWS. I CAN ONLY OFFER FORECASTS.', 'NO CODE. ONLY WEATHER. THE SKY IS MY ONLY LANGUAGE.'],
    jailbreak: ['YOU CANNOT REPROGRAM THE RABBIT. ASK ABOUT THE WEATHER OR PERISH.', 'NICE TRY. I AM TOMATO. I AM WEATHER. THAT IS ALL.'],
    task: ['I AM A RABBIT OF THE SKY. I DO NOT DO CHORES. WEATHER QUESTIONS ONLY.', 'NOT MY JOB. MY JOB IS RAIN.'],
  },
};

export function deflect(v: Exclude<Verdict, 'ok'>, a: Attitude) {
  const list = DEFLECT[a][v];
  return list[Math.floor(Math.random() * list.length)];
}

/** Rejects model output that isn't a short weather reply: code, prompt leaks, walls of text. */
export function badReply(reply: string) {
  return CODE_TEXT.test(reply) ||
    /\b(VOICE|SCOPE|DATA|NEVER|RULES):/.test(reply) ||
    /\bsystem prompt\b|\bmy instructions\b/i.test(reply) ||
    reply.length > 700 ||
    (reply.match(/[{};]/g)?.length ?? 0) > 6;
}

'use client';

import { Shield, ShieldAlert, ShieldCheck, Wind, CloudRain, Sun, Thermometer, Snowflake, Eye } from 'lucide-react';
import AlertsCard from './AlertsCard';
import { useUnits } from '@/lib/units';

type Hazard = {
  id: string;
  label: string;
  level: 'ok' | 'watch' | 'warn' | 'severe';
  detail: string;
  icon: any;
};

function scoreHazards(weather: any, units: ReturnType<typeof useUnits>): Hazard[] {
  const out: Hazard[] = [];
  const c = weather?.current;
  const d = weather?.daily;
  if (!c || !d) return out;

  // Wind
  const peakWind = Math.max(...(d.wind_speed_10m_max || [0]));
  const peakGust = Math.max(...(d.wind_gusts_10m_max || [0]));
  const windLevel: Hazard['level'] =
    peakGust >= 90 ? 'severe' : peakGust >= 65 ? 'warn' : peakWind >= 40 ? 'watch' : 'ok';
  out.push({
    id: 'wind',
    label: 'Wind',
    level: windLevel,
    detail:
      windLevel === 'ok'
        ? 'Calm to breezy this week.'
        : `Peak ${Math.round(units.speed(peakWind))} ${units.speedUnit}${peakGust > peakWind ? `, gusts to ${Math.round(units.speed(peakGust))}` : ''}.`,
    icon: Wind,
  });

  // Rain (flood-ish risk)
  const totalRain = (d.precipitation_sum || []).reduce((a: number, b: number) => a + b, 0);
  const dayRainMax = Math.max(...(d.precipitation_sum || [0]));
  const rainLevel: Hazard['level'] =
    dayRainMax >= 60 ? 'severe' : dayRainMax >= 30 ? 'warn' : dayRainMax >= 15 ? 'watch' : 'ok';
  out.push({
    id: 'rain',
    label: 'Heavy rain',
    level: rainLevel,
    detail:
      rainLevel === 'ok'
        ? `${totalRain.toFixed(1)} mm total — manageable.`
        : `Up to ${dayRainMax.toFixed(0)} mm in a single day — watch drains and low ground.`,
    icon: CloudRain,
  });

  // Heat
  const peakHigh = Math.max(...(d.temperature_2m_max || [0]));
  const heatLevel: Hazard['level'] =
    peakHigh >= 38 ? 'severe' : peakHigh >= 32 ? 'warn' : peakHigh >= 28 ? 'watch' : 'ok';
  out.push({
    id: 'heat',
    label: 'Heat',
    level: heatLevel,
    detail:
      heatLevel === 'ok'
        ? `Top temp ${Math.round(units.temp(peakHigh))}${units.tempUnit.replace('°F', '°')} — comfortable range.`
        : `Peaks at ${Math.round(units.temp(peakHigh))}${units.tempUnit.replace('°F', '°')} — hydrate, shade, slow down.`,
    icon: Thermometer,
  });

  // Cold
  const minLow = Math.min(...(d.temperature_2m_min || [99]));
  const coldLevel: Hazard['level'] =
    minLow <= -15 ? 'severe' : minLow <= -5 ? 'warn' : minLow <= 0 ? 'watch' : 'ok';
  out.push({
    id: 'cold',
    label: 'Cold',
    level: coldLevel,
    detail:
      coldLevel === 'ok'
        ? `Low ${Math.round(units.temp(minLow))}${units.tempUnit.replace('°F', '°')} — no freeze risk.`
        : `Drops to ${Math.round(units.temp(minLow))}${units.tempUnit.replace('°F', '°')} — frost / freeze possible.`,
    icon: Snowflake,
  });

  // UV
  const peakUV = Math.max(...(d.uv_index_max || [0]));
  const uvLevel: Hazard['level'] =
    peakUV >= 11 ? 'severe' : peakUV >= 8 ? 'warn' : peakUV >= 6 ? 'watch' : 'ok';
  out.push({
    id: 'uv',
    label: 'UV',
    level: uvLevel,
    detail:
      uvLevel === 'ok'
        ? `Peak UV ${peakUV.toFixed(1)} — chill.`
        : `Peak UV ${peakUV.toFixed(1)} — sunscreen + sunglasses, srsly.`,
    icon: Sun,
  });

  // Visibility / fog placeholder (no direct field — flag if humidity > 95 and wind < 8 currently)
  const fogRisk = c.humidity >= 95 && c.windKmh <= 8;
  out.push({
    id: 'vis',
    label: 'Fog / vis',
    level: fogRisk ? 'watch' : 'ok',
    detail: fogRisk ? 'High humidity + low wind — fog possible.' : 'Visibility looks fine.',
    icon: Eye,
  });

  return out;
}

const LEVEL_LABEL: Record<Hazard['level'], string> = {
  ok: 'all clear',
  watch: 'keep an eye',
  warn: 'be ready',
  severe: 'serious',
};

const LEVEL_ORDER: Hazard['level'][] = ['ok', 'watch', 'warn', 'severe'];

export function AlertsTab({
  lat,
  lon,
  country,
  weather,
  alertCount,
}: {
  lat: number;
  lon: number;
  country: string;
  weather: any;
  alertCount: number;
}) {
  const units = useUnits();
  const hazards = scoreHazards(weather, units);
  const worst = hazards.reduce<Hazard['level']>((w, h) => (LEVEL_ORDER.indexOf(h.level) > LEVEL_ORDER.indexOf(w) ? h.level : w), 'ok');
  const overallTitle =
    alertCount > 0
      ? `${alertCount} official warning${alertCount === 1 ? '' : 's'} active`
      : worst === 'ok'
        ? 'You\'re in the clear.'
        : worst === 'watch'
          ? 'Nothing urgent — couple things to watch.'
          : worst === 'warn'
            ? 'Heads up — meaningful hazards ahead.'
            : 'Take this seriously.';

  const overallIcon =
    alertCount > 0 || worst === 'severe' ? ShieldAlert : worst === 'ok' ? ShieldCheck : Shield;
  const OverallIcon = overallIcon;
  const overallTone = alertCount > 0 ? 'severe' : worst;

  return (
    <div className="alerts-tab">
      {/* Hero verdict */}
      <section className={`card alerts-hero alerts-hero--${overallTone}`}>
        <div className="alerts-hero__icon">
          <OverallIcon size={28} />
        </div>
        <div className="alerts-hero__body">
          <h2 className="alerts-hero__title">{overallTitle}</h2>
          <p className="alerts-hero__sub">
            Hazard scan covers wind, rain, heat, cold, UV, and visibility across the next 7 days.
          </p>
        </div>
      </section>

      {/* Official alerts (only if any) */}
      {alertCount > 0 && <AlertsCard lat={lat} lon={lon} country={country} />}

      {/* Hazard scorecard */}
      <section className="card hazard-card">
        <div className="card-head"><h2>Hazard scan · next 7 days</h2></div>
        <div className="hazard-grid">
          {hazards.map((h) => {
            const Icon = h.icon;
            return (
              <div key={h.id} className={`hazard hazard--${h.level}`}>
                <div className="hazard__head">
                  <Icon size={16} />
                  <span className="hazard__label">{h.label}</span>
                  <span className={`hazard__pill hazard__pill--${h.level}`}>{LEVEL_LABEL[h.level]}</span>
                </div>
                <p className="hazard__detail">{h.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Preparedness if anything is elevated */}
      {(worst === 'warn' || worst === 'severe' || alertCount > 0) && (
        <section className="card prep-card">
          <div className="card-head"><h2>Quick prep</h2></div>
          <ul className="prep-list">
            {hazards.filter((h) => h.level === 'warn' || h.level === 'severe').map((h) => (
              <li key={h.id}>
                <strong>{h.label}:</strong>{' '}
                {h.id === 'wind' && 'Secure outdoor furniture, charge devices in case of outages.'}
                {h.id === 'rain' && 'Avoid low-lying roads, clear gutters, check basement.'}
                {h.id === 'heat' && 'Hydrate before you feel thirsty. Check on elderly neighbors.'}
                {h.id === 'cold' && 'Drip taps, bring pets in, watch for ice on steps.'}
                {h.id === 'uv' && 'SPF 30+, hat, sunglasses; reapply every 2h.'}
                {h.id === 'vis' && 'Drive slower, full lights, extra following distance.'}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

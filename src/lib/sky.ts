export type SkyPeriod = 'night' | 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk';

export interface SkyConfig {
  gradient: string;
  // Blended top colour: homeContainer bg (#0d0d1a) × 0.6 + gradient 0% stop × 0.4
  // Matches the exact visible pixel at the top of DynamicBackground.
  blendedTopColor: string;
  starOpacity: number;
}

export function getSkyPeriod(hour: number): SkyPeriod {
  if (hour >= 22 || hour < 5) return 'night';
  if (hour < 7)               return 'dawn';
  if (hour < 10)              return 'morning';
  if (hour < 14)              return 'midday';
  if (hour < 18)              return 'afternoon';
  return 'dusk';
}

export const SKY_CONFIGS: Record<SkyPeriod, SkyConfig> = {
  // blendedTopColor = #0d0d1a × 0.6 + gradient-top × 0.4
  night:     { gradient: 'linear-gradient(180deg, #0d0d1a 0%, #16213e 30%, #0f3460 60%, #0a0a1a 100%)', blendedTopColor: '#0d0d1a', starOpacity: 1 },
  dawn:      { gradient: 'linear-gradient(180deg, #1a0a2e 0%, #6b2d6e 35%, #c85a2a 70%, #f0a060 100%)', blendedTopColor: '#120c22', starOpacity: 0.25 },
  morning:   { gradient: 'linear-gradient(180deg, #3a7a9e 0%, #6aaec8 40%, #a8d4e8 75%, #f5e8c0 100%)', blendedTopColor: '#1f394f', starOpacity: 0 },
  midday:    { gradient: 'linear-gradient(180deg, #0878c8 0%, #2898e8 40%, #58c0f8 75%, #a8e0ff 100%)', blendedTopColor: '#0b3860', starOpacity: 0 },
  afternoon: { gradient: 'linear-gradient(180deg, #0a5a9a 0%, #1e7ac0 40%, #50a8d8 70%, #d8a830 100%)', blendedTopColor: '#0c2c4d', starOpacity: 0 },
  dusk:      { gradient: 'linear-gradient(180deg, #0d0d1a 0%, #6b1a4a 30%, #c83c1e 65%, #f07820 100%)', blendedTopColor: '#0d0d1a', starOpacity: 0.15 },
};

export function getCurrentSkyConfig(): SkyConfig {
  return SKY_CONFIGS[getSkyPeriod(new Date().getHours())];
}

/* ============================================================
   SchoolConnect — Theme / Branding Store (Zustand)
   Manages school branding config.
   Persists to localStorage for instant load on return visits.
   ============================================================ */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { BrandingConfig } from '../api/types';

interface ThemeState {
  schoolName: string;
  tagline: string;
  logoUrl: string;
  primaryColor?: string;
  secondaryColor?: string;
  accentColor: string;
  faviconUrl: string;
  isLoaded: boolean;

  // Actions
  setBranding: (config: BrandingConfig) => void;
  resetToDefaults: () => void;
}

const DEFAULT_SCHOOL_NAME = 'SchoolConnect';
const DEFAULT_ACCENT_COLOR = '#4f46e5'; // Indigo-600 from tokens
const DEFAULT_TAGLINE = 'Smart School Management';

/**
 * Applies accent color as CSS custom properties on :root.
 * This lets every component that references --brand-accent
 * automatically pick up the school's colors.
 */
function applyAccentColor(hex: string): void {
  const root = document.documentElement;
  root.style.setProperty('--brand-accent', hex);

  // Generate a slightly darker hover variant
  root.style.setProperty('--brand-accent-hover', darkenHex(hex, 15));

  // Generate a light background variant
  root.style.setProperty('--brand-accent-light', hexToLightBg(hex));
}

function darkenHex(hex: string, percent: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, (num >> 16) - Math.round(255 * (percent / 100)));
  const g = Math.max(0, ((num >> 8) & 0x00ff) - Math.round(255 * (percent / 100)));
  const b = Math.max(0, (num & 0x0000ff) - Math.round(255 * (percent / 100)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, '0')}`;
}

function hexToLightBg(hex: string): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = num >> 16;
  const g = (num >> 8) & 0x00ff;
  const b = num & 0x0000ff;
  return `rgba(${r}, ${g}, ${b}, 0.08)`;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      schoolName: DEFAULT_SCHOOL_NAME,
      tagline: DEFAULT_TAGLINE,
      logoUrl: '',
      primaryColor: DEFAULT_ACCENT_COLOR,
      secondaryColor: '#06b6d4',
      accentColor: DEFAULT_ACCENT_COLOR,
      faviconUrl: '',
      isLoaded: false,

      setBranding: (config) => {
        const accent = config.primaryColor || config.accentColor || DEFAULT_ACCENT_COLOR;
        applyAccentColor(accent);

        // Update favicon if provided
        if (config.faviconUrl) {
          const favicon = document.querySelector<HTMLLinkElement>(
            'link[rel="icon"]'
          );
          if (favicon) {
            favicon.href = config.faviconUrl;
          }
        }

        set((state) => ({
          schoolName: config.schoolName || state.schoolName || DEFAULT_SCHOOL_NAME,
          tagline: config.tagline ?? state.tagline,
          logoUrl: config.logoUrl ?? state.logoUrl,
          primaryColor: config.primaryColor,
          secondaryColor: config.secondaryColor,
          accentColor: accent,
          faviconUrl: config.faviconUrl ?? state.faviconUrl,
          isLoaded: true,
        }));
      },

      resetToDefaults: () => {
        applyAccentColor(DEFAULT_ACCENT_COLOR);
        set({
          schoolName: DEFAULT_SCHOOL_NAME,
          tagline: DEFAULT_TAGLINE,
          logoUrl: '',
          accentColor: DEFAULT_ACCENT_COLOR,
          faviconUrl: '',
          isLoaded: false,
        });
      },
    }),
    {
      name: 'schoolconnect-branding',
      // Only persist branding fields, not functions
      partialize: (state) => ({
        schoolName: state.schoolName,
        tagline: state.tagline,
        logoUrl: state.logoUrl,
        accentColor: state.accentColor,
        faviconUrl: state.faviconUrl,
        isLoaded: state.isLoaded,
      }),
      // Re-apply CSS properties when hydrating from localStorage
      onRehydrateStorage: () => (state) => {
        if (state?.accentColor) {
          applyAccentColor(state.accentColor);
        }
      },
    }
  )
);

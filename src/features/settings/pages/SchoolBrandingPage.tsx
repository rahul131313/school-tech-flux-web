/* ============================================================
   SchoolBrandingPage — School Identity, Colors, and Logo Settings
   Connected to Spring Boot:
   - GET /api/v1/school-configuration/branding
   - PUT /api/v1/school-configuration/branding
   ============================================================ */

import { useState, useEffect } from 'react';
import { Palette, Save } from 'lucide-react';
import { schoolConfigurationApi } from '../../../api/endpoints/schoolConfiguration';
import { Button } from '../../../components/ui/Button';
import { useToast } from '../../../components/ui/Toast';
import { useThemeStore } from '../../../stores/themeStore';
import { isApiError, type ApiError } from '../../../api/types';

export function SchoolBrandingPage() {
  const toast = useToast();
  const { setBranding } = useThemeStore();

  const [logoUrl, setLogoUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#4f46e5');
  const [secondaryColor, setSecondaryColor] = useState('#06b6d4');
  const [splashAnimationUrl, setSplashAnimationUrl] = useState('');
  const [tagline, setTagline] = useState('');

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  const fetchBranding = async () => {
    setIsLoading(true);
    try {
      const data = await schoolConfigurationApi.getBranding();
      if (data) {
        setLogoUrl(data.logoUrl || '');
        setPrimaryColor(data.primaryColor || '#4f46e5');
        setSecondaryColor(data.secondaryColor || '#06b6d4');
        setSplashAnimationUrl(data.splashAnimationUrl || '');
        setTagline(data.tagline || '');
      }
    } catch {
      // Branding might not be saved yet
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchBranding();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const updated = await schoolConfigurationApi.updateBranding({
        logoUrl: logoUrl.trim() || undefined,
        primaryColor,
        secondaryColor,
        splashAnimationUrl: splashAnimationUrl.trim() || undefined,
        tagline: tagline.trim() || undefined,
      });

      // Update theme store
      setBranding({
        logoUrl: updated.logoUrl,
        primaryColor: updated.primaryColor,
        secondaryColor: updated.secondaryColor,
        tagline: updated.tagline,
      });

      toast.success('School branding updated successfully!');
    } catch (error: unknown) {
      if (isApiError(error)) {
        toast.error((error as ApiError).message || 'Failed to update branding');
      } else {
        toast.error('Failed to save branding changes');
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
      <div>
        <h3
          style={{
            margin: 0,
            fontSize: 'var(--font-size-xl)',
            fontWeight: 'var(--font-weight-bold)',
            color: 'var(--color-text-primary)',
          }}
        >
          School Branding & Theme
        </h3>
        <p style={{ margin: '4px 0 0', fontSize: 'var(--font-size-sm)', color: 'var(--color-text-secondary)' }}>
          Customize your institution logo, primary palette, and portal tagline
        </p>
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))',
          gap: 'var(--space-6)',
          alignItems: 'start',
        }}
      >
        {/* Settings Form */}
        <form
          onSubmit={handleSave}
          style={{
            background: 'var(--color-bg-card, #ffffff)',
            border: '1px solid var(--color-border-primary, #e2e8f0)',
            borderRadius: 'var(--radius-xl)',
            padding: 'var(--space-6)',
            display: 'flex',
            flexDirection: 'column',
            gap: 'var(--space-4)',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 4,
                textTransform: 'uppercase',
              }}
            >
              School Logo URL
            </label>
            <input
              type="url"
              placeholder="https://example.com/school-logo.png"
              value={logoUrl}
              onChange={(e) => setLogoUrl(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                }}
              >
                Primary Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{ width: 40, height: 40, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  style={{
                    flex: 1,
                    height: 40,
                    padding: '0 8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: 'monospace',
                  }}
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>

            <div>
              <label
                style={{
                  display: 'block',
                  fontSize: 'var(--font-size-xs)',
                  fontWeight: 600,
                  color: 'var(--color-text-secondary)',
                  marginBottom: 4,
                  textTransform: 'uppercase',
                }}
              >
                Secondary Color
              </label>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  style={{ width: 40, height: 40, border: 'none', borderRadius: 4, cursor: 'pointer' }}
                />
                <input
                  type="text"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  style={{
                    flex: 1,
                    height: 40,
                    padding: '0 8px',
                    border: '1px solid #cbd5e1',
                    borderRadius: 6,
                    fontSize: 13,
                    fontFamily: 'monospace',
                  }}
                  pattern="^#[0-9A-Fa-f]{6}$"
                />
              </div>
            </div>
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 4,
                textTransform: 'uppercase',
              }}
            >
              School Tagline / Motto
            </label>
            <input
              type="text"
              placeholder="E.g., Inspiring Excellence, Empowering Futures"
              value={tagline}
              onChange={(e) => setTagline(e.target.value)}
              maxLength={200}
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          <div>
            <label
              style={{
                display: 'block',
                fontSize: 'var(--font-size-xs)',
                fontWeight: 600,
                color: 'var(--color-text-secondary)',
                marginBottom: 4,
                textTransform: 'uppercase',
              }}
            >
              Splash Animation URL (Lottie JSON / GIF)
            </label>
            <input
              type="url"
              placeholder="https://example.com/splash-animation.json"
              value={splashAnimationUrl}
              onChange={(e) => setSplashAnimationUrl(e.target.value)}
              style={{
                width: '100%',
                height: 40,
                padding: '0 12px',
                border: '1px solid #cbd5e1',
                borderRadius: 6,
                fontSize: 14,
              }}
            />
          </div>

          <div style={{ marginTop: 'var(--space-2)' }}>
            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={isSaving}
              disabled={isLoading}
            >
              <Save size={16} />
              <span>Save Branding</span>
            </Button>
          </div>
        </form>

        {/* Live Preview Card */}
        <div
          style={{
            background: 'var(--color-bg-card, #ffffff)',
            border: '1px solid var(--color-border-primary, #e2e8f0)',
            borderRadius: 'var(--radius-xl)',
            overflow: 'hidden',
            boxShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
          }}
        >
          <div
            style={{
              padding: 'var(--space-4) var(--space-6)',
              background: 'var(--color-bg-subtle, #f8fafc)',
              borderBottom: '1px solid #e2e8f0',
              fontWeight: 600,
              fontSize: 'var(--font-size-sm)',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
            }}
          >
            <Palette size={16} style={{ color: primaryColor }} />
            <span>Live Portal Preview</span>
          </div>

          <div style={{ padding: 'var(--space-6)', display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div
              style={{
                borderRadius: 'var(--radius-lg)',
                padding: '24px',
                background: `linear-gradient(135deg, ${primaryColor} 0%, ${secondaryColor} 100%)`,
                color: '#ffffff',
                display: 'flex',
                alignItems: 'center',
                gap: 16,
              }}
            >
              {logoUrl ? (
                <img
                  src={logoUrl}
                  alt="School Logo Preview"
                  style={{ width: 64, height: 64, borderRadius: 8, objectFit: 'contain', background: '#fff', padding: 4 }}
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: 8,
                    background: 'rgba(255, 255, 255, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    fontSize: 24,
                  }}
                >
                  SC
                </div>
              )}

              <div>
                <h4 style={{ margin: 0, fontSize: 18, fontWeight: 700 }}>SchoolConnect Portal</h4>
                <p style={{ margin: '4px 0 0', fontSize: 13, opacity: 0.9 }}>
                  {tagline || 'Excellence in modern education'}
                </p>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 10 }}>
              <div
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 6,
                  border: `2px solid ${primaryColor}`,
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                  color: primaryColor,
                }}
              >
                Primary Button
              </div>
              <div
                style={{
                  flex: 1,
                  padding: 12,
                  borderRadius: 6,
                  background: secondaryColor,
                  color: '#ffffff',
                  textAlign: 'center',
                  fontSize: 12,
                  fontWeight: 600,
                }}
              >
                Secondary Action
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

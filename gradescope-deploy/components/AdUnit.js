/**
 * components/AdUnit.js
 * ─────────────────────────────────────────────────────────────────────────────
 * Reusable Google AdSense ad slot component.
 *
 * HOW TO USE:
 *   import AdUnit from '../components/AdUnit';
 *   <AdUnit slot="1234567890" format="horizontal" />
 *
 * PROPS:
 *   slot      — AdSense ad slot ID  (e.g. "1234567890")
 *   format    — AdSense data-ad-format (default: "auto")
 *   style     — optional inline style overrides for the outer wrapper
 *   className — optional CSS class for the outer wrapper
 *
 * BEFORE GOING LIVE:
 *   1. Replace NEXT_PUBLIC_ADSENSE_CLIENT in your .env.local / Vercel env vars:
 *        NEXT_PUBLIC_ADSENSE_CLIENT=ca-pub-XXXXXXXXXXXXXXXX
 *   2. Replace each slot ID passed to <AdUnit slot="..." /> with your real
 *      slot IDs from the AdSense dashboard.
 *   3. Set NODE_ENV=production on Vercel (it is by default for `next build`).
 *
 * GUARDS:
 *   • Renders nothing in development (NODE_ENV !== 'production').
 *   • Renders nothing if NEXT_PUBLIC_ADSENSE_CLIENT is not set.
 *   • useEffect pushes to adsbygoogle only once per mount.
 *   • The Script tag in Layout.js is loaded once globally — no duplicate load.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useEffect, useRef } from 'react';

const IS_PROD   = process.env.NODE_ENV === 'production';
const CLIENT_ID = process.env.NEXT_PUBLIC_ADSENSE_CLIENT || '';

export default function AdUnit({
  slot,
  format    = 'auto',
  style     = {},
  className = '',
}) {
  const adRef  = useRef(null);
  const pushed = useRef(false);

  useEffect(() => {
    // Only push once per mount, only in production, only when client is set
    if (!IS_PROD || !CLIENT_ID || !slot || pushed.current) return;
    try {
      (window.adsbygoogle = window.adsbygoogle || []).push({});
      pushed.current = true;
    } catch (err) {
      // adsbygoogle may not have loaded yet — silently swallow
    }
  }, [slot]);

  // In development, show a clearly-labelled placeholder so layout is visible
  if (!IS_PROD) {
    return (
      <div
        className={className}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'rgba(201,153,58,0.06)',
          border: '1px dashed rgba(201,153,58,0.35)',
          borderRadius: '6px',
          padding: '0.6rem 1rem',
          minHeight: '60px',
          fontSize: '0.72rem',
          fontFamily: "'DM Mono', monospace",
          color: 'rgba(201,153,58,0.7)',
          letterSpacing: '0.1em',
          textTransform: 'uppercase',
          ...style,
        }}
      >
        Ad Slot · {slot || 'NO_SLOT_ID'} · (dev only)
      </div>
    );
  }

  // Don't render anything if publisher ID is missing
  if (!CLIENT_ID) return null;

  return (
    <div className={className} style={{ textAlign: 'center', overflow: 'hidden', ...style }}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={CLIENT_ID}
        data-ad-slot={slot}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
}

export const BrandMark = ({ className = "", size = 42 }) => (
  <svg
    className={`brand-mark ${className}`.trim()}
    width={size}
    height={size}
    viewBox="0 0 96 96"
    role="img"
    aria-label="Virtual Vaidya logo"
  >
    <defs>
      <linearGradient id="brand-red" x1="26" x2="66" y1="10" y2="58" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#ff6b6b" />
        <stop offset="0.48" stopColor="#ef1f2f" />
        <stop offset="1" stopColor="#a90512" />
      </linearGradient>
      <linearGradient id="brand-blue" x1="13" x2="48" y1="36" y2="81" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#6bd6ff" />
        <stop offset="0.5" stopColor="#168de8" />
        <stop offset="1" stopColor="#075fb6" />
      </linearGradient>
      <linearGradient id="brand-green" x1="48" x2="87" y1="43" y2="78" gradientUnits="userSpaceOnUse">
        <stop offset="0" stopColor="#96f26f" />
        <stop offset="0.48" stopColor="#31bf50" />
        <stop offset="1" stopColor="#0d7f33" />
      </linearGradient>
      <filter id="brand-shadow" x="-20%" y="-20%" width="140%" height="150%">
        <feDropShadow dx="0" dy="3" stdDeviation="2.4" floodColor="#0f172a" floodOpacity="0.25" />
      </filter>
    </defs>

    <path
      d="M22 42a31 31 0 0 1 52 0"
      fill="none"
      stroke="url(#brand-red)"
      strokeLinecap="round"
      strokeWidth="8"
      filter="url(#brand-shadow)"
    />
    <path
      d="M41 20h14v17h17v14H55v17H41V51H24V37h17V20Z"
      fill="url(#brand-red)"
      filter="url(#brand-shadow)"
    />
    <path
      d="M39 39C27 46 21 57 22 72c14-3 24-13 27-30-3-2-6-3-10-3Z"
      fill="url(#brand-blue)"
      filter="url(#brand-shadow)"
    />
    <path
      d="M57 42c13 5 20 15 20 30-15-1-25-11-30-27 3-2 6-3 10-3Z"
      fill="url(#brand-green)"
      filter="url(#brand-shadow)"
    />
    <path
      d="M12 48c0 12 8 17 20 16l6 16 10-18 9 18 8-15c8 0 15-4 19-12"
      fill="none"
      stroke="url(#brand-blue)"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="4.5"
    />
    <path
      d="M75 67c4-14 7-22 15-31 2 12-1 20-15 31Z"
      fill="url(#brand-green)"
      filter="url(#brand-shadow)"
    />
    <path d="M82 61c5-2 9-2 13 0-5 6-10 8-17 7" fill="url(#brand-green)" />
    <circle cx="13" cy="47" r="4" fill="#0b82dc" />
    <circle cx="11" cy="61" r="4" fill="#0b82dc" />
  </svg>
);

export const BrandWordmark = ({ compact = false }) => (
  <span className="brand-wordmark" aria-label="Virtual Vaidya">
    {!compact && (
      <>
        <span className="brand-wordmark__virtual">Virtual</span>
        <span className="brand-wordmark__space"> </span>
      </>
    )}
    <span className="brand-wordmark__vaidya">Vaidya</span>
  </span>
);

export const BrandLogo = ({ compact = false, markSize = 42, className = "" }) => (
  <span className={`brand-logo ${className}`.trim()}>
    <BrandMark size={markSize} />
    <BrandWordmark compact={compact} />
  </span>
);

export default BrandLogo;

interface LogoProps {
  size?: number;
}

export function Logo({ size = 42 }: LogoProps) {
  return (
    <div className="logo-mark" aria-hidden="true" style={{ width: size, height: size }}>
      <svg
        viewBox="0 0 88 88"
        role="img"
        xmlns="http://www.w3.org/2000/svg"
      >
        <rect x="4" y="4" width="80" height="80" rx="22" className="logo-shell" />
        <path
          d="M22 58L35 45"
          className="logo-tail logo-tail-far"
        />
        <path
          d="M27 63L45 45"
          className="logo-tail logo-tail-mid"
        />
        <path
          d="M33 67L55 45"
          className="logo-tail logo-tail-near"
        />
        <path
          d="M56 21L58.977 29.023L67 32L58.977 34.977L56 43L53.023 34.977L45 32L53.023 29.023L56 21Z"
          className="logo-star"
        />
        <path d="M26 22L27.6 26.4L32 28L27.6 29.6L26 34L24.4 29.6L20 28L24.4 26.4L26 22Z" className="logo-spark" />
        <path d="M66 49L67.2 52.3L70.5 53.5L67.2 54.7L66 58L64.8 54.7L61.5 53.5L64.8 52.3L66 49Z" className="logo-spark logo-spark-soft" />
      </svg>
    </div>
  );
}

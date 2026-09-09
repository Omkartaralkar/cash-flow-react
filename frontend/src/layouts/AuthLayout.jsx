export default function AuthLayout({ children, tagline }) {
  return (
    <div className="auth-layout">
      <div className="auth-layout__panel">
        <div className="auth-layout__brand">
          <span className="auth-layout__mark" aria-hidden="true" />
          <span>Swamiraj Cash Flow</span>
        </div>
        <p className="auth-layout__tagline">{tagline}</p>
      </div>

      <div className="auth-layout__form">{children}</div>
    </div>
  );
}

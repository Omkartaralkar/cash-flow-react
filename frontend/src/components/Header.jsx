import { useNavigate } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import { useTheme } from "../hooks/useTheme";
import { useToast } from "../hooks/useToast";

export default function Header({ onMenuClick }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { showToast } = useToast();
  const navigate = useNavigate();

  async function handleLogout() {
    await logout();
    showToast("Signed out.");
    navigate("/login");
  }

  return (
    <header className="header">
      <button
        type="button"
        className="header__menu-btn"
        onClick={onMenuClick}
        aria-label="Open navigation"
      >
        <span />
        <span />
        <span />
      </button>

      <div className="header__title">Cash Flow</div>

      <div className="header__actions">
        <button
          type="button"
          className="theme-toggle"
          onClick={toggleTheme}
          aria-label="Toggle dark mode"
          title="Toggle dark mode"
        >
          {theme === "dark" ? "☀" : "☾"}
        </button>

        <div className="header__user">
          <span className="header__avatar" aria-hidden="true">
            {user ? user.slice(0, 1).toUpperCase() : "?"}
          </span>
          <span className="header__username">{user}</span>
        </div>

        <button type="button" className="btn btn--ghost btn--sm" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}

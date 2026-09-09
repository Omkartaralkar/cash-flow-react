import { Navigate, useLocation } from "react-router-dom";

import { useAuth } from "../hooks/useAuth";
import Loading from "../components/Loading";

export default function ProtectedRoute({ children }) {
  const { user, checking } = useAuth();
  const location = useLocation();

  if (checking) {
    return (
      <div className="full-page-loading">
        <Loading label="Loading…" />
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}

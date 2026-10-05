import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <nav style={styles.nav}>
      <div style={styles.logo}>
        <Link to="/" style={styles.logoLink}>
          🌍 FoodBridge
        </Link>
      </div>

      <div style={styles.links}>
        {user && (
          <>
            <span style={styles.user}>
              {user.name}{" "}
              <span style={styles.role}>({user.role})</span>
            </span>
            <button onClick={handleLogout} style={styles.logoutBtn}>
              Logout
            </button>
          </>
        )}
      </div>
    </nav>
  );
}

const styles = {
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "14px 32px",
    background: "linear-gradient(90deg, #123B5D, #0077B6)",
    color: "white",
    boxShadow: "0 2px 10px rgba(18, 59, 93, 0.25)",
  },
  logo: {
    fontSize: "20px",
    fontWeight: "700",
  },
  logoLink: {
    color: "white",
    textDecoration: "none",
  },
  links: {
    display: "flex",
    alignItems: "center",
    gap: "20px",
  },
  user: {
    fontSize: "14px",
  },
  role: {
    opacity: 0.85,
    fontSize: "13px",
  },
  logoutBtn: {
    background: "#c53030",
    color: "white",
    border: "none",
    padding: "7px 16px",
    borderRadius: "6px",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "500",
  },
};

export default Navbar;
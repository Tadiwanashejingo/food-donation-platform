import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const user = await login(email, password);

      if (user.role === "donor") navigate("/donor");
      else if (user.role === "receiver") navigate("/receiver");
      else if (user.role === "admin") navigate("/admin");
      else navigate("/");
    } catch (err) {
      setError(err.response?.data?.detail || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.brand}>
          <span style={styles.logo}>🌍 FoodBridge</span>
          <p style={styles.tagline}>Connecting surplus food with communities</p>
        </div>

        <h2 style={styles.title}>Welcome back</h2>
        <p style={styles.subtitle}>Sign in to continue</p>

        {error && <div style={styles.error}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              style={styles.input}
              placeholder="Enter your email"
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              style={styles.input}
              placeholder="Enter your password"
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </button>
        </form>

        <p style={styles.footer}>
          Don't have an account?{" "}
          <Link to="/register" style={styles.link}>
            Register
          </Link>
        </p>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    background: "linear-gradient(160deg, #F7F9FA 0%, #e0f2fe 100%)",
    padding: "24px",
  },
  card: {
    background: "white",
    padding: "36px 40px",
    borderRadius: 16,
    boxShadow: "0 8px 30px rgba(18, 59, 93, 0.12)",
    width: "100%",
    maxWidth: 400,
    border: "1px solid #e8ecf0",
  },
  brand: {
    textAlign: "center",
    marginBottom: 24,
  },
  logo: {
    fontSize: 22,
    fontWeight: 700,
    color: "#123B5D",
  },
  tagline: {
    margin: "6px 0 0",
    fontSize: 13,
    color: "#64748b",
  },
  title: {
    margin: "0 0 6px",
    textAlign: "center",
    color: "#123B5D",
    fontSize: 22,
  },
  subtitle: {
    textAlign: "center",
    color: "#64748b",
    marginBottom: 24,
    fontSize: 14,
  },
  field: {
    marginBottom: 16,
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 13,
    fontWeight: 500,
    color: "#475569",
  },
  input: {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 15,
    boxSizing: "border-box",
  },
  button: {
    width: "100%",
    padding: "12px",
    background: "#2E8B57",
    color: "white",
    border: "none",
    borderRadius: 8,
    fontSize: 16,
    fontWeight: 600,
    cursor: "pointer",
    marginTop: 8,
  },
  error: {
    background: "#fce8e6",
    color: "#c5221f",
    padding: "10px 12px",
    borderRadius: 8,
    marginBottom: 16,
    textAlign: "center",
    fontSize: 14,
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    color: "#64748b",
    fontSize: 14,
  },
  link: {
    color: "#0077B6",
    fontWeight: 500,
    textDecoration: "none",
  },
};

export default Login;
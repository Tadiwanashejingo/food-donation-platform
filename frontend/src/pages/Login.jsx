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
      {/* LEFT PANEL — mission / message */}
      <div style={styles.left}>
        <div style={styles.leftContent}>
          <div style={styles.brand}>🌍 FoodBridge</div>
          <h1 style={styles.headline}>
            Share surplus food.
            <br />
            Support your community.
          </h1>
          <p style={styles.message}>
            FoodBridge connects donors with people who need meals — reducing
            waste and fighting hunger with dignity.
          </p>

          <div style={styles.points}>
            <div style={styles.point}>🍱 Donors list surplus food easily</div>
            <div style={styles.point}>🤝 Receivers request food nearby</div>
            <div style={styles.point}>📊 Track real community impact</div>
          </div>

          <p style={styles.sdg}>Aligned with UN SDG 2 — Zero Hunger</p>
        </div>
      </div>

      {/* RIGHT PANEL — login form */}
      <div style={styles.right}>
        <div style={styles.card}>
          <h2 style={styles.title}>Welcome back</h2>
          <p style={styles.subtitle}>Log in to continue to FoodBridge</p>

          {error && <div style={styles.error}>{error}</div>}

          <form onSubmit={handleSubmit}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={styles.input}
                placeholder="you@example.com"
              />
            </div>

            <div style={styles.formGroup}>
              <label style={styles.label}>Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                style={styles.input}
                placeholder="••••••••"
              />
            </div>

            <button type="submit" style={styles.button} disabled={loading}>
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

          <p style={styles.footer}>
            Don’t have an account? <Link to="/register">Register</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    display: "flex",
    fontFamily: "system-ui, -apple-system, Segoe UI, Roboto, sans-serif",
  },
  left: {
    flex: 1,
    background: "linear-gradient(135deg, #123B5D 0%, #0077B6 100%)",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px",
  },
  leftContent: {
    maxWidth: 460,
  },
  brand: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 24,
    letterSpacing: 0.3,
  },
  headline: {
    fontSize: 34,
    lineHeight: 1.25,
    margin: "0 0 16px",
    fontWeight: 700,
  },
  message: {
    fontSize: 16,
    lineHeight: 1.6,
    opacity: 0.95,
    marginBottom: 28,
  },
  points: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
    marginBottom: 28,
  },
  point: {
    background: "rgba(255,255,255,0.12)",
    border: "1px solid rgba(255,255,255,0.2)",
    borderRadius: 10,
    padding: "12px 14px",
    fontSize: 15,
  },
  sdg: {
    margin: 0,
    fontSize: 14,
    opacity: 0.85,
  },
  right: {
    flex: 1,
    background: "#F7F9FA",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "40px 20px",
  },
  card: {
    background: "white",
    width: "100%",
    maxWidth: 400,
    padding: "36px 32px",
    borderRadius: 16,
    boxShadow: "0 8px 30px rgba(0,0,0,0.08)",
  },
  title: {
    margin: "0 0 6px",
    fontSize: 26,
    color: "#1F2933",
  },
  subtitle: {
    margin: "0 0 24px",
    color: "#64748b",
    fontSize: 15,
  },
  formGroup: {
    marginBottom: 16,
  },
  label: {
    display: "block",
    marginBottom: 6,
    fontSize: 14,
    color: "#475569",
    fontWeight: 500,
  },
  input: {
    width: "100%",
    padding: "12px 14px",
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
    fontSize: 14,
    textAlign: "center",
  },
  footer: {
    textAlign: "center",
    marginTop: 20,
    color: "#64748b",
    fontSize: 14,
  },
};

export default Login;
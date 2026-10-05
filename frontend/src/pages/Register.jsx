import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/useAuth";

function Register() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    role: "receiver",
    phone: "",
    city: "",
    area: "",
    pincode: "",
  });
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setLoading(true);

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        role: formData.role,
        phone: formData.phone || null,
        address: {
          city: formData.city,
          area: formData.area || null,
          pincode: formData.pincode || null,
        },
      };

      await register(payload);
      setSuccess("Registration successful! Please login.");
      setTimeout(() => navigate("/login"), 1500);
    } catch (err) {
      setError(err.response?.data?.detail || "Registration failed");
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

        <h2 style={styles.title}>Create account</h2>
        <p style={styles.subtitle}>Join as a donor or receiver</p>

        {error && <div style={styles.error}>{error}</div>}
        {success && <div style={styles.success}>{success}</div>}

        <form onSubmit={handleSubmit}>
          <div style={styles.field}>
            <label style={styles.label}>Full Name</label>
            <input
              name="name"
              value={formData.name}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              minLength={6}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              style={styles.input}
            >
              <option value="receiver">Receiver</option>
              <option value="donor">Donor</option>
            </select>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Phone</label>
            <input
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>City *</label>
            <input
              name="city"
              value={formData.city}
              onChange={handleChange}
              required
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Area</label>
            <input
              name="area"
              value={formData.area}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Pincode</label>
            <input
              name="pincode"
              value={formData.pincode}
              onChange={handleChange}
              style={styles.input}
            />
          </div>

          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Creating account..." : "Register"}
          </button>
        </form>

        <p style={styles.footer}>
          Already have an account?{" "}
          <Link to="/login" style={styles.link}>
            Login
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
    maxWidth: 440,
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
    marginBottom: 14,
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
  success: {
    background: "#e6f4ea",
    color: "#137333",
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

export default Register;
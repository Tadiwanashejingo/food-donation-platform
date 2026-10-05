import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import { useAuth } from "../context/useAuth";

function DonorDashboard() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [message, setMessage] = useState("");
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    food_type: "cooked",
    quantity: "",
    expiry_date: "",
    city: "",
    area: "",
    pincode: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/donations/my/donations");
        setDonations(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const payload = {
        title: formData.title,
        description: formData.description,
        food_type: formData.food_type,
        quantity: formData.quantity,
        expiry_date: new Date(formData.expiry_date).toISOString(),
        pickup_address: {
          city: formData.city,
          area: formData.area || null,
          pincode: formData.pincode || null,
        },
      };
      await api.post("/api/donations", payload);
      setMessage("✅ Donation created successfully. Thank you for sharing.");
      setShowForm(false);
      setFormData({
        title: "",
        description: "",
        food_type: "cooked",
        quantity: "",
        expiry_date: "",
        city: "",
        area: "",
        pincode: "",
      });
      const res = await api.get("/api/donations/my/donations");
      setDonations(res.data);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to create donation");
    }
  };

  const totalDonations = donations.length;
  const completed = donations.filter((d) => d.status === "completed").length;
  const available = donations.filter((d) => d.status === "available").length;

  const firstName = user?.name?.split(" ")[0] || "Donor";

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        {/* ===== WELCOME BANNER ===== */}
        <section style={styles.welcome}>
          <div>
            <h1 style={styles.welcomeTitle}>
              Good day, {firstName} 👋
            </h1>
            <p style={styles.welcomeText}>
              Thank you for helping reduce food waste and support communities.
              Every meal donated is an opportunity to make a difference.
            </p>
            <div style={styles.welcomeActions}>
              <button
                onClick={() => setShowForm(true)}
                style={styles.primaryBtn}
              >
                + Donate Food
              </button>
              <Link to="/manage-requests">
                <button style={styles.secondaryBtn}>Manage Requests</button>
              </Link>
              <Link to="/impact">
                <button style={styles.secondaryBtn}>View Impact</button>
              </Link>
            </div>
          </div>
        </section>

        {/* ===== IMPACT OVERVIEW ===== */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Your Impact Overview</h2>
          <div style={styles.statsGrid}>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🍱</div>
              <div style={styles.statNumber}>{totalDonations}</div>
              <div style={styles.statLabel}>Donations Shared</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>✅</div>
              <div style={styles.statNumber}>{completed}</div>
              <div style={styles.statLabel}>Completed</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🟢</div>
              <div style={styles.statNumber}>{available}</div>
              <div style={styles.statLabel}>Currently Available</div>
            </div>
            <div style={styles.statCard}>
              <div style={styles.statIcon}>🌍</div>
              <div style={styles.statNumber}>SDG 2</div>
              <div style={styles.statLabel}>Zero Hunger</div>
            </div>
          </div>
          <p style={styles.impactStatement}>
            Your contributions help reduce food waste and provide nourishment
            to people in need — supporting{" "}
            <strong>Sustainable Development Goal 2: Zero Hunger</strong>.
          </p>
        </section>

        {/* ===== MESSAGE ===== */}
        {message && (
          <div
            style={{
              ...styles.alert,
              background: message.includes("✅") ? "#e6f4ea" : "#fce8e6",
              color: message.includes("✅") ? "#137333" : "#c5221f",
            }}
          >
            {message}
          </div>
        )}

        {/* ===== CREATE FORM ===== */}
        {showForm && (
          <section style={styles.formCard}>
            <div style={styles.formHeader}>
              <h3 style={{ margin: 0 }}>Share Surplus Food</h3>
              <button
                onClick={() => setShowForm(false)}
                style={styles.closeBtn}
              >
                Cancel
              </button>
            </div>
            <form onSubmit={handleSubmit} style={styles.form}>
              <input
                name="title"
                placeholder="Title (e.g. Fresh Vegetable Biryani) *"
                value={formData.title}
                onChange={handleChange}
                required
                style={styles.input}
              />
              <textarea
                name="description"
                placeholder="Short description — help receivers know what to expect"
                value={formData.description}
                onChange={handleChange}
                style={{ ...styles.input, minHeight: 80 }}
              />
              <div style={styles.formRow}>
                <select
                  name="food_type"
                  value={formData.food_type}
                  onChange={handleChange}
                  style={styles.input}
                >
                  <option value="cooked">Cooked</option>
                  <option value="packaged">Packaged</option>
                  <option value="fruits">Fruits</option>
                  <option value="vegetables">Vegetables</option>
                  <option value="bakery">Bakery</option>
                  <option value="dairy">Dairy</option>
                  <option value="other">Other</option>
                </select>
                <input
                  name="quantity"
                  placeholder="Quantity (e.g. 20 plates) *"
                  value={formData.quantity}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
              </div>
              <input
                type="datetime-local"
                name="expiry_date"
                value={formData.expiry_date}
                onChange={handleChange}
                required
                style={styles.input}
              />
              <div style={styles.formRow}>
                <input
                  name="city"
                  placeholder="City *"
                  value={formData.city}
                  onChange={handleChange}
                  required
                  style={styles.input}
                />
                <input
                  name="area"
                  placeholder="Area"
                  value={formData.area}
                  onChange={handleChange}
                  style={styles.input}
                />
                <input
                  name="pincode"
                  placeholder="Pincode"
                  value={formData.pincode}
                  onChange={handleChange}
                  style={styles.input}
                />
              </div>
              <button type="submit" style={styles.primaryBtn}>
                Submit Donation
              </button>
            </form>
          </section>
        )}

        {/* ===== RECENT DONATIONS ===== */}
        <section style={styles.section}>
          <div style={styles.sectionHeader}>
            <h2 style={styles.sectionTitle}>Your Recent Donations</h2>
            {!showForm && (
              <button
                onClick={() => setShowForm(true)}
                style={styles.smallPrimary}
              >
                + New Donation
              </button>
            )}
          </div>

          {loading ? (
            <Loading text="Loading your donations..." />
          ) : donations.length === 0 ? (
            <div style={styles.empty}>
              <p style={{ fontSize: 18, marginBottom: 8 }}>
                You haven’t shared any food yet.
              </p>
              <p style={{ color: "#64748b", marginBottom: 20 }}>
                Start by creating your first donation and help someone in need.
              </p>
              <button
                onClick={() => setShowForm(true)}
                style={styles.primaryBtn}
              >
                + Create Your First Donation
              </button>
            </div>
          ) : (
            <div style={styles.list}>
              {donations.map((d) => (
                <div key={d._id || d.id} style={styles.donationCard}>
                  <div>
                    <h3 style={styles.donationTitle}>{d.title}</h3>
                    <p style={styles.donationMeta}>
                      {d.food_type} · {d.quantity}
                    </p>
                    <p style={styles.donationLoc}>
                      📍 {d.pickup_address?.city}
                      {d.pickup_address?.area
                        ? `, ${d.pickup_address.area}`
                        : ""}
                    </p>
                  </div>
                  <span
                    style={{
                      ...styles.badge,
                      background:
                        d.status === "available"
                          ? "#e6f4ea"
                          : d.status === "completed"
                          ? "#e8f0fe"
                          : d.status === "requested"
                          ? "#fef7e0"
                          : "#fce8e6",
                      color:
                        d.status === "available"
                          ? "#137333"
                          : d.status === "completed"
                          ? "#1967d2"
                          : d.status === "requested"
                          ? "#b06000"
                          : "#c5221f",
                    }}
                  >
                    {d.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ===== MISSION + TESTIMONIALS ===== */}
        <section style={styles.twoCol}>
          <div style={styles.missionCard}>
            <h3 style={styles.cardHeading}>Our Mission</h3>
            <p style={styles.missionBody}>
              We believe every person deserves access to proper nutrition. By
              connecting surplus food with people in need, we reduce waste and
              restore dignity — one meal at a time.
            </p>
            <p style={styles.missionBody}>
              Your donation supports <strong>SDG 2 – Zero Hunger</strong> and
              strengthens local communities.
            </p>
          </div>

          <div style={styles.testimonialCard}>
            <h3 style={styles.cardHeading}>💙 Voices from the Community</h3>
            <blockquote style={styles.quote}>
              “What may seem like a small donation to one person can make a
              meaningful difference to another family.”
            </blockquote>
            <p style={styles.quoteAuthor}>— Food Distribution Partner</p>
            <p style={styles.demoNote}>Demo testimonial for presentation</p>
          </div>
        </section>

        {/* ===== HOW IT WORKS ===== */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>How Your Donation Helps</h2>
          <div style={styles.steps}>
            <div style={styles.step}>
              <div style={styles.stepNum}>1</div>
              <div>
                <strong>You share surplus food</strong>
                <p>List what you can give and when it can be collected.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNum}>2</div>
              <div>
                <strong>Receivers request it</strong>
                <p>People or organisations in need send a request.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNum}>3</div>
              <div>
                <strong>You accept & complete</strong>
                <p>Approve the request and arrange safe handover.</p>
              </div>
            </div>
            <div style={styles.step}>
              <div style={styles.stepNum}>4</div>
              <div>
                <strong>Impact is recorded</strong>
                <p>Your contribution is tracked on the Impact dashboard.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}

const styles = {
  page: {
    minHeight: "100vh",
    background: "#F7F9FA",
  },
  container: {
    maxWidth: 1100,
    margin: "0 auto",
    padding: "28px 24px 60px",
  },
  welcome: {
    background: "linear-gradient(135deg, #123B5D 0%, #0077B6 100%)",
    color: "white",
    borderRadius: 16,
    padding: "32px 36px",
    marginBottom: 28,
    boxShadow: "0 8px 24px rgba(18, 59, 93, 0.2)",
  },
  welcomeTitle: {
    margin: "0 0 10px",
    fontSize: 28,
    fontWeight: 600,
  },
  welcomeText: {
    margin: "0 0 22px",
    fontSize: 16,
    opacity: 0.95,
    maxWidth: 560,
    lineHeight: 1.5,
  },
  welcomeActions: {
    display: "flex",
    flexWrap: "wrap",
    gap: 12,
  },
  primaryBtn: {
    background: "#2E8B57",
    color: "white",
    border: "none",
    padding: "11px 20px",
    borderRadius: 8,
    fontSize: 15,
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryBtn: {
    background: "rgba(255,255,255,0.15)",
    color: "white",
    border: "1px solid rgba(255,255,255,0.35)",
    padding: "11px 20px",
    borderRadius: 8,
    fontSize: 15,
    cursor: "pointer",
  },
  smallPrimary: {
    background: "#2E8B57",
    color: "white",
    border: "none",
    padding: "8px 14px",
    borderRadius: 6,
    fontSize: 14,
    cursor: "pointer",
  },
  section: {
    marginBottom: 36,
  },
  sectionTitle: {
    margin: "0 0 16px",
    fontSize: 20,
    color: "#1F2933",
  },
  sectionHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
    gap: 16,
    marginBottom: 16,
  },
  statCard: {
    background: "white",
    borderRadius: 12,
    padding: "20px 18px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e8ecf0",
  },
  statIcon: {
    fontSize: 24,
    marginBottom: 8,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 700,
    color: "#123B5D",
  },
  statLabel: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  impactStatement: {
    color: "#475569",
    fontSize: 15,
    lineHeight: 1.6,
    margin: 0,
  },
  alert: {
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 15,
  },
  formCard: {
    background: "white",
    borderRadius: 12,
    padding: 24,
    marginBottom: 28,
    border: "1px solid #e8ecf0",
    boxShadow: "0 2px 8px rgba(0,0,0,0.05)",
  },
  formHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  closeBtn: {
    background: "transparent",
    border: "none",
    color: "#64748b",
    cursor: "pointer",
    fontSize: 14,
  },
  form: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  formRow: {
    display: "flex",
    gap: 12,
    flexWrap: "wrap",
  },
  input: {
    flex: 1,
    minWidth: 140,
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 15,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 12,
  },
  donationCard: {
    background: "white",
    borderRadius: 12,
    padding: "16px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    border: "1px solid #e8ecf0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  donationTitle: {
    margin: "0 0 4px",
    fontSize: 16,
    color: "#1F2933",
  },
  donationMeta: {
    margin: "0 0 4px",
    fontSize: 14,
    color: "#64748b",
  },
  donationLoc: {
    margin: 0,
    fontSize: 13,
    color: "#94a3b8",
  },
  badge: {
    padding: "5px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "capitalize",
  },
  empty: {
    textAlign: "center",
    padding: "48px 24px",
    background: "white",
    borderRadius: 12,
    border: "1px dashed #cbd5e1",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
    marginBottom: 36,
  },
  missionCard: {
    background: "white",
    borderRadius: 12,
    padding: 24,
    border: "1px solid #e8ecf0",
  },
  testimonialCard: {
    background: "linear-gradient(180deg, #f0f9ff 0%, #e0f2fe 100%)",
    borderRadius: 12,
    padding: 24,
    border: "1px solid #bae6fd",
  },
  cardHeading: {
    margin: "0 0 12px",
    fontSize: 17,
    color: "#123B5D",
  },
  missionBody: {
    margin: "0 0 10px",
    color: "#475569",
    lineHeight: 1.6,
    fontSize: 15,
  },
  quote: {
    margin: "0 0 10px",
    fontStyle: "italic",
    color: "#1e3a5f",
    lineHeight: 1.55,
  },
  quoteAuthor: {
    margin: "0 0 8px",
    fontSize: 14,
    color: "#475569",
  },
  demoNote: {
    margin: 0,
    fontSize: 12,
    color: "#94a3b8",
  },
  steps: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: 16,
  },
  step: {
    background: "white",
    borderRadius: 12,
    padding: 18,
    display: "flex",
    gap: 14,
    border: "1px solid #e8ecf0",
  },
  stepNum: {
    width: 32,
    height: 32,
    borderRadius: "50%",
    background: "#0077B6",
    color: "white",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontWeight: 700,
    fontSize: 14,
    flexShrink: 0,
  },
};

export default DonorDashboard;
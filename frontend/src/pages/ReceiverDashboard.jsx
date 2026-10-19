import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";
import { useAuth } from "../context/useAuth";

function ReceiverDashboard() {
  const { user } = useAuth();
  const [donations, setDonations] = useState([]);
  const [myRequests, setMyRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [filterCity, setFilterCity] = useState("");
  const [activeTab, setActiveTab] = useState("available");

  const firstName = user?.name?.split(" ")[0] || "Friend";

  const loadData = async () => {
    setLoading(true);
    try {
      const [donRes, reqRes] = await Promise.all([
        api.get("/api/donations", { params: { status: "available" } }),
        api.get("/api/requests"),
      ]);
      setDonations(donRes.data);
      setMyRequests(reqRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

 useEffect(() => {
  const load = async () => {
    setLoading(true);
    try {
      const [donRes, reqRes] = await Promise.all([
        api.get("/api/donations", { params: { status: "available" } }),
        api.get("/api/requests"),
      ]);
      setDonations(donRes.data);
      setMyRequests(reqRes.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  load();
}, []);

  const showAvailableFood = async () => {
    setActiveTab("available");
    setLoading(true);
    try {
      const params = { status: "available" };
      if (filterCity.trim()) params.city = filterCity.trim();
      const res = await api.get("/api/donations", { params });
      setDonations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
    setTimeout(() => {
      document.getElementById("available-food")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const showMyRequests = () => {
    setActiveTab("requests");
    setTimeout(() => {
      document.getElementById("my-requests")?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }, 50);
  };

  const handleSearch = async () => {
    setLoading(true);
    try {
      const params = { status: "available" };
      if (filterCity.trim()) params.city = filterCity.trim();
      const res = await api.get("/api/donations", { params });
      setDonations(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequest = async (foodId) => {
    setMessage("");
    try {
      await api.post("/api/requests", {
        food_id: foodId,
        message: "I would like to collect this food. Thank you!",
      });
      setMessage("✅ Request submitted successfully. The donor will review it.");
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to submit request");
    }
  };

  const pendingCount = myRequests.filter((r) => r.status === "pending").length;
  const acceptedCount = myRequests.filter((r) => r.status === "accepted").length;
  const completedCount = myRequests.filter((r) => r.status === "completed").length;

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        {/* ===== WELCOME ===== */}
        <section style={styles.welcome}>
          <h1 style={styles.welcomeTitle}>Welcome back, {firstName} 👋</h1>
          <p style={styles.welcomeText}>
            Find available food donations and manage your requests with dignity.
            Everyone deserves access to nutritious food.
          </p>
          <div style={styles.welcomeActions}>
            <button onClick={showAvailableFood} style={styles.primaryBtn}>
              🔎 Find Available Food
            </button>
            <button onClick={showMyRequests} style={styles.secondaryBtn}>
              My Requests
            </button>
            <Link to="/impact">
              <button style={styles.secondaryBtn}>View Impact</button>
            </Link>
          </div>
        </section>

        {/* ===== OVERVIEW CARDS ===== */}
        <section style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🍱</div>
            <div style={styles.statNumber}>{donations.length}</div>
            <div style={styles.statLabel}>Available Now</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📦</div>
            <div style={styles.statNumber}>{pendingCount}</div>
            <div style={styles.statLabel}>Pending Requests</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div style={styles.statNumber}>{acceptedCount}</div>
            <div style={styles.statLabel}>Accepted</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>💙</div>
            <div style={styles.statNumber}>{completedCount}</div>
            <div style={styles.statLabel}>Completed</div>
          </div>
        </section>

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

        {/* ===== TABS ===== */}
        <div style={styles.tabs}>
          <button
            onClick={showAvailableFood}
            style={{
              ...styles.tab,
              ...(activeTab === "available" ? styles.tabActive : {}),
            }}
          >
            Available Food
          </button>
          <button
            onClick={showMyRequests}
            style={{
              ...styles.tab,
              ...(activeTab === "requests" ? styles.tabActive : {}),
            }}
          >
            My Requests ({myRequests.length})
          </button>
        </div>

        {loading ? (
          <Loading text="Loading..." />
        ) : activeTab === "available" ? (
          <section id="available-food">
            <div style={styles.searchRow}>
              <input
                type="text"
                placeholder="Filter by city..."
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                style={styles.input}
              />
              <button onClick={handleSearch} style={styles.primaryBtn}>
                Search
              </button>
            </div>

            {donations.length === 0 ? (
              <div style={styles.empty}>
                <p style={{ fontSize: 17, marginBottom: 8 }}>
                  No available donations right now.
                </p>
                <p style={{ color: "#64748b", margin: 0 }}>
                  Check back soon or try a different city.
                </p>
              </div>
            ) : (
              <div style={styles.list}>
                {donations.map((d) => (
                  <div key={d._id || d.id} style={styles.card}>
                    <div style={styles.cardBody}>
                      <h3 style={styles.cardTitle}>{d.title}</h3>
                      <p style={styles.cardDesc}>{d.description}</p>
                      <p style={styles.cardMeta}>
                        <strong>{d.food_type}</strong> · {d.quantity}
                      </p>
                      <p style={styles.cardMeta}>
                        Donor: {d.donor_name || "Community donor"}
                      </p>
                      <p style={styles.cardLoc}>
                        📍 {d.pickup_address?.city}
                        {d.pickup_address?.area
                          ? `, ${d.pickup_address.area}`
                          : ""}
                      </p>
                      <p style={styles.cardExpiry}>
                        Available until:{" "}
                        {new Date(d.expiry_date).toLocaleString()}
                      </p>
                    </div>
                    <button
                      onClick={() => handleRequest(d._id || d.id)}
                      style={styles.requestBtn}
                    >
                      Request Food
                    </button>
                  </div>
                ))}
              </div>
            )}
          </section>
        ) : (
          <section id="my-requests">
            {myRequests.length === 0 ? (
              <div style={styles.empty}>
                <p style={{ fontSize: 17, marginBottom: 8 }}>
                  You have no requests yet.
                </p>
                <p style={{ color: "#64748b", marginBottom: 16 }}>
                  Browse available food and submit a request.
                </p>
                <button onClick={showAvailableFood} style={styles.primaryBtn}>
                  Find Available Food
                </button>
              </div>
            ) : (
              <div style={styles.list}>
                {myRequests.map((r) => (
                  <div key={r._id || r.id} style={styles.card}>
                    <div style={styles.cardBody}>
                      <h3 style={styles.cardTitle}>
                        {r.food_title || "Food item"}
                      </h3>
                      {r.message && (
                        <p style={styles.cardDesc}>{r.message}</p>
                      )}
                      <p style={styles.cardMeta}>
                        Requested:{" "}
                        {new Date(r.requested_at).toLocaleString()}
                      </p>
                      <span
                        style={{
                          ...styles.badge,
                          background:
                            r.status === "pending"
                              ? "#fef7e0"
                              : r.status === "accepted"
                              ? "#e6f4ea"
                              : r.status === "completed"
                              ? "#e8f0fe"
                              : "#fce8e6",
                          color:
                            r.status === "pending"
                              ? "#b06000"
                              : r.status === "accepted"
                              ? "#137333"
                              : r.status === "completed"
                              ? "#1967d2"
                              : "#c5221f",
                        }}
                      >
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>
        )}

        {/* ===== DIGNITY MESSAGE ===== */}
        <section style={styles.dignity}>
          <h3 style={{ margin: "0 0 10px", color: "#123B5D" }}>
            Food with dignity
          </h3>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
            This platform exists so that surplus food reaches people who need
            it — with respect, transparency, and care. Your requests help
            reduce waste and support <strong>SDG 2 – Zero Hunger</strong>.
          </p>
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
    marginBottom: 24,
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
    maxWidth: 520,
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
  statsGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
    gap: 16,
    marginBottom: 24,
  },
  statCard: {
    background: "white",
    borderRadius: 12,
    padding: "18px 16px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e8ecf0",
  },
  statIcon: { fontSize: 22, marginBottom: 6 },
  statNumber: {
    fontSize: 26,
    fontWeight: 700,
    color: "#123B5D",
  },
  statLabel: {
    fontSize: 13,
    color: "#64748b",
    marginTop: 4,
  },
  alert: {
    padding: "12px 16px",
    borderRadius: 8,
    marginBottom: 20,
    fontSize: 15,
  },
  tabs: {
    display: "flex",
    gap: 8,
    marginBottom: 20,
  },
  tab: {
    padding: "10px 18px",
    borderRadius: 8,
    border: "1px solid #e2e8f0",
    background: "white",
    cursor: "pointer",
    fontSize: 14,
    color: "#475569",
  },
  tabActive: {
    background: "#123B5D",
    color: "white",
    borderColor: "#123B5D",
  },
  searchRow: {
    display: "flex",
    gap: 10,
    marginBottom: 20,
    flexWrap: "wrap",
  },
  input: {
    padding: "11px 14px",
    border: "1px solid #cbd5e1",
    borderRadius: 8,
    fontSize: 15,
    minWidth: 220,
  },
  list: {
    display: "flex",
    flexDirection: "column",
    gap: 14,
  },
  card: {
    background: "white",
    borderRadius: 12,
    padding: "18px 20px",
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    gap: 16,
    border: "1px solid #e8ecf0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  cardBody: { flex: 1 },
  cardTitle: {
    margin: "0 0 6px",
    fontSize: 17,
    color: "#1F2933",
  },
  cardDesc: {
    margin: "0 0 8px",
    color: "#64748b",
    fontSize: 14,
  },
  cardMeta: {
    margin: "0 0 4px",
    fontSize: 14,
    color: "#475569",
  },
  cardLoc: {
    margin: "0 0 4px",
    fontSize: 13,
    color: "#64748b",
  },
  cardExpiry: {
    margin: 0,
    fontSize: 12,
    color: "#94a3b8",
  },
  requestBtn: {
    background: "#0077B6",
    color: "white",
    border: "none",
    padding: "10px 16px",
    borderRadius: 8,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 600,
    whiteSpace: "nowrap",
  },
  badge: {
    display: "inline-block",
    marginTop: 8,
    padding: "4px 12px",
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
  dignity: {
    marginTop: 36,
    background: "white",
    borderRadius: 12,
    padding: 24,
    border: "1px solid #e8ecf0",
  },
};

export default ReceiverDashboard;
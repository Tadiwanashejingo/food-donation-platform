import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import { useAuth } from "../context/useAuth";
import Loading from "../components/Loading";

function ImpactStats() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { user } = useAuth();

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get("/api/dashboard/stats");
        setStats(res.data);
      } catch (err) {
        setError(err.response?.data?.detail || "Failed to load statistics");
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return (
      <div style={styles.page}>
        <Navbar />
        <Loading text="Loading impact statistics..." />
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.page}>
        <Navbar />
        <div style={{ padding: 40, color: "#c5221f", textAlign: "center" }}>
          {error}
        </div>
      </div>
    );
  }

  const backPath =
    user?.role === "donor" ? "/donor" : user?.role === "receiver" ? "/receiver" : "/";

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        {/* Header */}
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Impact Dashboard</h1>
            <p style={styles.subtitle}>
              Platform-wide contribution to <strong>SDG 2 – Zero Hunger</strong>
            </p>
          </div>
          <Link to={backPath} style={styles.backLink}>
            ← Back to Dashboard
          </Link>
        </div>

        {/* Main stats */}
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🍱</div>
            <div style={styles.statNumber}>{stats.total_donations}</div>
            <div style={styles.statLabel}>Total Donations</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>✅</div>
            <div style={{ ...styles.statNumber, color: "#2E8B57" }}>
              {stats.completed_donations}
            </div>
            <div style={styles.statLabel}>Completed</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🟢</div>
            <div style={{ ...styles.statNumber, color: "#0077B6" }}>
              {stats.available_donations}
            </div>
            <div style={styles.statLabel}>Available Now</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📨</div>
            <div style={styles.statNumber}>{stats.total_requests}</div>
            <div style={styles.statLabel}>Total Requests</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👤</div>
            <div style={styles.statNumber}>{stats.active_donors}</div>
            <div style={styles.statLabel}>Active Donors</div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>🤝</div>
            <div style={styles.statNumber}>{stats.active_receivers}</div>
            <div style={styles.statLabel}>Active Receivers</div>
          </div>
        </div>

        {/* Impact statement */}
        <div style={styles.statement}>
          Together we are reducing food waste and connecting surplus food with
          people who need it — one donation at a time.
        </div>

        {/* Two columns */}
        <div style={styles.twoCol}>
          {/* Food by type */}
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Food Donations by Type</h3>
            {stats.food_by_type && stats.food_by_type.length > 0 ? (
              <div>
                {stats.food_by_type.map((item, index) => (
                  <div key={index} style={styles.listRow}>
                    <span style={{ textTransform: "capitalize" }}>
                      {item.food_type}
                    </span>
                    <strong style={{ color: "#123B5D" }}>{item.count}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.emptyText}>No data yet</p>
            )}
          </div>

          {/* By city */}
          <div style={styles.panel}>
            <h3 style={styles.panelTitle}>Donations by City</h3>
            {stats.donations_by_city && stats.donations_by_city.length > 0 ? (
              <div>
                {stats.donations_by_city.map((item, index) => (
                  <div key={index} style={styles.listRow}>
                    <span>{item.city || "Unknown"}</span>
                    <strong style={{ color: "#123B5D" }}>{item.count}</strong>
                  </div>
                ))}
              </div>
            ) : (
              <p style={styles.emptyText}>No data yet</p>
            )}
          </div>
        </div>

        {/* Mission footer */}
        <div style={styles.missionBox}>
          <h3 style={{ margin: "0 0 10px", color: "#123B5D" }}>
            Why this matters
          </h3>
          <p style={{ margin: 0, color: "#475569", lineHeight: 1.6 }}>
            Every completed donation helps divert edible food from waste and
            provides nourishment to individuals and communities. This platform
            supports <strong>Sustainable Development Goal 2 – Zero Hunger</strong>.
          </p>
        </div>
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
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 28,
    flexWrap: "wrap",
    gap: 12,
  },
  title: {
    margin: "0 0 6px",
    fontSize: 28,
    color: "#123B5D",
  },
  subtitle: {
    margin: 0,
    color: "#64748b",
    fontSize: 15,
  },
  backLink: {
    color: "#0077B6",
    textDecoration: "none",
    fontSize: 15,
    fontWeight: 500,
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
    padding: "20px 16px",
    textAlign: "center",
    boxShadow: "0 2px 8px rgba(0,0,0,0.06)",
    border: "1px solid #e8ecf0",
  },
  statIcon: {
    fontSize: 22,
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
  statement: {
    background: "linear-gradient(135deg, #e0f2fe 0%, #f0fdf4 100%)",
    borderRadius: 12,
    padding: "18px 22px",
    marginBottom: 28,
    color: "#1e3a5f",
    fontSize: 15,
    lineHeight: 1.55,
    border: "1px solid #bae6fd",
  },
  twoCol: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
    gap: 20,
    marginBottom: 28,
  },
  panel: {
    background: "white",
    borderRadius: 12,
    padding: 22,
    border: "1px solid #e8ecf0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  panelTitle: {
    margin: "0 0 16px",
    fontSize: 17,
    color: "#123B5D",
  },
  listRow: {
    display: "flex",
    justifyContent: "space-between",
    padding: "10px 0",
    borderBottom: "1px solid #f1f5f9",
    fontSize: 15,
  },
  emptyText: {
    color: "#94a3b8",
    margin: 0,
  },
  missionBox: {
    background: "white",
    borderRadius: 12,
    padding: 24,
    border: "1px solid #e8ecf0",
  },
};

export default ImpactStats;
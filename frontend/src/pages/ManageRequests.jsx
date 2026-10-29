import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import api from "../api/axios";
import Navbar from "../components/Navbar";
import Loading from "../components/Loading";

function ManageRequests() {
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get("/api/requests");
        setRequests(res.data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const updateStatus = async (requestId, newStatus) => {
    setMessage("");
    try {
      await api.patch(`/api/requests/${requestId}`, { status: newStatus });
      setMessage(`✅ Request marked as ${newStatus}`);

      const res = await api.get("/api/requests");
      setRequests(res.data);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to update request");
    }
  };

  const pending = requests.filter((r) => r.status === "pending").length;
  const accepted = requests.filter((r) => r.status === "accepted").length;
  const completed = requests.filter((r) => r.status === "completed").length;

  return (
    <div style={styles.page}>
      <Navbar />

      <div style={styles.container}>
        <div style={styles.header}>
          <div>
            <h1 style={styles.title}>Manage Requests</h1>
            <p style={styles.subtitle}>
              Review and respond to requests for your donations
            </p>
          </div>
          <Link to="/donor" style={styles.backLink}>
            ← Back to Dashboard
          </Link>
        </div>

        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statNumber}>{requests.length}</div>
            <div style={styles.statLabel}>Total</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNumber, color: "#b06000" }}>
              {pending}
            </div>
            <div style={styles.statLabel}>Pending</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNumber, color: "#2E8B57" }}>
              {accepted}
            </div>
            <div style={styles.statLabel}>Accepted</div>
          </div>
          <div style={styles.statCard}>
            <div style={{ ...styles.statNumber, color: "#0077B6" }}>
              {completed}
            </div>
            <div style={styles.statLabel}>Completed</div>
          </div>
        </div>

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

        {loading ? (
          <Loading text="Loading requests..." />
        ) : requests.length === 0 ? (
          <div style={styles.empty}>
            <p style={{ fontSize: 17, marginBottom: 8 }}>
              No requests received yet.
            </p>
            <p style={{ color: "#64748b", margin: 0 }}>
              When receivers request your food, they will appear here.
            </p>
          </div>
        ) : (
          <div style={styles.list}>
            {requests.map((r) => (
              <div key={r._id || r.id} style={styles.card}>
                <div style={styles.cardBody}>
                  <h3 style={styles.cardTitle}>
                    {r.food_title || "Food item"}
                  </h3>
                  <p style={styles.cardMeta}>
                    <strong>Requested by:</strong>{" "}
                    {r.receiver_name || "Unknown"}
                  </p>
                  {r.message && (
                    <p style={styles.cardMsg}>
                      <strong>Message:</strong> {r.message}
                    </p>
                  )}
                  <p style={styles.cardDate}>
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

                  {/* Contact box after accept */}
                  {r.status === "accepted" && (
                    <div style={styles.contactBox}>
                      <strong style={{ color: "#137333" }}>
                        Contact receiver to arrange pickup
                      </strong>
                      <p style={styles.contactText}>
                        {r.receiver_name && (
                          <>
                            Name: {r.receiver_name}
                            <br />
                          </>
                        )}
                        {r.receiver_phone && (
                          <>
                            Phone: {r.receiver_phone}
                            <br />
                          </>
                        )}
                        {r.receiver_email && <>Email: {r.receiver_email}</>}
                        {!r.receiver_phone && !r.receiver_email && (
                          <span style={{ color: "#64748b" }}>
                            No phone/email on receiver profile
                          </span>
                        )}
                      </p>
                    </div>
                  )}
                </div>

                <div style={styles.actions}>
                  {r.status === "pending" && (
                    <>
                      <button
                        onClick={() =>
                          updateStatus(r._id || r.id, "accepted")
                        }
                        style={styles.acceptBtn}
                      >
                        Accept
                      </button>
                      <button
                        onClick={() =>
                          updateStatus(r._id || r.id, "rejected")
                        }
                        style={styles.rejectBtn}
                      >
                        Reject
                      </button>
                    </>
                  )}
                  {r.status === "accepted" && (
                    <button
                      onClick={() =>
                        updateStatus(r._id || r.id, "completed")
                      }
                      style={styles.completeBtn}
                    >
                      Mark Completed
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
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
    maxWidth: 1000,
    margin: "0 auto",
    padding: "28px 24px 60px",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 24,
    flexWrap: "wrap",
    gap: 12,
  },
  title: {
    margin: "0 0 6px",
    fontSize: 26,
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
    gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
    gap: 14,
    marginBottom: 24,
  },
  statCard: {
    background: "white",
    borderRadius: 12,
    padding: "16px",
    textAlign: "center",
    border: "1px solid #e8ecf0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  statNumber: {
    fontSize: 24,
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
    gap: 20,
    border: "1px solid #e8ecf0",
    boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
  },
  cardBody: { flex: 1 },
  cardTitle: {
    margin: "0 0 8px",
    fontSize: 17,
    color: "#1F2933",
  },
  cardMeta: {
    margin: "0 0 4px",
    fontSize: 14,
    color: "#475569",
  },
  cardMsg: {
    margin: "0 0 6px",
    fontSize: 14,
    color: "#64748b",
  },
  cardDate: {
    margin: "0 0 10px",
    fontSize: 12,
    color: "#94a3b8",
  },
  badge: {
    display: "inline-block",
    padding: "4px 12px",
    borderRadius: 20,
    fontSize: 12,
    fontWeight: 600,
    textTransform: "capitalize",
  },
  contactBox: {
    marginTop: 12,
    padding: 12,
    background: "#e6f4ea",
    borderRadius: 8,
    border: "1px solid #c6e6c8",
  },
  contactText: {
    margin: "8px 0 0",
    color: "#1F2933",
    lineHeight: 1.5,
    fontSize: 14,
  },
  actions: {
    display: "flex",
    flexDirection: "column",
    gap: 8,
  },
  acceptBtn: {
    background: "#2E8B57",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  },
  rejectBtn: {
    background: "#c53030",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  },
  completeBtn: {
    background: "#0077B6",
    color: "white",
    border: "none",
    padding: "8px 16px",
    borderRadius: 6,
    cursor: "pointer",
    fontSize: 14,
    fontWeight: 500,
  },
  empty: {
    textAlign: "center",
    padding: "48px 24px",
    background: "white",
    borderRadius: 12,
    border: "1px dashed #cbd5e1",
  },
};

export default ManageRequests;
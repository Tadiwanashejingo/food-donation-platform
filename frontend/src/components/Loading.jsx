function Loading({ text = "Loading..." }) {
  return (
    <div style={styles.container}>
      <div style={styles.spinner}></div>
      <p style={styles.text}>{text}</p>
    </div>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    padding: "60px 20px",
    color: "#718096",
  },
  spinner: {
    width: "36px",
    height: "36px",
    border: "4px solid #e2e8f0",
    borderTop: "4px solid #38a169",
    borderRadius: "50%",
    animation: "spin 0.8s linear infinite",
    marginBottom: "16px",
  },
  text: {
    margin: 0,
    fontSize: "15px",
  },
};

export default Loading;
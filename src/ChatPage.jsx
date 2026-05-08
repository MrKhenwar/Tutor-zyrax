import React from "react";
import { useNavigate } from "react-router-dom";
import { ChatSection } from "./AdminChat";

const ChatPage = () => {
  const navigate = useNavigate();

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <h2 style={styles.mainTitle}>💬 Messages</h2>
        <button onClick={() => navigate("/")} style={styles.backButton}>
          ← Back to Dashboard
        </button>
      </div>
      <ChatSection fullPage />
    </div>
  );
};

const styles = {
  container: {
    padding: "20px",
    maxWidth: "1400px",
    margin: "0 auto",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "20px",
    flexWrap: "wrap",
    gap: "10px",
  },
  mainTitle: {
    color: "#333",
    margin: "0",
    fontSize: "28px",
  },
  backButton: {
    padding: "10px 20px",
    borderRadius: "8px",
    border: "none",
    backgroundColor: "#6c757d",
    color: "#fff",
    cursor: "pointer",
    fontSize: "14px",
    fontWeight: "bold",
  },
};

export default ChatPage;

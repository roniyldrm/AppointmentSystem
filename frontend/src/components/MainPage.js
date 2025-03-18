import React from "react";
import { Link } from "react-router-dom";

const MainPage = () => {
  const styles = {
    container: {
      fontFamily: "Inter, sans-serif",
      textAlign: "center",
      backgroundColor: "#F4F6F9",
      minHeight: "100vh",
    },
    header: {
      width: "100%",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
      padding: "15px 30px",
      backgroundColor: "#2C7BE5",
      color: "white",
      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
      boxSizing: "border-box",
    },
    title: {
      fontSize: "24px",
      fontWeight: "bold",
      flexGrow: 1, // Ensures it takes available space
      textAlign: "left",
      color: "white"
    },
    authButtons: {
      display: "flex",
      flexWrap: "nowrap", // Prevents wrapping
      gap: "10px",
    },
    button: {
      padding: "10px 15px",
      border: "none",
      cursor: "pointer",
      fontSize: "16px",
      borderRadius: "8px",
      transition: "0.3s ease-in-out",
      whiteSpace: "nowrap", // Prevents button text from wrapping
    },
    loginButton: {
      backgroundColor: "white",
      color: "#2C7BE5",
      border: "2px solid white",
    },
    registerButton: {
      backgroundColor: "#28A745",
      color: "white",
    },
    mainContent: {
      marginTop: "80px",
      padding: "20px",
    },
    heading: {
      fontSize: "32px",
      color: "#2C7BE5",
      fontWeight: "bold",
    },
    subtext: {
      fontSize: "18px",
      color: "#555",
    },
  };

  return (
    <div style={styles.container}>
        <header style={styles.header}>
            <Link to="/">
                <button
                    style={{
                        background: "transparent",
                        border: "none",
                        padding: "0",
                        cursor: "pointer",
                    }}
                    onMouseOver={(e) => (e.target.style.opacity = 0.8)}
                    onMouseOut={(e) => (e.target.style.opacity = 1)}
                >
                    <h1 style={styles.title}>HealthCare Management</h1>
                </button>
            </Link>
            <div style={styles.authButtons}>
            <Link to="/login">
            <button 
                style={{ ...styles.button, ...styles.loginButton }}
                onMouseOver={(e) => (e.target.style.opacity = 0.8)}
                onMouseOut={(e) => (e.target.style.opacity = 1)}>
                Login
            </button>
            </Link>
            <Link to="register">
                <button 
                    style={{ ...styles.button, ...styles.registerButton }}
                    onMouseOver={(e) => (e.target.style.opacity = 0.8)}
                    onMouseOut={(e) => (e.target.style.opacity = 1)}>
                    Register
                </button>
            </Link>
            </div>
        </header>
      <main style={styles.mainContent}>
        <h2 style={styles.heading}>Effortless Appointment Management</h2>
        <p style={styles.subtext}>
          Schedule and manage appointments seamlessly with our intuitive system.
        </p>
      </main>
    </div>
  );
};

export default MainPage;

import React, { useState } from "react";
import { Link } from "react-router-dom";


const LoginPage = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const isDisabled = !email || !password

  const handleLogin = (e) => {
    e.preventDefault();
    
  };

  const styles = {
    container: {
      fontFamily: "Inter, sans-serif",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#F4F6F9",
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
    formContainer: {
      width: "100%",
      maxWidth: "400px",
      backgroundColor: "white",
      padding: "40px",
      borderRadius: "10px",
      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
    },
    title: {
        fontSize: "24px",
        fontWeight: "bold",
        flexGrow: 1, // Ensures it takes available space
        textAlign: "left",
        color: "white"
      },
    loginTitle: {
      fontSize: "28px",
      fontWeight: "bold",
      color: "#2C7BE5",
      marginBottom: "20px",
    },
    input: {
      width: "100%",
      padding: "12px",
      margin: "10px 0",
      borderRadius: "8px",
      border: "1px solid #ccc",
      fontSize: "16px",
      boxSizing: "border-box",
    },
    button: {
        width: "100%",
        padding: "12px",
        border: "none",
        cursor: "pointer",
        fontSize: "16px",
        borderRadius: "8px",
        backgroundColor: "#2C7BE5", // Normal state color
        color: "white",
        marginTop: "20px",
        transition: "0.3s ease-in-out",
      },
      buttonDisabled: {
        width: "100%",
        padding: "12px",
        border: "none",
        cursor: "not-allowed",  // Disabled cursor
        fontSize: "16px",
        borderRadius: "8px",
        backgroundColor: "#699EE4", // Softer shade of blue for disabled state
        color: "#BCC9D3", // Lighter grayish color for text
        marginTop: "20px",
        transition: "0.3s ease-in-out",
      },
    error: {
      color: "#E63946",
      marginTop: "10px",
    },
    registerLink: {
      marginTop: "15px",
      fontSize: "14px",
      color: "#28A745",
      textDecoration: "none",
    },
  };

  return (
    <div>
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
        </header>
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <h2 style={styles.loginTitle}>Login</h2>
        <form onSubmit={handleLogin}>
        {error && <div style={styles.error}>{error}</div>}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          {error && <div style={styles.error}>{error}</div>}
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <button type="submit"   style={isDisabled ? styles.buttonDisabled : styles.button}
  disabled={isDisabled}>
            Login
          </button>
        </form>
        {error && <div style={styles.error}>{error}</div>}
        <a href="/register" style={styles.registerLink}>
          Don't have an account? Register
        </a>
      </div>
    </div>
    </div>
  );
};

export default LoginPage;

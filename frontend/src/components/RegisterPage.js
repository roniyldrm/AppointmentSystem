import React, { useState } from "react";
import { Link } from "react-router-dom";


const RegisterPage = () => {
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

    const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); 
    setLoading(true);
    const role = "user"

    try {
      const response = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, role }),
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Something went wrong!");
        console.log(data)
      } else {
        const data = await response.json();
        alert("Login Successful!");
        console.log(data)
      }
    } catch (err) {
      setError("An error occurred while logging in.");
    } finally {
      setLoading(false); 
    }
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
    formContainer: {
      width: "100%",
      maxWidth: "400px",
      backgroundColor: "white",
      padding: "40px",
      borderRadius: "10px",
      boxShadow: "0px 4px 6px rgba(0, 0, 0, 0.1)",
      textAlign: "center",
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
        flexGrow: 1, 
        textAlign: "left",
        color: "white"
      },
    registerTitle: {
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
        backgroundColor: "#2C7BE5", 
        color: "white",
        marginTop: "20px",
        transition: "0.3s ease-in-out",
      },
      buttonDisabled: {
        width: "100%",
        padding: "12px",
        border: "none",
        cursor: "not-allowed",
        fontSize: "16px",
        borderRadius: "8px",
        backgroundColor: "#699EE4",
        color: "#BCC9D3",
        marginTop: "20px",
        transition: "0.3s ease-in-out",
      },
    error: {
      color: "#E63946",
      marginTop: "10px",
    },
    loginLink: {
      marginTop: "15px",
      fontSize: "14px",
      color: "#28A745",
      textDecoration: "none",
    },
  };

  return (
    <>
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
        <h2 style={styles.title}>Register</h2>
        {error && <div style={styles.error}>{error}</div>}
        <form onSubmit={handleRegister}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            style={styles.input}
          />
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          <button type="submit" style={styles.button}>
          {loading ? "Registering ..." : "Register"}
          </button>
        </form>
        <a href="/login" style={styles.loginLink}>
          Already have an account? Login here
        </a>
      </div>
    </div>
    </>
  );
};

export default RegisterPage;

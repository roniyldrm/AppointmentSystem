import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";

const MainPage = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in
    const token = localStorage.getItem("token");
    setIsLoggedIn(!!token);
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    setIsLoggedIn(false);
    // Optionally redirect to login page
    navigate("/login");
  };

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
    logoutButton: {
      backgroundColor: "#DC3545",
      color: "white",
    },
    mainContent: {
      marginTop: "40px",
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
      marginBottom: "40px",
    },
    featuresContainer: {
      display: "flex",
      flexWrap: "wrap",
      justifyContent: "center",
      gap: "20px",
      maxWidth: "1200px",
      margin: "0 auto",
      padding: "20px",
    },
    featureCard: {
      backgroundColor: "white",
      borderRadius: "10px",
      padding: "30px 20px",
      boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
      width: "300px",
      transition: "transform 0.3s ease, box-shadow 0.3s ease",
      cursor: "pointer",
    },
    featureCardHover: {
      transform: "translateY(-10px)",
      boxShadow: "0 10px 20px rgba(0, 0, 0, 0.1)",
    },
    featureIcon: {
      fontSize: "48px",
      color: "#2C7BE5",
      marginBottom: "15px",
    },
    featureTitle: {
      fontSize: "20px",
      fontWeight: "bold",
      color: "#333",
      marginBottom: "10px",
    },
    featureDescription: {
      fontSize: "16px",
      color: "#666",
      lineHeight: "1.5",
    },
    ctaButton: {
      padding: "12px 25px",
      fontSize: "18px",
      backgroundColor: "#2C7BE5",
      color: "white",
      border: "none",
      borderRadius: "8px",
      cursor: "pointer",
      marginTop: "30px",
      transition: "background-color 0.3s ease",
    },
    navMenu: {
      display: "flex",
      gap: "20px",
    },
    navLink: {
      color: "white",
      textDecoration: "none",
      padding: "5px 10px",
      borderRadius: "5px",
      transition: "background-color 0.3s ease",
    },
    navLinkHover: {
      backgroundColor: "rgba(255, 255, 255, 0.1)",
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
        
        {isLoggedIn ? (
          <>
            <div style={styles.navMenu}>
              <Link 
                to="/appointment" 
                style={styles.navLink}
                onMouseOver={(e) => (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.1)")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "transparent")}
              >
                Book Appointment
              </Link>
              <Link 
                to="/profile" 
                style={styles.navLink}
                onMouseOver={(e) => (e.target.style.backgroundColor = "rgba(255, 255, 255, 0.1)")}
                onMouseOut={(e) => (e.target.style.backgroundColor = "transparent")}
              >
                My Profile
              </Link>
            </div>
            <button 
              style={{ ...styles.button, ...styles.logoutButton }}
              onClick={handleLogout}
              onMouseOver={(e) => (e.target.style.opacity = 0.8)}
              onMouseOut={(e) => (e.target.style.opacity = 1)}
            >
              Logout
            </button>
          </>
        ) : (
          <div style={styles.authButtons}>
            <Link to="/login">
              <button 
                style={{ ...styles.button, ...styles.loginButton }}
                onMouseOver={(e) => (e.target.style.opacity = 0.8)}
                onMouseOut={(e) => (e.target.style.opacity = 1)}
              >
                Login
              </button>
            </Link>
            <Link to="/register">
              <button 
                style={{ ...styles.button, ...styles.registerButton }}
                onMouseOver={(e) => (e.target.style.opacity = 0.8)}
                onMouseOut={(e) => (e.target.style.opacity = 1)}
              >
                Register
              </button>
            </Link>
          </div>
        )}
      </header>
      
      <main style={styles.mainContent}>
        <h2 style={styles.heading}>Effortless Appointment Management</h2>
        <p style={styles.subtext}>
          Schedule and manage appointments seamlessly with our intuitive system.
        </p>
        
        <div style={styles.featuresContainer}>
          <div 
            style={styles.featureCard}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-10px)";
              e.currentTarget.style.boxShadow = "0 10px 20px rgba(0, 0, 0, 0.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
            }}
            onClick={() => isLoggedIn ? navigate("/appointment") : navigate("/login")}
          >
            <div style={styles.featureIcon}>📅</div>
            <h3 style={styles.featureTitle}>Book Appointments</h3>
            <p style={styles.featureDescription}>
              Easily schedule appointments with doctors across multiple hospitals and clinics.
            </p>
          </div>
          
          <div 
            style={styles.featureCard}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-10px)";
              e.currentTarget.style.boxShadow = "0 10px 20px rgba(0, 0, 0, 0.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
            }}
            onClick={() => isLoggedIn ? navigate("/profile") : navigate("/login")}
          >
            <div style={styles.featureIcon}>👤</div>
            <h3 style={styles.featureTitle}>Manage Profile</h3>
            <p style={styles.featureDescription}>
              View and manage your upcoming and past appointments in one place.
            </p>
          </div>
          
          <div 
            style={styles.featureCard}
            onMouseOver={(e) => {
              e.currentTarget.style.transform = "translateY(-10px)";
              e.currentTarget.style.boxShadow = "0 10px 20px rgba(0, 0, 0, 0.1)";
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.transform = "translateY(0)";
              e.currentTarget.style.boxShadow = "0 4px 6px rgba(0, 0, 0, 0.1)";
            }}
          >
            <div style={styles.featureIcon}>🔔</div>
            <h3 style={styles.featureTitle}>Real-time Updates</h3>
            <p style={styles.featureDescription}>
              Receive notifications and updates about your appointments in real-time.
            </p>
          </div>
        </div>
        
        {!isLoggedIn && (
          <Link to="/register">
            <button 
              style={styles.ctaButton}
              onMouseOver={(e) => (e.target.style.backgroundColor = "#1A56A2")}
              onMouseOut={(e) => (e.target.style.backgroundColor = "#2C7BE5")}
            >
              Get Started
            </button>
          </Link>
        )}
      </main>
    </div>
  );
};

export default MainPage;

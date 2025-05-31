import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    password: "",
    confirmPassword: ""
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(""); 
    setLoading(true);

    // Validate form
    if (formData.password !== formData.confirmPassword) {
      setError("Şifreler eşleşmiyor!");
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError("Şifre en az 6 karakter olmalıdır!");
      setLoading(false);
      return;
    }

    const role = "user";

    try {
      // Step 1: Register the user
      const registerResponse = await fetch("http://localhost:8080/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: formData.email,
          password: formData.password,
          role
        }),
      });

      if (!registerResponse.ok) {
        const data = await registerResponse.json();
        setError(data.error || "Kayıt sırasında bir hata oluştu!");
        console.log(data);
        setLoading(false);
        return;
      }

      const userData = await registerResponse.json();
      
      // Store essential user data in localStorage
      localStorage.setItem('userFirstName', formData.firstName);
      localStorage.setItem('userLastName', formData.lastName);
      localStorage.setItem('userEmail', formData.email);
      localStorage.setItem('userPhone', formData.phone);
      
      // Step 2: Create user profile with additional info using the userCode from registration
      if (userData && userData.userCode) {
        try {
          const profileResponse = await fetch(`http://localhost:8080/api/user/${userData.userCode}/profile`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "Authorization": `Bearer ${userData.accessToken}`
            },
            body: JSON.stringify({
              userCode: userData.userCode,
              firstName: formData.firstName,
              lastName: formData.lastName,
              email: formData.email,
              phone: formData.phone
            }),
          });

          if (!profileResponse.ok) {
            console.error("Profil bilgileri kaydedilemedi!");
          }
        } catch (profileErr) {
          console.error("Profil oluşturma hatası:", profileErr);
        }
      }

      alert("Kayıt başarılı! Giriş yapabilirsiniz.");
      navigate('/login');
    } catch (err) {
      setError("Kayıt sırasında bir hata oluştu.");
      console.error(err);
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
      minHeight: "100vh",
      backgroundColor: "#F4F6F9",
      padding: "20px 0",
    },
    formContainer: {
      width: "100%",
      maxWidth: "500px",
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
    inputRow: {
      display: "flex",
      gap: "10px",
      width: "100%",
    },
    inputGroup: {
      flex: 1,
      marginBottom: "15px",
    },
    label: {
      display: "block",
      textAlign: "left",
      marginBottom: "5px",
      fontSize: "14px",
      fontWeight: "500",
      color: "#495057",
    },
    input: {
      width: "100%",
      padding: "12px",
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
      marginBottom: "10px",
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
          <h2 style={{...styles.registerTitle, color: "#2C7BE5"}}>Kayıt Ol</h2>
          {error && <div style={styles.error}>{error}</div>}
          <form onSubmit={handleRegister}>
            <div style={styles.inputRow}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Ad</label>
                <input
                  type="text"
                  name="firstName"
                  placeholder="Adınız"
                  value={formData.firstName}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Soyad</label>
                <input
                  type="text"
                  name="lastName"
                  placeholder="Soyadınız"
                  value={formData.lastName}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>E-posta</label>
              <input
                type="email"
                name="email"
                placeholder="E-posta adresiniz"
                value={formData.email}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.inputGroup}>
              <label style={styles.label}>Telefon</label>
              <input
                type="tel"
                name="phone"
                placeholder="Telefon numaranız"
                value={formData.phone}
                onChange={handleChange}
                style={styles.input}
                required
              />
            </div>
            
            <div style={styles.inputRow}>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Şifre</label>
                <input
                  type="password"
                  name="password"
                  placeholder="Şifreniz"
                  value={formData.password}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
              <div style={styles.inputGroup}>
                <label style={styles.label}>Şifre Tekrar</label>
                <input
                  type="password"
                  name="confirmPassword"
                  placeholder="Şifrenizi tekrar girin"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  style={styles.input}
                  required
                />
              </div>
            </div>
            
            <button 
              type="submit" 
              style={loading ? styles.buttonDisabled : styles.button}
              disabled={loading}
            >
              {loading ? "Kayıt Yapılıyor..." : "Kayıt Ol"}
            </button>
          </form>
          <div style={{marginTop: "20px"}}>
            <Link to="/login" style={styles.loginLink}>
              Zaten hesabınız var mı? Giriş yapın
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default RegisterPage;

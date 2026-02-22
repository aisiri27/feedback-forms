import React, { useState } from "react";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";
import { jwtDecode } from "jwt-decode";

export default function AppWrapper() {
  return (
    <GoogleOAuthProvider clientId="your-google-client-id.apps.googleusercontent.com">
      <LoginPage />
    </GoogleOAuthProvider>
  );
}

function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const dummyUser = {
    email: "admin@feedback.com",
    password: "123456",
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (!email || !password) {
      setError("Please enter all fields");
      return;
    }

    if (email === dummyUser.email && password === dummyUser.password) {
      setSuccess("Login successful! Welcome to dashboard");
    } else {
      setError("Invalid email or password");
    }
  };

  const handleGoogleSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    setSuccess(`Welcome ${decoded.name}`);
    console.log(decoded);
  };

  const handleGoogleError = () => {
    setError("Google Login Failed");
  };

  return (
    <div style={{
      height: "100vh",
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      background: "linear-gradient(to right, #667eea, #764ba2)",
      fontFamily: "Arial"
    }}>

      <div style={{
        background: "white",
        padding: "40px",
        borderRadius: "10px",
        width: "350px",
        boxShadow: "0 10px 25px rgba(0,0,0,0.2)"
      }}>

        <h2 style={{ textAlign: "center" }}>Feedback Login</h2>

        {/* GOOGLE LOGIN */}
        <div style={{ display: "flex", justifyContent: "center", margin: "20px 0" }}>
          <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
        </div>

        <p style={{ textAlign: "center" }}>OR</p>

        <form onSubmit={handleLogin}>
          <input
            type="email"
            placeholder="Enter email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={{ width: "100%", padding: "10px", margin: "10px 0" }}
          />

          <input
            type="password"
            placeholder="Enter password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={{ width: "100%", padding: "10px", margin: "10px 0" }}
          />

          <button style={{
            width: "100%",
            padding: "10px",
            background: "#667eea",
            color: "white",
            border: "none",
            borderRadius: "5px"
          }}>
            Login
          </button>
        </form>

        {error && <p style={{ color: "red" }}>{error}</p>}
        {success && <p style={{ color: "green" }}>{success}</p>}

        <p style={{ fontSize: "12px", marginTop: "15px" }}>
          Demo login: admin@feedback.com / 123456
        </p>
      </div>
    </div>
  );
}

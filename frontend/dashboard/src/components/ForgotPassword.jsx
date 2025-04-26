import { useState } from "react";
import logoIcon from "../assets/logo.ico";
import "../styles/login-button.css";
import "../styles/login-form.css";

const ForgotPassword = ({ onBackToLogin }) => {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  // API URL for backend
  const API_URL = "http://localhost:8000/api";

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setIsLoading(true);

    if (!email) {
      setError("Please enter your email address");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/forgot-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "An error occurred");
        setIsLoading(false);
        return;
      }

      setSuccess("If your email exists in our system, you will receive a password reset link shortly");
      setEmail("");
    } catch (err) {
      console.error("Forgot password error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-content">
      <div className="logo-container">
        <img src={logoIcon} alt="WasteNot Logo" className="auth-logo" />
      </div>

      <h2 className="welcome-text">
        Reset Password <span className="leaf-icon">🍃</span>
      </h2>

      <p className="auth-subtitle">
        Enter your email address and we'll send you a link to reset your password.
      </p>

      {error && <div className="auth-error">{error}</div>}
      {success && <div className="auth-success">{success}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="email">Email</label>
          <input
            type="email"
            id="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <button 
          type="submit" 
          className="login-button"
          disabled={isLoading}
        >
          {isLoading ? "Sending..." : "Send Reset Link"}
        </button>

        <div className="back-to-login">
          <button 
            type="button" 
            className="text-button"
            onClick={onBackToLogin}
            disabled={isLoading}
          >
            &larr; Back to Login
          </button>
        </div>
      </form>
    </div>
  );
};

export default ForgotPassword; 
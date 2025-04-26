import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import logoIcon from "../assets/logo.ico";
import "../styles/login-button.css";
import "../styles/login-form.css";

const ResetPassword = () => {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [tokenValidated, setTokenValidated] = useState(false);
  const [isTokenValid, setIsTokenValid] = useState(true);

  const { token } = useParams();
  const navigate = useNavigate();

  // API URL for backend
  const API_URL = "http://localhost:8000/api";

  // Validate the token on component mount
  useEffect(() => {
    // For this implementation, we're keeping it simple
    // In a real app, you might want to verify the token validity on the server
    if (!token) {
      setIsTokenValid(false);
    } else {
      setTokenValidated(true);
    }
  }, [token]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!password || !confirmPassword) {
      setError("Please enter both fields");
      setIsLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      setIsLoading(false);
      return;
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/reset-password/${token}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "An error occurred");
        setIsLoading(false);
        return;
      }

      setSuccess(true);
      setPassword("");
      setConfirmPassword("");
      
      // Redirect to login after 3 seconds
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      console.error("Reset password error:", err);
      setError("An error occurred. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // If token isn't valid, show an error
  if (!isTokenValid && tokenValidated) {
    return (
      <div className="login-content">
        <div className="logo-container">
          <img src={logoIcon} alt="WasteNot Logo" className="auth-logo" />
        </div>
        <h2 className="welcome-text">Invalid Reset Link</h2>
        <div className="auth-error">
          This password reset link is invalid or has expired.
        </div>
        <button 
          className="login-button"
          onClick={() => navigate("/")}
        >
          Back to Login
        </button>
      </div>
    );
  }

  return (
    <div className="login-content">
      <div className="logo-container">
        <img src={logoIcon} alt="WasteNot Logo" className="auth-logo" />
      </div>

      <h2 className="welcome-text">
        Create New Password <span className="leaf-icon">🍃</span>
      </h2>

      {success ? (
        <div className="auth-success-container">
          <div className="auth-success">Password has been reset successfully!</div>
          <p>Redirecting to login page...</p>
        </div>
      ) : (
        <>
          {error && <div className="auth-error">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="password">New Password</label>
              <input
                type="password"
                id="password"
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm Password</label>
              <input
                type="password"
                id="confirmPassword"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
              />
            </div>

            <button 
              type="submit" 
              className="login-button"
              disabled={isLoading}
            >
              {isLoading ? "Resetting..." : "Reset Password"}
            </button>

            <div className="back-to-login">
              <button 
                type="button" 
                className="text-button"
                onClick={() => navigate("/")}
                disabled={isLoading}
              >
                &larr; Back to Login
              </button>
            </div>
          </form>
        </>
      )}
    </div>
  );
};

export default ResetPassword; 
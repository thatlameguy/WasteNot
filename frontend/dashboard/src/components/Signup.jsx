import { useState } from "react";
import logoIcon from "../assets/logo.ico";
import { API_URL } from "../utils/api";

const Signup = ({ onToggleForm }) => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    // Validate form
    if (!name || !email || !password || !confirmPassword) {
      setError("All fields are required");
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
      const response = await fetch(`${API_URL}/auth/signup`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name,
          email,
          password
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Signup failed");
        setIsLoading(false);
        return;
      }

      // Store token in localStorage
      localStorage.setItem("token", data.token);
      
      // Store user data
      if (data.user) {
        localStorage.setItem("user", JSON.stringify(data.user));
      }

      // Refresh the page to trigger App.jsx to verify the token
      window.location.reload();
    } catch (err) {
      console.error("Signup error:", err);
      setError("An error occurred during signup. Please try again.");
      setIsLoading(false);
    }
  };

  const handleSocialSignup = async (provider) => {
    setError(`${provider} signup is not implemented yet.`);
  };

  return (
    <div className="login-content">
      <div className="login-header">
        <div className="logo-container">
          <img src={logoIcon} alt="WasteNot Logo" className="auth-logo" />
        </div>
      </div>

      <h2 className="welcome-text">
        Create Account <span className="leaf-icon">🍃</span>
      </h2>

      {error && <div className="auth-error">{error}</div>}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            placeholder="Enter your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="signup-email">Email</label>
          <input
            type="email"
            id="signup-email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="form-group">
          <label htmlFor="signup-password">Password</label>
          <input
            type="password"
            id="signup-password"
            placeholder="Create a password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={6}
          />
        </div>

        <div className="form-group">
          <label htmlFor="confirm-password">Confirm Password</label>
          <input
            type="password"
            id="confirm-password"
            placeholder="Confirm your password"
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
          {isLoading ? "Creating Account..." : "Sign Up"}
        </button>
      </form>

      <div className="social-login">
        <p>Or sign up with</p>
        <div className="social-icons">
          <button 
            className="social-icon google"
            onClick={() => handleSocialSignup("Google")}
            disabled={isLoading}
          >
            G
          </button>
          <button 
            className="social-icon facebook"
            onClick={() => handleSocialSignup("Facebook")}
            disabled={isLoading}
          >
            f
          </button>
          <button 
            className="social-icon apple"
            onClick={() => handleSocialSignup("Apple")}
            disabled={isLoading}
          >
            <span role="img" aria-label="Apple">🍎</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Signup;
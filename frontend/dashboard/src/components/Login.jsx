import { useState } from "react";
import logoIcon from "../assets/logo.ico";
import "../styles/login-button.css";
import "../styles/login-form.css";
import { API_URL } from "../utils/api";

const Login = ({ onToggleForm, onForgotPassword }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    if (!email || !password) {
      setError("Please enter both email and password");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "Invalid credentials");
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
      console.error("Login error:", err);
      setError("An error occurred during login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  // Handle guest login
  const handleGuestLogin = () => {
    setError("");
    setIsLoading(true);

    try {
      // Set guest mode flags
      localStorage.setItem("isGuest", "true");
      
      // Create guest user data
      const guestUser = {
        id: 'guest_user',
        name: 'Guest User',
        email: 'guest@wastenot.app',
        avatarId: 1,
        avatar: null,
        isGuest: true
      };
      
      localStorage.setItem("user", JSON.stringify(guestUser));
      
      // Refresh the page to load guest mode
      window.location.reload();
    } catch (err) {
      console.error("Guest login error:", err);
      setError("An error occurred during guest login. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSocialLogin = async (provider) => {
    setError(`${provider} login is not implemented yet.`);
  };

  return (
    <div className="login-content">
      <div className="logo-container">
        <img src={logoIcon} alt="WasteNot Logo" className="auth-logo" />
      </div>

      <h2 className="welcome-text">
        Welcome Back <span className="leaf-icon">🍃</span>
      </h2>

      {error && <div className="auth-error">{error}</div>}

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

        <div className="form-group">
          <label htmlFor="password">Password</label>
          <input
            type="password"
            id="password"
            placeholder="Enter your password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="forgot-password">
          <a href="#" onClick={(e) => {
            e.preventDefault();
            onForgotPassword();
          }}>
            Forgot password?
          </a>
        </div>

        <button 
          type="submit" 
          className="login-button"
          disabled={isLoading}
        >
          {isLoading ? "Logging in..." : "Login"}
        </button>
      </form>

      {/* Guest Mode Section */}
      <div className="guest-login-section">
        <div className="divider">
          <span>or</span>
        </div>
        
        <button 
          className="guest-login-button"
          onClick={handleGuestLogin}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Try as Guest"}
        </button>
        
        <div className="guest-features">
          <h4>Guest Mode Features:</h4>
          <ul>
            <li>✅ Full dashboard experience</li>
            <li>✅ Add, edit, and manage food items</li>
            <li>✅ Get recipe suggestions</li>
            <li>✅ View analytics and insights</li>
            <li>✅ All data stays on your device</li>
          </ul>
        </div>
      </div>

      <div className="social-login">
        <p>Or sign in with</p>
        <div className="social-icons">
          <button 
            className="social-icon google"
            onClick={() => handleSocialLogin("Google")}
            disabled={isLoading}
            aria-label="Login with Google"
          >
            G
          </button>
          <button 
            className="social-icon facebook"
            onClick={() => handleSocialLogin("Facebook")}
            disabled={isLoading}
            aria-label="Login with Facebook"
          >
            f
          </button>
          <button 
            className="social-icon apple"
            onClick={() => handleSocialLogin("Apple")}
            disabled={isLoading}
            aria-label="Login with Apple"
          >
            <span role="img" aria-label="Apple">🍎</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
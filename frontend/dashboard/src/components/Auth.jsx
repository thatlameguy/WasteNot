import { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";
import ForgotPassword from "./ForgotPassword";
import AuthImage from "./AuthImage";
import ThemeToggle from "./ThemeToggle";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);

  const toggleForm = () => {
    setIsLogin(!isLogin);
    setIsForgotPassword(false);
  };

  const showForgotPassword = () => {
    setIsForgotPassword(true);
  };

  const showLogin = () => {
    setIsForgotPassword(false);
  };

  return (
    <div className="auth-container">
      <ThemeToggle />
      <AuthImage />
      <div className="auth-card">
        {!isForgotPassword && (
          <div className="auth-toggle-buttons">
            <button 
              className={`auth-toggle-button ${isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(true)}
            >
              Login
            </button>
            <button 
              className={`auth-toggle-button ${!isLogin ? 'active' : ''}`}
              onClick={() => setIsLogin(false)}
            >
              Sign Up
            </button>
          </div>
        )}
        <div className="auth-content-wrapper">
          <div className="auth-image">
            {/* Background image handled by AuthImage component */}
          </div>
          
          <div className="auth-form">
            {isForgotPassword ? (
              <ForgotPassword onBackToLogin={showLogin} />
            ) : isLogin ? (
              <Login onToggleForm={toggleForm} onForgotPassword={showForgotPassword} />
            ) : (
              <Signup onToggleForm={toggleForm} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth; 
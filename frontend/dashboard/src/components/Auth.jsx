import { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";
import ForgotPassword from "./ForgotPassword";
import AuthImage from "./AuthImage";
import ThemeToggle from "./ThemeToggle";
import TestConnection from "./TestConnection";

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [showConnectionTest, setShowConnectionTest] = useState(false);

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
            
            {/* Connection test toggle button */}
            <button 
              onClick={() => setShowConnectionTest(!showConnectionTest)}
              style={{ 
                marginTop: '20px', 
                padding: '5px 10px', 
                background: 'transparent', 
                border: '1px solid #ccc', 
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '12px'
              }}
            >
              {showConnectionTest ? 'Hide Connection Test' : 'Show Connection Test'}
            </button>
            
            {/* Show connection test if enabled */}
            {showConnectionTest && <TestConnection />}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Auth; 
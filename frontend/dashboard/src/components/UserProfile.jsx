// frontend/dashboard/src/components/UserProfile.jsx
import { User } from "lucide-react";
import { AVATARS } from "./AvatarSelector";

function UserProfile({ collapsed, user, setActiveTab }) {
  // Safely access user properties with optional chaining
  const userName = user?.name || "User";
  
  // Check if user exists to prevent null reference errors
  if (!user) {
    return (
      <div className="user-profile">
        <div className="profile-actions">
          <button className="login-button" onClick={() => window.location.href = "/"}>
            Login
          </button>
        </div>
      </div>
    );
  }
  
  const handleProfileClick = () => {
    setActiveTab("Settings");
  };
  
  // Get avatar path based on user's avatarId
  const avatarPath = user.avatarId ? 
    AVATARS.find(a => a.id === user.avatarId)?.path : 
    null;
  
  return (
    <div className={`user-profile ${collapsed ? "collapsed" : ""}`}>
      <div 
        className="user-avatar"
        onClick={handleProfileClick}
        title="Profile Settings"
      >
        {avatarPath ? (
          <img 
            src={avatarPath} 
            alt="User Avatar" 
            style={{ width: '100%', height: '100%', borderRadius: '50%', objectFit: 'cover' }}
          />
        ) : (
          <User size={collapsed ? 20 : 24} />
        )}
      </div>
      {!collapsed && (
        <div className="user-info">
          <h3 className="user-name">{userName}</h3>
        </div>
      )}
    </div>
  );
}

export default UserProfile;
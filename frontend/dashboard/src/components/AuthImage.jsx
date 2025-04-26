import React from 'react';
import loginCover from '../assets/login-cover.jpg';

const AuthImage = () => {
  // This component doesn't render anything visible
  // It's just a way to import and use the image in CSS
  React.useEffect(() => {
    // Find the auth-image element
    const authImageEl = document.querySelector('.auth-image');
    if (authImageEl) {
      // Set the background image directly using the imported image
      authImageEl.style.backgroundImage = `url(${loginCover})`;
    }
  }, []);

  return null;
};

export default AuthImage; 
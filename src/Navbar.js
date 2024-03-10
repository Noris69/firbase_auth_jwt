// Navbar.js
import React from 'react';

const Navbar = ({ user, handleLogout }) => {
  return (
    <header className="header">
      <div className="container">
        {user ? (
          <div className="user-info">
            <p>Welcome, {user.email}</p>
            <button onClick={handleLogout}>Logout</button>
          </div>
        ) : (
          <div className="ynov-quizz">
            <p>Welcome to Ynov Quizz</p>

          </div>
        )}
      </div>
    </header>
  );
};

export default Navbar;

import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Header.scss';

function Header() {
  const location = useLocation();

  return (
    <header className="header">
      <div className="header-container">
        <div className="logo-section">
          <Link to="/" className="logo-link">
          {/* Логотип с оригального хедера на сайте Т-банка */}
            <img 
              src="https://cdn.tbank.ru/static/pfa-multimedia/images/33447f85-5b92-42f9-8d88-509bd152b47c.svg" 
              alt="Т-Банк" 
              className="logo-icon"
            />
            <div className="logo-text">
              <span className="logo-title">T-GPT</span>
              <span className="logo-subtitle">— Нейросеть от Т-Банка</span>
            </div>
          </Link>
        </div>
        
        <div className="header-actions">
          <button className="profile-btn">
            <span className="profile-text">Личный кабинет</span>
          </button>
        </div>
      </div>
    </header>
  );
}

export default Header;
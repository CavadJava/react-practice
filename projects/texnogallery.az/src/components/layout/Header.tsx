import './Header.css';

function Header() {
  return (
    <header className="header">
      <div className="header-left">
        <div className="logo">TEXNO GALLERY</div>
        <div className="search-bar">
          <input type="text" placeholder="axtardığınız məhsulun seriya, model və ya adını yazın..." />
          <button className="search-button">🔍</button>
        </div>
      </div>
      <div className="header-right">
        <button className="contact-button">Əlaqə</button>
        <div className="user-actions">
          <span className="icon">🔖</span>
          <span className="icon">🛒</span>
          <span className="icon">👤</span>
        </div>
      </div>
    </header>
  );
}

export default Header;

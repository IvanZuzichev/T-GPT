import './Footer.scss';

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-container">
        <div className="footer-links">
          <a href="#" className="footer-link">
            Оферта
          </a>
          <a href="#" className="footer-link">
            Документация API
          </a>
          <a href="#" className="footer-link">
            Политика обработки персональных данных
          </a>
        </div>

        <div className="footer-support">
          По вопросам обращайтесь в{' '}
          <a href="#" className="support-link">
            чат поддержки
          </a>
        </div>

        <div className="footer-bottom">
          <div className="footer-copyright">© 2026, АНО ДПО «Т-Нейросети»</div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;

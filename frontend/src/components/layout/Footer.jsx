import Icon from "../ui/Icon";

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-content">
        <div className="footer-left">
          <img src="/logo.png" alt="BiasScope" className="footer-logo" />
        </div>
        <div className="footer-center">
          <p className="footer-quote">"There are no facts, only interpretations."</p>
        </div>
        <div className="footer-right">
          <a href="https://github.com/shuvam586/bias-scope" target="_blank" rel="noopener noreferrer" className="github-link">
            <Icon name="github" size={20} />
            <span>GitHub</span>
          </a>
        </div>
      </div>
    </footer>
  );
}

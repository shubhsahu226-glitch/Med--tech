import React from "react";
import { Link } from "react-router-dom";
import { Heart } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-inner">
        <div className="footer-brand">
          <Heart fill="currentColor" size={18} style={{ color: "var(--primary)" }} />
          <span>MedTech AI</span>
          <span style={{ fontWeight: 400, color: "var(--text-muted)" }}>
            © {new Date().getFullYear()}
          </span>
        </div>
        
        <div className="footer-links">
          <Link to="/">Privacy Policy</Link>
          <Link to="/">Terms of Service</Link>
          <Link to="/">Support Helpdesk</Link>
        </div>
      </div>
    </footer>
  );
};
export default Footer;

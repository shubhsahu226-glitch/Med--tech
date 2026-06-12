import { Link } from "react-router-dom";
import { BrandLogo } from "./BrandLogo";

export const Footer = () => {
  return (
    <footer 
      style={{
        backgroundColor: "var(--bg-primary)",
        borderTop: "1px solid var(--border-color)",
        padding: "2rem",
        textAlign: "center",
        fontSize: "0.875rem",
        color: "var(--text-secondary)"
      }}
    >
      <div 
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexWrap: "wrap",
          maxWidth: "1200px",
          margin: "0 auto",
          gap: "1rem"
        }}
      >
        <div className="align-center gap-2">
          <BrandLogo markSize={30} className="brand-logo--footer" />
          <span>© {new Date().getFullYear()} All Rights Reserved.</span>
        </div>
        
        <div style={{ display: "flex", gap: "1.5rem" }}>
          <Link to="/" style={{ hover: { color: "var(--primary)" } }}>Privacy Policy</Link>
          <Link to="/">Terms of Service</Link>
          <Link to="/">Support Helpdesk</Link>
        </div>
      </div>
    </footer>
  );
};
export default Footer;

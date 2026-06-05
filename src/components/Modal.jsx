import React, { useEffect } from "react";
import { X } from "lucide-react";

export const Modal = ({ isOpen, onClose, title, children, footerButtons }) => {
  // Prevent body scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose} role="dialog" aria-modal="true" aria-labelledby="modal-title">
      <div 
        className="modal-content" 
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <h3 id="modal-title" style={{ margin: 0, fontSize: "1.2rem" }}>{title}</h3>
          <button className="btn-icon" onClick={onClose} style={{ border: "none" }} aria-label="Close modal">
            <X size={18} />
          </button>
        </div>
        
        <div className="modal-body">
          {children}
        </div>
        
        {footerButtons && (
          <div className="modal-footer">
            {footerButtons}
          </div>
        )}
      </div>
    </div>
  );
};
export default Modal;

import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { fetchMedicalTermExplanation } from '../services';
import { MessageSquare, HeartPulse, Activity, Briefcase, X, Loader2 } from 'lucide-react';

export const MedicalTermTooltip = ({ term, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [explanation, setExplanation] = useState(null);
  const tooltipRef = useRef(null);

  // Close when clicking outside or scrolling
  useEffect(() => {
    const handleClickOutside = (event) => {
      // Check if click is inside the tooltip container (span) or the portal itself
      const portalEl = document.getElementById(`tooltip-${term.replace(/\s+/g, '-')}`);
      if (
        (tooltipRef.current && tooltipRef.current.contains(event.target)) ||
        (portalEl && portalEl.contains(event.target))
      ) {
        return;
      }
      setIsOpen(false);
    };
    
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      document.addEventListener("touchstart", handleClickOutside);
      // Optional: close on scroll to avoid detached tooltips
      window.addEventListener("scroll", () => setIsOpen(false), { passive: true });
    }
    
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("touchstart", handleClickOutside);
      window.removeEventListener("scroll", () => setIsOpen(false));
    };
  }, [isOpen, term]);

  const [position, setPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    if (isOpen && tooltipRef.current) {
      const rect = tooltipRef.current.getBoundingClientRect();
      setPosition({
        top: rect.bottom + window.scrollY + 8,
        left: rect.left + window.scrollX + (rect.width / 2)
      });
    }
  }, [isOpen]);

  const loadData = async () => {
    if (!explanation && !isLoading) {
      setIsLoading(true);
      const data = await fetchMedicalTermExplanation(term);
      setExplanation(data);
      setIsLoading(false);
    }
  };

  const handleMouseEnter = () => {
    setIsOpen(true);
    loadData();
  };

  const handleMouseLeave = () => {
    setIsOpen(false);
  };

  const handleClick = (e) => {
    // Toggle on click (especially useful for mobile)
    e.preventDefault();
    e.stopPropagation();
    if (!isOpen) {
      setIsOpen(true);
      loadData();
    } else {
      setIsOpen(false);
    }
  };

  return (
    <div 
      className="medical-term-container" 
      style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
      ref={tooltipRef}
    >
      <span 
        style={{ 
          textDecoration: 'underline', 
          textDecorationStyle: 'dotted',
          textUnderlineOffset: '4px',
          cursor: 'pointer',
          color: 'inherit',
          fontWeight: 'inherit',
          fontSize: 'inherit'
        }}
      >
        {children || term}
      </span>

      {isOpen && createPortal(
        <div 
          id={`tooltip-${term.replace(/\s+/g, '-')}`}
          className="medical-tooltip-card shadow-lg"
          style={{
            position: 'absolute',
            zIndex: 99999,
            backgroundColor: 'var(--bg-primary, #ffffff)',
            border: '1px solid var(--border-color, #e5e7eb)',
            borderRadius: '12px',
            padding: '16px',
            width: '320px',
            top: `${position.top}px`,
            left: `${position.left}px`,
            transform: 'translateX(-50%)',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            cursor: 'default',
            color: 'var(--text-primary, #111827)',
            textAlign: 'left'
          }}
          onClick={(e) => e.stopPropagation()} 
        >
          <div className="flex-between m-b-2" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px', borderBottom: '1px solid var(--border-color, #f3f4f6)', paddingBottom: '8px' }}>
            <h4 style={{ margin: 0, fontSize: '1rem', fontWeight: '700', color: 'var(--text-primary, #111827)' }}>
              {term}
            </h4>
            <button 
              onClick={(e) => { e.stopPropagation(); setIsOpen(false); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px', color: 'var(--text-muted, #6b7280)' }}
            >
              <X size={16} />
            </button>
          </div>

          {isLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '24px 0', gap: '8px', color: 'var(--primary, #3b82f6)' }}>
              <Loader2 className="animate-spin" size={24} />
              <span style={{ fontSize: '0.85rem' }}>Translating term...</span>
            </div>
          ) : explanation ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              
              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <MessageSquare size={16} style={{ color: 'var(--primary, #3b82f6)', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary, #111827)' }}>Simple Meaning:</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #4b5563)', lineHeight: 1.4 }}>
                    {explanation.simpleMeaning}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <HeartPulse size={16} style={{ color: '#ef4444', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary, #111827)' }}>Why It Matters:</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #4b5563)', lineHeight: 1.4 }}>
                    {explanation.whyItMatters}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Activity size={16} style={{ color: '#f59e0b', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary, #111827)' }}>Effect on Body:</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #4b5563)', lineHeight: 1.4 }}>
                    {explanation.bodyImpact}
                  </p>
                </div>
              </div>

              <div style={{ display: 'flex', gap: '8px', alignItems: 'flex-start' }}>
                <Briefcase size={16} style={{ color: '#10b981', flexShrink: 0, marginTop: '2px' }} />
                <div>
                  <strong style={{ fontSize: '0.85rem', color: 'var(--text-primary, #111827)' }}>Everyday Example:</strong>
                  <p style={{ margin: '2px 0 0', fontSize: '0.8rem', color: 'var(--text-secondary, #4b5563)', lineHeight: 1.4 }}>
                    {explanation.easyExample}
                  </p>
                </div>
              </div>

            </div>
          ) : (
            <div style={{ fontSize: '0.85rem', color: 'var(--danger, #ef4444)', textAlign: 'center', padding: '16px 0' }}>
              Could not load explanation.
            </div>
          )}
        </div>,
        document.body
      )}
    </div>
  );
};

export default MedicalTermTooltip;

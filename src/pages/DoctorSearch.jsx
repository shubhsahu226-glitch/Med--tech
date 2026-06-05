import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useHealth } from "../context/HealthContext";
import { Search, MapPin, DollarSign, Calendar, Sparkles, Award, Star } from "lucide-react";
import { DoctorCard } from "../components/CardComponents";
import { Modal } from "../components/Modal";

export const DoctorSearch = () => {
  const { doctors } = useHealth();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState("");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [activeDoctorProfile, setActiveDoctorProfile] = useState(null);

  const specialties = ["All", "Cardiologist", "Neurologist", "Pediatrician", "General Physician", "Dermatologist"];

  const filteredDoctors = doctors.filter(doc => {
    const matchesSearch = doc.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          doc.specialty.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesSpecialty = selectedSpecialty === "All" || doc.specialty === selectedSpecialty;
    return matchesSearch && matchesSpecialty;
  });

  const handleBookRedirect = (doctor) => {
    navigate("/patient/book", { state: { selectedDoctor: doctor } });
  };

  return (
    <div className="flex-column gap-6">
      {/* Header */}
      <div>
        <h1 style={{ fontSize: "1.75rem", margin: 0 }}>Consult Medical Specialists</h1>
        <p className="text-secondary-color" style={{ fontSize: "0.9rem" }}>Book secure chat or video sessions with qualified clinical professionals.</p>
      </div>

      {/* Search Bar & Filters */}
      <div className="card flex-column gap-4" style={{ padding: "1.25rem" }}>
        <div style={{ position: "relative" }}>
          <input 
            type="text" 
            className="form-input" 
            placeholder="Search doctors by name or specialty..." 
            style={{ paddingLeft: "2.5rem" }}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Search 
            size={18} 
            style={{ 
              position: "absolute", 
              top: "50%", 
              left: "0.875rem", 
              transform: "translateY(-50%)",
              color: "var(--text-muted)" 
            }} 
          />
        </div>

        {/* Specialty Filter Badges */}
        <div style={{ display: "flex", gap: "0.5rem", flexWrap: "wrap" }}>
          {specialties.map(spec => (
            <button
              key={spec}
              onClick={() => setSelectedSpecialty(spec)}
              style={{
                fontSize: "0.8rem",
                fontWeight: "600",
                padding: "0.4rem 0.8rem",
                borderRadius: "var(--radius-full)",
                backgroundColor: selectedSpecialty === spec ? "var(--primary)" : "var(--bg-secondary)",
                color: selectedSpecialty === spec ? "white" : "var(--text-secondary)",
                border: "1px solid var(--border-color)",
                transition: "all var(--transition-fast)"
              }}
            >
              {spec}
            </button>
          ))}
        </div>
      </div>

      {/* Doctor Cards Grid */}
      {filteredDoctors.length === 0 ? (
        <div className="card text-center" style={{ padding: "3rem" }}>
          <p className="text-secondary-color">No medical specialists match your search criteria.</p>
        </div>
      ) : (
        <div className="grid-3">
          {filteredDoctors.map(doc => (
            <DoctorCard 
              key={doc.id} 
              doctor={doc} 
              onBookClick={() => handleBookRedirect(doc)}
              onProfileClick={() => setActiveDoctorProfile(doc)}
            />
          ))}
        </div>
      )}

      {/* Doctor Info Detail Modal */}
      {activeDoctorProfile && (
        <Modal
          isOpen={!!activeDoctorProfile}
          onClose={() => setActiveDoctorProfile(null)}
          title={`Specialist Profile: ${activeDoctorProfile.name}`}
          footerButtons={
            <>
              <button className="btn btn-secondary" onClick={() => setActiveDoctorProfile(null)}>Close</button>
              <button 
                className="btn btn-primary" 
                onClick={() => {
                  const doc = activeDoctorProfile;
                  setActiveDoctorProfile(null);
                  handleBookRedirect(doc);
                }}
              >
                Book Appointment
              </button>
            </>
          }
        >
          <div className="flex-column gap-4">
            <div className="align-center gap-3">
              <img 
                src={activeDoctorProfile.image} 
                alt={activeDoctorProfile.name} 
                style={{ width: "72px", height: "72px", borderRadius: "50%", objectFit: "cover", border: "1px solid var(--border-color)" }}
              />
              <div>
                <h3 style={{ margin: 0 }}>{activeDoctorProfile.name}</h3>
                <span className="badge badge-info" style={{ marginTop: "0.25rem" }}>{activeDoctorProfile.specialty}</span>
                <div className="align-center gap-1 m-t-2" style={{ color: "var(--warning)" }}>
                  <Star size={14} fill="currentColor" />
                  <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "var(--text-primary)" }}>{activeDoctorProfile.rating}</span>
                  <span style={{ fontSize: "0.85rem", color: "var(--text-muted)" }}>({activeDoctorProfile.reviews} reviews)</span>
                </div>
              </div>
            </div>

            <div style={{ borderTop: "1px solid var(--border-color)", borderBottom: "1px solid var(--border-color)", padding: "1rem 0" }} className="flex-column gap-2">
              <div className="align-center gap-2" style={{ fontSize: "0.875rem" }}>
                <Award size={16} style={{ color: "var(--primary)" }} />
                <span><strong>Education:</strong> {activeDoctorProfile.education}</span>
              </div>
              <div className="align-center gap-2" style={{ fontSize: "0.875rem" }}>
                <MapPin size={16} style={{ color: "var(--primary)" }} />
                <span><strong>Location:</strong> {activeDoctorProfile.location}</span>
              </div>
              <div className="align-center gap-2" style={{ fontSize: "0.875rem" }}>
                <DollarSign size={16} style={{ color: "var(--primary)" }} />
                <span><strong>Consultation Fee:</strong> {activeDoctorProfile.consultationFee} (HIPAA Telehealth Session)</span>
              </div>
            </div>

            <div>
              <h4 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>About Practitioner</h4>
              <p className="text-secondary-color" style={{ fontSize: "0.85rem", lineHeight: 1.6 }}>{activeDoctorProfile.about}</p>
            </div>

            <div>
              <h4 style={{ fontSize: "0.95rem", marginBottom: "0.5rem" }}>Weekly Consultation Hours</h4>
              <div className="flex-column gap-1">
                {activeDoctorProfile.availability.map((av, i) => (
                  <span key={i} className="badge badge-info" style={{ width: "fit-content", fontSize: "0.75rem" }}>{av}</span>
                ))}
              </div>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};
export default DoctorSearch;

// src/components/Footer.jsx
import React from "react";
import { FaFacebookF, FaInstagram, FaLinkedinIn } from "react-icons/fa";

export default function Footer() {
  return (
    <footer
      style={{
        backgroundColor: "#0077b6",
        color: "#fff",
        padding: "50px 20px",
        marginTop: "40px",
      }}
    >
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          justifyContent: "space-between",
          gap: "30px",
        }}
      >
        {/* Section A propos */}
        <div style={{ flex: "1 1 250px" }}>
          <h3 style={{ marginBottom: "15px" }}>À propos</h3>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#e0e0e0" }}>
            La Dentolink est un laboratoire numérique spécialisé dans les couronnes fabriquées en CAD/CAM.
            Nous fournissons des prothèses de haute qualité et des services professionnels.
          </p>
          {/* Icônes sociales */}
          <div style={{ display: "flex", gap: "12px", marginTop: "15px" }}>
            <a
              href="https://facebook.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#fff",
                fontSize: "18px",
                transition: "color 0.3s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#e0e0e0")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#fff")}
            >
              <FaFacebookF />
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#fff",
                fontSize: "18px",
                transition: "color 0.3s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#e0e0e0")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#fff")}
            >
              <FaInstagram />
            </a>
            <a
              href="https://linkedin.com"
              target="_blank"
              rel="noopener noreferrer"
              style={{
                color: "#fff",
                fontSize: "18px",
                transition: "color 0.3s",
              }}
              onMouseOver={(e) => (e.currentTarget.style.color = "#e0e0e0")}
              onMouseOut={(e) => (e.currentTarget.style.color = "#fff")}
            >
              <FaLinkedinIn />
            </a>
          </div>
        </div>

        {/* Section Contact */}
        <div style={{ flex: "1 1 250px" }}>
          <h3 style={{ marginBottom: "15px" }}>Contact & Informations</h3>
          <p style={{ fontSize: "14px", lineHeight: "1.6", color: "#e0e0e0" }}>
            📍 Adresse : Lot II D Antananarivo, Madagascar <br />
            ⏰ Heure d'ouverture : Lun-Ven 08:00 - 17:00 <br />
            ✉️ Email : sundev@gmail.com <br />
            📞 Téléphone : +261 33 58 119 36
          </p>
        </div>

        {/* Section Liens */}
        <div style={{ flex: "1 1 150px" }}>
          <h3 style={{ marginBottom: "15px" }}>Liens utiles</h3>
          <ul style={{ listStyle: "none", padding: 0, fontSize: "14px" }}>
            <li>
              <a
                href="/"
                style={{ color: "#e0e0e0", textDecoration: "none", transition: "color 0.3s" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#e0e0e0")}
              >
                Accueil
              </a>
            </li>
            <li>
              <a
                href="/products"
                style={{ color: "#e0e0e0", textDecoration: "none", transition: "color 0.3s" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#e0e0e0")}
              >
                Produits
              </a>
            </li>
            <li>
              <a
                href="/contact"
                style={{ color: "#e0e0e0", textDecoration: "none", transition: "color 0.3s" }}
                onMouseOver={(e) => (e.currentTarget.style.color = "#fff")}
                onMouseOut={(e) => (e.currentTarget.style.color = "#e0e0e0")}
              >
                Contact
              </a>
            </li>
          </ul>
        </div>
      </div>

      {/* Copyright */}
      <div
        style={{
          textAlign: "center",
          marginTop: "40px",
          fontSize: "12px",
          color: "#c0c0c0",
        }}
      >
        &copy; {new Date().getFullYear()} Dentolink 2025 . Tous droits réservés.
      </div>
    </footer>
  );
}

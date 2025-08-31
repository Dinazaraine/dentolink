import Card from "../../components/Card.jsx";
import { useState } from "react";

// ✅ Importation des images locales pour Physique
import physique1 from "./Physique/all.png";
import physique2 from "./Physique/aligner.png";
import physique3 from "./Physique/amovible.png";
import physique4 from "./Physique/blancissement.PNG";
import physique5 from "./Physique/bridge.PNG";
import physique6 from "./Physique/contention.PNG";
import physique7 from "./Physique/courrone.PNG";
import physique8 from "./Physique/courrone1.PNG";
import physique9 from "./Physique/facette.PNG";
import physique10 from "./Physique/inlay onlay.PNG";
import physique11 from "./Physique/lithyum.PNG";
import physique12 from "./Physique/metalique.PNG";
import physique13 from "./Physique/peek.PNG";
import physique14 from "./Physique/tcs.PNG";
import physique15 from "./Physique/zircone.PNG";

// ✅ Importation des images locales pour Design
import design0 from "./Design/0.PNG";
import design1 from "./Design/1.PNG";
import design2 from "./Design/2.PNG";
import design3 from "./Design/3.PNG";
import design4 from "./Design/4.PNG";
import design5 from "./Design/5.PNG";
import design6 from "./Design/6.PNG";
import design7 from "./Design/7.PNG";
import design8 from "./Design/8.PNG";
import design9 from "./Design/9.PNG";

export default function ProductForm() {
  const [category, setCategory] = useState(null);

  // ✅ Définir les images par catégorie
  const imagesPhysique = [
    physique1,
    physique2,
    physique3,
    physique4,
    physique5,
    physique6,
    physique7,
    physique8,
    physique9,
    physique10,
    physique11,
    physique12,
    physique13,
    physique14,
    physique15,
  ];

  const imagesDesign = [
    design0,
    design1,
    design2,
    design3,
    design4,
    design5,
    design6,
    design7,
    design8,
    design9,
  ];

  const selectedImages =
    category === "physique"
      ? imagesPhysique
      : category === "design"
      ? imagesDesign
      : [];

  return (
    <Card>
      <div style={{ display: "grid", gap: "24px" }}>
        {/* ✅ Introduction */}
        <div style={{ textAlign: "center" }}>
          <h2 style={{ fontSize: "28px", marginBottom: "12px", color: "#222" }}>
            Nos Produits
          </h2>
          <p style={{ fontSize: "16px", color: "#555", lineHeight: "1.6" }}>
            La DDLM est un laboratoire numérique spécialisé dans les couronnes fabriquées en CAD/CAM.
            Nous offrons aussi des prothèses standard : couronne céramo-métallique, amovible flexible,
            gouttières aligneur, etc.
          </p>
        </div>

        {/* ✅ Boutons catégorie */}
        <div style={{ display: "flex", justifyContent: "center", gap: "20px" }}>
          <button
            onClick={() => setCategory("physique")}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "2px solid #0077b6",
              background: category === "physique" ? "#0077b6" : "#fff",
              color: category === "physique" ? "#fff" : "#0077b6",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            Physique
          </button>
          <button
            onClick={() => setCategory("design")}
            style={{
              padding: "12px 24px",
              borderRadius: "8px",
              border: "2px solid #0077b6",
              background: category === "design" ? "#0077b6" : "#fff",
              color: category === "design" ? "#fff" : "#0077b6",
              fontWeight: "bold",
              fontSize: "16px",
              cursor: "pointer",
              transition: "all 0.3s ease",
            }}
          >
            Design
          </button>
        </div>

        {/* ✅ Images */}
        {category && (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: "16px",
              marginTop: "20px",
            }}
          >
            {selectedImages.length ? (
              selectedImages.map((src, idx) => (
                <div
                  key={idx}
                  style={{
                    borderRadius: "10px",
                    overflow: "hidden",
                    background: "#f4f4f4",
                    boxShadow: "0 3px 10px rgba(0,0,0,0.1)",
                    display: "flex",
                    justifyContent: "center",
                    alignItems: "center",
                    height: "160px",
                  }}
                >
                  <img
                    src={src}
                    alt={`Produit ${idx + 1}`}
                    style={{
                      maxWidth: "100%",
                      maxHeight: "100%",
                      objectFit: "contain",
                      display: "block",
                    }}
                  />
                </div>
              ))
            ) : (
              <p style={{ textAlign: "center", color: "#888" }}>
                Aucune image disponible pour cette catégorie.
              </p>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

import Card from "../../components/Card.jsx";
import { useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

// ✅ Importation des images locales pour Physique
import physique1 from "./Physique/all.png";
import physique2 from "./Physique/aligner.png";
import physique3 from "./Physique/amovible.png";
import physique4 from "./Physique/blancissement.png";
import physique5 from "./Physique/bridge.png";
import physique6 from "./Physique/contention.png";
import physique7 from "./Physique/courrone.png";
import physique8 from "./Physique/courrone1.png";
import physique9 from "./Physique/facette.png";
import physique10 from "./Physique/inlay onlay.png";
import physique11 from "./Physique/lithyum.png";
import physique12 from "./Physique/metalique.png";
import physique13 from "./Physique/peek.png";
import physique14 from "./Physique/tcs.png";
import physique15 from "./Physique/zircone.png";

// ✅ Importation des images locales pour Design
import design0 from "./design/0.png";
import design1 from "./design/1.png";
import design2 from "./design/2.png";
import design3 from "./design/3.png";
import design4 from "./design/4.png";
import design5 from "./design/5.png";
import design6 from "./design/6.png";
import design7 from "./design/7.png";
import design8 from "./design/8.png";
import design9 from "./design/9.png";

export default function ProductForm() {
  const [category, setCategory] = useState(null);

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
      <div className="container py-4">
        {/* ✅ Introduction */}
        <div className="text-center mb-4">
          <h2 className="fw-bold text-dark">Nos Produits</h2>
          <p className="text-muted">
            La DDLM est un laboratoire numérique spécialisé dans les couronnes
            fabriquées en CAD/CAM.
            <br />
            Nous offrons aussi des prothèses standard : couronne céramo-métallique,
            amovible flexible, gouttières aligneur, etc.
          </p>
        </div>

        {/* ✅ Boutons catégorie */}
        <div className="d-flex justify-content-center gap-3 mb-4">
          <button
            className={`btn btn-lg ${
              category === "physique" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setCategory("physique")}
          >
            Physique
          </button>
          <button
            className={`btn btn-lg ${
              category === "design" ? "btn-primary" : "btn-outline-primary"
            }`}
            onClick={() => setCategory("design")}
          >
            Design
          </button>
        </div>

        {/* ✅ Grille images */}
        {category && (
          <div className="row g-3">
            {selectedImages.length ? (
              selectedImages.map((src, idx) => (
                <div key={idx} className="col-6 col-md-4 col-lg-3">
                  <div className="card h-100 shadow-sm border-0">
                    <div className="d-flex justify-content-center align-items-center p-2 bg-light" style={{ height: "160px" }}>
                      <img
                        src={src}
                        alt={`Produit ${idx + 1}`}
                        className="img-fluid"
                        style={{ maxHeight: "140px", objectFit: "contain" }}
                      />
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="col-12 text-center text-muted">
                Aucune image disponible pour cette catégorie.
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}

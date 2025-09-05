import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { createOrder } from "./api.js";
import DentalChart from "../../components/DentalChart.jsx";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";

const ACCEPTED_EXT = ["image/png", "image/jpeg", "image/jpg", "image/webp", ".stl", ".obj", ".ply"];
const MAX_PER_FILE_MB = 50;
const MAX_FILES = 10;

export default function OrderForm({ onCreated }) {
  const fileInputRef = useRef(null);
  const notified = useRef(false);

  const [form, setForm] = useState({
    patient_name: "",
    patient_sex: "",
    patient_age: "",
    model: "",
    remark: "",
    files: [],
  works: [{ work_type: "", sub_type: "", upper_teeth: [], lower_teeth: [] }],
  });

  const [errMsg, setErrMsg] = useState("");

  const createMut = useMutation({
    mutationFn: (payload) => createOrder(payload),
    onMutate: () => setErrMsg(""),
    onSuccess: () => {
      if (!notified.current) {
        notified.current = true;
        onCreated?.();
        setForm({
          patient_name: "",
          patient_sex: "",
          patient_age: "",
          model: "",
          remark: "",
          files: [],
            works: [{ work_type: "", sub_type: "", upper_teeth: [], lower_teeth: [] }],

        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setTimeout(() => (notified.current = false), 0);
      }
    },
    onError: (err) => {
      setErrMsg(String(err?.error || err?.response?.data?.error || err?.message || err));
    },
  });

  // Gestion champs patient
  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  // Fichiers
  function handleFilesSelected(e) {
    let next = Array.from(e.target.files || []);
    next = next.filter((file) => file.size <= MAX_PER_FILE_MB * 1024 * 1024);
    if (next.length > MAX_FILES) next = next.slice(0, MAX_FILES);
    setForm((f) => ({ ...f, files: next }));
  }

  function removeFileAt(i) {
    setForm((f) => {
      const c = [...f.files];
      c.splice(i, 1);
      return { ...f, files: c };
    });
  }

  // Travaux
  function addWork() {
    setForm((f) => ({
      ...f,
works: [...f.works, { work_type: "", sub_type: "", upper_teeth: [], lower_teeth: [] }],
    }));
  }

  function removeWork(i) {
    setForm((f) => {
      const works = [...f.works];
      works.splice(i, 1);
      return { ...f, works };
    });
  }

function handleWorkChange(i, name, value) {
  setForm((f) => {
    const works = [...f.works];

    // Normaliser upper_teeth et lower_teeth
    if ((name === "upper_teeth" || name === "lower_teeth") && !Array.isArray(value)) {
      value = [];
    }

    // Compatibilité rétro avec teeth (on peut l'ignorer ou le mapper vers upper)
    if (name === "teeth") {
      value = Array.isArray(value) ? value : [];
      works[i]["upper_teeth"] = value; // tu choisis si tu veux copier dans upper_teeth
    } else {
      works[i][name] = value;
    }

    return { ...f, works };
  });
}


  // Sous-types
  function renderSubType(workType, index, currentValue) {
    switch (workType) {
      case "Conjointe":
        return (
          <select
            className="form-select"
            value={currentValue}
            onChange={(e) => handleWorkChange(index, "sub_type", e.target.value)}
          >
            <option value="">Sélectionner un détail</option>
            <option value="Inlay core">Inlay core</option>
            <option value="Ilay onlay">Ilay onlay</option>
            <option value="Facette dentaire">Facette dentaire</option>
            <option value="Chape pour couronne">Chape pour couronne</option>
            <option value="Couronne">Couronne</option>
          </select>
        );
      case "Amovible":
        return (
          <select
            className="form-select"
            value={currentValue}
            onChange={(e) => handleWorkChange(index, "sub_type", e.target.value)}
          >
            <option value="">Sélectionner un détail</option>
            <option value="Sellite">Sellite</option>
          </select>
        );
      case "Gouttières":
        return (
          <select
            className="form-select"
            value={currentValue}
            onChange={(e) => handleWorkChange(index, "sub_type", e.target.value)}
          >
            <option value="">Sélectionner un détail</option>
            <option value="Gouttière alligneur">Gouttière alligneur</option>
          </select>
        );
      case "Implant":
        return (
          <select
            className="form-select"
            value={currentValue}
            onChange={(e) => handleWorkChange(index, "sub_type", e.target.value)}
          >
            <option value="">Sélectionner un détail</option>
            <option value="Couronne sur Implant">Couronne sur Implant</option>
            <option value="Planification implantaire / Par dents">Planification implantaire / Par dents</option>
            <option value="Guide Chirugicale">Guide Chirugicale</option>
            <option value="Piler personnalisée">Piler personnalisée</option>
            <option value="All on 4/6 12dent avec fausse gencive">All on 4/6 12dent avec fausse gencive</option>
          </select>
        );
      default:
        return (
          <select className="form-select" disabled>
            <option>Choisir un type d'abord</option>
          </select>
        );
    }
  }

  // Envoi
  function onSubmit(e) {
    e.preventDefault();
    if (!form.patient_name || !form.patient_sex || !form.patient_age) {
      setErrMsg("⚠️ Veuillez remplir les champs obligatoires.");
      return;
    }
    if (form.works.length === 0) {
      setErrMsg("⚠️ Veuillez ajouter au moins un travail.");
      return;
    }

    const payload = {
      patient_name: form.patient_name,
      patient_sex: form.patient_sex,
      patient_age: Number(form.patient_age),
      model: form.model || "",
      remark: form.remark || "",
      files: form.files,
      works: form.works,
    };

    console.log("📦 Payload brut:", payload);
    createMut.mutate(payload);
  }

  return (
    <>
      <form
        onSubmit={onSubmit}
        className="card shadow-lg p-4 bg-light border-0"
        style={{ maxWidth: 800, margin: "0 auto" }}
      >
        <h3 className="mb-4 text-primary">
          <i className="bi bi-journal-plus me-2"></i> Nouvelle commande
        </h3>

        {/* Patient */}
        <div className="mb-3 input-group">
          <span className="input-group-text">
            <i className="bi bi-person"></i>
          </span>
          <input
            className="form-control"
            name="patient_name"
            placeholder="Nom du patient"
            value={form.patient_name}
            onChange={handleChange}
            required
          />
        </div>

        <div className="row mb-3">
          <div className="col input-group">
            <span className="input-group-text">
              <i className="bi bi-gender-ambiguous"></i>
            </span>
            <select
              className="form-select"
              name="patient_sex"
              value={form.patient_sex}
              onChange={handleChange}
              required
            >
              <option value="">Sexe</option>
              <option value="Homme">Homme</option>
              <option value="Femme">Femme</option>
            </select>
          </div>
          <div className="col input-group">
            <span className="input-group-text">
              <i className="bi bi-cake2"></i>
            </span>
            <input
              type="number"
              className="form-control"
              name="patient_age"
              placeholder="Âge"
              value={form.patient_age}
              onChange={handleChange}
              required
            />
          </div>
        </div>

        {/* Travaux */}
        <h5 className="mb-2 text-secondary">
          <i className="bi bi-tools me-2"></i> Travaux demandés
        </h5>

        {form.works.map((w, i) => (
          <div key={i} className="card p-3 mb-3 border">
            <div className="row mb-2">
              <div className="col">
                <select
                  className="form-select"
                  value={w.work_type}
                  onChange={(e) => handleWorkChange(i, "work_type", e.target.value)}
                  required
                >
                  <option value="">Type de travail</option>
                  <option value="Conjointe">Conjointe</option>
                  <option value="Amovible">Amovible</option>
                  <option value="Gouttières">Gouttières</option>
                  <option value="Implant">Implant</option>
                </select>
              </div>
              <div className="col">{renderSubType(w.work_type, i, w.sub_type)}</div>
              <div className="col-auto">
                {i > 0 && (
                  <button type="button" className="btn btn-outline-danger" onClick={() => removeWork(i)}>
                    ✖
                  </button>
                )}
              </div>
            </div>

            <h6 className="mt-2">Dents concernées</h6>
            <DentalChart
  selectedUpper={Array.isArray(w.upper_teeth) ? w.upper_teeth : []}
  selectedLower={Array.isArray(w.lower_teeth) ? w.lower_teeth : []}
  setSelectedUpper={(teeth) => handleWorkChange(i, "upper_teeth", teeth)}
  setSelectedLower={(teeth) => handleWorkChange(i, "lower_teeth", teeth)}
/>

          </div>
        ))}

        <button type="button" className="btn btn-outline-primary mb-3" onClick={addWork}>
          ➕ Ajouter un travail
        </button>

        {/* Modèle */}
        <div className="mb-3 input-group">
          <span className="input-group-text">
            <i className="bi bi-layers"></i>
          </span>
          <select className="form-select" name="model" value={form.model} onChange={handleChange}>
            <option value="">Modèle de travail</option>
            <option value="1 arcade">1 arcade</option>
            <option value="Haut et bas">Haut et bas</option>
          </select>
        </div>

        {/* Remarques */}
        <div className="mb-3 input-group">
          <span className="input-group-text">
            <i className="bi bi-chat-dots"></i>
          </span>
          <textarea
            className="form-control"
            name="remark"
            placeholder="Remarques"
            value={form.remark}
            onChange={handleChange}
          />
        </div>

        {/* Fichiers */}
        <div className="mb-3">
          <label className="form-label">
            <i className="bi bi-paperclip me-2"></i> Fichiers (STL / Images)
          </label>
          <input className="form-control" ref={fileInputRef} type="file" multiple onChange={handleFilesSelected} />

          {form.files.length > 0 && (
            <ul className="list-group mt-2">
              {form.files.map((f, i) => (
                <li key={i} className="list-group-item d-flex justify-content-between align-items-center">
                  <i className="bi bi-file-earmark-text me-2 text-primary"></i>
                  {f.name} ({(f.size / (1024 * 1024)).toFixed(2)} Mo)
                  <button type="button" className="btn btn-sm btn-outline-danger" onClick={() => removeFileAt(i)}>
                    <i className="bi bi-trash"></i> Retirer
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Bouton */}
        <div className="d-grid">
          <button className="btn btn-primary" disabled={createMut.isPending}>
            {createMut.isPending ? (
              <>
                <i className="bi bi-hourglass-split me-2"></i> Envoi…
              </>
            ) : (
              <>
                <i className="bi bi-check-circle me-2"></i> Créer la commande
              </>
            )}
          </button>
        </div>

        {!!errMsg && (
          <div className="alert alert-danger mt-3" role="alert">
            <i className="bi bi-exclamation-octagon-fill me-2"></i>
            {errMsg}
          </div>
        )}
      </form>

      {/* 🔎 Aperçu des infos saisies */}
      <div className="card mt-4 shadow-sm">
        <div className="card-body">
          <h5 className="text-secondary mb-3">
            <i className="bi bi-eye me-2"></i> Aperçu de la commande
          </h5>
          <p><strong>Nom patient :</strong> {form.patient_name || "-"}</p>
          <p><strong>Sexe :</strong> {form.patient_sex || "-"}</p>
          <p><strong>Âge :</strong> {form.patient_age || "-"}</p>
          <p><strong>Modèle :</strong> {form.model || "-"}</p>
          <p><strong>Remarques :</strong> {form.remark || "-"}</p>

          <h6>Travaux :</h6>
          <ul>
            {form.works.map((w, i) => (
              <li key={i}>
{w.work_type || "?"} – {w.sub_type || "?"} – 
Haut: {Array.isArray(w.upper_teeth) && w.upper_teeth.length > 0 ? w.upper_teeth.join(", ") : "aucune"} | 
Bas: {Array.isArray(w.lower_teeth) && w.lower_teeth.length > 0 ? w.lower_teeth.join(", ") : "aucune"}
              </li>
            ))}
          </ul>

          <h6>Fichiers :</h6>
          <ul>
            {form.files.map((f, i) => (
              <li key={i}>{f.name} ({(f.size / (1024 * 1024)).toFixed(2)} Mo)</li>
            ))}
          </ul>
        </div>
      </div>
    </>
  );
}

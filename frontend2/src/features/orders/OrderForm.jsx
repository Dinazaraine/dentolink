import React, { useState, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { createOrder } from "./api.js";
import DentalChart from "../../components/DentalChart.jsx";

const ACCEPTED_EXT = [
  "image/png",
  "image/jpeg",
  "image/jpg",
  "image/webp",
  ".stl",
  ".obj",
  ".ply",
];
const MAX_PER_FILE_MB = 50;
const MAX_FILES = 10;

export default function OrderForm({ onCreated }) {
  const fileInputRef = useRef(null);
  const notified = useRef(false);

  const [form, setForm] = useState({
    patient_name: "",
    patient_sex: "",
    patient_age: "",
    work_type: "",
    sub_type: "",
    model: "",
    remark: "",
    files: [],
  });

  const [selectedTeeth, setSelectedTeeth] = useState([]);
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
          work_type: "",
          sub_type: "",
          model: "",
          remark: "",
          files: [],
        });
        if (fileInputRef.current) fileInputRef.current.value = "";
        setSelectedTeeth([]);
        setTimeout(() => (notified.current = false), 0);
      }
    },
    onError: (err) => {
      setErrMsg(
        String(err?.error || err?.response?.data?.error || err?.message || err)
      );
    },
  });

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((f) => ({ ...f, [name]: value }));
  }

  function handleFilesSelected(e) {
    let next = Array.from(e.target.files || []);
    next = next.filter((file) => {
      const okType =
        ACCEPTED_EXT.includes(file.type) ||
        ACCEPTED_EXT.some((ext) =>
          file.name?.toLowerCase().endsWith(ext)
        );
      const okSize = file.size <= MAX_PER_FILE_MB * 1024 * 1024;
      return okType && okSize;
    });
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

  function onSubmit(e) {
    e.preventDefault();
    if (!form.patient_name || !form.patient_sex || !form.patient_age || !form.work_type) {
      setErrMsg("Veuillez remplir les champs obligatoires.");
      return;
    }

    const upper = selectedTeeth.filter((n) => n >= 11 && n <= 28);
    const lower = selectedTeeth.filter((n) => n >= 31 && n <= 48);

    const payload = {
      patient_name: form.patient_name,
      patient_sex: form.patient_sex,
      patient_age: Number(form.patient_age),
      work_type: form.work_type,
      sub_type: form.sub_type || "",
      model: form.model || "",
      remark: form.remark || "",
      upper_teeth: upper,
      lower_teeth: lower,
      files: form.files,
    };

    createMut.mutate(payload);
  }

  function renderSubType() {
    switch (form.work_type) {
      case "Conjointe":
        return (
          <select name="sub_type" value={form.sub_type} onChange={handleChange}>
            <option value="">Sélectionner un détail</option>
            <option value="COURONNE OU BRIDGE">COURONNE OU BRIDGE</option>
            <option value="inlay onlay">inlay onlay</option>
            <option value="Chape de couronne">Chape de couronne</option>
            <option value="facette">facette</option>
            <option value="inlay core">inlay core</option>
          </select>
        );
      case "Adjointe":
        return (
          <select name="sub_type" value={form.sub_type} onChange={handleChange}>
            <option value="">Sélectionner un détail</option>
            <option value="PLAQUE STELLITE">PLAQUE STELLITE</option>
            <option value="PAP CLASSIQUE">PAP CLASSIQUE</option>
            <option value="Stellite+montage dent">Stellite+montage dent</option>
          </select>
        );
      case "Implant":
        return (
          <select name="sub_type" value={form.sub_type} onChange={handleChange}>
            <option value="">Sélectionner un détail</option>
            <option value="couronne sur implant">couronne sur implant</option>
            <option value="pilier personnalisé">pilier personnalisé</option>
            <option value="all on x">all on x</option>
          </select>
        );
      default:
        return null;
    }
  }

  return (
    <form onSubmit={onSubmit} style={{ display: "grid", gap: 12, maxWidth: 700 }}>
      <h3>Nouvelle commande</h3>

      <input
        name="patient_name"
        placeholder="Nom du patient"
        value={form.patient_name}
        onChange={handleChange}
        required
      />

      <select name="patient_sex" value={form.patient_sex} onChange={handleChange} required>
        <option value="">Sexe</option>
        <option value="Homme">Homme</option>
        <option value="Femme">Femme</option>
      </select>

      <input
        type="number"
        name="patient_age"
        placeholder="Âge"
        value={form.patient_age}
        onChange={handleChange}
        required
      />

      <div style={{ display: "flex", gap: 10 }}>
        <select name="work_type" value={form.work_type} onChange={handleChange} required>
          <option value="">Type de travail</option>
          <option value="Conjointe">Conjointe</option>
          <option value="Adjointe">Adjointe</option>
          <option value="Implant">Implant</option>
          <option value="Gouttière">Gouttière</option>
          <option value="Planification Implantaire">Planification Implantaire</option>
          <option value="Analyse aligneur">Analyse aligneur</option>
        </select>
        {renderSubType()}
      </div>

      <select name="model" value={form.model} onChange={handleChange}>
        <option value="">Modèle de travail</option>
        <option value="1 arcade">1 arcade</option>
        <option value="Haut et bas">Haut et bas</option>
      </select>

      <DentalChart selectedTeeth={selectedTeeth} setSelectedTeeth={setSelectedTeeth} />

      <textarea
        name="remark"
        placeholder="Remarques"
        value={form.remark}
        onChange={handleChange}
      />

      <div>
        <label>Fichiers (STL / Images)</label>
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".stl,.obj,.ply,image/png,image/jpeg,image/jpg,image/webp"
          onChange={handleFilesSelected}
        />
        {form.files.length > 0 && (
          <ul>
            {form.files.map((f, i) => (
              <li key={i}>
                {f.name} ({(f.size / (1024 * 1024)).toFixed(2)} Mo)
                <button type="button" onClick={() => removeFileAt(i)}>Retirer</button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <button disabled={createMut.isPending}>
        {createMut.isPending ? "Envoi…" : "Créer la commande"}
      </button>

      {!!errMsg && <div style={{ color: "crimson" }}>{errMsg}</div>}
    </form>
  );
}

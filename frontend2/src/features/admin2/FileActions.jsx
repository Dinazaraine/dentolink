export default function FileActions({ files }) {
  return (
    <div>
      <h4>Fichiers envoyés par le dentiste</h4>
      {files?.map((f, i) => (
        <div key={i}>
          <a href={f.url} target="_blank" rel="noreferrer">{f.originalName}</a>
          <button onClick={() => window.open(f.url, "_blank")}>Télécharger</button>
        </div>
      ))}
    </div>
  );
}

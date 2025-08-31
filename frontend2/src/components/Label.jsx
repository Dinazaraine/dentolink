export default function Label({ children, htmlFor }) {
  return (
    <label htmlFor={htmlFor} style={{ display: 'block', marginBottom: 6, fontWeight: 600 }}>
      {children}
    </label>
  )
}

export default function Card({ children }) {
  return (
    <div style={{ border: '1px solid #eee', borderRadius: 12, padding: 16, background: '#fff' }}>
      {children}
    </div>
  )
}

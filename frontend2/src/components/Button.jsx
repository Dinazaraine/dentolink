export default function Button({ children, ...props }) {
  return (
    <button
      {...props}
      style={{
        padding: '8px 12px',
        borderRadius: 8,
        border: '1px solid #111',
        background: '#111',
        color: '#fff',
        cursor: 'pointer',
      }}
    >
      {children}
    </button>
  )
}

import { Outlet, NavLink } from 'react-router-dom'
import NavBar from './NavBar'

export default function AppLayout() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: 16 }}>
      <NavBar />
      <Outlet />
    </div>
  )
}

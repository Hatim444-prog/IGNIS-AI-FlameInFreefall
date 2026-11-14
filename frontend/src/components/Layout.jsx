import { NavLink, Outlet } from 'react-router-dom'
import { NAV } from '../lib/labels'
import ShortlistBar from './ShortlistBar'
import SiteFooter from './SiteFooter'

export default function Layout() {
  return (
    <div className="app-shell">
      <aside className="side-nav">
        <p className="brand">IGNIS</p>
        <p className="brand-tag">Find flame-safety evidence for space missions</p>
        <nav aria-label="Main">
          <ul className="nav-list">
            {NAV.map((item) => (
              <li key={item.to}>
                <NavLink
                  to={item.to}
                  end={item.end}
                  className={({ isActive }) => (isActive ? 'active' : undefined)}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </aside>
      <div className="main-column">
        <ShortlistBar />
        <main className="main-content">
          <Outlet />
        </main>
        <SiteFooter />
      </div>
    </div>
  )
}

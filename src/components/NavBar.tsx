import { NavLink } from 'react-router-dom'
import { ThemeToggle } from './ThemeToggle'
import styles from './NavBar.module.css'

export function NavBar() {
  return (
    <nav className={styles.nav}>
      <div className={styles.links}>
        <NavLink
          to="/"
          end
          className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
        >
          Цели
        </NavLink>
        <NavLink
          to="/gallery"
          className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
        >
          Общая галерея
        </NavLink>
        <NavLink
          to="/journal"
          className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
        >
          Дневник благодарностей
        </NavLink>
      </div>
      <ThemeToggle />
    </nav>
  )
}

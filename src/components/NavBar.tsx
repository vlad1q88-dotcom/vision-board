import { NavLink } from 'react-router-dom'
import { BackupMenu } from './BackupMenu'
import { ThemeToggle } from './ThemeToggle'
import styles from './NavBar.module.css'

export function NavBar() {
  return (
    <div className={styles.bar}>
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
            to="/plan"
            className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
          >
            План
          </NavLink>
          <NavLink
            to="/journal"
            className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
          >
            Дневник благодарностей
          </NavLink>
          <NavLink
            to="/gallery"
            className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
          >
            Общая галерея
          </NavLink>
          <NavLink
            to="/wish-map"
            className={({ isActive }) => (isActive ? styles.linkActive : styles.link)}
          >
            Карта желаний
          </NavLink>
        </div>
        <div className={styles.controls}>
          <BackupMenu />
          <ThemeToggle />
        </div>
      </nav>
    </div>
  )
}

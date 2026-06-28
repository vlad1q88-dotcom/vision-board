import { Route, Routes } from 'react-router-dom'
import { GoalsListPage } from './pages/GoalsListPage'
import { PlanPage } from './pages/PlanPage'
import { GalleryPage } from './pages/GalleryPage'
import { SlideshowPage } from './pages/SlideshowPage'
import { JournalPage } from './pages/JournalPage'
import { WishMapPage } from './pages/WishMapPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<GoalsListPage />} />
      <Route path="/plan" element={<PlanPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/slideshow" element={<SlideshowPage />} />
      <Route path="/journal" element={<JournalPage />} />
      <Route path="/wish-map" element={<WishMapPage />} />
    </Routes>
  )
}

export default App

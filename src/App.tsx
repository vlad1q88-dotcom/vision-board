import { Route, Routes } from 'react-router-dom'
import { GoalsListPage } from './pages/GoalsListPage'
import { GalleryPage } from './pages/GalleryPage'
import { SlideshowPage } from './pages/SlideshowPage'
import { JournalPage } from './pages/JournalPage'
import { WishMapPage } from './pages/WishMapPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<GoalsListPage />} />
      <Route path="/gallery" element={<GalleryPage />} />
      <Route path="/slideshow" element={<SlideshowPage />} />
      <Route path="/journal" element={<JournalPage />} />
      <Route path="/wish-map" element={<WishMapPage />} />
    </Routes>
  )
}

export default App

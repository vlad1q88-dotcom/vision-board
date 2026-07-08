import { useEffect, useState } from 'react'
import QRCode from 'qrcode'
import { DONATION_URL } from '../donation'
import styles from './DonateButton.module.css'

function DonateDialog({ onClose }: { onClose: () => void }) {
  const [qrDataUrl, setQrDataUrl] = useState('')

  useEffect(() => {
    QRCode.toDataURL(DONATION_URL, { width: 240, margin: 1 }).then(setQrDataUrl)
  }, [])

  return (
    <div className={styles.backdrop} onClick={onClose}>
      <div className={styles.dialog} onClick={(event) => event.stopPropagation()}>
        <h3 className={styles.title}>Поддержать проект</h3>
        {/* Deliberately kept on a white plate even in the dark theme — inverted (light-on-dark)
            QR codes scan unreliably in many camera apps. */}
        <div className={styles.qrPlate}>{qrDataUrl && <img src={qrDataUrl} alt="QR-код для доната" />}</div>
        <a className={styles.link} href={DONATION_URL} target="_blank" rel="noreferrer">
          {DONATION_URL}
        </a>
        <button type="button" className={styles.close} onClick={onClose}>
          Закрыть
        </button>
      </div>
    </div>
  )
}

export function DonateButton() {
  const [isOpen, setIsOpen] = useState(false)

  if (!DONATION_URL) return null

  return (
    <>
      <button
        type="button"
        className={styles.toggle}
        onClick={() => setIsOpen(true)}
        aria-label="Поддержать проект"
        title="Поддержать проект"
      >
        <svg viewBox="0 0 24 24" className={styles.icon}>
          <path
            d="M12 21s-7.5-4.7-10-9.2C.5 8.2 2.4 4.5 6 4.5c2.1 0 3.6 1.1 6 3.6 2.4-2.5 3.9-3.6 6-3.6 3.6 0 5.5 3.7 4 7.3C19.5 16.3 12 21 12 21z"
            fill="currentColor"
          />
        </svg>
      </button>
      {isOpen && <DonateDialog onClose={() => setIsOpen(false)} />}
    </>
  )
}

import Link from 'next/link'

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link href="/" className="logo">
              <span className="logo-mark"><span>A</span></span>
              Worklin
            </Link>
            <p>La plateforme qui rend l&apos;artisanat aussi simple à réserver qu&apos;un cabinet médical.</p>
          </div>

          <div className="footer-col">
            <h4>Particuliers</h4>
            <ul>
              <li><Link href="/recherche">Trouver un artisan</Link></li>
              <li><Link href="/recherche?urgent=1">Dépannage urgent</Link></li>
              <li><Link href="/#how">Comment ça marche</Link></li>
              <li><Link href="#">Garantie qualité</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Artisans</h4>
            <ul>
              <li><Link href="/devenir-artisan">Devenir Pionnier</Link></li>
              <li><Link href="#">Tarifs</Link></li>
              <li><Link href="/dashboard/artisan">Tableau de bord</Link></li>
              <li><Link href="#">Centre d&apos;aide pro</Link></li>
            </ul>
          </div>

          <div className="footer-col">
            <h4>Worklin</h4>
            <ul>
              <li><Link href="#">À propos</Link></li>
              <li><Link href="#">Carrières</Link></li>
              <li><Link href="#">Presse</Link></li>
              <li><Link href="#">Contact</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <div>© 2026 Worklin · SAS au capital de 50 000 €</div>
          <div style={{ display: 'flex', gap: '24px' }}>
            <Link href="#">Mentions légales</Link>
            <Link href="#">CGU</Link>
            <Link href="#">Confidentialité</Link>
            <Link href="#">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

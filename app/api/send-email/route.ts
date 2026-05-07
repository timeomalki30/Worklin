import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const FROM = process.env.RESEND_FROM || 'Worklin <noreply@worklin.fr>'
const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'https://worklin.fr'

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) {
    console.warn('[email] RESEND_API_KEY not set — skipping send to', to)
    return
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
  if (!res.ok) console.error('[email] Resend error:', await res.text())
}

function emailBase(content: string) {
  return `<!DOCTYPE html><html><body style="font-family:system-ui,sans-serif;background:#F5F1E8;padding:32px">
<div style="max-width:600px;margin:0 auto;background:white;border-radius:16px;overflow:hidden;border:1px solid #E5DCC8">
  <div style="background:#0B2440;padding:20px 28px;display:flex;align-items:center;gap:12px">
    <div style="width:32px;height:32px;background:#DD5A2A;border-radius:8px;display:flex;align-items:center;justify-content:center">
      <span style="color:white;font-weight:900;font-size:16px">W</span>
    </div>
    <span style="color:white;font-weight:800;font-size:18px">Worklin</span>
  </div>
  <div style="padding:28px">${content}</div>
  <div style="padding:16px 28px;background:#F5F1E8;border-top:1px solid #E5DCC8;font-size:11px;color:#8A8675;text-align:center">
    Worklin · La plateforme des artisans solos · ${APP_URL}
  </div>
</div></body></html>`
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type } = body
  const supabase = createAdminClient()

  // ── Nouvelle demande vitrine ──
  if (type === 'nouvelle_demande') {
    const { artisanId, demande } = body
    const { data: artisan } = await supabase.from('artisans').select('*, profiles(email, prenom, nom)').eq('id', artisanId).single()
    const artisanEmail = (artisan?.profiles as any)?.email
    if (artisanEmail) {
      await sendEmail(artisanEmail, `📩 Nouvelle demande de devis sur votre vitrine`, emailBase(`
        <h2 style="color:#0B2440;margin-bottom:8px">Nouvelle demande reçue !</h2>
        <p>Un client a rempli le formulaire de votre vitrine Worklin.</p>
        <div style="background:#F5F1E8;border-radius:12px;padding:16px;margin:16px 0">
          <p style="margin:0 0 6px"><strong>Nom :</strong> ${demande.nom}</p>
          ${demande.email ? `<p style="margin:0 0 6px"><strong>Email :</strong> ${demande.email}</p>` : ''}
          ${demande.phone ? `<p style="margin:0 0 6px"><strong>Tél :</strong> ${demande.phone}</p>` : ''}
          <p style="margin:0"><strong>Besoin :</strong> ${demande.description}</p>
        </div>
        <a href="${APP_URL}/dashboard/artisan/vitrine" style="display:inline-block;background:#DD5A2A;color:white;padding:12px 24px;border-radius:12px;text-decoration:none;font-weight:700">
          Répondre et créer un devis →
        </a>
      `))
    }
  }

  // ── Envoi devis ──
  if (type === 'devis') {
    const { clientEmail, devisId } = body
    if (!clientEmail) return NextResponse.json({ ok: true })
    const { data: devis } = await supabase.from('devis').select('*, artisans(entreprise, profiles(prenom, nom))').eq('id', devisId).single()
    if (!devis) return NextResponse.json({ ok: true })
    const artisanName = devis.artisans?.entreprise || `${(devis.artisans?.profiles as any)?.prenom} ${(devis.artisans?.profiles as any)?.nom}`
    await sendEmail(clientEmail, `Devis ${devis.numero} — ${artisanName}`, emailBase(`
      <h2 style="color:#0B2440;margin-bottom:8px">Votre devis est prêt 📄</h2>
      <p><strong>${artisanName}</strong> vous a envoyé un devis.</p>
      <div style="background:#F5F1E8;border-radius:12px;padding:16px;margin:16px 0">
        <p style="margin:0 0 6px"><strong>N° :</strong> ${devis.numero}</p>
        ${devis.titre ? `<p style="margin:0 0 6px"><strong>Objet :</strong> ${devis.titre}</p>` : ''}
        <p style="margin:0 0 6px"><strong>Montant TTC :</strong> ${devis.total_ttc.toFixed(2)} €</p>
        ${devis.date_validite ? `<p style="margin:0;color:#DD5A2A"><strong>Valable jusqu'au :</strong> ${new Date(devis.date_validite).toLocaleDateString('fr-FR')}</p>` : ''}
      </div>
      <p style="font-size:12px;color:#8A8675">Pour accepter ce devis, répondez à cet email ou contactez directement l'artisan.</p>
    `))
  }

  // ── Envoi facture ──
  if (type === 'facture') {
    const { clientEmail, factureId } = body
    if (!clientEmail) return NextResponse.json({ ok: true })
    const { data: facture } = await supabase.from('factures').select('*, artisans(entreprise, profiles(prenom, nom))').eq('id', factureId).single()
    if (!facture) return NextResponse.json({ ok: true })
    const artisanName = facture.artisans?.entreprise || `${(facture.artisans?.profiles as any)?.prenom} ${(facture.artisans?.profiles as any)?.nom}`
    await sendEmail(clientEmail, `Facture ${facture.numero} — ${artisanName}`, emailBase(`
      <h2 style="color:#0B2440;margin-bottom:8px">Votre facture 🧾</h2>
      <p><strong>${artisanName}</strong> vous a envoyé une facture.</p>
      <div style="background:#F5F1E8;border-radius:12px;padding:16px;margin:16px 0">
        <p style="margin:0 0 6px"><strong>N° :</strong> ${facture.numero}</p>
        ${facture.titre ? `<p style="margin:0 0 6px"><strong>Objet :</strong> ${facture.titre}</p>` : ''}
        <p style="margin:0 0 6px"><strong>Montant TTC :</strong> ${facture.total_ttc.toFixed(2)} €</p>
        ${facture.date_echeance ? `<p style="margin:0;color:#B83A2A"><strong>Échéance :</strong> ${new Date(facture.date_echeance).toLocaleDateString('fr-FR')}</p>` : ''}
      </div>
      <p style="font-size:12px;color:#8A8675">En cas de retard de paiement, des pénalités légales s'appliqueront (art. L441-10 C. com.).</p>
    `))
  }

  // ── Relance impayé ──
  if (type === 'relance') {
    const { clientEmail, factureId, facture } = body
    if (!clientEmail) return NextResponse.json({ ok: true })
    const { data: f } = await supabase.from('factures').select('*, artisans(entreprise, profiles(prenom, nom, phone))').eq('id', factureId).single()
    if (!f) return NextResponse.json({ ok: true })
    const artisanName = f.artisans?.entreprise || `${(f.artisans?.profiles as any)?.prenom} ${(f.artisans?.profiles as any)?.nom}`
    const phone = (f.artisans?.profiles as any)?.phone
    await sendEmail(clientEmail, `Rappel paiement — Facture ${f.numero}`, emailBase(`
      <h2 style="color:#0B2440;margin-bottom:8px">Rappel de paiement</h2>
      <p>Nous vous rappelons que la facture ci-dessous reste à régler.</p>
      <div style="background:#FEE2E2;border-radius:12px;padding:16px;margin:16px 0;border:1px solid #FECACA">
        <p style="margin:0 0 6px"><strong>Facture :</strong> ${f.numero}</p>
        <p style="margin:0 0 6px"><strong>Montant TTC :</strong> ${f.total_ttc.toFixed(2)} €</p>
        ${f.date_echeance ? `<p style="margin:0;color:#DC2626"><strong>Échéance dépassée :</strong> ${new Date(f.date_echeance).toLocaleDateString('fr-FR')}</p>` : ''}
      </div>
      <p>Merci de régulariser votre situation. Pour toute question, contactez <strong>${artisanName}</strong>${phone ? ` au ${phone}` : ''}.</p>
      <p style="font-size:11px;color:#8A8675;margin-top:16px">Conformément à l'art. L441-10 du Code de commerce, tout retard de paiement entraîne des pénalités au taux légal + indemnité forfaitaire de 40 €.</p>
    `))
  }

  return NextResponse.json({ ok: true })
}

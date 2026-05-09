import { NextRequest, NextResponse } from 'next/server'
import { createAdminClient } from '@/lib/supabase/server'

const FROM = process.env.RESEND_FROM || 'Worklin <noreply@worklin.fr>'

async function sendEmail(to: string, subject: string, html: string) {
  if (!process.env.RESEND_API_KEY) return
  await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, html }),
  })
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { type } = body
  const supabase = createAdminClient()

  if (type === 'reservation_confirmation') {
    const { userId, artisanId, date, heure } = body

    const [{ data: user }, { data: artisan }] = await Promise.all([
      supabase.from('profiles').select('email, prenom, nom').eq('id', userId).single(),
      supabase.from('artisans').select('metier, entreprise, profiles(email, prenom, nom)').eq('id', artisanId).single(),
    ])

    const artisanName = artisan?.entreprise || `${(artisan?.profiles as any)?.prenom} ${(artisan?.profiles as any)?.nom}`
    const dateFormatted = new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })

    if (user?.email) {
      await sendEmail(user.email, `Votre demande de RDV chez ${artisanName}`, `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
          <h1 style="color:#0B2440;font-size:24px;margin-bottom:8px">Demande de RDV envoyée ✅</h1>
          <p>Bonjour ${user.prenom},</p>
          <p>Votre demande de rendez-vous avec <strong>${artisanName}</strong> (${artisan?.metier}) a bien été transmise.</p>
          <div style="background:#F5F1E8;border-radius:8px;padding:20px;margin:24px 0">
            <p style="margin:0"><strong>Date :</strong> ${dateFormatted} à ${heure}</p>
          </div>
          <p>Vous recevrez une confirmation dès que l'artisan aura accepté votre demande.</p>
          <p style="color:#8A8675;font-size:12px;margin-top:48px">Worklin — La plateforme des artisans de confiance</p>
        </div>
      `)
    }

    if ((artisan?.profiles as any)?.email) {
      await sendEmail((artisan.profiles as any).email, `Nouvelle demande de RDV — ${dateFormatted} à ${heure}`, `
        <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
          <h1 style="color:#0B2440;font-size:24px;margin-bottom:8px">Nouvelle demande de RDV 📅</h1>
          <p>Bonjour,</p>
          <p><strong>${user?.prenom} ${user?.nom}</strong> souhaite vous rencontrer.</p>
          <div style="background:#F5F1E8;border-radius:8px;padding:20px;margin:24px 0">
            <p style="margin:0"><strong>Date :</strong> ${dateFormatted} à ${heure}</p>
          </div>
          <p>Connectez-vous à votre <a href="${process.env.NEXT_PUBLIC_URL || 'https://worklin.fr'}/dashboard/artisan/agenda" style="color:#DD5A2A">espace artisan</a> pour confirmer ou refuser cette demande.</p>
          <p style="color:#8A8675;font-size:12px;margin-top:48px">Worklin Pro — Gérez votre activité sereinement</p>
        </div>
      `)
    }
  }

  if (type === 'devis') {
    const { clientEmail, devisId } = body
    if (!clientEmail) return NextResponse.json({ ok: true })

    const { data: devis } = await supabase.from('devis').select('*, artisans(entreprise, profiles(prenom, nom))').eq('id', devisId).single()
    if (!devis) return NextResponse.json({ ok: true })

    const artisanName = devis.artisans?.entreprise || `${(devis.artisans?.profiles as any)?.prenom} ${(devis.artisans?.profiles as any)?.nom}`

    await sendEmail(clientEmail, `Devis ${devis.numero} — ${artisanName}`, `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#0B2440;font-size:24px;margin-bottom:8px">Votre devis est prêt 📄</h1>
        <p>${artisanName} vous a envoyé un devis.</p>
        <div style="background:#F5F1E8;border-radius:8px;padding:20px;margin:24px 0">
          <p style="margin:0 0 8px"><strong>Numéro :</strong> ${devis.numero}</p>
          ${devis.titre ? `<p style="margin:0 0 8px"><strong>Objet :</strong> ${devis.titre}</p>` : ''}
          <p style="margin:0"><strong>Montant TTC :</strong> ${devis.total_ttc.toFixed(2)} €</p>
        </div>
        <p style="color:#8A8675;font-size:12px;margin-top:48px">Worklin Pro</p>
      </div>
    `)
  }

  if (type === 'facture') {
    const { clientEmail, factureId } = body
    if (!clientEmail) return NextResponse.json({ ok: true })

    const { data: facture } = await supabase.from('factures').select('*, artisans(entreprise, profiles(prenom, nom))').eq('id', factureId).single()
    if (!facture) return NextResponse.json({ ok: true })

    const artisanName = facture.artisans?.entreprise || `${(facture.artisans?.profiles as any)?.prenom} ${(facture.artisans?.profiles as any)?.nom}`

    await sendEmail(clientEmail, `Facture ${facture.numero} — ${artisanName}`, `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px">
        <h1 style="color:#0B2440;font-size:24px;margin-bottom:8px">Votre facture 🧾</h1>
        <p>${artisanName} vous a envoyé une facture.</p>
        <div style="background:#F5F1E8;border-radius:8px;padding:20px;margin:24px 0">
          <p style="margin:0 0 8px"><strong>Numéro :</strong> ${facture.numero}</p>
          ${facture.titre ? `<p style="margin:0 0 8px"><strong>Objet :</strong> ${facture.titre}</p>` : ''}
          <p style="margin:0 0 8px"><strong>Montant TTC :</strong> ${facture.total_ttc.toFixed(2)} €</p>
          ${facture.date_echeance ? `<p style="margin:0"><strong>Échéance :</strong> ${new Date(facture.date_echeance).toLocaleDateString('fr-FR')}</p>` : ''}
        </div>
        <p style="color:#8A8675;font-size:12px;margin-top:48px">Worklin Pro</p>
      </div>
    `)
  }

  return NextResponse.json({ ok: true })
}

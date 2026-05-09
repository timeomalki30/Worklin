import { Document, Page, Text, View, StyleSheet, Font } from '@react-pdf/renderer'
import type { Devis, Facture, ClientArtisan } from '@/types'

const styles = StyleSheet.create({
  page: { backgroundColor: '#FFFFFF', fontFamily: 'Helvetica', fontSize: 10, color: '#0A0E13', padding: '40px 48px' },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32, paddingBottom: 24, borderBottom: '2px solid #0B2440' },
  logo: { fontSize: 28, fontFamily: 'Helvetica-Bold', color: '#0B2440', letterSpacing: -1 },
  logoSub: { fontSize: 9, color: '#DD5A2A', fontFamily: 'Helvetica-Bold', letterSpacing: 2, textTransform: 'uppercase', marginTop: 4 },
  docType: { fontSize: 22, fontFamily: 'Helvetica-Bold', color: '#0B2440', textAlign: 'right' },
  docNum: { fontSize: 12, color: '#8A8675', textAlign: 'right', marginTop: 4 },
  docDate: { fontSize: 10, color: '#4A5260', textAlign: 'right', marginTop: 2 },
  section: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 32 },
  address: { fontSize: 10, lineHeight: 1.6, color: '#4A5260' },
  addressTitle: { fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#8A8675', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 },
  addressName: { fontFamily: 'Helvetica-Bold', color: '#0A0E13', fontSize: 11, marginBottom: 2 },
  tableHeader: { flexDirection: 'row', backgroundColor: '#0B2440', color: 'white', padding: '8px 12px', marginBottom: 0, fontFamily: 'Helvetica-Bold', fontSize: 9, textTransform: 'uppercase', letterSpacing: 0.8 },
  tableRow: { flexDirection: 'row', padding: '10px 12px', borderBottom: '1px solid #E5DCC8' },
  tableRowAlt: { flexDirection: 'row', padding: '10px 12px', backgroundColor: '#FBF7EE', borderBottom: '1px solid #E5DCC8' },
  col1: { flex: 2.5 },
  col2: { width: 50, textAlign: 'center' },
  col3: { width: 55, textAlign: 'right' },
  col4: { width: 50, textAlign: 'right' },
  col5: { width: 70, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  totalsSection: { marginTop: 20, alignItems: 'flex-end' },
  totalRow: { flexDirection: 'row', justifyContent: 'flex-end', gap: 24, padding: '4px 0', fontSize: 10 },
  totalFinal: { flexDirection: 'row', justifyContent: 'flex-end', gap: 24, padding: '12px 16px', backgroundColor: '#0B2440', color: 'white', marginTop: 4, borderRadius: 4 },
  totalLabel: { width: 120, textAlign: 'right', color: '#8A8675' },
  totalValue: { width: 80, textAlign: 'right', fontFamily: 'Helvetica-Bold' },
  totalFinalLabel: { width: 120, textAlign: 'right', color: 'rgba(255,255,255,0.8)', fontFamily: 'Helvetica-Bold', fontSize: 12 },
  totalFinalValue: { width: 80, textAlign: 'right', fontFamily: 'Helvetica-Bold', fontSize: 14, color: 'white' },
  footer: { marginTop: 40, paddingTop: 16, borderTop: '1px solid #E5DCC8', fontSize: 8, color: '#8A8675', lineHeight: 1.6 },
  mentions: { fontSize: 8, color: '#8A8675', marginTop: 8, lineHeight: 1.5 },
  badge: { backgroundColor: '#FCEEE3', color: '#DD5A2A', padding: '4px 10px', borderRadius: 4, fontSize: 9, fontFamily: 'Helvetica-Bold', textTransform: 'uppercase', letterSpacing: 1 },
})

interface Props {
  document: Devis | Facture
  type: 'devis' | 'facture'
  artisanInfo: {
    nom: string
    prenom: string
    entreprise?: string
    siret?: string
    tva?: string
    adresse?: string
    email?: string
    phone?: string
  }
  client?: ClientArtisan
}

export default function PDFDocument({ document: doc, type, artisanInfo, client }: Props) {
  const titre = type === 'devis' ? 'DEVIS' : 'FACTURE'
  const isDevis = type === 'devis'
  const d = doc as Devis

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.logo}>Worklin</Text>
            <Text style={styles.logoSub}>Pro</Text>
          </View>
          <View>
            <Text style={styles.docType}>{titre}</Text>
            <Text style={styles.docNum}>{doc.numero}</Text>
            <Text style={styles.docDate}>Émis le {new Date(doc.date_emission).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Text>
            {isDevis && (d as Devis).date_validite && (
              <Text style={[styles.docDate, { color: '#DD5A2A' }]}>Valable jusqu&apos;au {new Date((d as Devis).date_validite).toLocaleDateString('fr-FR')}</Text>
            )}
            {!isDevis && (doc as Facture).date_echeance && (
              <Text style={[styles.docDate, { color: '#B83A2A' }]}>Échéance : {new Date((doc as Facture).date_echeance).toLocaleDateString('fr-FR')}</Text>
            )}
          </View>
        </View>

        {/* Addresses */}
        <View style={styles.section}>
          <View style={{ flex: 1, marginRight: 32 }}>
            <Text style={styles.addressTitle}>Prestataire</Text>
            <Text style={styles.addressName}>{artisanInfo.entreprise || `${artisanInfo.prenom} ${artisanInfo.nom}`}</Text>
            <Text style={styles.address}>{artisanInfo.adresse}</Text>
            {artisanInfo.siret && <Text style={styles.address}>SIRET : {artisanInfo.siret}</Text>}
            {artisanInfo.tva && <Text style={styles.address}>TVA Intracommunautaire : {artisanInfo.tva}</Text>}
            {artisanInfo.email && <Text style={styles.address}>{artisanInfo.email}</Text>}
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.addressTitle}>Client</Text>
            {client ? (
              <>
                <Text style={styles.addressName}>{client.prenom} {client.nom}</Text>
                {client.adresse && <Text style={styles.address}>{client.adresse}</Text>}
                {client.email && <Text style={styles.address}>{client.email}</Text>}
                {client.phone && <Text style={styles.address}>{client.phone}</Text>}
              </>
            ) : (
              <Text style={styles.address}>—</Text>
            )}
          </View>
        </View>

        {/* Titre du document */}
        {doc.titre && <Text style={{ fontSize: 14, fontFamily: 'Helvetica-Bold', marginBottom: 16, color: '#0B2440' }}>{doc.titre}</Text>}

        {/* Table */}
        <View style={styles.tableHeader}>
          <Text style={styles.col1}>Description</Text>
          <Text style={styles.col2}>Qté</Text>
          <Text style={styles.col3}>Prix HT</Text>
          <Text style={styles.col4}>TVA</Text>
          <Text style={styles.col5}>Total HT</Text>
        </View>
        {doc.lignes.map((ligne, i) => (
          <View key={i} style={i % 2 === 0 ? styles.tableRow : styles.tableRowAlt}>
            <Text style={styles.col1}>{ligne.description}</Text>
            <Text style={styles.col2}>{ligne.quantite}{ligne.unite ? ` ${ligne.unite}` : ''}</Text>
            <Text style={styles.col3}>{ligne.prix_unitaire.toFixed(2)} €</Text>
            <Text style={styles.col4}>{ligne.tva_pct} %</Text>
            <Text style={styles.col5}>{(ligne.quantite * ligne.prix_unitaire).toFixed(2)} €</Text>
          </View>
        ))}

        {/* Totaux */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Total HT</Text>
            <Text style={styles.totalValue}>{doc.total_ht.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>TVA</Text>
            <Text style={styles.totalValue}>{doc.tva.toFixed(2)} €</Text>
          </View>
          <View style={styles.totalFinal}>
            <Text style={styles.totalFinalLabel}>TOTAL TTC</Text>
            <Text style={styles.totalFinalValue}>{doc.total_ttc.toFixed(2)} €</Text>
          </View>
        </View>

        {/* Notes */}
        {doc.notes && (
          <View style={{ marginTop: 24, padding: 12, backgroundColor: '#FBF7EE', borderRadius: 4 }}>
            <Text style={{ fontSize: 9, fontFamily: 'Helvetica-Bold', color: '#8A8675', textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 4 }}>Notes</Text>
            <Text style={{ fontSize: 10, color: '#4A5260', lineHeight: 1.5 }}>{doc.notes}</Text>
          </View>
        )}

        {/* Footer légal */}
        <View style={styles.footer}>
          {isDevis && (
            <Text>Ce devis est valable jusqu&apos;au {new Date((d as Devis).date_validite).toLocaleDateString('fr-FR')}. Pour l&apos;accepter, veuillez signer et retourner ce document avec la mention &quot;Bon pour accord&quot;.</Text>
          )}
          {!isDevis && (
            <Text>Paiement à réception de facture. En cas de retard, des pénalités de retard au taux légal en vigueur seront appliquées, ainsi qu&apos;une indemnité forfaitaire de 40 € pour frais de recouvrement (art. L441-10 C. com.).</Text>
          )}
          <Text style={{ marginTop: 6 }}>
            {artisanInfo.entreprise} — SIRET {artisanInfo.siret || 'N/A'}{artisanInfo.tva ? ` — TVA : ${artisanInfo.tva}` : ''} — Signature électronique conforme eIDAS
          </Text>
          <Text style={{ marginTop: 4, fontSize: 7.5, color: '#AAAAAA' }}>
            Document généré par Worklin Pro · Conforme réforme facturation électronique 2027 (PPF/PDP) · Les données fiscales sont conservées 10 ans
          </Text>
        </View>
      </Page>
    </Document>
  )
}

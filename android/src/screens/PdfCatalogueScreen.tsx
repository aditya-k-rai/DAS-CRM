import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Linking,
} from 'react-native';

interface PdfCatalogueScreenProps {
  onClose?: () => void;
}

export const PdfCatalogueScreen: React.FC<PdfCatalogueScreenProps> = ({ onClose }) => {
  const pdfList = [
    { title: 'DAS CRM Enterprise Suite 2026 Deck.pdf', size: '4.2 MB', updated: 'Updated 2 days ago' },
    { title: 'AI Lead Scoring Engine Pro Specs.pdf', size: '2.8 MB', updated: 'Updated last week' },
    { title: 'WhatsApp Cloud API Pricing Rate Card.pdf', size: '1.5 MB', updated: 'Updated 3 days ago' },
  ];

  const handleDispatchPdfViaWhatsApp = (pdfTitle: string) => {
    const text = encodeURIComponent(`Hi! Here is the requested corporate PDF brochure: ${pdfTitle}\nDownload directly: https://dascrm.com/docs/${encodeURIComponent(pdfTitle)}`);
    const waUrl = `whatsapp://send?text=${text}`;
    Linking.canOpenURL(waUrl)
      .then((supported) => {
        if (supported) {
          Linking.openURL(waUrl);
        } else {
          Alert.alert('📄 Brochure Dispatched', `Brochure link generated for ${pdfTitle}!\n\nLink: https://dascrm.com/docs/${pdfTitle}`);
        }
      })
      .catch(() => {
        Alert.alert('📄 Brochure Dispatched', `Brochure link generated for ${pdfTitle}!`);
      });
  };

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.topHeader}>
        {onClose && (
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backBtnText}>← Back to Operations</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>📄 PDF Catalogue &amp; Brochure Hub</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.moduleCard}>
          <Text style={styles.moduleTitle}>📄 Corporate PDF Catalogues &amp; Decks</Text>
          <Text style={styles.moduleSub}>Download, share or dispatch PDF brochures directly to leads via WhatsApp.</Text>

          {pdfList.map((pdf, idx) => (
            <View key={idx} style={[styles.itemRow, idx < pdfList.length - 1 && styles.borderBottom]}>
              <View style={{ flex: 1 }}>
                <Text style={styles.itemName}>📄 {pdf.title}</Text>
                <Text style={styles.itemSub}>{pdf.size} • {pdf.updated}</Text>
              </View>
              <View style={{ flexDirection: 'row', gap: 6 }}>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#38bdf8' }]}
                  onPress={() => Alert.alert('📄 Download PDF Catalogue', `Downloading ${pdf.title}...`)}
                >
                  <Text style={styles.actionBtnText}>Download</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, { backgroundColor: '#10b981' }]}
                  onPress={() => handleDispatchPdfViaWhatsApp(pdf.title)}
                >
                  <Text style={styles.actionBtnText}>Share WA</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  topHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingTop: 16, paddingBottom: 12, backgroundColor: '#0f172a', borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  backBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  backBtnText: { color: '#38bdf8', fontWeight: '900', fontSize: 11 },
  headerTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  scrollContent: { padding: 14, paddingBottom: 32 },
  moduleCard: { backgroundColor: '#0f172a', borderRadius: 18, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  moduleTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  moduleSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, marginBottom: 10, lineHeight: 14 },
  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  actionBtnText: { fontSize: 10, fontWeight: '900', color: '#ffffff' },
  itemRow: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  itemName: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  itemSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
});

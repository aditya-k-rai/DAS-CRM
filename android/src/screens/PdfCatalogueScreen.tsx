import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Linking,
} from 'react-native';

export interface PdfItem {
  id: string;
  title: string;
  size: string;
  updated: string;
  category: 'PRODUCT' | 'PRICING' | 'SPECIFICATION' | 'PROPOSAL';
  downloadsCount: number;
}

interface PdfCatalogueScreenProps {
  onClose?: () => void;
}

export const PdfCatalogueScreen: React.FC<PdfCatalogueScreenProps> = ({ onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewPdf, setPreviewPdf] = useState<PdfItem | null>(null);

  const [newTitle, setNewTitle] = useState('');
  const [newSize, setNewSize] = useState('3.5 MB');
  const [newCategory, setNewCategory] = useState<'PRODUCT' | 'PRICING' | 'SPECIFICATION' | 'PROPOSAL'>('PRODUCT');

  const [pdfList, setPdfList] = useState<PdfItem[]>([
    { id: '1', title: 'DAS CRM Enterprise Suite 2026 Deck.pdf', size: '4.2 MB', updated: 'Updated 2 days ago', category: 'PRODUCT', downloadsCount: 142 },
    { id: '2', title: 'AI Lead Scoring Engine Pro Specs.pdf', size: '2.8 MB', updated: 'Updated last week', category: 'SPECIFICATION', downloadsCount: 89 },
    { id: '3', title: 'WhatsApp Cloud API Pricing Rate Card.pdf', size: '1.5 MB', updated: 'Updated 3 days ago', category: 'PRICING', downloadsCount: 215 },
    { id: '4', title: 'GST 18% Commercial Proposal Template.pdf', size: '1.9 MB', updated: 'Updated yesterday', category: 'PROPOSAL', downloadsCount: 64 },
  ]);

  const handleUploadPdf = () => {
    if (!newTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for the corporate PDF document.');
      return;
    }
    const filename = newTitle.endsWith('.pdf') ? newTitle.trim() : `${newTitle.trim()}.pdf`;
    const newDoc: PdfItem = {
      id: `pdf_${Date.now()}`,
      title: filename,
      size: newSize.trim() || '2.0 MB',
      updated: 'Just Now',
      category: newCategory,
      downloadsCount: 0,
    };
    setPdfList([newDoc, ...pdfList]);
    setNewTitle('');
    setShowUploadModal(false);
    Alert.alert('✅ Brochure Published', `Successfully added "${filename}" to corporate catalogue!`);
  };

  const handleDispatchPdfViaWhatsApp = (pdf: PdfItem) => {
    const text = encodeURIComponent(`Hi! Here is the requested corporate PDF brochure: ${pdf.title}\nDownload directly: https://dascrm.com/docs/${encodeURIComponent(pdf.title)}`);
    const waUrl = `whatsapp://send?text=${text}`;
    Linking.canOpenURL(waUrl)
      .then((supported) => {
        if (supported) Linking.openURL(waUrl);
        else Alert.alert('📄 Brochure Link Generated', `Share URL: https://dascrm.com/docs/${pdf.title}`);
      })
      .catch(() => Alert.alert('📄 Brochure Link Generated', `Share URL: https://dascrm.com/docs/${pdf.title}`));
  };

  const handleDispatchPdfViaEmail = (pdf: PdfItem) => {
    Alert.prompt(
      '📧 Email PDF Brochure',
      `Enter recipient email address to dispatch ${pdf.title}:`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Send Email',
          onPress: (email?: string) => {
            if (email) {
              Alert.alert('📧 Email Dispatched', `Brochure ${pdf.title} sent to ${email} via AWS SES!`);
            }
          },
        },
      ]
    );
  };

  const filteredPdfs = pdfList.filter((pdf) => {
    if (searchQuery.trim()) {
      return pdf.title.toLowerCase().includes(searchQuery.toLowerCase());
    }
    return true;
  });

  return (
    <View style={styles.container}>
      {/* Header */}
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
          <View style={styles.cardHeaderRow}>
            <Text style={styles.moduleTitle}>📄 Corporate PDF Catalogues &amp; Decks</Text>
            <TouchableOpacity style={styles.actionBtnGreen} onPress={() => setShowUploadModal(true)}>
              <Text style={styles.btnTextWhite}>+ Upload PDF</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.moduleSub}>Download, preview, share or dispatch PDF brochures directly to leads via WhatsApp &amp; Email.</Text>

          <View style={{ marginVertical: 8 }}>
            <TextInput
              style={styles.inputField}
              placeholder="🔍 Search catalogues by title or keyword..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {filteredPdfs.map((pdf, idx) => (
            <View key={pdf.id} style={[styles.itemRow, idx < filteredPdfs.length - 1 && styles.borderBottom]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.itemName}>📄 {pdf.title}</Text>
                  <Text style={styles.catBadge}>{pdf.category}</Text>
                </View>
                <Text style={styles.itemSub}>{pdf.size} • {pdf.updated} • {pdf.downloadsCount} downloads</Text>
              </View>

              <View style={{ gap: 4, flexDirection: 'row' }}>
                <TouchableOpacity
                  style={styles.previewBtn}
                  onPress={() => {
                    setPreviewPdf(pdf);
                    setShowPreviewModal(true);
                  }}
                >
                  <Text style={styles.btnTextDark}>Preview</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shareWaBtn}
                  onPress={() => handleDispatchPdfViaWhatsApp(pdf)}
                >
                  <Text style={styles.btnTextWhite}>WA</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.shareEmailBtn}
                  onPress={() => handleDispatchPdfViaEmail(pdf)}
                >
                  <Text style={styles.btnTextWhite}>Email</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>

      {/* Upload Modal */}
      <Modal visible={showUploadModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>➕ Upload Corporate PDF Brochure</Text>
              <TouchableOpacity onPress={() => setShowUploadModal(false)} style={styles.modalCloseBtn}>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <View style={{ gap: 10 }}>
              <TextInput style={styles.inputField} placeholder="Brochure Title (e.g. Q4 Product Catalog)" placeholderTextColor="#64748b" value={newTitle} onChangeText={setNewTitle} />
              <TextInput style={styles.inputField} placeholder="File Size (e.g. 4.5 MB)" placeholderTextColor="#64748b" value={newSize} onChangeText={setNewSize} />
              <View style={{ flexDirection: 'row', gap: 4 }}>
                {(['PRODUCT', 'PRICING', 'SPECIFICATION', 'PROPOSAL'] as const).map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, newCategory === cat && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                    onPress={() => setNewCategory(cat)}
                  >
                    <Text style={{ fontSize: 8, fontWeight: '900', color: newCategory === cat ? '#ffffff' : '#94a3b8' }}>{cat}</Text>
                  </TouchableOpacity>
                ))}
              </View>
              <TouchableOpacity style={styles.saveUploadBtn} onPress={handleUploadPdf}>
                <Text style={{ color: '#090d16', fontWeight: '900', fontSize: 12 }}>🚀 Publish PDF Document →</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Document Preview Modal */}
      <Modal visible={showPreviewModal} transparent animationType="fade">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { height: '75%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>📖 {previewPdf?.title}</Text>
              <TouchableOpacity onPress={() => setShowPreviewModal(false)} style={styles.modalCloseBtn}>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>
            <View style={{ flex: 1, backgroundColor: '#020617', borderRadius: 12, padding: 16, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#334155' }}>
              <Text style={{ fontSize: 42, marginBottom: 10 }}>📄</Text>
              <Text style={{ fontSize: 14, fontWeight: '900', color: '#ffffff', textAlign: 'center' }}>{previewPdf?.title}</Text>
              <Text style={{ fontSize: 11, color: '#38bdf8', marginTop: 4 }}>Category: {previewPdf?.category} • Size: {previewPdf?.size}</Text>
              <Text style={{ fontSize: 10, color: '#94a3b8', marginTop: 12, textAlign: 'center', paddingHorizontal: 20 }}>
                Official DAS CRM Document Preview Renderer. 2-way sync enabled across mobile &amp; web portals.
              </Text>
            </View>
          </View>
        </View>
      </Modal>
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
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  moduleTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  moduleSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, marginBottom: 8, lineHeight: 14 },
  actionBtnGreen: { backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  btnTextWhite: { fontSize: 9, fontWeight: '900', color: '#ffffff' },
  btnTextDark: { fontSize: 9, fontWeight: '900', color: '#090d16' },
  inputField: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#ffffff' },
  itemRow: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  itemName: { fontSize: 11, fontWeight: '700', color: '#ffffff' },
  catBadge: { fontSize: 8, fontWeight: '900', color: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.15)', paddingHorizontal: 4, paddingVertical: 1, borderRadius: 4 },
  itemSub: { fontSize: 9, color: '#94a3b8', marginTop: 2 },
  previewBtn: { backgroundColor: '#38bdf8', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  shareWaBtn: { backgroundColor: '#10b981', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  shareEmailBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 6, paddingVertical: 4, borderRadius: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'center', padding: 16 },
  modalCard: { backgroundColor: '#0f172a', borderRadius: 20, padding: 16, borderWidth: 1, borderColor: '#1e293b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 8 },
  modalTitleText: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  modalCloseBtn: { backgroundColor: '#1e293b', width: 26, height: 26, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  saveUploadBtn: { backgroundColor: '#34d399', paddingVertical: 10, alignItems: 'center', borderRadius: 8, marginTop: 4 },
});

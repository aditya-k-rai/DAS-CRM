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
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

export interface WhatsAppTemplate {
  id: string;
  title: string;
  category: 'OUTREACH' | 'PROPOSAL' | 'FOLLOWUP' | 'PROMOTION';
  text: string;
}

interface WhatsAppTemplatesScreenProps {
  onClose?: () => void;
}

export const WhatsAppTemplatesScreen: React.FC<WhatsAppTemplatesScreenProps> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const [activeTab, setActiveTab] = useState<'ALL' | 'OUTREACH' | 'PROPOSAL' | 'FOLLOWUP' | 'PROMOTION'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  // Variable Sandbox State
  const [sandboxName, setSandboxName] = useState('Rajesh Kumar');
  const [sandboxCompany, setSandboxCompany] = useState('TechCorp Solutions');
  const [sandboxValue, setSandboxValue] = useState('₹5,90,000');
  const [sandboxProduct, setSandboxProduct] = useState('Enterprise Suite');

  const [waTemplatesList, setWaTemplatesList] = useState<WhatsAppTemplate[]>([
    {
      id: 'tpl_1',
      title: '🌱 Initial Lead Outreach',
      category: 'OUTREACH',
      text: 'Hi {name}! Thank you for reaching out to DAS CRM. We help companies like {company} scale sales calls by 3x.',
    },
    {
      id: 'tpl_2',
      title: '📄 GST Commercial Proposal',
      category: 'PROPOSAL',
      text: 'Hello {name}, please find our official commercial quote for {product} attached with 18% GST tax breakdown totaling {value}.',
    },
    {
      id: 'tpl_3',
      title: '⏰ SLA 15-Min Followup',
      category: 'FOLLOWUP',
      text: 'Hi {name}, just checking in from {company} to see if you had any questions regarding our enterprise proposal.',
    },
    {
      id: 'tpl_4',
      title: '🎉 Q3 Festival Discount Offer',
      category: 'PROMOTION',
      text: 'Exciting news {name}! Get 20% off on {product} for {company} when you upgrade this week.',
    },
  ]);

  const [editTplModalOpen, setEditTplModalOpen] = useState(false);
  const [editingTpl, setEditingTpl] = useState<WhatsAppTemplate | null>(null);
  const [tplFormTitle, setTplFormTitle] = useState('');
  const [tplFormCategory, setTplFormCategory] = useState<'OUTREACH' | 'PROPOSAL' | 'FOLLOWUP' | 'PROMOTION'>('OUTREACH');
  const [tplFormText, setTplFormText] = useState('');

  const handleOpenEditTpl = (tpl?: WhatsAppTemplate) => {
    if (tpl) {
      setEditingTpl(tpl);
      setTplFormTitle(tpl.title);
      setTplFormCategory(tpl.category);
      setTplFormText(tpl.text);
    } else {
      setEditingTpl(null);
      setTplFormTitle('');
      setTplFormCategory('OUTREACH');
      setTplFormText('');
    }
    setEditTplModalOpen(true);
  };

  const handleSaveTpl = () => {
    if (!tplFormTitle.trim() || !tplFormText.trim()) {
      Alert.alert('Missing Info', 'Please enter a template title and message text.');
      return;
    }
    const newTpl: WhatsAppTemplate = {
      id: editingTpl ? editingTpl.id : `tpl_${Date.now()}`,
      title: tplFormTitle.trim(),
      category: tplFormCategory,
      text: tplFormText.trim(),
    };
    if (editingTpl) {
      setWaTemplatesList((prev) => prev.map((t) => (t.id === newTpl.id ? newTpl : t)));
    } else {
      setWaTemplatesList([newTpl, ...waTemplatesList]);
    }
    setEditTplModalOpen(false);
    Alert.alert('✅ Template Saved', `WhatsApp template "${tplFormTitle}" saved & synced!`);
  };

  const handleDeleteTpl = (id: string, title: string) => {
    Alert.alert('Delete Template', `Are you sure you want to remove "${title}"?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => setWaTemplatesList((prev) => prev.filter((t) => t.id !== id)),
      },
    ]);
  };

  const handleDuplicateTpl = (tpl: WhatsAppTemplate) => {
    const dup: WhatsAppTemplate = {
      id: `tpl_dup_${Date.now()}`,
      title: `${tpl.title} (Copy)`,
      category: tpl.category,
      text: tpl.text,
    };
    setWaTemplatesList([dup, ...waTemplatesList]);
    Alert.alert('📋 Template Duplicated', `Created duplicate of "${tpl.title}"`);
  };

  const parseVariables = (rawText: string) => {
    return rawText
      .replace(/{name}/g, sandboxName || '{name}')
      .replace(/{company}/g, sandboxCompany || '{company}')
      .replace(/{value}/g, sandboxValue || '{value}')
      .replace(/{product}/g, sandboxProduct || '{product}');
  };

  const filteredTemplates = waTemplatesList.filter((tpl) => {
    if (activeTab !== 'ALL' && tpl.category !== activeTab) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return tpl.title.toLowerCase().includes(q) || tpl.text.toLowerCase().includes(q);
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
        <Text style={styles.headerTitle}>✏️ WhatsApp Direct Templates</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Category Tabs & Search */}
        <View style={styles.moduleCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.moduleTitle}>✏️ WhatsApp Template Engine</Text>
            <TouchableOpacity style={styles.actionBtnGreen} onPress={() => handleOpenEditTpl()}>
              <Text style={styles.actionBtnText}>+ Create Tpl</Text>
            </TouchableOpacity>
          </View>

          {/* Category Chips */}
          <View style={styles.tabsRow}>
            {(['ALL', 'OUTREACH', 'PROPOSAL', 'FOLLOWUP', 'PROMOTION'] as const).map((cat) => (
              <TouchableOpacity
                key={cat}
                style={[styles.tabChip, activeTab === cat && styles.tabChipActive]}
                onPress={() => setActiveTab(cat)}
              >
                <Text style={[styles.tabChipText, activeTab === cat && styles.tabChipTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </View>

          <View style={{ marginVertical: 6 }}>
            <TextInput
              style={styles.inputField}
              placeholder="🔍 Search templates..."
              placeholderTextColor="#64748b"
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>

          {filteredTemplates.map((tpl) => (
            <View key={tpl.id} style={[styles.itemRow, styles.borderBottom]}>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.itemName}>{tpl.title}</Text>
                  <Text style={styles.catBadge}>{tpl.category}</Text>
                </View>
                <Text style={styles.itemSub} numberOfLines={2}>{tpl.text}</Text>
                {/* Live Preview */}
                <View style={styles.parsedPreviewBox}>
                  <Text style={styles.parsedPreviewText}>Preview: "{parseVariables(tpl.text)}"</Text>
                </View>
              </View>
              <View style={{ gap: 4 }}>
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleOpenEditTpl(tpl)}>
                  <Text style={styles.actionBtnText}>Edit</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#0284c7' }]} onPress={() => handleDuplicateTpl(tpl)}>
                  <Text style={styles.actionBtnText}>Copy</Text>
                </TouchableOpacity>
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#ef4444' }]} onPress={() => handleDeleteTpl(tpl.id, tpl.title)}>
                  <Text style={styles.actionBtnText}>Del</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>

        {/* Live Variable Parser Sandbox */}
        <View style={[styles.moduleCard, { marginTop: 12 }]}>
          <Text style={styles.moduleTitle}>🧪 Live Template Variable Sandbox</Text>
          <Text style={styles.moduleSub}>Enter test parameters to test parsed message outputs live before dispatching.</Text>

          <View style={{ gap: 8, marginTop: 8 }}>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TextInput style={[styles.inputField, { flex: 1 }]} value={sandboxName} onChangeText={setSandboxName} placeholder="Client Name" placeholderTextColor="#64748b" />
              <TextInput style={[styles.inputField, { flex: 1 }]} value={sandboxCompany} onChangeText={setSandboxCompany} placeholder="Company Name" placeholderTextColor="#64748b" />
            </View>
            <View style={{ flexDirection: 'row', gap: 6 }}>
              <TextInput style={[styles.inputField, { flex: 1 }]} value={sandboxValue} onChangeText={setSandboxValue} placeholder="Deal Value" placeholderTextColor="#64748b" />
              <TextInput style={[styles.inputField, { flex: 1 }]} value={sandboxProduct} onChangeText={setSandboxProduct} placeholder="Product Name" placeholderTextColor="#64748b" />
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Modal */}
      <Modal visible={editTplModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { paddingBottom: Math.max(insets.bottom, Platform.OS === 'android' ? 56 : 20) + 16 }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitleText}>
                {editingTpl ? '✏️ Edit WhatsApp Template' : '➕ Create New WhatsApp Template'}
              </Text>
              <TouchableOpacity onPress={() => setEditTplModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ gap: 12, paddingBottom: 20 }}>
              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>📌 Template Title:</Text>
                <TextInput
                  style={styles.inputField}
                  value={tplFormTitle}
                  onChangeText={setTplFormTitle}
                  placeholder="e.g. 🌱 Initial Outreach"
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>🏷️ Category:</Text>
                <View style={{ flexDirection: 'row', gap: 6 }}>
                  {(['OUTREACH', 'PROPOSAL', 'FOLLOWUP', 'PROMOTION'] as const).map((cat) => (
                    <TouchableOpacity
                      key={cat}
                      style={[{ flex: 1, paddingVertical: 6, alignItems: 'center', borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' }, tplFormCategory === cat && { backgroundColor: '#4f46e5', borderColor: '#818cf8' }]}
                      onPress={() => setTplFormCategory(cat)}
                    >
                      <Text style={[{ fontSize: 9, fontWeight: '900', color: '#94a3b8' }, tplFormCategory === cat && { color: '#ffffff' }]}>
                        {cat}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <View style={{ gap: 6 }}>
                <Text style={{ fontSize: 11, fontWeight: '800', color: '#cbd5e1' }}>📝 Template Message Text:</Text>
                <TextInput
                  style={[styles.inputField, { height: 110, textAlignVertical: 'top' }]}
                  value={tplFormText}
                  onChangeText={setTplFormText}
                  multiline
                  placeholder="Type message text with placeholders..."
                  placeholderTextColor="#64748b"
                />
              </View>

              <View style={{ gap: 4 }}>
                <Text style={{ fontSize: 10, color: '#94a3b8', fontWeight: '700' }}>Insert Placeholder Variables:</Text>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                  {['{name}', '{company}', '{value}', '{product}', '{price}', '{catalog_link}'].map((ph) => (
                    <TouchableOpacity
                      key={ph}
                      style={{ backgroundColor: 'rgba(56,189,248,0.15)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 }}
                      onPress={() => setTplFormText((prev) => (prev ? prev + ' ' + ph : ph))}
                    >
                      <Text style={{ fontSize: 10, fontWeight: '900', color: '#38bdf8' }}>+ {ph}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>

              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: '#34d399', paddingVertical: 10, borderRadius: 12, alignItems: 'center', marginTop: 8 }]} onPress={handleSaveTpl}>
                <Text style={{ fontSize: 12, fontWeight: '900', color: '#090d16' }}>💾 Save &amp; Sync Template →</Text>
              </TouchableOpacity>
            </ScrollView>
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
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  moduleTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  moduleSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 14 },
  tabsRow: { flexDirection: 'row', gap: 4, marginVertical: 6, flexWrap: 'wrap' },
  tabChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' },
  tabChipActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  tabChipText: { fontSize: 9, fontWeight: '800', color: '#94a3b8' },
  tabChipTextActive: { color: '#ffffff' },
  actionBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignItems: 'center' },
  actionBtnGreen: { backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8 },
  actionBtnText: { fontSize: 9, fontWeight: '900', color: '#ffffff' },
  itemRow: { paddingVertical: 10, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  itemName: { fontSize: 12, fontWeight: '700', color: '#ffffff' },
  catBadge: { fontSize: 8, fontWeight: '900', color: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.15)', paddingHorizontal: 5, paddingVertical: 2, borderRadius: 4 },
  itemSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  parsedPreviewBox: { backgroundColor: '#020617', padding: 6, borderRadius: 6, marginTop: 4, borderWidth: 1, borderColor: '#1e293b' },
  parsedPreviewText: { fontSize: 9, color: '#34d399', fontStyle: 'italic' },
  inputField: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#ffffff' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2,6,23,0.85)', justifyContent: 'flex-end' },
  modalCard: { backgroundColor: '#0f172a', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 16, maxHeight: '85%', borderWidth: 1, borderColor: '#1e293b' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 14, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 10 },
  modalTitleText: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  modalCloseBtn: { backgroundColor: '#1e293b', width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});

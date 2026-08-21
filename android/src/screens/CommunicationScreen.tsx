import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';

export interface WAChatThread {
  id: string;
  contactName: string;
  phone: string;
  company: string;
  lastMessage: string;
  timestamp: string;
  unreadCount: number;
  assignedAgent: string;
  stage: 'NEW' | 'CONTACTED' | 'QUALIFIED' | 'WON';
  internalNotes: string[];
  messages: { sender: 'CLIENT' | 'AGENT' | 'SYSTEM'; text: string; time: string }[];
}

interface CommunicationScreenProps {
  onClose?: () => void;
}

export const CommunicationScreen: React.FC<CommunicationScreenProps> = ({ onClose }) => {
  const [chatThreads, setChatThreads] = useState<WAChatThread[]>([
    {
      id: 'thread_1',
      contactName: 'Rajesh Kumar',
      phone: '+91 98765 43210',
      company: 'TechCorp Solutions',
      lastMessage: 'Sure, send the proposal deck on WhatsApp.',
      timestamp: '10:42 AM',
      unreadCount: 2,
      assignedAgent: 'Aditya Rai',
      stage: 'QUALIFIED',
      internalNotes: ['Client requested enterprise pricing.', 'Follow up tomorrow at 2 PM.'],
      messages: [
        { sender: 'CLIENT', text: 'Hi, I need details on DAS CRM Enterprise plan.', time: '10:30 AM' },
        { sender: 'AGENT', text: 'Hello Rajesh! Sure, our enterprise plan includes WhatsApp Cloud API sync and AI lead scoring.', time: '10:35 AM' },
        { sender: 'CLIENT', text: 'Sure, send the proposal deck on WhatsApp.', time: '10:42 AM' },
      ],
    },
    {
      id: 'thread_2',
      contactName: 'Priya Sharma',
      phone: '+91 98123 45678',
      company: 'LogiTech Freight',
      lastMessage: 'When can we start the trial?',
      timestamp: 'Yesterday',
      unreadCount: 0,
      assignedAgent: 'Amit Patel',
      stage: 'CONTACTED',
      internalNotes: ['Budget is approved for Q3.'],
      messages: [
        { sender: 'CLIENT', text: 'Interested in freight tracking module integration.', time: 'Yesterday' },
        { sender: 'AGENT', text: 'Hi Priya! We support custom webhook ingestion for logistics.', time: 'Yesterday' },
        { sender: 'CLIENT', text: 'When can we start the trial?', time: 'Yesterday' },
      ],
    },
  ]);

  const [activeThreadId, setActiveThreadId] = useState<string>('thread_1');
  const [newChatInput, setNewChatInput] = useState<string>('');
  const [internalNoteInput, setInternalNoteInput] = useState<string>('');
  const [showNewThreadForm, setShowNewThreadForm] = useState<boolean>(false);
  const [newThreadContact, setNewThreadContact] = useState<string>('');
  const [newThreadPhone, setNewThreadPhone] = useState<string>('');
  const [newThreadCompany, setNewThreadCompany] = useState<string>('');

  const activeThread = chatThreads.find((t) => t.id === activeThreadId) || chatThreads[0];

  const handleCreateNewThread = () => {
    if (!newThreadContact.trim() || !newThreadPhone.trim()) {
      Alert.alert('Missing Info', 'Please enter contact name and phone number.');
      return;
    }
    const newT: WAChatThread = {
      id: `thread_${Date.now()}`,
      contactName: newThreadContact.trim(),
      phone: newThreadPhone.trim(),
      company: newThreadCompany.trim() || 'Enterprise Prospect',
      lastMessage: 'Chat thread created.',
      timestamp: 'Just Now',
      unreadCount: 0,
      assignedAgent: 'Active User',
      stage: 'NEW',
      internalNotes: ['New thread created manually.'],
      messages: [{ sender: 'SYSTEM', text: 'Chat conversation initialized via WhatsApp Cloud API.', time: 'Just Now' }],
    };
    setChatThreads([newT, ...chatThreads]);
    setActiveThreadId(newT.id);
    setNewThreadContact('');
    setNewThreadPhone('');
    setNewThreadCompany('');
    setShowNewThreadForm(false);
    Alert.alert('✅ Thread Initialized', `Created new WhatsApp thread for ${newT.contactName}!`);
  };

  const handleSendChatMessage = () => {
    if (!newChatInput.trim()) return;
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setChatThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? {
              ...t,
              lastMessage: newChatInput.trim(),
              timestamp: nowTime,
              messages: [...t.messages, { sender: 'AGENT', text: newChatInput.trim(), time: nowTime }],
            }
          : t
      )
    );
    setNewChatInput('');
  };

  const handleAddInternalNote = () => {
    if (!internalNoteInput.trim()) return;
    setChatThreads((prev) =>
      prev.map((t) =>
        t.id === activeThreadId
          ? { ...t, internalNotes: [...t.internalNotes, internalNoteInput.trim()] }
          : t
      )
    );
    setInternalNoteInput('');
  };

  return (
    <View style={styles.container}>
      {/* Screen Navigation Header */}
      <View style={styles.topHeader}>
        {onClose && (
          <TouchableOpacity style={styles.backBtn} onPress={onClose}>
            <Text style={styles.backBtnText}>← Back to Operations</Text>
          </TouchableOpacity>
        )}
        <Text style={styles.headerTitle}>💬 Communication Workspace</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.moduleCard}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.moduleTitle}>📱 WhatsApp Cloud API Shared Inbox</Text>
            <TouchableOpacity
              style={styles.actionBtnGreen}
              onPress={() => setShowNewThreadForm(!showNewThreadForm)}
            >
              <Text style={styles.btnTextWhite}>
                {showNewThreadForm ? '✕ Close Form' : '➕ Start New Thread'}
              </Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.moduleSub}>In-depth live chat threads, client messages &amp; private team notes.</Text>

          {/* New Thread Form */}
          {showNewThreadForm && (
            <View style={styles.newThreadFormCard}>
              <Text style={styles.formSectionTitle}>👤 Initialize New WhatsApp Contact Thread</Text>
              <TextInput style={styles.inputField} placeholder="Contact Name (e.g. Rahul Varma)" placeholderTextColor="#64748b" value={newThreadContact} onChangeText={setNewThreadContact} />
              <TextInput style={styles.inputField} placeholder="Phone Number (e.g. +91 98765 12345)" placeholderTextColor="#64748b" value={newThreadPhone} onChangeText={setNewThreadPhone} keyboardType="phone-pad" />
              <TextInput style={styles.inputField} placeholder="Company / Client Name" placeholderTextColor="#64748b" value={newThreadCompany} onChangeText={setNewThreadCompany} />
              <TouchableOpacity style={styles.actionBtnGreenFull} onPress={handleCreateNewThread}>
                <Text style={styles.btnTextWhite}>🚀 Create &amp; Open Chat Thread →</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Thread Selector Chips */}
          <View style={styles.chipsContainer}>
            {chatThreads.map((t) => (
              <TouchableOpacity
                key={t.id}
                style={[styles.threadChip, activeThreadId === t.id && styles.threadChipActive]}
                onPress={() => setActiveThreadId(t.id)}
              >
                <Text style={[styles.threadChipText, activeThreadId === t.id && styles.threadChipTextActive]}>
                  👤 {t.contactName}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Active Thread Detail Box */}
          {activeThread && (
            <View style={styles.threadBox}>
              <View style={styles.threadHeaderRow}>
                <View>
                  <Text style={styles.contactName}>{activeThread.contactName}</Text>
                  <Text style={styles.contactSub}>{activeThread.company} • {activeThread.phone}</Text>
                </View>
                <Text style={styles.agentTag}>Agent: {activeThread.assignedAgent}</Text>
              </View>

              {/* Messages Stream */}
              <View style={styles.messagesContainer}>
                {activeThread.messages.map((m, idx) => (
                  <View
                    key={idx}
                    style={[
                      styles.msgBubble,
                      m.sender === 'AGENT' ? styles.agentMsg : m.sender === 'CLIENT' ? styles.clientMsg : styles.systemMsg,
                    ]}
                  >
                    <Text style={styles.msgText}>{m.text}</Text>
                    <Text style={styles.msgTime}>{m.time}</Text>
                  </View>
                ))}
              </View>

              {/* Template Quick Chips */}
              <View style={styles.tplChipsRow}>
                {[
                  { label: 'Outreach Tpl', text: 'Hi! Thank you for contacting DAS CRM. How can we help today?' },
                  { label: 'GST Rate Tpl', text: 'Here is our 18% GST tax rate card and product specifications.' },
                ].map((tpl, i) => (
                  <TouchableOpacity
                    key={i}
                    style={styles.tplBadge}
                    onPress={() => setNewChatInput(tpl.text)}
                  >
                    <Text style={styles.tplBadgeText}>+ {tpl.label}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* Chat Input Bar */}
              <View style={styles.chatInputRow}>
                <TextInput
                  style={[styles.inputField, { flex: 1 }]}
                  placeholder="Type WhatsApp message..."
                  placeholderTextColor="#64748b"
                  value={newChatInput}
                  onChangeText={setNewChatInput}
                />
                <TouchableOpacity style={styles.sendBtn} onPress={handleSendChatMessage}>
                  <Text style={styles.btnTextWhite}>Send ➔</Text>
                </TouchableOpacity>
              </View>

              {/* Private Notes */}
              <View style={styles.privateNotesCard}>
                <Text style={styles.notesTitle}>🔒 Internal Team Notes:</Text>
                {activeThread.internalNotes.map((note, idx) => (
                  <Text key={idx} style={styles.noteText}>• {note}</Text>
                ))}
                <View style={styles.chatInputRow}>
                  <TextInput
                    style={[styles.inputField, { flex: 1 }]}
                    placeholder="Add private note..."
                    placeholderTextColor="#64748b"
                    value={internalNoteInput}
                    onChangeText={setInternalNoteInput}
                  />
                  <TouchableOpacity style={styles.saveNoteBtn} onPress={handleAddInternalNote}>
                    <Text style={styles.btnTextDark}>Save Note</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
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
  cardHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  moduleTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff' },
  moduleSub: { fontSize: 10, color: '#94a3b8', marginTop: 2, lineHeight: 14 },
  actionBtnGreen: { backgroundColor: '#10b981', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  actionBtnGreenFull: { backgroundColor: '#10b981', paddingVertical: 8, alignItems: 'center', borderRadius: 8 },
  btnTextWhite: { fontSize: 10, fontWeight: '900', color: '#ffffff' },
  btnTextDark: { fontSize: 10, fontWeight: '900', color: '#090d16' },
  newThreadFormCard: { backgroundColor: '#020617', padding: 10, borderRadius: 12, borderWidth: 1, borderColor: '#10b981', gap: 6, marginVertical: 8 },
  formSectionTitle: { fontSize: 11, fontWeight: '900', color: '#34d399' },
  inputField: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8, fontSize: 12, color: '#ffffff' },
  chipsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginVertical: 10 },
  threadChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b' },
  threadChipActive: { backgroundColor: '#4f46e5', borderColor: '#818cf8' },
  threadChipText: { fontSize: 11, fontWeight: '800', color: '#94a3b8' },
  threadChipTextActive: { color: '#ffffff' },
  threadBox: { backgroundColor: '#020617', borderRadius: 12, padding: 12, borderWidth: 1, borderColor: '#1e293b' },
  threadHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 8 },
  contactName: { fontSize: 13, fontWeight: '900', color: '#ffffff' },
  contactSub: { fontSize: 10, color: '#94a3b8', marginTop: 2 },
  agentTag: { fontSize: 10, fontWeight: '800', color: '#818cf8' },
  messagesContainer: { gap: 8, marginVertical: 12, maxHeight: 220 },
  msgBubble: { padding: 10, borderRadius: 10, maxWidth: '85%' },
  agentMsg: { backgroundColor: '#312e81', alignSelf: 'flex-end' },
  clientMsg: { backgroundColor: '#1e293b', alignSelf: 'flex-start' },
  systemMsg: { backgroundColor: '#0f172a', alignSelf: 'center', borderWidth: 1, borderColor: '#334155' },
  msgText: { fontSize: 11, color: '#ffffff', lineHeight: 15 },
  msgTime: { fontSize: 8, color: '#94a3b8', marginTop: 4, alignSelf: 'flex-end' },
  tplChipsRow: { flexDirection: 'row', gap: 6, marginBottom: 8 },
  tplBadge: { backgroundColor: 'rgba(56,189,248,0.15)', borderWidth: 1, borderColor: 'rgba(56,189,248,0.4)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  tplBadgeText: { fontSize: 9, fontWeight: '800', color: '#38bdf8' },
  chatInputRow: { flexDirection: 'row', gap: 6, alignItems: 'center' },
  sendBtn: { backgroundColor: '#4f46e5', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 8 },
  saveNoteBtn: { backgroundColor: '#fbbf24', paddingHorizontal: 10, paddingVertical: 8, borderRadius: 8 },
  privateNotesCard: { marginTop: 8, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e293b', gap: 6 },
  notesTitle: { fontSize: 10, fontWeight: '800', color: '#fbbf24' },
  noteText: { fontSize: 10, color: '#cbd5e1' },
});

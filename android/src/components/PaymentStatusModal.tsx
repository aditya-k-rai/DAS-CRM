/**
 * PaymentStatusModal.tsx — DAS CRM Android
 * Popup modal triggered after an Invoice or Quotation is generated/sent.
 * Prompts user to select payment status:
 *   - 🟢 Payment Done / Cleared -> Updates Lead Status to WON
 *   - 🟡 Payment Pending / Will Pay Later -> Updates Lead Status to IN NEGOTIATION
 *   - ⏳ Waiting / Client Awaiting -> Keeps in IN NEGOTIATION
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
} from 'react-native';

export interface PaymentOutcomeResult {
  paymentStatus: 'DONE' | 'PENDING_LATER' | 'WAITING';
  amountPaid?: string;
  notes?: string;
  targetLeadStatus: 'WON' | 'IN NEGOTIATION';
}

interface PaymentStatusModalProps {
  visible: boolean;
  leadName: string;
  leadValue?: string;
  onClose: () => void;
  onConfirmPaymentOutcome: (result: PaymentOutcomeResult) => void;
}

export function PaymentStatusModal({
  visible,
  leadName,
  leadValue = '$14,200',
  onClose,
  onConfirmPaymentOutcome,
}: PaymentStatusModalProps) {
  const [selectedOption, setSelectedOption] = useState<'DONE' | 'PENDING_LATER' | 'WAITING'>('DONE');
  const [notesText, setNotesText] = useState('');
  const [paymentRef, setPaymentRef] = useState('');

  const handleConfirm = () => {
    let targetStatus: 'WON' | 'IN NEGOTIATION' = 'IN NEGOTIATION';
    if (selectedOption === 'DONE') {
      targetStatus = 'WON';
    }

    onConfirmPaymentOutcome({
      paymentStatus: selectedOption,
      notes: notesText.trim() || (selectedOption === 'DONE' ? 'Full payment received & cleared.' : selectedOption === 'PENDING_LATER' ? 'Invoice sent. Client promised payment later.' : 'Invoice sent. Awaiting client confirmation.'),
      targetLeadStatus: targetStatus,
    });
    setNotesText('');
    setPaymentRef('');
    onClose();
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View>
              <Text style={styles.badgeLabel}>💳 INVOICE & PAYMENT AUDIT</Text>
              <Text style={styles.modalTitle}>Update Payment & Deal Status</Text>
              <Text style={styles.modalSub}>
                Invoice generated for <Text style={{ color: '#ffffff', fontWeight: '800' }}>{leadName}</Text> ({leadValue})
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={{ color: '#94a3b8', fontSize: 16, fontWeight: 'bold' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Options List */}
          <View style={styles.optionsContainer}>
            {/* Option 1: Payment Done */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedOption === 'DONE' && styles.optionCardActiveDone,
              ]}
              onPress={() => setSelectedOption('DONE')}
              activeOpacity={0.8}
            >
              <View style={styles.optionHeaderRow}>
                <Text style={styles.optionIcon}>🟢</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, selectedOption === 'DONE' && { color: '#34d399' }]}>
                    Payment Done / Cleared
                  </Text>
                  <Text style={styles.optionSub}>Full or partial payment received. Auto-transitions status to WON 🎉</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Option 2: Payment Later */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedOption === 'PENDING_LATER' && styles.optionCardActivePending,
              ]}
              onPress={() => setSelectedOption('PENDING_LATER')}
              activeOpacity={0.8}
            >
              <View style={styles.optionHeaderRow}>
                <Text style={styles.optionIcon}>🟡</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, selectedOption === 'PENDING_LATER' && { color: '#fbbf24' }]}>
                    Payment Promised / Will Pay Later
                  </Text>
                  <Text style={styles.optionSub}>Invoice sent. Follow-up scheduled. Status set to IN NEGOTIATION 📄</Text>
                </View>
              </View>
            </TouchableOpacity>

            {/* Option 3: Waiting */}
            <TouchableOpacity
              style={[
                styles.optionCard,
                selectedOption === 'WAITING' && styles.optionCardActiveWaiting,
              ]}
              onPress={() => setSelectedOption('WAITING')}
              activeOpacity={0.8}
            >
              <View style={styles.optionHeaderRow}>
                <Text style={styles.optionIcon}>⏳</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionTitle, selectedOption === 'WAITING' && { color: '#818cf8' }]}>
                    Waiting / Client Reviewing
                  </Text>
                  <Text style={styles.optionSub}>Awaiting client approval. Status set to IN NEGOTIATION ⏳</Text>
                </View>
              </View>
            </TouchableOpacity>
          </View>

          {/* Additional Payment Reference / Notes Input */}
          <View style={styles.notesSection}>
            <Text style={styles.notesLabel}>Transaction Reference / Payment Notes (Optional):</Text>
            <TextInput
              style={styles.notesInput}
              placeholder="e.g. UPR Ref #987214 or Cheque deposited..."
              placeholderTextColor="#64748b"
              value={notesText}
              onChangeText={setNotesText}
            />
          </View>

          {/* Actions Footer */}
          <View style={styles.footerRow}>
            <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
              <Text style={styles.confirmBtnText}>Save Payment Outcome →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    width: '100%',
    maxWidth: 440,
    backgroundColor: '#0c1322',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.35)',
    padding: 18,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 12,
    marginBottom: 14,
  },
  badgeLabel: {
    fontSize: 9,
    fontWeight: '900',
    color: '#818cf8',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  modalSub: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
  closeBtn: {
    padding: 4,
  },
  optionsContainer: {
    gap: 10,
    marginBottom: 14,
  },
  optionCard: {
    backgroundColor: '#020617',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#1e293b',
    padding: 12,
  },
  optionCardActiveDone: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.5)',
  },
  optionCardActivePending: {
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    borderColor: 'rgba(245, 158, 11, 0.5)',
  },
  optionCardActiveWaiting: {
    backgroundColor: 'rgba(99, 102, 241, 0.12)',
    borderColor: 'rgba(99, 102, 241, 0.5)',
  },
  optionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  optionIcon: {
    fontSize: 18,
  },
  optionTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#ffffff',
  },
  optionSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  notesSection: {
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 10.5,
    fontWeight: '700',
    color: '#94a3b8',
    marginBottom: 6,
  },
  notesInput: {
    backgroundColor: '#020617',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#ffffff',
    fontSize: 11,
  },
  footerRow: {
    flexDirection: 'row',
    gap: 10,
  },
  cancelBtn: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderWidth: 1,
    borderColor: '#334155',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  cancelBtnText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#94a3b8',
  },
  confirmBtn: {
    flex: 1.6,
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 10,
    alignItems: 'center',
  },
  confirmBtnText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ffffff',
  },
});

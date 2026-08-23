/**
 * CustomAlertModal.tsx — DAS CRM Android
 * Premium Dark Glassmorphism Custom Alert Dialog Component.
 * Replaces all native OS system Alert.alert dialogs across the platform.
 */

import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
} from 'react-native';

export interface CustomAlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive' | 'primary';
}

export interface CustomAlertState {
  visible: boolean;
  title: string;
  message: string;
  buttons?: CustomAlertButton[];
}

interface Props {
  alert: CustomAlertState | null;
  onClose: () => void;
}

export default function CustomAlertModal({ alert, onClose }: Props) {
  if (!alert || !alert.visible) return null;

  const getHeaderIcon = (title: string) => {
    if (title.includes('Email') || title.includes('🚀')) return '🚀';
    if (title.includes('Copied') || title.includes('📋')) return '📋';
    if (title.includes('Deal') || title.includes('🎉')) return '🎉';
    if (title.includes('Status') || title.includes('⚡')) return '⚡';
    if (title.includes('Phone') || title.includes('📞') || title.includes('Dialing')) return '📞';
    if (title.includes('WhatsApp') || title.includes('💬')) return '💬';
    if (title.includes('Meeting') || title.includes('📅') || title.includes('Leave')) return '📅';
    if (title.includes('Delete') || title.includes('Purge') || title.includes('🔴') || title.includes('Error')) return '⚠️';
    return '✨';
  };

  const icon = getHeaderIcon(alert.title);
  const buttons = alert.buttons && alert.buttons.length > 0
    ? alert.buttons
    : [{ text: 'OK', onPress: onClose, style: 'primary' }];

  return (
    <Modal visible={alert.visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header Icon & Title */}
          <View style={styles.headerRow}>
            <View style={styles.iconCircle}>
              <Text style={{ fontSize: 20 }}>{icon}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.titleText}>{alert.title}</Text>
              <Text style={styles.subTag}>DAS CRM TELEMETRY</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Message Content */}
          <ScrollView style={{ maxHeight: 220, marginVertical: 12 }}>
            <Text style={styles.messageText}>{alert.message}</Text>
          </ScrollView>

          {/* Buttons Stack */}
          <View style={styles.buttonsContainer}>
            {buttons.map((btn, idx) => {
              const isPrimary = btn.style === 'primary' || idx === buttons.length - 1;
              const isDestructive = btn.style === 'destructive';
              const isCancel = btn.style === 'cancel';

              const btnBg = isDestructive
                ? '#ef4444'
                : isCancel
                ? '#1e293b'
                : isPrimary
                ? '#4f46e5'
                : 'rgba(99, 102, 241, 0.2)';

              const btnTextColor = isCancel ? '#94a3b8' : '#ffffff';
              const borderColor = isCancel ? '#334155' : isPrimary ? '#818cf8' : 'transparent';

              return (
                <TouchableOpacity
                  key={idx}
                  style={[
                    styles.actionBtn,
                    { backgroundColor: btnBg, borderColor, borderWidth: isCancel ? 1 : 0 },
                  ]}
                  onPress={() => {
                    onClose();
                    if (btn.onPress) btn.onPress();
                  }}
                >
                  <Text style={[styles.actionBtnText, { color: btnTextColor }]}>{btn.text}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.88)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0d1527',
    borderRadius: 24,
    borderWidth: 1.5,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    padding: 20,
    shadowColor: '#6366f1',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 24,
    elevation: 14,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    paddingBottom: 14,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: 'rgba(99, 102, 241, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(99, 102, 241, 0.4)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#ffffff',
  },
  subTag: {
    fontSize: 9,
    fontWeight: '800',
    color: '#818cf8',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    color: '#94a3b8',
    fontSize: 14,
    fontWeight: '900',
  },
  messageText: {
    fontSize: 13,
    color: '#cbd5e1',
    lineHeight: 19,
    fontWeight: '500',
  },
  buttonsContainer: {
    gap: 10,
    marginTop: 8,
  },
  actionBtn: {
    paddingVertical: 13,
    paddingHorizontal: 16,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
});

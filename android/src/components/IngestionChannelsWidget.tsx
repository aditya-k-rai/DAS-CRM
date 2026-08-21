import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';

export interface IngestionChannelItem {
  id: string;
  name: string;
  badgeTag: string;
  tagType: 'FAST' | 'SLOW' | 'NORMAL';
  ingestedText: string;
  lastTimeText: string;
  statusDotColor: string;
  cardBorderColor: string;
  actionKey: 'SHEETS' | 'FACEBOOK' | 'WHATSAPP' | 'GOOGLE_ADS' | 'WEBSITE' | 'ZAPIER';
}

export const INGESTION_CHANNELS_DATA: IngestionChannelItem[] = [
  {
    id: 'ch-1',
    name: 'Google Sheets',
    badgeTag: 'Live Range A2:F  ⚡ FAST BLINK',
    tagType: 'FAST',
    ingestedText: '1,890 Syncing',
    lastTimeText: 'Last: Just now (Most Recent)',
    statusDotColor: '#34d399',
    cardBorderColor: 'rgba(52,211,153,0.3)',
    actionKey: 'SHEETS',
  },
  {
    id: 'ch-2',
    name: 'Facebook Ads',
    badgeTag: 'Active Hook  ⏳ SLOW',
    tagType: 'SLOW',
    ingestedText: '1,240 Ingested',
    lastTimeText: 'Last: 18 mins ago',
    statusDotColor: '#34d399',
    cardBorderColor: 'rgba(99,102,241,0.3)',
    actionKey: 'FACEBOOK',
  },
  {
    id: 'ch-3',
    name: 'WhatsApp Web',
    badgeTag: 'Connected  ⏳ SLOW',
    tagType: 'SLOW',
    ingestedText: '410 Ingested',
    lastTimeText: 'Last: 1.5 hrs ago',
    statusDotColor: '#34d399',
    cardBorderColor: 'rgba(52,211,153,0.3)',
    actionKey: 'WHATSAPP',
  },
  {
    id: 'ch-4',
    name: 'Google Ads',
    badgeTag: 'Auto-Sync  ⏳ SLOW',
    tagType: 'SLOW',
    ingestedText: '650 Ingested',
    lastTimeText: 'Last: 4 hrs ago',
    statusDotColor: '#34d399',
    cardBorderColor: 'rgba(239,68,68,0.3)',
    actionKey: 'GOOGLE_ADS',
  },
  {
    id: 'ch-5',
    name: 'Website Form',
    badgeTag: 'Webhook Live',
    tagType: 'NORMAL',
    ingestedText: '230 Ingested',
    lastTimeText: 'Last: Yesterday (No data today)',
    statusDotColor: '#64748b',
    cardBorderColor: 'rgba(148,163,184,0.2)',
    actionKey: 'WEBSITE',
  },
  {
    id: 'ch-6',
    name: 'Zapier API',
    badgeTag: 'Key Active',
    tagType: 'NORMAL',
    ingestedText: '890 Ingested',
    lastTimeText: 'Last: 3 days ago',
    statusDotColor: '#64748b',
    cardBorderColor: 'rgba(148,163,184,0.2)',
    actionKey: 'ZAPIER',
  },
];

interface IngestionChannelsWidgetProps {
  navigation?: any;
  title?: string;
}

export default function IngestionChannelsWidget({ navigation, title = '🟢 Live Ingestion Channels & Traffic Sources' }: IngestionChannelsWidgetProps) {

  const handleChannelPress = (ch: IngestionChannelItem) => {
    switch (ch.actionKey) {
      case 'SHEETS':
        Alert.alert(
          '📊 Google Sheets Ingress Active',
          'Live range Sheet1!A2:F actively ingesting 1,890 leads into CRM.\n\nOpening Lead Collections workspace...',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Leads →', onPress: () => navigation?.navigate('Leads') },
          ]
        );
        break;

      case 'FACEBOOK':
        Alert.alert(
          '🔷 Facebook Lead Ads Webhook',
          'Meta Lead Ads webhook listener actively receiving instant lead form payloads.\n\n• 1,240 Ingested\n• Webhook Status: 200 OK'
        );
        break;

      case 'WHATSAPP':
        Alert.alert(
          '💬 WhatsApp Web & Cloud API',
          'Official WhatsApp Business API connected.\n\nOpening Communications Hub...',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Open Communications →', onPress: () => navigation?.navigate('More', { initialModule: 'COMMUNICATIONS' }) },
          ]
        );
        break;

      case 'GOOGLE_ADS':
        Alert.alert(
          '🎯 Google Ads Conversion API',
          'GCLID click tracking & conversion API auto-sync active.\n\n• 650 Ingested\n• Last Sync: 4 hrs ago'
        );
        break;

      case 'WEBSITE':
        Alert.alert(
          '🌐 Website Form Webhook Endpoint',
          'Public API Ingress Endpoint:\nPOST /api/v1/leads/webhook\n\n• 230 Ingested\n• Status: Active'
        );
        break;

      case 'ZAPIER':
        Alert.alert(
          '⚡ Zapier & Public REST API Keys',
          'Zapier integration active with scoped API key.\n\n• 890 Ingested\n• Status: Active Key'
        );
        break;
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.widgetTitle}>{title}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scrollRow}>
        {INGESTION_CHANNELS_DATA.map((ch) => (
          <TouchableOpacity
            key={ch.id}
            style={[styles.channelBox, { borderColor: ch.cardBorderColor }]}
            onPress={() => handleChannelPress(ch)}
            activeOpacity={0.8}
          >
            {/* Top Name & Live Status Dot */}
            <View style={styles.topRow}>
              <Text style={styles.channelName}>{ch.name}</Text>
              <View style={[styles.statusDot, { backgroundColor: ch.statusDotColor }]} />
            </View>

            {/* Tag Badge */}
            <View style={[styles.tagBadge, ch.tagType === 'FAST' ? styles.fastTag : ch.tagType === 'SLOW' ? styles.slowTag : styles.normalTag]}>
              <Text style={[styles.tagText, ch.tagType === 'FAST' ? { color: '#34d399' } : ch.tagType === 'SLOW' ? { color: '#fbbf24' } : { color: '#94a3b8' }]}>
                {ch.badgeTag}
              </Text>
            </View>

            {/* Ingested Number */}
            <Text style={styles.ingestedVal}>{ch.ingestedText}</Text>

            {/* Last Time Label */}
            <Text style={styles.lastTimeText}>{ch.lastTimeText}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { marginVertical: 10 },
  widgetTitle: { fontSize: 13, fontWeight: '900', color: '#ffffff', marginBottom: 10, paddingHorizontal: 4 },
  scrollRow: { flexDirection: 'row', gap: 10, paddingRight: 10 },

  channelBox: {
    width: 175,
    backgroundColor: '#0c1322',
    borderRadius: 16,
    borderWidth: 1.5,
    padding: 12,
    justifyContent: 'space-between',
  },

  topRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 },
  channelName: { fontSize: 12, fontWeight: '900', color: '#ffffff' },
  statusDot: { width: 10, height: 10, borderRadius: 5 },

  tagBadge: {
    paddingHorizontal: 6,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 10,
    borderWidth: 1,
  },
  fastTag: { backgroundColor: 'rgba(52,211,153,0.12)', borderColor: 'rgba(52,211,153,0.35)' },
  slowTag: { backgroundColor: 'rgba(30,41,59,0.7)', borderColor: '#334155' },
  normalTag: { backgroundColor: 'rgba(30,41,59,0.5)', borderColor: '#334155' },
  tagText: { fontSize: 8, fontWeight: '900', letterSpacing: 0.3 },

  ingestedVal: { fontSize: 15, fontWeight: '900', color: '#38bdf8', marginBottom: 4 },
  lastTimeText: { fontSize: 9, color: '#94a3b8', fontWeight: '600' },
});

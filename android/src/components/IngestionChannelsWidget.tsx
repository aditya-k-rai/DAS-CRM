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
  icon: string;
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
    icon: '📊',
    name: 'Google Sheets',
    badgeTag: 'Sheet1!A2:F ⚡ FAST',
    tagType: 'FAST',
    ingestedText: '1,890 Syncing',
    lastTimeText: 'Just now',
    statusDotColor: '#34d399',
    cardBorderColor: 'rgba(52,211,153,0.4)',
    actionKey: 'SHEETS',
  },
  {
    id: 'ch-2',
    icon: '🔷',
    name: 'Facebook Ads',
    badgeTag: 'Webhook ⏳ SLOW',
    tagType: 'SLOW',
    ingestedText: '1,240 Ingested',
    lastTimeText: '18m ago',
    statusDotColor: '#34d399',
    cardBorderColor: 'rgba(99,102,241,0.4)',
    actionKey: 'FACEBOOK',
  },
  {
    id: 'ch-3',
    icon: '💬',
    name: 'WhatsApp Web',
    badgeTag: 'Cloud API ⏳ SLOW',
    tagType: 'SLOW',
    ingestedText: '410 Ingested',
    lastTimeText: '1.5h ago',
    statusDotColor: '#34d399',
    cardBorderColor: 'rgba(52,211,153,0.4)',
    actionKey: 'WHATSAPP',
  },
  {
    id: 'ch-4',
    icon: '🎯',
    name: 'Google Ads',
    badgeTag: 'Auto-Sync ⏳ SLOW',
    tagType: 'SLOW',
    ingestedText: '650 Ingested',
    lastTimeText: '4h ago',
    statusDotColor: '#34d399',
    cardBorderColor: 'rgba(239,68,68,0.4)',
    actionKey: 'GOOGLE_ADS',
  },
  {
    id: 'ch-5',
    icon: '🌐',
    name: 'Website Form',
    badgeTag: 'REST Webhook',
    tagType: 'NORMAL',
    ingestedText: '230 Ingested',
    lastTimeText: 'Yesterday',
    statusDotColor: '#64748b',
    cardBorderColor: 'rgba(148,163,184,0.3)',
    actionKey: 'WEBSITE',
  },
  {
    id: 'ch-6',
    icon: '⚡',
    name: 'Zapier API',
    badgeTag: 'Key Active',
    tagType: 'NORMAL',
    ingestedText: '890 Ingested',
    lastTimeText: '3d ago',
    statusDotColor: '#64748b',
    cardBorderColor: 'rgba(148,163,184,0.3)',
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
      {/* Title Bar with Count Chip */}
      <View style={styles.titleRow}>
        <Text style={styles.widgetTitle}>{title}</Text>
        <View style={styles.activeStreamsChip}>
          <Text style={styles.activeStreamsText}>6 STREAMS</Text>
        </View>
      </View>

      {/* Horizontal Cards ScrollView */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollRow}
      >
        {INGESTION_CHANNELS_DATA.map((ch) => (
          <TouchableOpacity
            key={ch.id}
            style={[styles.channelBox, { borderColor: ch.cardBorderColor }]}
            onPress={() => handleChannelPress(ch)}
            activeOpacity={0.8}
          >
            {/* Top Row: Icon + Channel Name + Live Dot */}
            <View style={styles.topRow}>
              <View style={styles.nameWithIcon}>
                <Text style={styles.iconText}>{ch.icon}</Text>
                <Text style={styles.channelName} numberOfLines={1}>{ch.name}</Text>
              </View>
              <View style={[styles.statusDot, { backgroundColor: ch.statusDotColor }]} />
            </View>

            {/* Ingested Telemetry Count */}
            <Text style={styles.ingestedVal}>{ch.ingestedText}</Text>

            {/* Bottom Row: Badge Tag + Last Synced Time */}
            <View style={styles.bottomRow}>
              <View style={[styles.tagBadge, ch.tagType === 'FAST' ? styles.fastTag : ch.tagType === 'SLOW' ? styles.slowTag : styles.normalTag]}>
                <Text style={[styles.tagText, ch.tagType === 'FAST' ? { color: '#34d399' } : ch.tagType === 'SLOW' ? { color: '#fbbf24' } : { color: '#94a3b8' }]}>
                  {ch.badgeTag}
                </Text>
              </View>
              <Text style={styles.lastTimeText}>{ch.lastTimeText}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    maxWidth: 600,
    marginVertical: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
    paddingHorizontal: 2,
  },
  widgetTitle: {
    fontSize: 12,
    fontWeight: '800',
    color: '#ffffff',
  },
  activeStreamsChip: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderWidth: 1,
    borderColor: 'rgba(52,211,153,0.3)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  activeStreamsText: {
    fontSize: 8,
    fontWeight: '900',
    color: '#34d399',
    letterSpacing: 0.5,
  },

  scrollRow: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 6,
    paddingVertical: 2,
  },

  channelBox: {
    width: 155,
    height: 100,
    backgroundColor: '#0c1322',
    borderRadius: 14,
    borderWidth: 1.2,
    padding: 10,
    justifyContent: 'space-between',
  },

  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  nameWithIcon: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    flex: 1,
    paddingRight: 4,
  },
  iconText: {
    fontSize: 12,
  },
  channelName: {
    fontSize: 11,
    fontWeight: '800',
    color: '#ffffff',
    flexShrink: 1,
  },
  statusDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
  },

  ingestedVal: {
    fontSize: 15,
    fontWeight: '900',
    color: '#38bdf8',
    marginVertical: 2,
  },

  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tagBadge: {
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 5,
    borderWidth: 1,
  },
  fastTag: {
    backgroundColor: 'rgba(52,211,153,0.12)',
    borderColor: 'rgba(52,211,153,0.35)',
  },
  slowTag: {
    backgroundColor: 'rgba(251,191,36,0.1)',
    borderColor: 'rgba(251,191,36,0.3)',
  },
  normalTag: {
    backgroundColor: 'rgba(30,41,59,0.5)',
    borderColor: '#334155',
  },
  tagText: {
    fontSize: 8,
    fontWeight: '800',
    letterSpacing: 0.2,
  },

  lastTimeText: {
    fontSize: 9,
    color: '#94a3b8',
    fontWeight: '600',
  },
});

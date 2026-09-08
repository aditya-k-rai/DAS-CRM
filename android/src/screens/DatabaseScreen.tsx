/**
 * DatabaseScreen.tsx — DAS CRM Android
 * Unified Database & Storage Management Screen
 *
 * Contains 2 Main Sections / Tabs:
 * 1. Lead Import History (CSV/Excel Ingestion, Google Sheets Sync, Mapping Engine, Logs)
 * 2. Data Storage (Google Drive Multi-Tenant Vault with Folder Hierarchy & Email Folder Export)
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { useAuthStore } from '../store/authStore';
import BulkIngestionScreen from './BulkIngestionScreen';
import {
  checkGoogleDriveStatus,
  listGoogleDriveFiles,
  requestFolderDataOnEmailAndroid,
  getFolderMailRequestsAndroid,
  GoogleDriveStoredFile,
  GoogleDriveConnectionStatus,
  FolderMailRequestResultAndroid,
} from '../services/googleDriveService';

const { width: SCREEN_W } = Dimensions.get('window');

interface DatabaseScreenProps {
  onClose?: () => void;
  initialTab?: 'IMPORTS' | 'STORAGE';
}

export const DatabaseScreen: React.FC<DatabaseScreenProps> = ({
  onClose,
  initialTab = 'IMPORTS',
}) => {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const { currentUser } = useAuthStore();

  // Top-level Section Switcher: 'IMPORTS' vs 'STORAGE'
  const [activeSection, setActiveSection] = useState<'IMPORTS' | 'STORAGE'>(initialTab);

  // Storage Vault State
  const [driveStatus, setDriveStatus] = useState<GoogleDriveConnectionStatus | null>(null);
  const [vaultFiles, setVaultFiles] = useState<GoogleDriveStoredFile[]>([]);
  const [mailRequests, setMailRequests] = useState<FolderMailRequestResultAndroid[]>([]);
  const [isLoadingStorage, setIsLoadingStorage] = useState(false);
  const [storageViewMode, setStorageViewMode] = useState<'HIERARCHY' | 'FILES' | 'MAIL_LOGS'>('HIERARCHY');

  // Hierarchy Selection State
  const [activeMainFolder, setActiveMainFolder] = useState<'EMPLOYEES' | 'LEADS' | 'QUOTATIONS' | 'PRODUCTS' | 'DOCUMENTS'>('EMPLOYEES');
  const [selectedEmployee, setSelectedEmployee] = useState<string>('Amit Shah');
  const [selectedSubCat, setSelectedSubCat] = useState<'DP' | 'Documents' | 'Details'>('Documents');

  // Email Request Modal State
  const [showMailModal, setShowMailModal] = useState(false);
  const [mailTargetFolder, setMailTargetFolder] = useState('Employees/Amit Shah/Documents');
  const [mailRecipient, setMailRecipient] = useState(currentUser?.email || 'admin@company.com');
  const [mailFormat, setMailFormat] = useState<'ZIP' | 'CSV_MANIFEST' | 'SECURE_LINK'>('ZIP');
  const [mailNotes, setMailNotes] = useState('');
  const [isSendingMail, setIsSendingMail] = useState(false);

  const EMPLOYEES = ['Amit Shah', 'Priya Sharma', 'Sunita Verma', 'Amit Patel'];

  const loadStorageData = async () => {
    setIsLoadingStorage(true);
    try {
      const [st, fl, ml] = await Promise.all([
        checkGoogleDriveStatus(),
        listGoogleDriveFiles(),
        getFolderMailRequestsAndroid(),
      ]);
      setDriveStatus(st);
      setVaultFiles(fl);
      setMailRequests(ml);
    } catch (e) {
      console.warn('Could not load storage telemetry:', e);
    } finally {
      setIsLoadingStorage(false);
    }
  };

  useEffect(() => {
    if (activeSection === 'STORAGE') {
      loadStorageData();
    }
  }, [activeSection]);

  const getActiveFolderPath = (): string => {
    if (activeMainFolder === 'EMPLOYEES') {
      return `Employees/${selectedEmployee}/${selectedSubCat}`;
    }
    if (activeMainFolder === 'LEADS') return 'Leads/Spreadsheets & Ingestions';
    if (activeMainFolder === 'QUOTATIONS') return 'Quotations & Invoices';
    if (activeMainFolder === 'PRODUCTS') return 'Products/Media & Specs';
    if (activeMainFolder === 'DOCUMENTS') return 'Documents/Company Legal & KYC';
    return 'Company Root (All Data)';
  };

  const handleOpenMailModal = (folderPathOverride?: string) => {
    const target = folderPathOverride || getActiveFolderPath();
    setMailTargetFolder(target);
    setMailRecipient(currentUser?.email || 'admin@company.com');
    setShowMailModal(true);
  };

  const handleSendFolderEmail = async () => {
    if (!mailRecipient.trim()) {
      Alert.alert('Error', 'Please enter a valid recipient email address.');
      return;
    }
    setIsSendingMail(true);
    try {
      const result = await requestFolderDataOnEmailAndroid({
        folderPath: mailTargetFolder,
        recipientEmail: mailRecipient.trim(),
        category: activeMainFolder,
        employeeName: activeMainFolder === 'EMPLOYEES' ? selectedEmployee : undefined,
        subCategory: activeMainFolder === 'EMPLOYEES' ? selectedSubCat : undefined,
        format: mailFormat,
        notes: mailNotes.trim(),
      });
      setMailRequests(prev => [result, ...prev]);
      setShowMailModal(false);
      Alert.alert(
        '📧 Folder Data Dispatched!',
        `Data package for "${mailTargetFolder}" has been prepared (${result.fileCount} files, format: ${mailFormat}) and emailed to ${mailRecipient}.`
      );
    } catch (e: any) {
      Alert.alert('Dispatch Error', e.message || 'Could not send email package.');
    } finally {
      setIsSendingMail(false);
    }
  };

  const currentFolderFiles = vaultFiles.filter(f => {
    if (activeMainFolder === 'EMPLOYEES') {
      return (
        f.employeeName?.toLowerCase() === selectedEmployee.toLowerCase() &&
        (!f.subCategory || f.subCategory.toLowerCase() === selectedSubCat.toLowerCase())
      );
    }
    return f.category === activeMainFolder;
  });

  return (
    <View style={[styles.container, { backgroundColor: colors.bg }]}>
      {/* Top Header */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border, paddingTop: insets.top + 8 }]}>
        <View style={styles.headerRow}>
          {onClose && (
            <TouchableOpacity
              onPress={onClose}
              style={[styles.backBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
              hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            >
              <Text style={[styles.backBtnText, { color: colors.primary }]}>← Back</Text>
            </TouchableOpacity>
          )}
          <View style={{ flex: 1 }}>
            <Text style={[styles.headerTitle, { color: colors.text }]}>🗄️ Database &amp; Storage</Text>
            <Text style={[styles.headerSubtitle, { color: colors.textMuted }]}>
              Lead Ingestions &amp; Google Drive Vault
            </Text>
          </View>
        </View>

        {/* TWO PRIMARY BUTTONS / TABS */}
        <View style={[styles.tabBar, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeSection === 'IMPORTS' && [styles.tabBtnActive, { backgroundColor: '#4f46e5' }],
            ]}
            onPress={() => setActiveSection('IMPORTS')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: activeSection === 'IMPORTS' ? '#ffffff' : colors.textMuted },
                activeSection === 'IMPORTS' && styles.tabBtnTextActive,
              ]}
            >
              📥 Lead Import History
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabBtn,
              activeSection === 'STORAGE' && [styles.tabBtnActive, { backgroundColor: '#7c3aed' }],
            ]}
            onPress={() => setActiveSection('STORAGE')}
            activeOpacity={0.8}
          >
            <Text
              style={[
                styles.tabBtnText,
                { color: activeSection === 'STORAGE' ? '#ffffff' : colors.textMuted },
                activeSection === 'STORAGE' && styles.tabBtnTextActive,
              ]}
            >
              🗄️ Data Storage (Vault)
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* SECTION 1: LEAD IMPORT HISTORY */}
      {activeSection === 'IMPORTS' ? (
        <View style={{ flex: 1 }}>
          <BulkIngestionScreen onClose={onClose} />
        </View>
      ) : (
        /* SECTION 2: DATA STORAGE (GOOGLE DRIVE VAULT & EMAIL REQUEST) */
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Main Vault Header Card */}
          <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.vaultHeaderRow}>
              <View style={styles.vaultIconBadge}>
                <Text style={{ fontSize: 24 }}>☁️</Text>
              </View>
              <View style={{ flex: 1 }}>
                <View style={styles.vaultTitleBadgeRow}>
                  <Text style={[styles.vaultTitle, { color: colors.text }]}>
                    Google Drive Multi-Tenant Vault
                  </Text>
                </View>
                <View style={styles.connectedBadge}>
                  <Text style={styles.connectedBadgeText}>● Service Account Connected</Text>
                </View>
                <Text style={[styles.vaultDesc, { color: colors.textMuted }]}>
                  Company &gt; Employees &gt; [Employee] &gt; [DP | Docs | Details]
                </Text>
              </View>
            </View>

            {/* Sub-view switcher for Storage */}
            <View style={styles.storageSubTabs}>
              <TouchableOpacity
                onPress={() => setStorageViewMode('HIERARCHY')}
                style={[
                  styles.storageSubTabBtn,
                  storageViewMode === 'HIERARCHY' && { backgroundColor: '#4f46e5' },
                ]}
              >
                <Text
                  style={[
                    styles.storageSubTabText,
                    { color: storageViewMode === 'HIERARCHY' ? '#fff' : colors.textMuted },
                  ]}
                >
                  📁 Folders
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStorageViewMode('FILES')}
                style={[
                  styles.storageSubTabBtn,
                  storageViewMode === 'FILES' && { backgroundColor: '#4f46e5' },
                ]}
              >
                <Text
                  style={[
                    styles.storageSubTabText,
                    { color: storageViewMode === 'FILES' ? '#fff' : colors.textMuted },
                  ]}
                >
                  📄 Files ({vaultFiles.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setStorageViewMode('MAIL_LOGS')}
                style={[
                  styles.storageSubTabBtn,
                  storageViewMode === 'MAIL_LOGS' && { backgroundColor: '#4f46e5' },
                ]}
              >
                <Text
                  style={[
                    styles.storageSubTabText,
                    { color: storageViewMode === 'MAIL_LOGS' ? '#fff' : colors.textMuted },
                  ]}
                >
                  📧 Mail Logs ({mailRequests.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={loadStorageData}
                style={[styles.storageSubTabBtn, { backgroundColor: colors.cardBgElevated }]}
              >
                {isLoadingStorage ? (
                  <ActivityIndicator size="small" color="#4f46e5" />
                ) : (
                  <Text style={[styles.storageSubTabText, { color: colors.textMuted }]}>🔄 Sync</Text>
                )}
              </TouchableOpacity>
            </View>

            {/* 4 Telemetry Metrics */}
            <View style={styles.statsGrid}>
              <View style={[styles.statBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border }]}>
                <Text style={styles.statLabel}>🛡️ IDENTITY</Text>
                <Text style={[styles.statValue, { color: colors.text }]} numberOfLines={1}>das-crm-drive</Text>
                <Text style={styles.statSub}>das-crm-506400</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border }]}>
                <Text style={styles.statLabel}>📁 FOLDER ORG</Text>
                <Text style={[styles.statValue, { color: colors.text }]}>Dedicated</Text>
                <Text style={styles.statSub}>Emp · Leads · Quotes</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border }]}>
                <Text style={styles.statLabel}>📄 VAULT FILES</Text>
                <Text style={[styles.statValue, { color: '#38bdf8' }]}>{vaultFiles.length} Stored</Text>
                <Text style={styles.statSub}>Direct Stream</Text>
              </View>

              <View style={[styles.statBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border }]}>
                <Text style={styles.statLabel}>⚡ DB LOAD</Text>
                <Text style={[styles.statValue, { color: '#34d399' }]}>0% (URL Only)</Text>
                <Text style={styles.statSub}>No binary in DB</Text>
              </View>
            </View>
          </View>

          {/* HIERARCHY VIEW */}
          {storageViewMode === 'HIERARCHY' && (
            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              {/* Company Root */}
              <View style={styles.rootHeaderRow}>
                <View>
                  <Text style={[styles.rootTitle, { color: colors.text }]}>
                    📁 Acme Sales Solutions (Company Root)
                  </Text>
                  <Text style={[styles.rootSub, { color: colors.textMuted }]}>
                    Google Drive &amp; Local Vault Sync
                  </Text>
                </View>

                {/* EMAIL REQUEST BUTTON */}
                <TouchableOpacity
                  onPress={() => handleOpenMailModal('Company Root (All Data)')}
                  style={styles.emailExportBtn}
                >
                  <Text style={styles.emailExportBtnText}>📧 Email Folder</Text>
                </TouchableOpacity>
              </View>

              {/* Main Categories Selector */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
                <TouchableOpacity
                  onPress={() => setActiveMainFolder('EMPLOYEES')}
                  style={[
                    styles.catChip,
                    activeMainFolder === 'EMPLOYEES' && styles.catChipActive,
                  ]}
                >
                  <Text style={styles.catChipText}>👤 Employees/</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveMainFolder('LEADS')}
                  style={[
                    styles.catChip,
                    activeMainFolder === 'LEADS' && styles.catChipActive,
                  ]}
                >
                  <Text style={styles.catChipText}>📊 Leads/</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveMainFolder('QUOTATIONS')}
                  style={[
                    styles.catChip,
                    activeMainFolder === 'QUOTATIONS' && styles.catChipActive,
                  ]}
                >
                  <Text style={styles.catChipText}>📑 Quotations/</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveMainFolder('PRODUCTS')}
                  style={[
                    styles.catChip,
                    activeMainFolder === 'PRODUCTS' && styles.catChipActive,
                  ]}
                >
                  <Text style={styles.catChipText}>📦 Products/</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => setActiveMainFolder('DOCUMENTS')}
                  style={[
                    styles.catChip,
                    activeMainFolder === 'DOCUMENTS' && styles.catChipActive,
                  ]}
                >
                  <Text style={styles.catChipText}>⚖️ Documents/</Text>
                </TouchableOpacity>
              </ScrollView>

              {/* If EMPLOYEES: Render Employee Tree */}
              {activeMainFolder === 'EMPLOYEES' && (
                <View style={[styles.employeeTreeBox, { backgroundColor: isDark ? '#0f172a' : '#f8fafc', borderColor: colors.border }]}>
                  <Text style={[styles.empTreeTitle, { color: colors.text }]}>
                    👤 Dedicated Per-Employee Folders
                  </Text>

                  {/* Employee chips */}
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.empChipScroll}>
                    {EMPLOYEES.map(emp => (
                      <TouchableOpacity
                        key={emp}
                        onPress={() => setSelectedEmployee(emp)}
                        style={[
                          styles.empChip,
                          selectedEmployee === emp && styles.empChipActive,
                        ]}
                      >
                        <Text
                          style={[
                            styles.empChipText,
                            selectedEmployee === emp && styles.empChipTextActive,
                          ]}
                        >
                          {emp}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>

                  {/* Employee Sub-folders */}
                  <View style={styles.subFolderRow}>
                    <TouchableOpacity
                      onPress={() => setSelectedSubCat('DP')}
                      style={[
                        styles.subFolderBtn,
                        selectedSubCat === 'DP' && styles.subFolderBtnActive,
                      ]}
                    >
                      <Text style={styles.subFolderIcon}>🖼️</Text>
                      <Text style={styles.subFolderTitle}>DP/</Text>
                      <Text style={styles.subFolderSub}>Avatars &amp; Pictures</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setSelectedSubCat('Documents')}
                      style={[
                        styles.subFolderBtn,
                        selectedSubCat === 'Documents' && styles.subFolderBtnActive,
                      ]}
                    >
                      <Text style={styles.subFolderIcon}>📑</Text>
                      <Text style={styles.subFolderTitle}>Documents/</Text>
                      <Text style={styles.subFolderSub}>KYC, PAN, Aadhaar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                      onPress={() => setSelectedSubCat('Details')}
                      style={[
                        styles.subFolderBtn,
                        selectedSubCat === 'Details' && styles.subFolderBtnActive,
                      ]}
                    >
                      <Text style={styles.subFolderIcon}>💳</Text>
                      <Text style={styles.subFolderTitle}>Details/</Text>
                      <Text style={styles.subFolderSub}>Bank &amp; Agreements</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}

              {/* Active Folder Bar & Email Action */}
              <View style={[styles.activeFolderBar, { backgroundColor: isDark ? '#1e293b' : '#f1f5f9' }]}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.activeFolderLabel}>📂 Active Folder:</Text>
                  <Text style={[styles.activeFolderPath, { color: colors.text }]} numberOfLines={1}>
                    {getActiveFolderPath()}
                  </Text>
                </View>

                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={styles.viewOnlyBadge}>
                    <Text style={styles.viewOnlyBadgeText}>🔒 View Only</Text>
                  </View>

                  <TouchableOpacity
                    onPress={() => handleOpenMailModal(getActiveFolderPath())}
                    style={styles.requestMailBtn}
                  >
                    <Text style={styles.requestMailBtnText}>📧 Request on Mail</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Files in Active Folder */}
              <View style={styles.filesSection}>
                <Text style={[styles.filesSectionTitle, { color: colors.text }]}>
                  Files in this folder ({currentFolderFiles.length})
                </Text>

                {currentFolderFiles.length === 0 ? (
                  <View style={styles.emptyFilesBox}>
                    <Text style={{ fontSize: 24, marginBottom: 4 }}>📂</Text>
                    <Text style={[styles.emptyFilesText, { color: colors.textMuted }]}>
                      No files stored in this folder yet.
                    </Text>
                    <Text style={[styles.emptyFilesSubText, { color: colors.textMuted }]}>
                      Files uploaded through CRM modules (Employee Profiles, KYC, Leads, Quotations) are automatically fetched and stored here in Google Drive.
                    </Text>
                  </View>
                ) : (
                  currentFolderFiles.map(file => (
                    <View
                      key={file.fileId}
                      style={[styles.fileRow, { borderBottomColor: colors.border }]}
                    >
                      <Text style={{ fontSize: 18, marginRight: 8 }}>📄</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                          {file.fileName}
                        </Text>
                        <Text style={styles.fileMeta}>
                          {(file.sizeBytes / 1024).toFixed(1)} KB • {file.uploadedAt}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row', gap: 6 }}>
                        <TouchableOpacity
                          onPress={() => {
                            if (file.driveViewUrl) {
                              Linking.openURL(file.driveViewUrl).catch(() => {
                                Alert.alert('File', `Viewing ${file.fileName}\nPath: ${file.folderPath}`);
                              });
                            } else {
                              Alert.alert('File Direct Access', `Viewing ${file.fileName}\nPath: ${file.folderPath}`);
                            }
                          }}
                          style={styles.viewFileBtn}
                        >
                          <Text style={styles.viewFileBtnText}>View</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                          onPress={() => {
                            const url = file.driveDownloadUrl || file.driveViewUrl;
                            if (url) {
                              Linking.openURL(url).catch(() => {
                                Alert.alert('Download', `Downloading ${file.fileName}`);
                              });
                            }
                          }}
                          style={styles.downloadFileBtn}
                        >
                          <Text style={styles.downloadFileBtnText}>Download</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))
                )}
              </View>
            </View>
          )}

          {/* ALL FILES VIEW */}
          {storageViewMode === 'FILES' && (
            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <Text style={[styles.filesSectionTitle, { color: colors.text }]}>
                All Multi-Tenant Vault Files ({vaultFiles.length})
              </Text>
              {vaultFiles.map(file => (
                <View
                  key={file.fileId}
                  style={[styles.fileRow, { borderBottomColor: colors.border }]}
                >
                  <Text style={{ fontSize: 18, marginRight: 8 }}>📄</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                      {file.fileName}
                    </Text>
                    <Text style={styles.fileMeta}>
                      {file.folderPath} • {(file.sizeBytes / 1024).toFixed(1)} KB
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 6 }}>
                    <TouchableOpacity
                      onPress={() => {
                        if (file.driveViewUrl) {
                          Linking.openURL(file.driveViewUrl).catch(() => {});
                        }
                      }}
                      style={styles.viewFileBtn}
                    >
                      <Text style={styles.viewFileBtnText}>View</Text>
                    </TouchableOpacity>
                    {file.driveDownloadUrl && (
                      <TouchableOpacity
                        onPress={() => {
                          Linking.openURL(file.driveDownloadUrl!).catch(() => {});
                        }}
                        style={styles.downloadFileBtn}
                      >
                        <Text style={styles.downloadFileBtnText}>Download</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                </View>
              ))}
            </View>
          )}

          {/* MAIL REQUESTS AUDIT LOGS VIEW */}
          {storageViewMode === 'MAIL_LOGS' && (
            <View style={[styles.card, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
              <View style={styles.rootHeaderRow}>
                <Text style={[styles.filesSectionTitle, { color: colors.text }]}>
                  📧 Email Requests History ({mailRequests.length})
                </Text>
                <TouchableOpacity
                  onPress={() => handleOpenMailModal()}
                  style={styles.emailExportBtn}
                >
                  <Text style={styles.emailExportBtnText}>+ New Request</Text>
                </TouchableOpacity>
              </View>

              {mailRequests.length === 0 ? (
                <View style={styles.emptyFilesBox}>
                  <Text style={[styles.emptyFilesText, { color: colors.textMuted }]}>
                    No folder email export requests yet.
                  </Text>
                </View>
              ) : (
                mailRequests.map(r => (
                  <View
                    key={r.requestId}
                    style={[styles.fileRow, { borderBottomColor: colors.border }]}
                  >
                    <Text style={{ fontSize: 20, marginRight: 8 }}>📦</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.fileName, { color: colors.text }]} numberOfLines={1}>
                        {r.folderPath}
                      </Text>
                      <Text style={styles.fileMeta}>
                        To: {r.recipientEmail} • Format: {r.format} • {r.fileCount} files ({r.totalSizeMb})
                      </Text>
                    </View>
                    <View style={styles.statusBadge}>
                      <Text style={styles.statusBadgeText}>✓ {r.status}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          )}
        </ScrollView>
      )}

      {/* MODAL: Request Folder Data on Email */}
      <Modal
        visible={showMailModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowMailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                📧 Request Folder Data via Mail
              </Text>
              <TouchableOpacity onPress={() => setShowMailModal(false)}>
                <Text style={{ fontSize: 18, color: colors.textMuted }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={[styles.modalSub, { color: colors.textMuted }]}>
              Export folder contents directly to your administrator email inbox.
            </Text>

            {/* Target Folder Path */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Target Folder Path</Text>
            <TextInput
              value={mailTargetFolder}
              onChangeText={setMailTargetFolder}
              placeholder="e.g. Employees/Amit Shah/Documents"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.cardBgElevated, color: colors.text, borderColor: colors.border }]}
            />

            {/* Recipient Email */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Admin Recipient Email</Text>
            <TextInput
              value={mailRecipient}
              onChangeText={setMailRecipient}
              keyboardType="email-address"
              autoCapitalize="none"
              placeholder="admin@company.com"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.cardBgElevated, color: colors.text, borderColor: colors.border }]}
            />

            {/* Format Selection */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Package Format</Text>
            <View style={styles.formatRow}>
              <TouchableOpacity
                onPress={() => setMailFormat('ZIP')}
                style={[
                  styles.formatBtn,
                  mailFormat === 'ZIP' && styles.formatBtnActive,
                ]}
              >
                <Text style={[styles.formatBtnText, mailFormat === 'ZIP' && styles.formatBtnTextActive]}>
                  📦 ZIP
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMailFormat('CSV_MANIFEST')}
                style={[
                  styles.formatBtn,
                  mailFormat === 'CSV_MANIFEST' && styles.formatBtnActive,
                ]}
              >
                <Text style={[styles.formatBtnText, mailFormat === 'CSV_MANIFEST' && styles.formatBtnTextActive]}>
                  📊 CSV
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMailFormat('SECURE_LINK')}
                style={[
                  styles.formatBtn,
                  mailFormat === 'SECURE_LINK' && styles.formatBtnActive,
                ]}
              >
                <Text style={[styles.formatBtnText, mailFormat === 'SECURE_LINK' && styles.formatBtnTextActive]}>
                  🔗 Link
                </Text>
              </TouchableOpacity>
            </View>

            {/* Notes */}
            <Text style={[styles.inputLabel, { color: colors.text }]}>Audit Memo / Notes (Optional)</Text>
            <TextInput
              value={mailNotes}
              onChangeText={setMailNotes}
              placeholder="e.g. Q3 compliance verification audit"
              placeholderTextColor={colors.textMuted}
              style={[styles.input, { backgroundColor: colors.cardBgElevated, color: colors.text, borderColor: colors.border }]}
            />

            {/* Modal Actions */}
            <View style={styles.modalActions}>
              <TouchableOpacity
                onPress={() => setShowMailModal(false)}
                style={[styles.cancelBtn, { borderColor: colors.border }]}
              >
                <Text style={[styles.cancelBtnText, { color: colors.textMuted }]}>Cancel</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={handleSendFolderEmail}
                disabled={isSendingMail}
                style={styles.confirmSendBtn}
              >
                {isSendingMail ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.confirmSendBtnText}>🚀 Send to Mail</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

export default DatabaseScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 12,
  },
  backBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '900',
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 11,
    marginTop: 1,
  },
  tabBar: {
    flexDirection: 'row',
    padding: 3,
    borderRadius: 12,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 9,
  },
  tabBtnActive: {
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 2,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  tabBtnTextActive: {
    fontWeight: '800',
  },
  scroll: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 14,
    paddingBottom: 40,
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 14,
  },
  vaultHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  vaultIconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#4f46e520',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vaultTitleBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  vaultTitle: {
    fontSize: 14,
    fontWeight: '900',
  },
  connectedBadge: {
    alignSelf: 'flex-start',
    backgroundColor: '#10b98120',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
    marginTop: 2,
  },
  connectedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  vaultDesc: {
    fontSize: 10,
    marginTop: 3,
  },
  storageSubTabs: {
    flexDirection: 'row',
    gap: 6,
    marginTop: 12,
  },
  storageSubTabBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  storageSubTabText: {
    fontSize: 11,
    fontWeight: '700',
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 12,
  },
  statBox: {
    flex: 1,
    minWidth: '45%',
    padding: 10,
    borderRadius: 10,
    borderWidth: 1,
  },
  statLabel: {
    fontSize: 9,
    fontWeight: '800',
    color: '#818cf8',
  },
  statValue: {
    fontSize: 13,
    fontWeight: '900',
    marginTop: 2,
  },
  statSub: {
    fontSize: 9,
    color: '#94a3b8',
    marginTop: 1,
  },
  rootHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  rootTitle: {
    fontSize: 13,
    fontWeight: '800',
  },
  rootSub: {
    fontSize: 10,
  },
  emailExportBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  emailExportBtnText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: '800',
  },
  catScroll: {
    flexDirection: 'row',
    marginVertical: 8,
  },
  catChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#33415530',
    marginRight: 6,
  },
  catChipActive: {
    backgroundColor: '#4f46e5',
  },
  catChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#cbd5e1',
  },
  employeeTreeBox: {
    padding: 10,
    borderRadius: 12,
    borderWidth: 1,
    marginVertical: 6,
  },
  empTreeTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 6,
  },
  empChipScroll: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  empChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#47556940',
    marginRight: 6,
  },
  empChipActive: {
    backgroundColor: '#4f46e5',
  },
  empChipText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  empChipTextActive: {
    color: '#ffffff',
  },
  subFolderRow: {
    flexDirection: 'row',
    gap: 6,
  },
  subFolderBtn: {
    flex: 1,
    padding: 8,
    borderRadius: 8,
    backgroundColor: '#33415530',
    alignItems: 'center',
  },
  subFolderBtnActive: {
    backgroundColor: '#4f46e525',
    borderColor: '#4f46e5',
    borderWidth: 1,
  },
  subFolderIcon: {
    fontSize: 14,
  },
  subFolderTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#cbd5e1',
    marginTop: 2,
  },
  subFolderSub: {
    fontSize: 8,
    color: '#94a3b8',
    textAlign: 'center',
    marginTop: 1,
  },
  activeFolderBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 10,
    marginTop: 10,
    gap: 8,
  },
  activeFolderLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: '#38bdf8',
  },
  activeFolderPath: {
    fontSize: 11,
    fontWeight: '800',
  },
  requestMailBtn: {
    backgroundColor: '#db2777',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  requestMailBtnText: {
    color: '#fff',
    fontSize: 10,
    fontWeight: '800',
  },
  filesSection: {
    marginTop: 12,
  },
  filesSectionTitle: {
    fontSize: 12,
    fontWeight: '800',
    marginBottom: 8,
  },
  emptyFilesBox: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  emptyFilesText: {
    fontSize: 11,
  },
  fileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  fileName: {
    fontSize: 12,
    fontWeight: '700',
  },
  fileMeta: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 1,
  },
  viewFileBtn: {
    backgroundColor: '#4f46e520',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewFileBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#818cf8',
  },
  downloadFileBtn: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  downloadFileBtnText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
  },
  viewOnlyBadge: {
    backgroundColor: '#f59e0b15',
    borderColor: '#f59e0b35',
    borderWidth: 1,
    paddingHorizontal: 7,
    paddingVertical: 4,
    borderRadius: 6,
  },
  viewOnlyBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#f59e0b',
  },
  emptyFilesSubText: {
    fontSize: 10,
    textAlign: 'center',
    marginTop: 4,
    maxWidth: 260,
  },
  statusBadge: {
    backgroundColor: '#10b98120',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#10b981',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    padding: 16,
  },
  modalContent: {
    borderRadius: 18,
    borderWidth: 1,
    padding: 18,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 15,
    fontWeight: '900',
  },
  modalSub: {
    fontSize: 11,
    marginTop: 3,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 11,
    fontWeight: '700',
    marginTop: 8,
    marginBottom: 4,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
  },
  formatRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  formatBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#47556940',
    alignItems: 'center',
  },
  formatBtnActive: {
    backgroundColor: '#7c3aed30',
    borderColor: '#7c3aed',
  },
  formatBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#94a3b8',
  },
  formatBtnTextActive: {
    color: '#c084fc',
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    marginTop: 16,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '700',
  },
  confirmSendBtn: {
    backgroundColor: '#7c3aed',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 10,
  },
  confirmSendBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '800',
  },
});

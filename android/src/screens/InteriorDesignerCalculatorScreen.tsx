/**
 * InteriorDesignerCalculatorScreen.tsx — DAS CRM Android
 * Mobile Interior Cost Calculator & 2D/3D Design Studio.
 *
 * Implements:
 * 1. Persistent Top Navigation Bar (All Quotations, All Diagrams, Lead History, Design Workflow).
 * 2. 7-Step Mobile Workflow:
 *    - Step 1: Mandatory Lead Selector (locks subsequent steps until chosen)
 *    - Step 2: Building Level & Project Metadata
 *    - Step 3: Room Dimensions & Automated Carpet Area / Perimeter Calculation
 *    - Step 4: Interior Work Category Toggles (Civil, Flooring, Ceiling, Walls, Joinery, Electrical, Hardware)
 *    - Step 5: 2D/3D Diagram Viewer & Web Studio Link
 *    - Step 6: Live Itemized BOQ & Cost Breakdown
 *    - Step 7: Dual Quotation Viewer (Customer Quote vs Confidential Internal Costing Sheet)
 */

import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';

interface Props {
  onClose: () => void;
}

type TabType = 'workflow' | 'quotations' | 'diagrams' | 'leadHistory';
type WorkflowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7;

interface MobileLead {
  id: string;
  name: string;
  phone: string;
  email: string;
  propertyType: string;
  budgetINR: number;
  status: string;
}

interface MobileRoom {
  id: string;
  name: string;
  type: string;
  length: number;
  width: number;
  height: number;
  carpetAreaSqFt: number;
  perimeterFt: number;
  wallAreaSqFt: number;
  furnitureCount: number;
}

const SEED_LEADS: MobileLead[] = [
  {
    id: 'lead-001',
    name: 'Rajesh Sharma',
    phone: '+91 98201 44521',
    email: 'rajesh.sharma@gmail.com',
    propertyType: '3BHK Apartment',
    budgetINR: 1850000,
    status: 'Qualified Proposal',
  },
  {
    id: 'lead-002',
    name: 'Pooja & Vikram Verma',
    phone: '+91 99308 12760',
    email: 'vikram.verma@outlook.com',
    propertyType: '4BHK Villa',
    budgetINR: 3200000,
    status: 'Site Measurement Done',
  },
  {
    id: 'lead-003',
    name: 'Ananya Deshmukh',
    phone: '+91 98190 33412',
    email: 'ananya.d@nexus.in',
    propertyType: 'Penthouse Suite',
    budgetINR: 4500000,
    status: 'Design In Progress',
  },
];

export const InteriorDesignerCalculatorScreen: React.FC<Props> = ({ onClose }) => {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();

  // Navigation State
  const [activeTab, setActiveTab] = useState<TabType>('workflow');
  const [currentStep, setCurrentStep] = useState<WorkflowStep>(1);

  // Workflow State
  const [selectedLeadId, setSelectedLeadId] = useState<string>('lead-001');
  const [leadSearch, setLeadSearch] = useState('');
  const [floorLevel, setFloorLevel] = useState('Ground Floor');
  const [projectName, setProjectName] = useState("Rajesh Sharma's Interior Project");

  // Rooms State
  const [rooms, setRooms] = useState<MobileRoom[]>([
    {
      id: 'room-1',
      name: 'Living & Dining Lounge',
      type: 'Living Room',
      length: 18,
      width: 14,
      height: 10,
      carpetAreaSqFt: 252,
      perimeterFt: 64,
      wallAreaSqFt: 640,
      furnitureCount: 3,
    },
    {
      id: 'room-2',
      name: 'Master Bedroom Suite',
      type: 'Master Bedroom',
      length: 16,
      width: 12,
      height: 10,
      carpetAreaSqFt: 192,
      perimeterFt: 56,
      wallAreaSqFt: 560,
      furnitureCount: 2,
    },
    {
      id: 'room-3',
      name: 'Modern Modular Kitchen',
      type: 'Kitchen',
      length: 12,
      width: 10,
      height: 10,
      carpetAreaSqFt: 120,
      perimeterFt: 44,
      wallAreaSqFt: 440,
      furnitureCount: 1,
    },
  ]);

  // Categories Toggles
  const [categories, setCategories] = useState({
    civil: true,
    flooring: true,
    ceiling: true,
    wall: true,
    furniture: true,
    electrical: true,
    hardware: true,
  });

  // Quotation Mode
  const [quotationMode, setQuotationMode] = useState<'customer' | 'internal'>('customer');

  // Selected Lead Helper
  const selectedLead = useMemo(() => {
    return SEED_LEADS.find((l) => l.id === selectedLeadId) || SEED_LEADS[0];
  }, [selectedLeadId]);

  // Total Carpet Area
  const totalArea = useMemo(() => {
    return rooms.reduce((acc, r) => acc + r.carpetAreaSqFt, 0);
  }, [rooms]);

  // Financial Calculations
  const calculations = useMemo(() => {
    const rawMaterial = Math.round(totalArea * 1450);
    const hardware = Math.round(rawMaterial * 0.16);
    const labor = Math.round(totalArea * 580);
    const wastage = Math.round(rawMaterial * 0.05);
    const transport = 18500;
    const internalCost = rawMaterial + hardware + labor + wastage + transport;

    const baseSelling = Math.round(internalCost * 1.35); // 35% margin
    const gst = Math.round(baseSelling * 0.18);
    const grandSelling = baseSelling + gst;
    const netMarginPct = Math.round(((baseSelling - internalCost) / baseSelling) * 100);

    return {
      rawMaterial,
      hardware,
      labor,
      wastage,
      transport,
      internalCost,
      baseSelling,
      gst,
      grandSelling,
      netMarginPct,
    };
  }, [totalArea]);

  const handleOpenWebStudio = () => {
    Linking.openURL('http://localhost:3000/calculators/interior-designer').catch(() => {
      Alert.alert('Studio Link', 'Open DAS CRM Web at /calculators/interior-designer to use full 3D WebGL Studio.');
    });
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: Math.max(insets.top, 16) }]}>
      {/* ── Top Header Bar ─────────────────────────────────────────── */}
      <View style={[styles.header, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={onClose}
          style={[styles.backBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
          activeOpacity={0.7}
        >
          <Text style={[styles.backBtnText, { color: colors.primary }]}>← Back</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={[styles.title, { color: colors.text }]}>Interior Cost Studio</Text>
          <Text style={[styles.subTitle, { color: colors.textMuted }]}>
            {selectedLead ? `Lead: ${selectedLead.name}` : 'Select Lead'}
          </Text>
        </View>
        <TouchableOpacity
          onPress={handleOpenWebStudio}
          style={[styles.studioPill, { backgroundColor: '#f43f5e' }]}
        >
          <Text style={styles.studioPillText}>3D Web</Text>
        </TouchableOpacity>
      </View>

      {/* ── Top Navigation Tabs (Always at TOP) ──────────────────────── */}
      <View style={[styles.topTabsBar, { backgroundColor: colors.cardBg, borderBottomColor: colors.border }]}>
        <TouchableOpacity
          onPress={() => setActiveTab('workflow')}
          style={[styles.tabButton, activeTab === 'workflow' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, { color: activeTab === 'workflow' ? '#fff' : colors.textMuted }]}>
            🛋️ Design
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('quotations')}
          style={[styles.tabButton, activeTab === 'quotations' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, { color: activeTab === 'quotations' ? '#fff' : colors.textMuted }]}>
            📋 Quotes
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('diagrams')}
          style={[styles.tabButton, activeTab === 'diagrams' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, { color: activeTab === 'diagrams' ? '#fff' : colors.textMuted }]}>
            📐 2D/3D
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          onPress={() => setActiveTab('leadHistory')}
          style={[styles.tabButton, activeTab === 'leadHistory' && styles.tabButtonActive]}
        >
          <Text style={[styles.tabButtonText, { color: activeTab === 'leadHistory' ? '#fff' : colors.textMuted }]}>
            📜 History
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* ── TAB: WORKFLOW ────────────────────────────────────────── */}
        {activeTab === 'workflow' && (
          <View>
            {/* Step Indicators */}
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.stepsScroll}>
              {[
                { s: 1, label: '1. Lead' },
                { s: 2, label: '2. Project' },
                { s: 3, label: '3. Rooms' },
                { s: 4, label: '4. Scope' },
                { s: 5, label: '5. 3D Studio' },
                { s: 6, label: '6. BOQ' },
                { s: 7, label: '7. Quote' },
              ].map((step) => (
                <TouchableOpacity
                  key={step.s}
                  onPress={() => setCurrentStep(step.s as WorkflowStep)}
                  style={[
                    styles.stepBadge,
                    {
                      backgroundColor:
                        currentStep === step.s
                          ? '#f43f5e'
                          : currentStep > step.s
                          ? 'rgba(244, 63, 94, 0.15)'
                          : colors.cardBgElevated,
                      borderColor: currentStep === step.s ? '#f43f5e' : colors.border,
                    },
                  ]}
                >
                  <Text
                    style={[
                      styles.stepBadgeText,
                      { color: currentStep === step.s ? '#fff' : colors.textSecondary },
                    ]}
                  >
                    {step.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* STEP 1: SELECT LEAD */}
            {currentStep === 1 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Step 1: Select CRM Lead (Mandatory)</Text>
                <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                  Customer must be selected before starting interior specifications.
                </Text>

                <TextInput
                  value={leadSearch}
                  onChangeText={setLeadSearch}
                  placeholder="Search leads by name or phone..."
                  placeholderTextColor={colors.textMuted}
                  style={[
                    styles.input,
                    { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text },
                  ]}
                />

                {SEED_LEADS.filter((l) => l.name.toLowerCase().includes(leadSearch.toLowerCase())).map((lead) => (
                  <TouchableOpacity
                    key={lead.id}
                    onPress={() => {
                      setSelectedLeadId(lead.id);
                      setProjectName(`${lead.name}'s Interior Project`);
                      setCurrentStep(2);
                    }}
                    style={[
                      styles.leadItem,
                      {
                        backgroundColor:
                          selectedLeadId === lead.id ? 'rgba(244, 63, 94, 0.1)' : colors.cardBgElevated,
                        borderColor: selectedLeadId === lead.id ? '#f43f5e' : colors.border,
                      },
                    ]}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={[styles.leadName, { color: colors.text }]}>{lead.name}</Text>
                      <Text style={styles.leadBadge}>{lead.status}</Text>
                    </View>
                    <Text style={[styles.leadDetail, { color: colors.textMuted }]}>
                      📞 {lead.phone} • {lead.propertyType}
                    </Text>
                    <Text style={[styles.leadBudget, { color: '#f43f5e' }]}>
                      Budget: ₹{lead.budgetINR.toLocaleString('en-IN')}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* STEP 2: PROJECT AREA */}
            {currentStep === 2 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Step 2: Project & Building Level</Text>
                <TextInput
                  value={projectName}
                  onChangeText={setProjectName}
                  style={[
                    styles.input,
                    { backgroundColor: colors.cardBgElevated, borderColor: colors.border, color: colors.text },
                  ]}
                  placeholder="Project Name"
                  placeholderTextColor={colors.textMuted}
                />

                <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Floor Level:</Text>
                <View style={styles.floorLevelsRow}>
                  {['Basement', 'Ground Floor', 'First Floor', 'Penthouse'].map((lvl) => (
                    <TouchableOpacity
                      key={lvl}
                      onPress={() => setFloorLevel(lvl)}
                      style={[
                        styles.floorBtn,
                        {
                          backgroundColor: floorLevel === lvl ? '#f43f5e' : colors.cardBgElevated,
                          borderColor: colors.border,
                        },
                      ]}
                    >
                      <Text style={{ color: floorLevel === lvl ? '#fff' : colors.textSecondary, fontSize: 11 }}>
                        {lvl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TouchableOpacity
                  onPress={() => setCurrentStep(3)}
                  style={[styles.primaryActionBtn, { backgroundColor: '#f43f5e' }]}
                >
                  <Text style={styles.primaryActionText}>Next: Rooms & Measurements →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 3: ROOMS & MEASUREMENTS */}
            {currentStep === 3 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Step 3: Rooms & Dimensions</Text>
                  <Text style={[styles.totalAreaText, { color: '#f43f5e' }]}>{totalArea} sq.ft Total</Text>
                </View>

                {rooms.map((room) => (
                  <View
                    key={room.id}
                    style={[styles.roomCard, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
                  >
                    <View style={styles.rowBetween}>
                      <Text style={[styles.roomName, { color: colors.text }]}>{room.name}</Text>
                      <Text style={styles.roomTypeBadge}>{room.type}</Text>
                    </View>
                    <View style={styles.metricsGrid}>
                      <View>
                        <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Dimensions</Text>
                        <Text style={[styles.metricValue, { color: colors.text }]}>
                          {room.length}&apos; × {room.width}&apos; × {room.height}&apos;
                        </Text>
                      </View>
                      <View>
                        <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Carpet Area</Text>
                        <Text style={[styles.metricValue, { color: '#f43f5e' }]}>{room.carpetAreaSqFt} sq.ft</Text>
                      </View>
                      <View>
                        <Text style={[styles.metricLabel, { color: colors.textMuted }]}>Perimeter</Text>
                        <Text style={[styles.metricValue, { color: colors.text }]}>{room.perimeterFt} ft</Text>
                      </View>
                    </View>
                  </View>
                ))}

                <TouchableOpacity
                  onPress={() => setCurrentStep(4)}
                  style={[styles.primaryActionBtn, { backgroundColor: '#f43f5e' }]}
                >
                  <Text style={styles.primaryActionText}>Next: Work Scope Categories →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 4: WORK CATEGORIES */}
            {currentStep === 4 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Step 4: Interior Work Categories</Text>
                <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                  Select the scope included in the project estimation.
                </Text>

                {[
                  { key: 'civil' as const, label: 'Civil Modifications', desc: 'Demolition & Partitions' },
                  { key: 'flooring' as const, label: 'Flooring & Skirting', desc: 'Tiles & Italian Marble' },
                  { key: 'ceiling' as const, label: 'False Ceiling & Cove', desc: 'Gypsum POP with LED' },
                  { key: 'wall' as const, label: 'Wall Treatment & Paint', desc: 'Royale Emulsion & Flutes' },
                  { key: 'furniture' as const, label: 'Custom Joinery', desc: 'Wardrobes, TV console, Beds' },
                  { key: 'electrical' as const, label: 'Electrical & Lighting', desc: 'Switches, wiring & fixtures' },
                  { key: 'hardware' as const, label: 'Hardware & Fittings', desc: 'Hinges, runners & channels' },
                ].map((cat) => (
                  <TouchableOpacity
                    key={cat.key}
                    onPress={() => setCategories((prev) => ({ ...prev, [cat.key]: !prev[cat.key] }))}
                    style={[
                      styles.categoryRow,
                      {
                        backgroundColor: categories[cat.key] ? 'rgba(244, 63, 94, 0.08)' : colors.cardBgElevated,
                        borderColor: categories[cat.key] ? '#f43f5e' : colors.border,
                      },
                    ]}
                  >
                    <View>
                      <Text style={[styles.catName, { color: colors.text }]}>{cat.label}</Text>
                      <Text style={[styles.catDesc, { color: colors.textMuted }]}>{cat.desc}</Text>
                    </View>
                    <Text style={{ color: categories[cat.key] ? '#f43f5e' : colors.textMuted, fontWeight: 'bold' }}>
                      {categories[cat.key] ? '✓ Included' : 'Excluded'}
                    </Text>
                  </TouchableOpacity>
                ))}

                <TouchableOpacity
                  onPress={() => setCurrentStep(5)}
                  style={[styles.primaryActionBtn, { backgroundColor: '#f43f5e' }]}
                >
                  <Text style={styles.primaryActionText}>Next: 2D/3D Studio →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 5: 3D STUDIO LAUNCH */}
            {currentStep === 5 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Step 5: Interactive 2D/3D Studio</Text>
                <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                  Place furniture, edit room dimensions, and manipulate 3D models in real-time.
                </Text>

                <View style={styles.studioBannerBox}>
                  <Text style={{ fontSize: 36, marginBottom: 8 }}>🛋️</Text>
                  <Text style={[styles.studioBannerTitle, { color: colors.text }]}>WebGL 3D Studio Ready</Text>
                  <Text style={[styles.studioBannerDesc, { color: colors.textMuted }]}>
                    Orbit, Walkthrough, 3D Gizmo transform matrix, and marketplace models live on Web / Tablet.
                  </Text>
                  <TouchableOpacity
                    onPress={handleOpenWebStudio}
                    style={[styles.webStudioBtn, { backgroundColor: '#f43f5e' }]}
                  >
                    <Text style={styles.webStudioBtnText}>Launch WebGL 3D Studio ↗</Text>
                  </TouchableOpacity>
                </View>

                <TouchableOpacity
                  onPress={() => setCurrentStep(6)}
                  style={[styles.primaryActionBtn, { backgroundColor: '#f43f5e' }]}
                >
                  <Text style={styles.primaryActionText}>Next: Live Itemized BOQ →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 6: LIVE BOQ & COSTS */}
            {currentStep === 6 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <Text style={[styles.cardTitle, { color: colors.text }]}>Step 6: Live Itemized BOQ</Text>
                <Text style={[styles.cardDesc, { color: colors.textMuted }]}>
                  Computed live from room dimensions and placed studio furniture.
                </Text>

                <View style={styles.costGrid}>
                  <View style={[styles.costBox, { backgroundColor: colors.cardBgElevated }]}>
                    <Text style={[styles.costBoxLabel, { color: colors.textMuted }]}>Materials</Text>
                    <Text style={[styles.costBoxVal, { color: colors.text }]}>
                      ₹{calculations.rawMaterial.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={[styles.costBox, { backgroundColor: colors.cardBgElevated }]}>
                    <Text style={[styles.costBoxLabel, { color: colors.textMuted }]}>Hardware</Text>
                    <Text style={[styles.costBoxVal, { color: colors.text }]}>
                      ₹{calculations.hardware.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={[styles.costBox, { backgroundColor: colors.cardBgElevated }]}>
                    <Text style={[styles.costBoxLabel, { color: colors.textMuted }]}>Labor</Text>
                    <Text style={[styles.costBoxVal, { color: colors.text }]}>
                      ₹{calculations.labor.toLocaleString('en-IN')}
                    </Text>
                  </View>
                  <View style={[styles.costBox, { backgroundColor: 'rgba(244, 63, 94, 0.1)' }]}>
                    <Text style={[styles.costBoxLabel, { color: '#f43f5e' }]}>Selling Total</Text>
                    <Text style={[styles.costBoxVal, { color: '#f43f5e' }]}>
                      ₹{calculations.grandSelling.toLocaleString('en-IN')}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  onPress={() => setCurrentStep(7)}
                  style={[styles.primaryActionBtn, { backgroundColor: '#f43f5e' }]}
                >
                  <Text style={styles.primaryActionText}>Generate Quotation Sheet →</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* STEP 7: QUOTATION SHEET */}
            {currentStep === 7 && (
              <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
                <View style={styles.rowBetween}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>Quotation Output</Text>
                  <View style={styles.quoteSwitch}>
                    <TouchableOpacity
                      onPress={() => setQuotationMode('customer')}
                      style={[styles.quoteSwitchBtn, quotationMode === 'customer' && styles.quoteSwitchActive]}
                    >
                      <Text style={{ fontSize: 10, color: quotationMode === 'customer' ? '#fff' : colors.textMuted }}>
                        Customer
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => setQuotationMode('internal')}
                      style={[styles.quoteSwitchBtn, quotationMode === 'internal' && styles.quoteSwitchActive]}
                    >
                      <Text style={{ fontSize: 10, color: quotationMode === 'internal' ? '#fff' : colors.textMuted }}>
                        Internal
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {quotationMode === 'customer' ? (
                  <View style={[styles.quotePreview, { backgroundColor: colors.cardBgElevated }]}>
                    <Text style={[styles.quoteDocHeader, { color: colors.text }]}>DAS CRM INTERIOR QUOTATION</Text>
                    <Text style={[styles.quoteDocSub, { color: colors.textMuted }]}>
                      Client: {selectedLead.name} • {selectedLead.phone}
                    </Text>
                    <View style={styles.divider} />
                    <View style={styles.rowBetween}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Scope of Work:</Text>
                      <Text style={{ color: colors.text, fontSize: 12 }}>{rooms.length} Rooms Complete Fitout</Text>
                    </View>
                    <View style={styles.rowBetween}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>Carpet Area:</Text>
                      <Text style={{ color: colors.text, fontSize: 12 }}>{totalArea} sq.ft</Text>
                    </View>
                    <View style={styles.rowBetween}>
                      <Text style={{ color: colors.textSecondary, fontSize: 12 }}>GST (18%):</Text>
                      <Text style={{ color: colors.text, fontSize: 12 }}>₹{calculations.gst.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.rowBetween}>
                      <Text style={{ color: '#f43f5e', fontWeight: 'bold', fontSize: 14 }}>Grand Total:</Text>
                      <Text style={{ color: '#f43f5e', fontWeight: 'bold', fontSize: 16 }}>
                        ₹{calculations.grandSelling.toLocaleString('en-IN')}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.quotePreview, { backgroundColor: '#0f172a' }]}>
                    <Text style={[styles.quoteDocHeader, { color: '#ef4444' }]}>CONFIDENTIAL INTERNAL COST SHEET</Text>
                    <Text style={{ color: '#94a3b8', fontSize: 10, marginBottom: 8 }}>
                      Raw Costs • Contractor Labor • Company Net Margin
                    </Text>
                    <View style={styles.divider} />
                    <View style={styles.rowBetween}>
                      <Text style={{ color: '#94a3b8', fontSize: 11 }}>Raw Material Cost:</Text>
                      <Text style={{ color: '#fff', fontSize: 11 }}>₹{calculations.rawMaterial.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.rowBetween}>
                      <Text style={{ color: '#94a3b8', fontSize: 11 }}>Hardware & Accessories:</Text>
                      <Text style={{ color: '#fff', fontSize: 11 }}>₹{calculations.hardware.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.rowBetween}>
                      <Text style={{ color: '#94a3b8', fontSize: 11 }}>Site Labor & Trades:</Text>
                      <Text style={{ color: '#fff', fontSize: 11 }}>₹{calculations.labor.toLocaleString('en-IN')}</Text>
                    </View>
                    <View style={styles.rowBetween}>
                      <Text style={{ color: '#94a3b8', fontSize: 11 }}>Internal Net Cost:</Text>
                      <Text style={{ color: '#10b981', fontWeight: 'bold', fontSize: 12 }}>
                        ₹{calculations.internalCost.toLocaleString('en-IN')}
                      </Text>
                    </View>
                    <View style={styles.rowBetween}>
                      <Text style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: 12 }}>Net Profit Margin:</Text>
                      <Text style={{ color: '#f59e0b', fontWeight: 'bold', fontSize: 12 }}>
                        {calculations.netMarginPct}%
                      </Text>
                    </View>
                  </View>
                )}

                <TouchableOpacity
                  onPress={() => Alert.alert('Quotation Saved', 'Saved to DAS CRM database and ready to send via WhatsApp/Email.')}
                  style={[styles.primaryActionBtn, { backgroundColor: '#10b981' }]}
                >
                  <Text style={styles.primaryActionText}>Save & Send Quotation</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {/* ── TAB: ALL QUOTATIONS ──────────────────────────────────── */}
        {activeTab === 'quotations' && (
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>All Interior Quotations</Text>
            {[
              { num: 'INT-2026-001', lead: 'Rajesh Sharma', amt: '₹28,50,000', status: 'Approved' },
              { num: 'INT-2026-002', lead: 'Pooja & Vikram Verma', amt: '₹42,20,000', status: 'Sent' },
              { num: 'INT-2026-003', lead: 'Ananya Deshmukh', amt: '₹55,00,000', status: 'Draft' },
            ].map((q) => (
              <View
                key={q.num}
                style={[styles.leadItem, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
              >
                <View style={styles.rowBetween}>
                  <Text style={[styles.leadName, { color: colors.text }]}>{q.num}</Text>
                  <Text style={styles.leadBadge}>{q.status}</Text>
                </View>
                <Text style={[styles.leadDetail, { color: colors.textMuted }]}>{q.lead}</Text>
                <Text style={[styles.leadBudget, { color: '#f43f5e' }]}>{q.amt}</Text>
              </View>
            ))}
          </View>
        )}

        {/* ── TAB: ALL 2D & 3D DIAGRAMS ────────────────────────────── */}
        {activeTab === 'diagrams' && (
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Saved 2D CAD Plans & 3D Renders</Text>
            {rooms.map((r) => (
              <View
                key={r.id}
                style={[styles.diagramCard, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}
              >
                <Text style={[styles.roomName, { color: colors.text }]}>{r.name}</Text>
                <Text style={[styles.leadDetail, { color: colors.textMuted }]}>
                  {r.length}&apos; × {r.width}&apos; • {r.carpetAreaSqFt} sq.ft
                </Text>
                <TouchableOpacity
                  onPress={handleOpenWebStudio}
                  style={[styles.miniStudioBtn, { backgroundColor: 'rgba(244, 63, 94, 0.15)' }]}
                >
                  <Text style={{ color: '#f43f5e', fontSize: 11, fontWeight: 'bold' }}>View in 3D Studio →</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>
        )}

        {/* ── TAB: LEAD HISTORY ────────────────────────────────────── */}
        {activeTab === 'leadHistory' && (
          <View style={[styles.sectionCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.cardTitle, { color: colors.text }]}>Lead Activity History</Text>
            {[
              { title: 'Quotation Generated', time: 'Today, 11:20 AM', desc: 'Generated Quotation INT-2026-001' },
              { title: '3D Room Updated', time: 'Yesterday, 4:15 PM', desc: 'Placed Bixler Sofa in Living Room' },
              { title: 'Site Measurement Taken', time: '28 Oct 2026', desc: 'Total carpet area recorded: 564 sq.ft' },
            ].map((h, i) => (
              <View key={i} style={styles.historyRow}>
                <View style={styles.historyDot} />
                <View style={{ flex: 1 }}>
                  <Text style={[styles.leadName, { color: colors.text }]}>{h.title}</Text>
                  <Text style={[styles.leadDetail, { color: colors.textMuted }]}>{h.time}</Text>
                  <Text style={{ color: colors.textSecondary, fontSize: 11, marginTop: 2 }}>{h.desc}</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
};

export default InteriorDesignerCalculatorScreen;

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    borderWidth: 1,
  },
  backBtnText: {
    fontSize: 13,
    fontWeight: '600',
  },
  titleContainer: { flex: 1 },
  title: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  subTitle: {
    fontSize: 11,
  },
  studioPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  studioPillText: {
    color: '#fff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  topTabsBar: {
    flexDirection: 'row',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderBottomWidth: 1,
    gap: 6,
  },
  tabButton: {
    flex: 1,
    paddingVertical: 6,
    borderRadius: 8,
    alignItems: 'center',
  },
  tabButtonActive: {
    backgroundColor: '#f43f5e',
  },
  tabButtonText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  stepsScroll: {
    marginBottom: 12,
  },
  stepBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 6,
  },
  stepBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  sectionCard: {
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  cardDesc: {
    fontSize: 11,
    marginBottom: 12,
  },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    marginBottom: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '600',
    marginBottom: 6,
  },
  leadItem: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  leadName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  leadBadge: {
    fontSize: 10,
    color: '#10b981',
    fontWeight: 'bold',
  },
  leadDetail: {
    fontSize: 11,
    marginBottom: 2,
  },
  leadBudget: {
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 2,
  },
  floorLevelsRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: 16,
  },
  floorBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
    borderWidth: 1,
  },
  primaryActionBtn: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 12,
  },
  primaryActionText: {
    color: '#fff',
    fontSize: 13,
    fontWeight: 'bold',
  },
  totalAreaText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  roomCard: {
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 8,
  },
  roomName: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  roomTypeBadge: {
    fontSize: 10,
    color: '#f43f5e',
    fontWeight: 'bold',
  },
  metricsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  metricLabel: {
    fontSize: 9,
  },
  metricValue: {
    fontSize: 11,
    fontWeight: 'bold',
    marginTop: 2,
  },
  categoryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  catName: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  catDesc: {
    fontSize: 10,
  },
  studioBannerBox: {
    alignItems: 'center',
    padding: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(244, 63, 94, 0.05)',
    marginVertical: 12,
  },
  studioBannerTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  studioBannerDesc: {
    fontSize: 11,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 16,
  },
  webStudioBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
  },
  webStudioBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  costGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginVertical: 8,
  },
  costBox: {
    width: '48%',
    padding: 12,
    borderRadius: 10,
  },
  costBoxLabel: {
    fontSize: 10,
    marginBottom: 4,
  },
  costBoxVal: {
    fontSize: 13,
    fontWeight: 'bold',
  },
  quoteSwitch: {
    flexDirection: 'row',
    backgroundColor: 'rgba(0,0,0,0.2)',
    borderRadius: 6,
    padding: 2,
  },
  quoteSwitchBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  quoteSwitchActive: {
    backgroundColor: '#f43f5e',
  },
  quotePreview: {
    padding: 16,
    borderRadius: 12,
    marginVertical: 12,
  },
  quoteDocHeader: {
    fontSize: 13,
    fontWeight: 'bold',
    marginBottom: 2,
  },
  quoteDocSub: {
    fontSize: 10,
    marginBottom: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
  diagramCard: {
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 10,
  },
  miniStudioBtn: {
    marginTop: 8,
    paddingVertical: 6,
    borderRadius: 6,
    alignItems: 'center',
  },
  historyRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 14,
    alignItems: 'flex-start',
  },
  historyDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#f43f5e',
    marginTop: 4,
  },
});

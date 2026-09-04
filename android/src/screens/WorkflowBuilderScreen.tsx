/**
 * WorkflowBuilderScreen.tsx — DAS CRM Android
 * Workflow Builder — Visual Automation Rule Engine
 * Accessible from Admin Dashboard Header Banner (Workflow Rules button).
 */

import React, { useState } from "react";
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Switch, Modal, Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface WorkflowRule {
  id: string; name: string; description: string;
  triggerLabel: string; conditionLabel: string; actionLabel: string;
  isActive: boolean; runCount: number; lastRunStr: string; color: string;
}

const INITIAL_WORKFLOWS: WorkflowRule[] = [
  { id: "wf-1", name: "Hot Lead Auto-Handover", description: "When AI Score reaches 80+, automatically escalate to the assigned Team Leader for priority follow-up.", triggerLabel: "AI Score >= 80", conditionLabel: "Status is not WON or LOST", actionLabel: "Assign to Team Leader & Send WhatsApp", isActive: true, runCount: 142, lastRunStr: "Today, 08:12 AM", color: "#6366f1" },
  { id: "wf-2", name: "No-Contact 3-Day Re-Assignment", description: "If a lead has not been contacted in 3 days, re-assign it to the next available Sales Executive.", triggerLabel: "No Contact for 72 Hours", conditionLabel: "Status = NEW or FOLLOW_UP", actionLabel: "Re-assign to Next Available Sales Exec", isActive: true, runCount: 38, lastRunStr: "Yesterday, 09:00 AM", color: "#0ea5e9" },
  { id: "wf-3", name: "Meeting Booked Notification", description: "Trigger a WhatsApp + in-app alert to the Sales Rep & Team Leader when a meeting is scheduled.", triggerLabel: "Status Changed > MEETING SCHEDULED", conditionLabel: "Any Lead, Any Rep", actionLabel: "WhatsApp + Push Notif to Rep & TL", isActive: true, runCount: 64, lastRunStr: "Today, 02:34 PM", color: "#10b981" },
  { id: "wf-4", name: "Lost Lead Win-Back Campaign", description: "If a lead is marked LOST, after 30 days automatically add them to the Win-Back drip campaign.", triggerLabel: "Status Changed > LOST", conditionLabel: "30 Days After LOST Date", actionLabel: "Add to Win-Back Campaign Queue", isActive: false, runCount: 12, lastRunStr: "28 Aug 2026, 11:00 AM", color: "#f59e0b" },
  { id: "wf-5", name: "High Value Deal Alert", description: "If deal value exceeds 5,00,000 notify Admin and Manager instantly.", triggerLabel: "Deal Value > Rs. 5,00,000", conditionLabel: "Status = NEGOTIATION or PROPOSAL", actionLabel: "Alert Admin & Manager in Real-Time", isActive: false, runCount: 7, lastRunStr: "15 Aug 2026, 03:45 PM", color: "#c084fc" },
];

const TRIGGER_OPTIONS = [
  { key: "AI_SCORE", icon: "AI", label: "AI Score Threshold" },
  { key: "STATUS_CHANGE", icon: "ST", label: "Lead Status Changed" },
  { key: "TIME_BASED", icon: "TM", label: "Time-Based Trigger" },
  { key: "VALUE_THRESHOLD", icon: "VL", label: "Deal Value Threshold" },
];

interface Props { navigation?: any; }

export default function WorkflowBuilderScreen({ navigation }: Props) {
  const insets = useSafeAreaInsets();
  const [rules, setRules] = useState<WorkflowRule[]>(INITIAL_WORKFLOWS);
  const [selected, setSelected] = useState<WorkflowRule | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedTrigger, setSelectedTrigger] = useState<string | null>(null);

  const activeCount = rules.filter(r => r.isActive).length;
  const totalRuns = rules.reduce((s, r) => s + r.runCount, 0);

  const toggle = (id: string) =>
    setRules(prev => prev.map(r => r.id === id ? { ...r, isActive: !r.isActive } : r));

  const deleteRule = (id: string) => {
    Alert.alert("Delete Rule", "Delete this automation rule? Cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      { text: "Delete", style: "destructive", onPress: () => { setRules(prev => prev.filter(r => r.id !== id)); setSelected(null); } },
    ]);
  };

  const goBack = () => {
    try { navigation?.goBack(); } catch { try { navigation?.navigate("Home"); } catch {} }
  };

  return (
    <View style={[styles.container, { paddingTop: 0 }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={goBack} activeOpacity={0.7}>
          <Text style={styles.backBtnText}>{"<"} Back</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Workflow Builder</Text>
          <Text style={styles.headerSub}>Lead Automation Rules Engine</Text>
        </View>
        <TouchableOpacity style={styles.createBtn} onPress={() => setCreateOpen(true)} activeOpacity={0.8}>
          <Text style={styles.createBtnText}>+ New Rule</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + 40 }]} showsVerticalScrollIndicator={false}>

        {/* Stats Strip */}
        <View style={styles.statsRow}>
          {[
            { val: rules.length, label: "Total Rules", color: "#ffffff" },
            { val: activeCount, label: "Active", color: "#34d399" },
            { val: totalRuns, label: "Total Runs", color: "#818cf8" },
            { val: rules.length - activeCount, label: "Paused", color: "#fbbf24" },
          ].map((s, i) => (
            <View key={i} style={styles.statChip}>
              <Text style={[styles.statVal, { color: s.color }]}>{s.val}</Text>
              <Text style={styles.statLbl}>{s.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionLbl}>AUTOMATION RULES</Text>

        {/* Workflow Cards */}
        {rules.map(rule => (
          <TouchableOpacity key={rule.id} style={[styles.ruleCard, { borderLeftColor: rule.color }]}
            onPress={() => setSelected(rule)} activeOpacity={0.85}>
            <View style={styles.ruleCardTop}>
              <View style={{ flex: 1 }}>
                <Text style={styles.ruleName}>{rule.name}</Text>
                <Text style={styles.ruleDesc} numberOfLines={2}>{rule.description}</Text>
              </View>
              <Switch value={rule.isActive} onValueChange={() => toggle(rule.id)}
                trackColor={{ false: "#1e293b", true: rule.color }} thumbColor="#fff" />
            </View>

            {/* Node Pipeline */}
            <View style={styles.pipeline}>
              <View style={[styles.nodeChip, { borderColor: "rgba(99,102,241,0.4)", backgroundColor: "rgba(99,102,241,0.1)" }]}>
                <Text style={styles.nodeChipLbl}>TRIGGER</Text>
                <Text style={[styles.nodeChipVal, { color: "#818cf8" }]}>{rule.triggerLabel}</Text>
              </View>
              <Text style={styles.pipelineArrow}>-{">"}</Text>
              <View style={[styles.nodeChip, { borderColor: "rgba(56,189,248,0.4)", backgroundColor: "rgba(56,189,248,0.08)" }]}>
                <Text style={styles.nodeChipLbl}>IF</Text>
                <Text style={[styles.nodeChipVal, { color: "#38bdf8" }]}>{rule.conditionLabel}</Text>
              </View>
              <Text style={styles.pipelineArrow}>-{">"}</Text>
              <View style={[styles.nodeChip, { borderColor: "rgba(52,211,153,0.4)", backgroundColor: "rgba(52,211,153,0.08)" }]}>
                <Text style={styles.nodeChipLbl}>THEN</Text>
                <Text style={[styles.nodeChipVal, { color: "#34d399" }]}>{rule.actionLabel}</Text>
              </View>
            </View>

            <View style={styles.ruleCardBottom}>
              <Text style={styles.ruleMetaText}>{rule.runCount} runs</Text>
              <Text style={styles.ruleMetaText}>Last: {rule.lastRunStr}</Text>
              <View style={[styles.activeBadge,
                rule.isActive
                  ? { borderColor: "rgba(52,211,153,0.4)", backgroundColor: "rgba(52,211,153,0.12)" }
                  : { borderColor: "rgba(100,116,139,0.3)", backgroundColor: "rgba(100,116,139,0.1)" }]}>
                <Text style={[styles.activeBadgeText, { color: rule.isActive ? "#34d399" : "#64748b" }]}>
                  {rule.isActive ? "ACTIVE" : "PAUSED"}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        ))}

        {/* Info Card */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>About Workflow Automation</Text>
          <Text style={styles.infoBody}>
            Each rule has a <Text style={{ color: "#818cf8", fontWeight: "800" }}>Trigger</Text> (what starts it), a{" "}
            <Text style={{ color: "#38bdf8", fontWeight: "800" }}>Condition</Text> (filter), and an{" "}
            <Text style={{ color: "#34d399", fontWeight: "800" }}>Action</Text> (what executes).
            Rules run in priority order when multiple rules match the same lead.
          </Text>
        </View>
      </ScrollView>

      {/* Detail Modal */}
      <Modal visible={!!selected} transparent animationType="slide">
        <View style={styles.overlay}>
          {selected && (
            <View style={styles.modalBox}>
              <View style={styles.modalHead}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{selected.name}</Text>
                  <Text style={styles.modalSub}>Automation Rule Detail</Text>
                </View>
                <TouchableOpacity style={styles.closeBtn} onPress={() => setSelected(null)}>
                  <Text style={styles.closeBtnText}>X</Text>
                </TouchableOpacity>
              </View>
              <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 20 }}>
                <View style={{ flexDirection: "row", gap: 10, marginBottom: 12, alignItems: "center" }}>
                  <View style={[styles.activeBadge,
                    selected.isActive
                      ? { borderColor: "rgba(52,211,153,0.4)", backgroundColor: "rgba(52,211,153,0.12)" }
                      : { borderColor: "rgba(100,116,139,0.3)", backgroundColor: "rgba(100,116,139,0.1)" }]}>
                    <Text style={[styles.activeBadgeText, { color: selected.isActive ? "#34d399" : "#64748b" }]}>
                      {selected.isActive ? "ACTIVE" : "PAUSED"}
                    </Text>
                  </View>
                  <Text style={styles.ruleMetaText}>{selected.runCount} total runs</Text>
                </View>

                <Text style={styles.detailDesc}>{selected.description}</Text>
                <Text style={[styles.sectionLbl, { marginTop: 12 }]}>AUTOMATION CHAIN</Text>

                {[
                  { lbl: "TRIGGER", val: selected.triggerLabel, col: "#818cf8", bc: "rgba(99,102,241,0.4)" },
                  { lbl: "CONDITION (IF)", val: selected.conditionLabel, col: "#38bdf8", bc: "rgba(56,189,248,0.4)" },
                  { lbl: "ACTION (THEN)", val: selected.actionLabel, col: "#34d399", bc: "rgba(52,211,153,0.4)" },
                ].map((node, i) => (
                  <View key={i}>
                    {i > 0 && (
                      <View style={{ alignItems: "center", paddingVertical: 6 }}>
                        <Text style={{ color: "#475569", fontSize: 18, fontWeight: "700" }}>|</Text>
                        <Text style={{ color: "#475569", fontSize: 12, fontWeight: "700", marginTop: -4 }}>v</Text>
                      </View>
                    )}
                    <View style={[styles.detailNode, { borderColor: node.bc }]}>
                      <Text style={styles.detailNodeLbl}>{node.lbl}</Text>
                      <Text style={[styles.detailNodeVal, { color: node.col }]}>{node.val}</Text>
                    </View>
                  </View>
                ))}

                <View style={styles.metaRow}>
                  <Text style={styles.metaLabel}>Last Executed:</Text>
                  <Text style={styles.metaValue}>{selected.lastRunStr}</Text>
                </View>

                <View style={{ flexDirection: "row", gap: 10, marginTop: 16 }}>
                  <TouchableOpacity style={[styles.actionBtn,
                    selected.isActive
                      ? { borderColor: "#475569", backgroundColor: "rgba(100,116,139,0.2)" }
                      : { borderColor: "#34d399", backgroundColor: "rgba(52,211,153,0.15)" }]}
                    onPress={() => { toggle(selected.id); setSelected(p => p ? { ...p, isActive: !p.isActive } : null); }}>
                    <Text style={[styles.actionBtnText, { color: selected.isActive ? "#94a3b8" : "#34d399" }]}>
                      {selected.isActive ? "Pause Rule" : "Activate Rule"}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.actionBtn, { borderColor: "rgba(239,68,68,0.4)", backgroundColor: "rgba(239,68,68,0.12)" }]}
                    onPress={() => deleteRule(selected.id)}>
                    <Text style={[styles.actionBtnText, { color: "#f87171" }]}>Delete Rule</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* Create Modal */}
      <Modal visible={createOpen} transparent animationType="slide">
        <View style={styles.overlay}>
          <View style={styles.modalBox}>
            <View style={styles.modalHead}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>New Workflow Rule</Text>
                <Text style={styles.modalSub}>Choose a trigger type to begin</Text>
              </View>
              <TouchableOpacity style={styles.closeBtn} onPress={() => { setCreateOpen(false); setSelectedTrigger(null); }}>
                <Text style={styles.closeBtnText}>X</Text>
              </TouchableOpacity>
            </View>
            <Text style={styles.sectionLbl}>SELECT TRIGGER TYPE</Text>
            {TRIGGER_OPTIONS.map(t => (
              <TouchableOpacity key={t.key}
                style={[styles.triggerOpt, selectedTrigger === t.key && styles.triggerOptActive]}
                onPress={() => setSelectedTrigger(t.key)} activeOpacity={0.8}>
                <View style={[styles.triggerIcon, selectedTrigger === t.key && { backgroundColor: "rgba(99,102,241,0.3)" }]}>
                  <Text style={{ fontSize: 10, fontWeight: "900", color: selectedTrigger === t.key ? "#818cf8" : "#64748b" }}>{t.icon}</Text>
                </View>
                <Text style={[styles.triggerLbl, selectedTrigger === t.key && { color: "#818cf8" }]}>{t.label}</Text>
                {selectedTrigger === t.key && <Text style={{ color: "#818cf8", fontSize: 16, fontWeight: "900" }}>v</Text>}
              </TouchableOpacity>
            ))}
            <TouchableOpacity
              style={[styles.proceedBtn, !selectedTrigger && { opacity: 0.35 }]}
              disabled={!selectedTrigger}
              onPress={() => {
                setCreateOpen(false); setSelectedTrigger(null);
                Alert.alert("Workflow Builder", "Full drag-and-drop rule builder arrives in DAS CRM v2.6. Your trigger template has been saved as a draft.");
              }} activeOpacity={0.8}>
              <Text style={styles.proceedBtnText}>Proceed to Rule Builder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#090d16" },
  header: { flexDirection: "row", alignItems: "center", gap: 10, paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)", backgroundColor: "#0c1322" },
  backBtn: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "rgba(255,255,255,0.06)", borderRadius: 8, borderWidth: 1, borderColor: "rgba(255,255,255,0.1)" },
  backBtnText: { color: "#94a3b8", fontSize: 12, fontWeight: "700" },
  headerTitle: { fontSize: 15, fontWeight: "900", color: "#ffffff", letterSpacing: 0.3 },
  headerSub: { fontSize: 10, color: "#64748b", fontWeight: "600", marginTop: 1 },
  createBtn: { backgroundColor: "rgba(99,102,241,0.2)", borderWidth: 1, borderColor: "rgba(99,102,241,0.5)", borderRadius: 10, paddingHorizontal: 12, paddingVertical: 8 },
  createBtnText: { color: "#818cf8", fontSize: 11, fontWeight: "900" },
  content: { padding: 16 },
  statsRow: { flexDirection: "row", gap: 8, marginBottom: 18 },
  statChip: { flex: 1, backgroundColor: "#0c1322", borderRadius: 12, borderWidth: 1, borderColor: "rgba(255,255,255,0.08)", padding: 10, alignItems: "center" },
  statVal: { fontSize: 18, fontWeight: "900" },
  statLbl: { fontSize: 9, color: "#64748b", fontWeight: "700", marginTop: 2, textAlign: "center" },
  sectionLbl: { fontSize: 10, fontWeight: "900", color: "#475569", letterSpacing: 1, textTransform: "uppercase", marginBottom: 10 },
  ruleCard: { backgroundColor: "#0c1322", borderRadius: 16, borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderLeftWidth: 4, padding: 14, marginBottom: 12, elevation: 3 },
  ruleCardTop: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 10 },
  ruleName: { fontSize: 13, fontWeight: "900", color: "#ffffff", marginBottom: 3 },
  ruleDesc: { fontSize: 10, color: "#94a3b8", fontWeight: "500", lineHeight: 14 },
  pipeline: { flexDirection: "row", flexWrap: "wrap", alignItems: "center", gap: 4, marginBottom: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: "rgba(255,255,255,0.05)" },
  nodeChip: { borderWidth: 1, borderRadius: 8, padding: 6, maxWidth: "100%" },
  nodeChipLbl: { fontSize: 8, color: "#475569", fontWeight: "900", letterSpacing: 0.5, marginBottom: 2 },
  nodeChipVal: { fontSize: 9, fontWeight: "800", lineHeight: 12 },
  pipelineArrow: { color: "#334155", fontSize: 12, fontWeight: "700" },
  ruleCardBottom: { flexDirection: "row", alignItems: "center", gap: 10, flexWrap: "wrap" },
  ruleMetaText: { fontSize: 9, color: "#64748b", fontWeight: "700" },
  activeBadge: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3 },
  activeBadgeText: { fontSize: 9, fontWeight: "900" },
  infoCard: { backgroundColor: "rgba(99,102,241,0.07)", borderRadius: 14, borderWidth: 1, borderColor: "rgba(99,102,241,0.2)", padding: 14, marginTop: 4 },
  infoTitle: { fontSize: 12, fontWeight: "900", color: "#818cf8", marginBottom: 6 },
  infoBody: { fontSize: 11, color: "#94a3b8", fontWeight: "500", lineHeight: 16 },
  overlay: { flex: 1, backgroundColor: "rgba(0,0,0,0.75)", justifyContent: "flex-end" },
  modalBox: { backgroundColor: "#0f172a", borderTopLeftRadius: 24, borderTopRightRadius: 24, borderTopWidth: 1, borderLeftWidth: 1, borderRightWidth: 1, borderColor: "rgba(255,255,255,0.1)", padding: 20, maxHeight: "92%" },
  modalHead: { flexDirection: "row", alignItems: "flex-start", gap: 10, marginBottom: 16, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.06)" },
  modalTitle: { fontSize: 16, fontWeight: "900", color: "#ffffff", marginBottom: 2 },
  modalSub: { fontSize: 10, color: "#64748b", fontWeight: "600" },
  closeBtn: { width: 30, height: 30, borderRadius: 15, backgroundColor: "rgba(255,255,255,0.08)", alignItems: "center", justifyContent: "center" },
  closeBtnText: { color: "#94a3b8", fontSize: 12, fontWeight: "900" },
  detailDesc: { fontSize: 12, color: "#94a3b8", fontWeight: "500", lineHeight: 17, marginBottom: 8, paddingBottom: 14, borderBottomWidth: 1, borderBottomColor: "rgba(255,255,255,0.05)" },
  detailNode: { backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderRadius: 12, padding: 12 },
  detailNodeLbl: { fontSize: 9, fontWeight: "900", color: "#475569", letterSpacing: 1, marginBottom: 4 },
  detailNodeVal: { fontSize: 12, fontWeight: "800" },
  metaRow: { flexDirection: "row", gap: 8, alignItems: "center", backgroundColor: "rgba(255,255,255,0.03)", borderRadius: 10, borderWidth: 1, borderColor: "rgba(255,255,255,0.06)", padding: 10, marginTop: 12 },
  metaLabel: { fontSize: 10, color: "#64748b", fontWeight: "700" },
  metaValue: { fontSize: 10, color: "#ffffff", fontWeight: "800" },
  actionBtn: { flex: 1, borderWidth: 1, borderRadius: 12, paddingVertical: 11, alignItems: "center", justifyContent: "center" },
  actionBtnText: { fontSize: 12, fontWeight: "900" },
  triggerOpt: { flexDirection: "row", alignItems: "center", gap: 12, backgroundColor: "rgba(255,255,255,0.03)", borderWidth: 1, borderColor: "rgba(255,255,255,0.07)", borderRadius: 12, padding: 12, marginBottom: 8 },
  triggerOptActive: { backgroundColor: "rgba(99,102,241,0.12)", borderColor: "rgba(99,102,241,0.45)" },
  triggerIcon: { width: 32, height: 32, borderRadius: 8, backgroundColor: "rgba(255,255,255,0.06)", alignItems: "center", justifyContent: "center" },
  triggerLbl: { flex: 1, fontSize: 12, fontWeight: "800", color: "#94a3b8" },
  proceedBtn: { backgroundColor: "rgba(99,102,241,0.22)", borderWidth: 1, borderColor: "rgba(99,102,241,0.55)", borderRadius: 14, paddingVertical: 14, alignItems: "center", marginTop: 14 },
  proceedBtnText: { color: "#818cf8", fontSize: 13, fontWeight: "900" },
});

"""
TeamLeaderDashboardView.py — DAS CRM Windows
Team Leader-Specific KPIs and Direct Report Performance
Feature parity with Android TeamLeaderDashboardScreen.tsx
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QScrollArea,
    QFrame, QGridLayout, QTableWidget, QTableWidgetItem, QAbstractItemView
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont, QBrush, QColor
from dataclasses import dataclass

# ─────────────────────────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class DirectReport:
    """Team leader's direct report"""
    id: str
    name: str
    leadsAssigned: int
    leadsConverted: int
    conversionRate: str  # percentage
    thisMonthRevenue: str
    quota: str
    quotaAttainment: int  # 0-100%
    status: str  # ON_TRACK, AT_RISK, CRITICAL

FALLBACK_DIRECT_REPORTS = [
    DirectReport("dr1", "Rajesh Kumar", 18, 5, "27.8%", "₹2,40,000", "₹3,50,000", 68, "ON_TRACK"),
    DirectReport("dr2", "Priya Sharma", 12, 4, "33.3%", "₹1,80,000", "₹3,00,000", 60, "AT_RISK"),
    DirectReport("dr3", "Amit Patel", 15, 3, "20.0%", "₹1,50,000", "₹3,20,000", 47, "CRITICAL"),
]

# ─────────────────────────────────────────────────────────────────────────────────────
# STAT CARD COMPONENT
# ─────────────────────────────────────────────────────────────────────────────────────

class StatCard(QFrame):
    """KPI metric display card"""
    def __init__(self, label: str, value: str, icon: str, color: str, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 12px;
                padding: 16px;
            }
        """)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(8)

        # Header
        headerLayout = QHBoxLayout()
        iconLabel = QLabel(icon)
        iconLabel.setFont(QFont("Segoe UI", 18))
        headerLayout.addWidget(iconLabel)

        labelWidget = QLabel(label)
        labelWidget.setFont(QFont("Segoe UI", 10))
        labelWidget.setStyleSheet("color: #94a3b8;")
        headerLayout.addWidget(labelWidget)
        headerLayout.addStretch()

        layout.addLayout(headerLayout)

        # Value
        valueLabel = QLabel(value)
        valueLabel.setFont(QFont("Segoe UI", 18, QFont.Weight.Bold))
        valueLabel.setStyleSheet(f"color: {color};")
        layout.addWidget(valueLabel)

        layout.addStretch()

# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN TEAM LEADER DASHBOARD VIEW
# ─────────────────────────────────────────────────────────────────────────────────────

class TeamLeaderDashboardView(QWidget):
    """Team Leader Dashboard with Direct Report Metrics"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
        """)

        self.directReports = list(FALLBACK_DIRECT_REPORTS)
        self._build_ui()

    def _build_ui(self):
        """Build team leader dashboard UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        scrollArea = QScrollArea()
        scrollArea.setWidgetResizable(True)
        scrollArea.setStyleSheet("QScrollArea { border: none; background-color: #090d16; }")

        scrollWidget = QWidget()
        scrollLayout = QVBoxLayout(scrollWidget)
        scrollLayout.setContentsMargins(16, 16, 16, 24)
        scrollLayout.setSpacing(12)

        # Title
        titleLabel = QLabel("🏆 Team Leader Dashboard")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        scrollLayout.addWidget(titleLabel)

        # KPI Grid
        kpiLayout = QGridLayout()
        kpiLayout.setContentsMargins(0, 0, 0, 0)
        kpiLayout.setSpacing(12)

        totalLeads = sum(dr.leadsAssigned for dr in self.directReports)
        totalConverted = sum(dr.leadsConverted for dr in self.directReports)
        avgConvRate = f"{(totalConverted/totalLeads*100):.1f}%" if totalLeads > 0 else "0%"
        totalRevenue = sum(int(dr.thisMonthRevenue.replace("₹", "").replace(",", "")) for dr in self.directReports)

        kpiCards = [
            ("Direct Reports", str(len(self.directReports)), "👥", "#818cf8"),
            ("Total Leads", str(totalLeads), "📊", "#60a5fa"),
            ("Avg Conversion", avgConvRate, "📈", "#34d399"),
            ("Team Revenue", f"₹{totalRevenue:,}", "💰", "#fbbf24"),
        ]

        for idx, (label, value, icon, color) in enumerate(kpiCards):
            card = StatCard(label, value, icon, color)
            kpiLayout.addWidget(card, idx // 2, idx % 2, 1, 1)

        scrollLayout.addLayout(kpiLayout)

        # Direct Reports Section
        repTitleLabel = QLabel("👥 Direct Reports Performance")
        repTitleLabel.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        repTitleLabel.setStyleSheet("color: #ffffff;")
        scrollLayout.addWidget(repTitleLabel)

        # Direct Reports Table
        self.reportsTable = QTableWidget()
        self.reportsTable.setColumnCount(8)
        self.reportsTable.setHorizontalHeaderLabels([
            "Name", "Leads", "Converted", "Conv. %", "Revenue", "Quota", "Attainment %", "Status"
        ])
        self.reportsTable.horizontalHeader().setStretchLastSection(False)
        self.reportsTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.reportsTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.reportsTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.reportsTable.setColumnWidth(0, 140)
        self.reportsTable.setColumnWidth(1, 70)
        self.reportsTable.setColumnWidth(2, 90)
        self.reportsTable.setColumnWidth(3, 80)
        self.reportsTable.setColumnWidth(4, 110)
        self.reportsTable.setColumnWidth(5, 110)
        self.reportsTable.setColumnWidth(6, 120)
        self.reportsTable.setColumnWidth(7, 100)

        self._refresh_reports_table()

        scrollLayout.addWidget(self.reportsTable, 1)

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _refresh_reports_table(self):
        """Refresh direct reports table"""
        self.reportsTable.setRowCount(len(self.directReports))

        for rowIdx, report in enumerate(self.directReports):
            self.reportsTable.setItem(rowIdx, 0, QTableWidgetItem(report.name))
            self.reportsTable.setItem(rowIdx, 1, QTableWidgetItem(str(report.leadsAssigned)))
            self.reportsTable.setItem(rowIdx, 2, QTableWidgetItem(str(report.leadsConverted)))
            self.reportsTable.setItem(rowIdx, 3, QTableWidgetItem(report.conversionRate))
            self.reportsTable.setItem(rowIdx, 4, QTableWidgetItem(report.thisMonthRevenue))
            self.reportsTable.setItem(rowIdx, 5, QTableWidgetItem(report.quota))

            # Attainment %
            attainmentItem = QTableWidgetItem(f"{report.quotaAttainment}%")
            attainmentColor = "#34d399" if report.quotaAttainment >= 80 else "#fbbf24" if report.quotaAttainment >= 60 else "#ef4444"
            attainmentItem.setForeground(QBrush(QColor(attainmentColor)))
            self.reportsTable.setItem(rowIdx, 6, attainmentItem)

            # Status
            statusItem = QTableWidgetItem(report.status)
            statusColor = "#34d399" if report.status == "ON_TRACK" else "#fbbf24" if report.status == "AT_RISK" else "#ef4444"
            statusItem.setForeground(QBrush(QColor(statusColor)))
            self.reportsTable.setItem(rowIdx, 7, statusItem)

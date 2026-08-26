"""
ManagerDashboardView.py — DAS CRM Windows
Manager-Specific KPIs, Team Performance, and Subordinate Metrics
Feature parity with Android ManagerDashboardScreen.tsx
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
class StatMetric:
    """KPI metric card"""
    label: str
    value: str
    icon: str
    trend: str  # UP, DOWN, STABLE
    color: str

@dataclass
class TeamMemberPerformance:
    """Team member sales performance"""
    id: str
    name: str
    role: str
    leadsAssigned: int
    dealsWon: int
    revenue: str
    targetProgress: int  # 0-100%
    status: str  # ACTIVE, INACTIVE

FALLBACK_TEAM = [
    TeamMemberPerformance("t1", "Rajesh Kumar", "Sales Executive", 24, 8, "₹3,20,000", 85, "ACTIVE"),
    TeamMemberPerformance("t2", "Priya Sharma", "Sales Executive", 18, 6, "₹2,10,000", 70, "ACTIVE"),
    TeamMemberPerformance("t3", "Vikram Mehta", "Senior Sales Rep", 32, 11, "₹4,50,000", 95, "ACTIVE"),
    TeamMemberPerformance("t4", "Sunita Rao", "Sales Executive", 15, 5, "₹1,80,000", 60, "ACTIVE"),
    TeamMemberPerformance("t5", "Amit Patel", "Sales Executive", 22, 7, "₹2,80,000", 75, "ACTIVE"),
]

# ─────────────────────────────────────────────────────────────────────────────────────
# STAT CARD COMPONENT
# ─────────────────────────────────────────────────────────────────────────────────────

class StatCard(QFrame):
    """KPI metric display card"""
    def __init__(self, metric: StatMetric, parent=None):
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

        # Header with icon and label
        headerLayout = QHBoxLayout()
        iconLabel = QLabel(metric.icon)
        iconLabel.setFont(QFont("Segoe UI", 20))
        headerLayout.addWidget(iconLabel)

        labelWidget = QLabel(metric.label)
        labelWidget.setFont(QFont("Segoe UI", 10))
        labelWidget.setStyleSheet("color: #94a3b8;")
        headerLayout.addWidget(labelWidget)

        # Trend indicator
        trendEmoji = "📈" if metric.trend == "UP" else "📉" if metric.trend == "DOWN" else "➡️"
        trendLabel = QLabel(trendEmoji)
        trendLabel.setFont(QFont("Segoe UI", 12))
        headerLayout.addStretch()
        headerLayout.addWidget(trendLabel)

        layout.addLayout(headerLayout)

        # Value
        valueLabel = QLabel(metric.value)
        valueLabel.setFont(QFont("Segoe UI", 18, QFont.Weight.Bold))
        valueLabel.setStyleSheet(f"color: {metric.color};")
        layout.addWidget(valueLabel)

        layout.addStretch()

# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN MANAGER DASHBOARD VIEW
# ─────────────────────────────────────────────────────────────────────────────────────

class ManagerDashboardView(QWidget):
    """Manager Dashboard with Team Performance Metrics"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
        """)

        self.teamMembers = list(FALLBACK_TEAM)
        self._build_ui()

    def _build_ui(self):
        """Build manager dashboard UI"""
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
        titleLabel = QLabel("📊 Manager Dashboard")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        scrollLayout.addWidget(titleLabel)

        # KPI Grid
        kpiLayout = QGridLayout()
        kpiLayout.setContentsMargins(0, 0, 0, 0)
        kpiLayout.setSpacing(12)

        kpiMetrics = [
            StatMetric("Team Sales (This Month)", "₹12,40,000", "💰", "UP", "#34d399"),
            StatMetric("Target Progress", "82%", "🎯", "UP", "#60a5fa"),
            StatMetric("Team Size", "5", "👥", "STABLE", "#818cf8"),
            StatMetric("Avg Deal Value", "₹2,48,000", "📈", "UP", "#fbbf24"),
        ]

        for idx, metric in enumerate(kpiMetrics):
            card = StatCard(metric)
            kpiLayout.addWidget(card, idx // 2, idx % 2, 1, 1)

        scrollLayout.addLayout(kpiLayout)

        # Team Performance Section
        teamTitleLayout = QHBoxLayout()
        teamTitleLabel = QLabel("👥 Team Performance")
        teamTitleLabel.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        teamTitleLabel.setStyleSheet("color: #ffffff;")
        teamTitleLayout.addWidget(teamTitleLabel)

        exportBtn = QPushButton("📥 Export Report")
        exportBtn.setStyleSheet("background-color: #4f46e5; padding: 4px 8px; font-size: 9px;")
        exportBtn.clicked.connect(lambda: None)
        teamTitleLayout.addStretch()
        teamTitleLayout.addWidget(exportBtn)

        scrollLayout.addLayout(teamTitleLayout)

        # Team Performance Table
        self.teamTable = QTableWidget()
        self.teamTable.setColumnCount(7)
        self.teamTable.setHorizontalHeaderLabels([
            "Rep Name", "Role", "Leads", "Deals Won", "Revenue", "Target %", "Status"
        ])
        self.teamTable.horizontalHeader().setStretchLastSection(False)
        self.teamTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.teamTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.teamTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.teamTable.setColumnWidth(0, 130)
        self.teamTable.setColumnWidth(1, 120)
        self.teamTable.setColumnWidth(2, 80)
        self.teamTable.setColumnWidth(3, 100)
        self.teamTable.setColumnWidth(4, 120)
        self.teamTable.setColumnWidth(5, 100)
        self.teamTable.setColumnWidth(6, 80)

        self._refresh_team_table()

        scrollLayout.addWidget(self.teamTable, 1)

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _refresh_team_table(self):
        """Refresh team performance table"""
        self.teamTable.setRowCount(len(self.teamMembers))

        for rowIdx, member in enumerate(self.teamMembers):
            self.teamTable.setItem(rowIdx, 0, QTableWidgetItem(member.name))
            self.teamTable.setItem(rowIdx, 1, QTableWidgetItem(member.role))
            self.teamTable.setItem(rowIdx, 2, QTableWidgetItem(str(member.leadsAssigned)))
            self.teamTable.setItem(rowIdx, 3, QTableWidgetItem(str(member.dealsWon)))
            self.teamTable.setItem(rowIdx, 4, QTableWidgetItem(member.revenue))

            # Target progress bar (visual representation)
            targetItem = QTableWidgetItem(f"{member.targetProgress}%")
            targetColor = "#34d399" if member.targetProgress >= 80 else "#fbbf24" if member.targetProgress >= 60 else "#ef4444"
            targetItem.setForeground(QBrush(QColor(targetColor)))
            self.teamTable.setItem(rowIdx, 5, targetItem)

            statusItem = QTableWidgetItem(member.status)
            statusColor = "#34d399" if member.status == "ACTIVE" else "#ef4444"
            statusItem.setForeground(QBrush(QColor(statusColor)))
            self.teamTable.setItem(rowIdx, 6, statusItem)

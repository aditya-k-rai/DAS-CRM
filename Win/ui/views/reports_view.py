"""
ReportsView.py — DAS CRM Windows
Analytics Dashboard with Charts, Metrics, and KPI Tracking
Feature parity with Android ReportsAnalyticsScreen.tsx
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QScrollArea,
    QFrame, QGridLayout, QComboBox, QDateEdit, QAbstractItemView, QTableWidget,
    QTableWidgetItem
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QFont, QBrush, QColor
from dataclasses import dataclass

# ─────────────────────────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class MetricData:
    """Analytics metric"""
    label: str
    value: str
    trend: str  # UP, DOWN, STABLE
    percentChange: str
    icon: str

@dataclass
class SalesMetric:
    """Sales performance metric"""
    month: str
    revenue: int
    deals: int
    avgDealValue: int

FALLBACK_METRICS = [
    MetricData("Monthly Recurring Revenue", "₹24,50,000", "UP", "+12.5%", "💰"),
    MetricData("Sales Pipeline Value", "₹65,32,000", "UP", "+8.3%", "🎯"),
    MetricData("Customer Acquisition Cost", "₹15,200", "DOWN", "-3.2%", "📊"),
    MetricData("Average Deal Cycle", "28 days", "DOWN", "-5 days", "⏱️"),
]

FALLBACK_SALES_DATA = [
    SalesMetric("January", 18500000, 24, 770833),
    SalesMetric("February", 19200000, 26, 738461),
    SalesMetric("March", 21800000, 32, 681250),
    SalesMetric("April", 20500000, 28, 732142),
    SalesMetric("May", 22100000, 30, 736666),
    SalesMetric("June", 24500000, 35, 700000),
]

# ─────────────────────────────────────────────────────────────────────────────────────
# METRIC CARD COMPONENT
# ─────────────────────────────────────────────────────────────────────────────────────

class MetricCard(QFrame):
    """Analytics metric display card"""
    def __init__(self, metric: MetricData, parent=None):
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
        iconLabel = QLabel(metric.icon)
        iconLabel.setFont(QFont("Segoe UI", 18))
        headerLayout.addWidget(iconLabel)

        labelWidget = QLabel(metric.label)
        labelWidget.setFont(QFont("Segoe UI", 9))
        labelWidget.setStyleSheet("color: #94a3b8;")
        headerLayout.addWidget(labelWidget)

        # Trend
        trendEmoji = "📈" if metric.trend == "UP" else "📉" if metric.trend == "DOWN" else "➡️"
        trendLabel = QLabel(trendEmoji)
        trendLabel.setFont(QFont("Segoe UI", 12))
        headerLayout.addStretch()
        headerLayout.addWidget(trendLabel)

        layout.addLayout(headerLayout)

        # Value and change
        valueLayout = QHBoxLayout()
        valueLabel = QLabel(metric.value)
        valueLabel.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        valueLabel.setStyleSheet("color: #34d399;")
        valueLayout.addWidget(valueLabel)

        changeColor = "#34d399" if metric.trend == "UP" else "#ef4444" if metric.trend == "DOWN" else "#fbbf24"
        changeLabel = QLabel(metric.percentChange)
        changeLabel.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        changeLabel.setStyleSheet(f"color: {changeColor};")
        valueLayout.addWidget(changeLabel)
        valueLayout.addStretch()

        layout.addLayout(valueLayout)

# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN REPORTS VIEW
# ─────────────────────────────────────────────────────────────────────────────────────

class ReportsView(QWidget):
    """Analytics & Reports Dashboard"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
        """)

        self.salesData = list(FALLBACK_SALES_DATA)
        self._build_ui()

    def _build_ui(self):
        """Build reports UI"""
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
        titleLabel = QLabel("📊 Reports & Analytics")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        scrollLayout.addWidget(titleLabel)

        # Date Range Selector
        dateLayout = QHBoxLayout()
        dateLayout.setContentsMargins(0, 0, 0, 0)
        dateLayout.setSpacing(8)

        dateLabel = QLabel("📅 Date Range:")
        dateLabel.setFont(QFont("Segoe UI", 10))
        dateLabel.setStyleSheet("color: #cbd5e1;")
        dateLayout.addWidget(dateLabel)

        self.startDateInput = QDateEdit()
        self.startDateInput.setDate(QDate(2026, 1, 1))
        self.startDateInput.setStyleSheet("""
            QDateEdit {
                background-color: #0f172a;
                color: #ffffff;
                border: 1px solid #1e293b;
                border-radius: 6px;
                padding: 6px;
            }
        """)
        dateLayout.addWidget(self.startDateInput)

        toLabel = QLabel("to")
        toLabel.setFont(QFont("Segoe UI", 10))
        toLabel.setStyleSheet("color: #cbd5e1;")
        dateLayout.addWidget(toLabel)

        self.endDateInput = QDateEdit()
        self.endDateInput.setDate(QDate.currentDate())
        self.endDateInput.setStyleSheet("""
            QDateEdit {
                background-color: #0f172a;
                color: #ffffff;
                border: 1px solid #1e293b;
                border-radius: 6px;
                padding: 6px;
            }
        """)
        dateLayout.addWidget(self.endDateInput)

        btnExport = QPushButton("📥 Export Report")
        btnExport.setStyleSheet("background-color: #4f46e5; padding: 4px 8px; font-size: 9px;")
        btnExport.clicked.connect(lambda: None)
        dateLayout.addWidget(btnExport)

        dateLayout.addStretch()
        scrollLayout.addLayout(dateLayout)

        # Key Metrics Grid (2x2)
        metricsLayout = QGridLayout()
        metricsLayout.setContentsMargins(0, 0, 0, 0)
        metricsLayout.setSpacing(12)

        for idx, metric in enumerate(FALLBACK_METRICS):
            card = MetricCard(metric)
            metricsLayout.addWidget(card, idx // 2, idx % 2, 1, 1)

        scrollLayout.addLayout(metricsLayout)

        # Sales Performance Section
        salesTitleLayout = QHBoxLayout()
        salesTitleLabel = QLabel("💹 Sales Performance (Last 6 Months)")
        salesTitleLabel.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        salesTitleLabel.setStyleSheet("color: #ffffff;")
        salesTitleLayout.addWidget(salesTitleLabel)

        chartTypeCombo = QComboBox()
        chartTypeCombo.addItems(["Line Chart", "Bar Chart", "Area Chart"])
        chartTypeCombo.setStyleSheet("""
            QComboBox {
                background-color: #0f172a;
                color: #ffffff;
                border: 1px solid #1e293b;
                border-radius: 6px;
                padding: 4px;
            }
        """)
        salesTitleLayout.addStretch()
        salesTitleLayout.addWidget(chartTypeCombo)

        scrollLayout.addLayout(salesTitleLayout)

        # Chart Placeholder
        chartFrame = QFrame()
        chartFrame.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 12px;
            }
        """)
        chartLayout = QVBoxLayout(chartFrame)
        chartLayout.setContentsMargins(16, 16, 16, 16)

        chartLabel = QLabel("📈 Chart Visualization\n(Line chart: Revenue & Deal Count trend)")
        chartLabel.setFont(QFont("Segoe UI", 10))
        chartLabel.setStyleSheet("color: #94a3b8;")
        chartLabel.setAlignment(Qt.AlignmentFlag.AlignCenter)
        chartLayout.addWidget(chartLabel)

        scrollLayout.addWidget(chartFrame, 1)

        # Sales Data Table
        tableTitleLabel = QLabel("📋 Monthly Sales Data")
        tableTitleLabel.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        tableTitleLabel.setStyleSheet("color: #ffffff;")
        scrollLayout.addWidget(tableTitleLabel)

        self.salesTable = QTableWidget()
        self.salesTable.setColumnCount(4)
        self.salesTable.setHorizontalHeaderLabels(["Month", "Revenue", "Deals", "Avg Deal Value"])
        self.salesTable.horizontalHeader().setStretchLastSection(False)
        self.salesTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.salesTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.salesTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.salesTable.setColumnWidth(0, 120)
        self.salesTable.setColumnWidth(1, 150)
        self.salesTable.setColumnWidth(2, 100)
        self.salesTable.setColumnWidth(3, 150)

        self._refresh_sales_table()

        scrollLayout.addWidget(self.salesTable)

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _refresh_sales_table(self):
        """Refresh sales data table"""
        self.salesTable.setRowCount(len(self.salesData))

        for rowIdx, sale in enumerate(self.salesData):
            self.salesTable.setItem(rowIdx, 0, QTableWidgetItem(sale.month))

            revenueItem = QTableWidgetItem(f"₹{sale.revenue:,}")
            revenueItem.setForeground(QBrush(QColor("#34d399")))
            self.salesTable.setItem(rowIdx, 1, revenueItem)

            dealsItem = QTableWidgetItem(str(sale.deals))
            dealsItem.setForeground(QBrush(QColor("#60a5fa")))
            self.salesTable.setItem(rowIdx, 2, dealsItem)

            avgItem = QTableWidgetItem(f"₹{sale.avgDealValue:,}")
            avgItem.setForeground(QBrush(QColor("#fbbf24")))
            self.salesTable.setItem(rowIdx, 3, avgItem)

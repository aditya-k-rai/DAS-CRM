"""
DashboardView.py — DAS CRM Windows
Executive Dashboard with KPIs, Upcoming Leads, Recent 5 Leads Preview
Feature parity with Android DashboardScreen.tsx
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QScrollArea, QFrame,
    QGridLayout
)
from PyQt6.QtCore import Qt, QSize
from PyQt6.QtGui import QFont, QColor, QBrush
from PyQt6.QtCore import pyqtSignal

class DashboardView(QWidget):
    """Executive Dashboard with KPIs and Lead Summary"""

    # Signals for navigation
    navigate_to_leads = pyqtSignal()
    navigate_to_attendance = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
        """)

        self._build_ui()

    def _build_ui(self):
        """Build dashboard UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        # Scrollable content
        scrollArea = QScrollArea()
        scrollArea.setWidgetResizable(True)
        scrollArea.setStyleSheet("QScrollArea { border: none; background-color: #090d16; }")

        scrollWidget = QWidget()
        scrollLayout = QVBoxLayout(scrollWidget)
        scrollLayout.setContentsMargins(16, 16, 16, 24)
        scrollLayout.setSpacing(16)

        # 👑 Top Executive Banner
        bannerWidget = self._build_banner()
        scrollLayout.addWidget(bannerWidget)

        # 📊 Executive Performance Summary Cards
        scrollLayout.addWidget(QLabel("Executive Performance Overview"))
        scrollLayout.lastWidget().setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        scrollLayout.lastWidget().setStyleSheet("color: #f8fafc; margin-bottom: 8px;")

        statsWidget = self._build_stats_grid()
        scrollLayout.addWidget(statsWidget)

        # 📅 UPCOMING LEADS & FOLLOW-UPS
        scrollLayout.addWidget(QLabel("Upcoming Lead Follow-ups"))
        scrollLayout.lastWidget().setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        scrollLayout.lastWidget().setStyleSheet("color: #f8fafc; margin-bottom: 8px;")

        upcomingWidget = self._build_upcoming_leads()
        scrollLayout.addWidget(upcomingWidget)

        # 📋 RECENT 5 LEADS PREVIEW WIDGET
        headerLayout = QHBoxLayout()
        headerLabel = QLabel("Recent 5 Ingested Leads")
        headerLabel.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        headerLabel.setStyleSheet("color: #f8fafc;")
        headerLayout.addWidget(headerLabel)
        headerLayout.addStretch()

        viewMoreBtn = QPushButton("View More Leads →")
        viewMoreBtn.setStyleSheet("""
            QPushButton {
                background-color: transparent;
                color: #818cf8;
                font-size: 11px;
                font-weight: 800;
                padding: 0px;
                border: none;
            }
            QPushButton:hover { color: #a5b4fc; }
        """)
        viewMoreBtn.clicked.connect(self.navigate_to_leads.emit)
        headerLayout.addWidget(viewMoreBtn)

        scrollLayout.addLayout(headerLayout)

        recentLeadsWidget = self._build_recent_leads()
        scrollLayout.addWidget(recentLeadsWidget)

        scrollLayout.addStretch()

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _build_banner(self) -> QFrame:
        """Build tenant admin header banner"""
        banner = QFrame()
        banner.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid rgba(99,102,241,0.3);
                border-radius: 18px;
                padding: 12px;
            }
        """)

        layout = QVBoxLayout(banner)
        layout.setContentsMargins(12, 12, 12, 12)

        roleLabel = QLabel("👑 TENANT ADMIN")
        roleLabel.setStyleSheet("""
            background-color: rgba(99,102,241,0.15);
            border: 1px solid rgba(99,102,241,0.3);
            color: #a5b4fc;
            padding: 4px 8px;
            border-radius: 6px;
            font-size: 8px;
            font-weight: 800;
            width: fit-content;
        """)

        companyLabel = QLabel("DAS CRM Enterprise")
        companyLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        companyLabel.setStyleSheet("color: #ffffff;")

        planLabel = QLabel("🟢 Pro Plan")
        planLabel.setStyleSheet("""
            background-color: rgba(16,185,129,0.15);
            border: 1px solid rgba(16,185,129,0.3);
            color: #34d399;
            padding: 3px 8px;
            border-radius: 8px;
            font-size: 9px;
            font-weight: 800;
            width: fit-content;
        """)

        layout.addWidget(roleLabel)
        layout.addWidget(companyLabel)
        layout.addWidget(planLabel)

        return banner

    def _build_stats_grid(self) -> QFrame:
        """Build 4-column KPI stats grid"""
        container = QFrame()
        container.setStyleSheet("border: none;")

        layout = QGridLayout(container)
        layout.setSpacing(10)
        layout.setContentsMargins(0, 0, 0, 0)

        stats = [
            ("📊", "1,420", "Total Ingested Leads", "rgba(99,102,241,0.3)"),
            ("💰", "₹148,500", "Pipeline Value", "rgba(16,185,129,0.3)", "#34d399"),
            ("⚡", "42", "Fresh Unassigned", "rgba(245,158,11,0.3)", "#fbbf24"),
            ("🎯", "28.5%", "Conversion Target", "rgba(168,85,247,0.3)", "#c084fc"),
        ]

        for idx, stat in enumerate(stats):
            card = self._build_stat_card(stat)
            layout.addWidget(card, idx // 2, idx % 2)

        return container

    def _build_stat_card(self, stat_data) -> QFrame:
        """Build individual stat card"""
        card = QFrame()
        card.setStyleSheet(f"""
            QFrame {{
                background-color: #0f172a;
                border: 1px solid {stat_data[3]};
                border-radius: 14px;
                padding: 10px;
            }}
        """)
        card.setMinimumHeight(130)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(10, 10, 10, 10)

        icon = QLabel(stat_data[0])
        icon.setFont(QFont("Segoe UI", 14))
        icon.setStyleSheet("margin-bottom: 4px;")

        value = QLabel(stat_data[1])
        value.setFont(QFont("Segoe UI", 18, QFont.Weight.Black))
        if len(stat_data) > 4:
            value.setStyleSheet(f"color: {stat_data[4]};")
        else:
            value.setStyleSheet("color: #ffffff;")

        label = QLabel(stat_data[2])
        label.setFont(QFont("Segoe UI", 9, QFont.Weight.Normal))
        label.setStyleSheet("color: #94a3b8;")

        layout.addWidget(icon)
        layout.addWidget(value)
        layout.addWidget(label)
        layout.addStretch()

        return card

    def _build_upcoming_leads(self) -> QFrame:
        """Build upcoming leads section"""
        card = QFrame()
        card.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 16px;
                padding: 12px;
            }
        """)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(0)

        upcoming = [
            ("Call Rajesh Kumar — Quote Discussion", "Today 2:00 PM", "HIGH"),
            ("Demo Presentation for TechCorp", "Today 4:30 PM", "HIGH"),
            ("Follow-up with Sunita Real Estate", "Tomorrow 11:00 AM", "MEDIUM"),
        ]

        for idx, (title, time, priority) in enumerate(upcoming):
            row = QHBoxLayout()

            textLayout = QVBoxLayout()
            titleLabel = QLabel(title)
            titleLabel.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
            titleLabel.setStyleSheet("color: #ffffff;")
            timeLabel = QLabel(f"📅 {time}")
            timeLabel.setFont(QFont("Segoe UI", 10))
            timeLabel.setStyleSheet("color: #94a3b8; margin-top: 2px;")

            textLayout.addWidget(titleLabel)
            textLayout.addWidget(timeLabel)

            row.addLayout(textLayout, 1)

            priorityLabel = QLabel(priority)
            priorityLabel.setFont(QFont("Segoe UI", 8, QFont.Weight.Bold))
            priorityLabel.setStyleSheet("""
                background-color: rgba(245,158,11,0.15);
                color: #fbbf24;
                padding: 2px 6px;
                border: 1px solid rgba(245,158,11,0.3);
                border-radius: 6px;
            """)

            row.addWidget(priorityLabel)

            layout.addLayout(row)

            if idx < len(upcoming) - 1:
                separator = QFrame()
                separator.setStyleSheet("border-bottom: 1px solid #1e293b;")
                separator.setMaximumHeight(1)
                layout.addWidget(separator)

        return card

    def _build_recent_leads(self) -> QFrame:
        """Build recent 5 leads section"""
        card = QFrame()
        card.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 16px;
                padding: 12px;
            }
        """)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(0)

        leads = [
            ("Rajesh Kumar", "TechCorp Ltd", "Proposal", "₹5,20,000", 91),
            ("Priya Sharma", "LogiTech Solutions", "Won", "₹3,50,000", 98),
            ("Vikram Mehta", "Acme Sales Solutions", "Qualified", "₹1,42,000", 85),
            ("Sunita Rao", "Real Estate Group", "Negotiation", "₹8,50,000", 77),
            ("Amit Patel", "Global Freight Ltd", "New Lead", "₹90,000", 63),
        ]

        for idx, (name, company, status, value, score) in enumerate(leads):
            row = QHBoxLayout()

            textLayout = QVBoxLayout()
            nameLabel = QLabel(name)
            nameLabel.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
            nameLabel.setStyleSheet("color: #ffffff;")
            companyLabel = QLabel(f"{company} • {status}")
            companyLabel.setFont(QFont("Segoe UI", 10))
            companyLabel.setStyleSheet("color: #94a3b8; margin-top: 2px;")

            textLayout.addWidget(nameLabel)
            textLayout.addWidget(companyLabel)

            row.addLayout(textLayout, 1)

            rightLayout = QVBoxLayout()
            valueLabel = QLabel(value)
            valueLabel.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
            valueLabel.setStyleSheet("color: #34d399;")
            scoreLabel = QLabel(f"🔥 Score {score}")
            scoreLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
            scoreLabel.setStyleSheet("color: #34d399;")

            rightLayout.addWidget(valueLabel, alignment=Qt.AlignmentFlag.AlignRight)
            rightLayout.addWidget(scoreLabel, alignment=Qt.AlignmentFlag.AlignRight)

            row.addLayout(rightLayout)

            layout.addLayout(row)

            if idx < len(leads) - 1:
                separator = QFrame()
                separator.setStyleSheet("border-bottom: 1px solid #1e293b;")
                separator.setMaximumHeight(1)
                layout.addWidget(separator)

        # View More Button
        viewMoreBtn = QPushButton("View All Leads & Distribution Controls →")
        viewMoreBtn.setStyleSheet("""
            QPushButton {
                background-color: rgba(99,102,241,0.15);
                border: 1px solid rgba(99,102,241,0.3);
                color: #a5b4fc;
                padding: 10px;
                border-radius: 10px;
                font-weight: 800;
                font-size: 11px;
                margin-top: 8px;
            }
            QPushButton:hover {
                background-color: rgba(99,102,241,0.25);
            }
        """)
        viewMoreBtn.clicked.connect(self.navigate_to_leads.emit)
        layout.addWidget(viewMoreBtn)

        return card

"""
AdminView.py — DAS CRM Windows
Tenant Admin Command Center with KPIs, Meetings, Workforce, Telemetry
Feature parity with Android AdminDashboardScreen.tsx
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QScrollArea, QFrame,
    QGridLayout, QTableWidget, QTableWidgetItem, QDialog, QAbstractItemView
)
from PyQt6.QtCore import Qt, QSize, pyqtSignal
from PyQt6.QtGui import QFont, QColor, QBrush

# ─────────────────────────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

class ScheduledMeetingItem:
    """Represents a scheduled meeting"""
    def __init__(self, id, leadId, leadName, company, phone, email, value,
                 assignedAgent, agentRole, meetingPurpose, scheduledTimeStr,
                 isToday, status):
        self.id = id
        self.leadId = leadId
        self.leadName = leadName
        self.company = company
        self.phone = phone
        self.email = email
        self.value = value
        self.assignedAgent = assignedAgent
        self.agentRole = agentRole
        self.meetingPurpose = meetingPurpose
        self.scheduledTimeStr = scheduledTimeStr
        self.isToday = isToday
        self.status = status  # CONFIRMED, SCHEDULED, IN_PROGRESS

MOCK_ADMIN_MEETINGS = [
    ScheduledMeetingItem("mtg-1", "lead-1", "Rajesh Mehta", "TechCorp Solutions Ltd",
                        "+91 98765 43210", "rajesh@techcorp.com", "₹5,20,000",
                        "Rajesh Kumar", "Sales Executive",
                        "Enterprise CRM Suite Demo & SLA Negotiation",
                        "Today, 02:30 PM", True, "CONFIRMED"),
    ScheduledMeetingItem("mtg-2", "lead-2", "Priya Sharma", "LogiTech Freight Systems",
                        "+91 98123 45678", "priya@logitech.com", "₹3,50,000",
                        "Amit Patel", "Sales Executive",
                        "WhatsApp Automation Bot Integration Review",
                        "Today, 04:45 PM", True, "SCHEDULED"),
    ScheduledMeetingItem("mtg-3", "lead-3", "Sunita Kapoor", "Sunita Logistics Pvt Ltd",
                        "+91 97222 33344", "sunita@sunitalogistics.com", "₹8,90,000",
                        "Amit Shah", "Team Leader",
                        "Executive Contract Signing & License Rollout",
                        "Today, 06:15 PM", True, "CONFIRMED"),
    ScheduledMeetingItem("mtg-4", "lead-4", "Vikram Sethi", "Sethi Enterprises",
                        "+91 98777 66655", "vikram@sethi.com", "₹4,20,000",
                        "Neha Joshi", "Team Leader",
                        "Cloud Telemetry License Proposal Walkthrough",
                        "Tomorrow, 11:00 AM", False, "SCHEDULED"),
    ScheduledMeetingItem("mtg-5", "lead-5", "Rakesh Verma", "Verma Solutions",
                        "+91 98111 22233", "rakesh@verma.com", "₹2,45,000",
                        "Priya Sharma", "Sales Executive",
                        "AI Lead Scoring Engine Pro Walkthrough",
                        "22 Aug 2026, 03:00 PM", False, "SCHEDULED"),
    ScheduledMeetingItem("mtg-6", "lead-6", "Deepa Nair", "Nair Exports Ltd",
                        "+91 99888 77766", "deepa@nair.com", "₹6,80,000",
                        "Rajesh Kumar", "Sales Executive",
                        "Multi-Tenant Migration & Security Compliance",
                        "23 Aug 2026, 05:30 PM", False, "SCHEDULED"),
]

# ─────────────────────────────────────────────────────────────────────────────────────
# MODAL: MEETING DETAILS
# ─────────────────────────────────────────────────────────────────────────────────────

class MeetingDetailsModal(QDialog):
    """Modal showing detailed meeting information"""
    def __init__(self, meeting: ScheduledMeetingItem, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"📅 Meeting Details - {meeting.leadName}")
        self.setGeometry(100, 100, 600, 500)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #f8fafc; }
            QPushButton { padding: 8px 16px; border-radius: 6px; font-weight: bold; }
            QPushButton#close { background-color: #1e293b; color: #94a3b8; }
            QPushButton#call { background-color: #10b981; color: white; }
            QPushButton#whatsapp { background-color: #25D366; color: white; }
        """)

        layout = QVBoxLayout(self)

        # Header
        headerLayout = QHBoxLayout()
        headerLayout.setContentsMargins(16, 16, 16, 12)

        titleLabel = QLabel(f"📅 {meeting.leadName} Meeting Details")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        headerLayout.addWidget(titleLabel)
        headerLayout.addStretch()

        statusLabel = QLabel(meeting.status)
        statusLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        statusColor = "#34d399" if meeting.status == "CONFIRMED" else "#38bdf8"
        statusLabel.setStyleSheet(f"""
            background-color: rgba(0, 200, 150, 0.15) if {statusColor == '#34d399'} else rgba(56,189,248,0.15);
            color: {statusColor};
            padding: 4px 8px;
            border: 1px solid {statusColor};
            border-radius: 6px;
        """)
        headerLayout.addWidget(statusLabel)

        layout.addLayout(headerLayout)

        # Content
        contentLayout = QVBoxLayout()
        contentLayout.setContentsMargins(16, 0, 16, 12)
        contentLayout.setSpacing(12)

        # Meeting Info Card
        meetingCard = self._build_info_section(
            "📍 Meeting Details",
            [
                ("Purpose", meeting.meetingPurpose),
                ("Scheduled", meeting.scheduledTimeStr),
                ("Status", meeting.status),
            ]
        )
        contentLayout.addWidget(meetingCard)

        # Lead Info Card
        leadCard = self._build_info_section(
            "👤 Lead Information",
            [
                ("Name", meeting.leadName),
                ("Company", meeting.company),
                ("Email", meeting.email),
                ("Phone", meeting.phone),
                ("Lead Value", meeting.value),
            ]
        )
        contentLayout.addWidget(leadCard)

        # Agent Info Card
        agentCard = self._build_info_section(
            "👨‍💼 Assigned Agent",
            [
                ("Agent", meeting.assignedAgent),
                ("Role", meeting.agentRole),
            ]
        )
        contentLayout.addWidget(agentCard)

        contentLayout.addStretch()

        layout.addLayout(contentLayout, 1)

        # Action Buttons
        actionLayout = QHBoxLayout()
        actionLayout.setContentsMargins(16, 0, 16, 16)
        actionLayout.setSpacing(8)

        btnCall = QPushButton("📞 Call Lead")
        btnCall.setObjectName("call")
        actionLayout.addWidget(btnCall)

        btnWhatsApp = QPushButton("💬 WhatsApp")
        btnWhatsApp.setObjectName("whatsapp")
        actionLayout.addWidget(btnWhatsApp)

        actionLayout.addStretch()

        btnClose = QPushButton("Close")
        btnClose.setObjectName("close")
        btnClose.clicked.connect(self.accept)
        actionLayout.addWidget(btnClose)

        layout.addLayout(actionLayout)

    def _build_info_section(self, title: str, fields: list) -> QFrame:
        """Build an info section card"""
        card = QFrame()
        card.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 12px;
                padding: 12px;
            }
        """)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(8)

        titleLabel = QLabel(title)
        titleLabel.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        layout.addWidget(titleLabel)

        for fieldName, fieldValue in fields:
            fieldLayout = QHBoxLayout()

            nameLabel = QLabel(f"{fieldName}:")
            nameLabel.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            nameLabel.setStyleSheet("color: #94a3b8;")
            nameLabel.setMaximumWidth(100)

            valueLabel = QLabel(fieldValue)
            valueLabel.setFont(QFont("Segoe UI", 10))
            valueLabel.setStyleSheet("color: #cbd5e1;")
            valueLabel.setWordWrap(True)

            fieldLayout.addWidget(nameLabel)
            fieldLayout.addWidget(valueLabel, 1)
            layout.addLayout(fieldLayout)

        return card

# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN ADMIN VIEW
# ─────────────────────────────────────────────────────────────────────────────────────

class AdminView(QWidget):
    """Admin Dashboard - Tenant Admin Command Center"""

    navigate_to_attendance = pyqtSignal()

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
        """)

        self.meetingFilter = "TODAY"
        self.selectedMeeting = None

        self._build_ui()

    def _build_ui(self):
        """Build admin dashboard UI"""
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

        # 📊 METRICS GRID (4 columns)
        scrollLayout.addWidget(self._build_metrics_section())

        # 📅 SCHEDULED MEETINGS
        scrollLayout.addWidget(self._build_meetings_section())

        # 👥 WORKFORCE & ATTENDANCE
        scrollLayout.addWidget(self._build_workforce_section())

        # ⚡ TODAY'S TELEMETRY
        scrollLayout.addWidget(self._build_telemetry_section())

        # 🟢 MULTI-SOURCE INGESTION TELEMETRY
        scrollLayout.addWidget(self._build_ingestion_section())

        scrollLayout.addStretch()

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _build_metrics_section(self) -> QFrame:
        """Build metrics KPI grid"""
        container = QFrame()
        container.setStyleSheet("border: none;")

        layout = QGridLayout(container)
        layout.setSpacing(12)
        layout.setContentsMargins(0, 0, 0, 0)

        metrics = [
            ("💵", "$128,400", "Won Revenue", "rgba(16,185,129,0.3)"),
            ("💰", "$412,000", "Active Pipeline", "rgba(99,102,241,0.3)"),
            ("📊", "3,420", "Total Leads", "rgba(56,189,248,0.3)"),
            ("📈", "14.2%", "Conversion Rate", "rgba(245,158,11,0.3)"),
        ]

        for idx, (icon, value, label, borderColor) in enumerate(metrics):
            card = self._build_metric_card(icon, value, label, borderColor)
            layout.addWidget(card, 0, idx)

        return container

    def _build_metric_card(self, icon: str, value: str, label: str, borderColor: str) -> QFrame:
        """Build individual metric card"""
        card = QFrame()
        card.setStyleSheet(f"""
            QFrame {{
                background-color: #0f172a;
                border: 1px solid {borderColor};
                border-radius: 14px;
                padding: 12px;
            }}
        """)
        card.setMinimumHeight(100)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(12, 12, 12, 12)

        iconLabel = QLabel(icon)
        iconLabel.setFont(QFont("Segoe UI", 16))

        valueLabel = QLabel(value)
        valueLabel.setFont(QFont("Segoe UI", 18, QFont.Weight.Black))
        valueLabel.setStyleSheet("color: #ffffff;")

        labelLabel = QLabel(label)
        labelLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Normal))
        labelLabel.setStyleSheet("color: #94a3b8;")

        layout.addWidget(iconLabel)
        layout.addWidget(valueLabel)
        layout.addWidget(labelLabel)
        layout.addStretch()

        return card

    def _build_meetings_section(self) -> QFrame:
        """Build scheduled meetings section"""
        container = QFrame()
        container.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 16px;
                padding: 12px;
            }
        """)

        layout = QVBoxLayout(container)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(12)

        # Header with filters
        headerLayout = QHBoxLayout()

        titleLabel = QLabel("📅 Scheduled Meetings Today & Upcoming")
        titleLabel.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        headerLayout.addWidget(titleLabel)
        headerLayout.addStretch()

        # Filter buttons
        for filter_name in ["TODAY", "UPCOMING", "ALL"]:
            btn = QPushButton(filter_name)
            btn.setCheckable(True)
            btn.setChecked(filter_name == "TODAY")
            btn.setMaximumHeight(24)
            btn.setMaximumWidth(80)
            btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: #020617 if {filter_name != "TODAY"} else #4f46e5;
                    border: 1px solid #1e293b;
                    color: #94a3b8 if {filter_name != "TODAY"} else #ffffff;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 9px;
                    font-weight: 800;
                }}
                QPushButton:checked {{
                    background-color: #4f46e5;
                    color: #ffffff;
                    border-color: #4f46e5;
                }}
            """)
            btn.toggled.connect(lambda checked, f=filter_name: self._set_meeting_filter(f) if checked else None)
            headerLayout.addWidget(btn)

        layout.addLayout(headerLayout)

        # Meetings table
        self.meetingsTable = QTableWidget()
        self.meetingsTable.setColumnCount(6)
        self.meetingsTable.setHorizontalHeaderLabels([
            "Lead Name", "Company", "Purpose", "Time", "Agent", "Status"
        ])
        self.meetingsTable.horizontalHeader().setStretchLastSection(False)
        self.meetingsTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.meetingsTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.meetingsTable.setMaximumHeight(250)
        self.meetingsTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.meetingsTable.setColumnWidth(0, 120)
        self.meetingsTable.setColumnWidth(1, 150)
        self.meetingsTable.setColumnWidth(2, 200)
        self.meetingsTable.setColumnWidth(3, 120)
        self.meetingsTable.setColumnWidth(4, 120)
        self.meetingsTable.setColumnWidth(5, 80)

        self.meetingsTable.doubleClicked.connect(self._open_meeting_details)

        self._refresh_meetings_table()

        layout.addWidget(self.meetingsTable, 1)

        return container

    def _refresh_meetings_table(self):
        """Refresh meetings table"""
        filtered_meetings = MOCK_ADMIN_MEETINGS
        if self.meetingFilter == "TODAY":
            filtered_meetings = [m for m in MOCK_ADMIN_MEETINGS if m.isToday]
        elif self.meetingFilter == "UPCOMING":
            filtered_meetings = [m for m in MOCK_ADMIN_MEETINGS if not m.isToday]

        self.meetingsTable.setRowCount(len(filtered_meetings))

        for rowIdx, meeting in enumerate(filtered_meetings):
            self.meetingsTable.setItem(rowIdx, 0, QTableWidgetItem(meeting.leadName))
            self.meetingsTable.setItem(rowIdx, 1, QTableWidgetItem(meeting.company))
            self.meetingsTable.setItem(rowIdx, 2, QTableWidgetItem(meeting.meetingPurpose))
            self.meetingsTable.setItem(rowIdx, 3, QTableWidgetItem(meeting.scheduledTimeStr))
            self.meetingsTable.setItem(rowIdx, 4, QTableWidgetItem(meeting.assignedAgent))

            statusItem = QTableWidgetItem(meeting.status)
            statusColor = "#34d399" if meeting.status == "CONFIRMED" else "#38bdf8"
            statusItem.setForeground(QBrush(QColor(statusColor)))
            statusItem.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
            self.meetingsTable.setItem(rowIdx, 5, statusItem)

    def _set_meeting_filter(self, filter_name: str):
        """Set meeting filter"""
        self.meetingFilter = filter_name
        self._refresh_meetings_table()

    def _open_meeting_details(self, index):
        """Open meeting details modal"""
        row = index.row()
        filtered_meetings = MOCK_ADMIN_MEETINGS
        if self.meetingFilter == "TODAY":
            filtered_meetings = [m for m in MOCK_ADMIN_MEETINGS if m.isToday]
        elif self.meetingFilter == "UPCOMING":
            filtered_meetings = [m for m in MOCK_ADMIN_MEETINGS if not m.isToday]

        if row < len(filtered_meetings):
            meeting = filtered_meetings[row]
            dialog = MeetingDetailsModal(meeting, self)
            dialog.exec()

    def _build_workforce_section(self) -> QFrame:
        """Build workforce & attendance section"""
        container = QFrame()
        container.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 16px;
                padding: 12px;
            }
        """)

        layout = QVBoxLayout(container)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(8)

        headerLayout = QHBoxLayout()

        titleLabel = QLabel("👥 Workforce & Attendance Today")
        titleLabel.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        headerLayout.addWidget(titleLabel)
        headerLayout.addStretch()

        viewBtn = QPushButton("View Attendance →")
        viewBtn.setStyleSheet("""
            QPushButton {
                background-color: transparent;
                color: #38bdf8;
                font-size: 10px;
                padding: 0px;
                border: none;
            }
        """)
        viewBtn.clicked.connect(self.navigate_to_attendance.emit)
        headerLayout.addWidget(viewBtn)

        layout.addLayout(headerLayout)

        # Attendance card
        attendanceCard = QFrame()
        attendanceCard.setStyleSheet("""
            QFrame {
                background-color: #020617;
                border: 1px solid #1e293b;
                border-radius: 10px;
                padding: 12px;
            }
        """)

        attendanceLayout = QHBoxLayout(attendanceCard)

        presentLabel = QLabel("19 / 24 Present")
        presentLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        presentLabel.setStyleSheet("color: #34d399;")

        percentLabel = QLabel("(79% Attendance)")
        percentLabel.setFont(QFont("Segoe UI", 10))
        percentLabel.setStyleSheet("color: #94a3b8;")

        attendanceLayout.addWidget(presentLabel)
        attendanceLayout.addWidget(percentLabel)
        attendanceLayout.addStretch()

        layout.addWidget(attendanceCard)

        return container

    def _build_telemetry_section(self) -> QFrame:
        """Build today's telemetry section"""
        container = QFrame()
        container.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 16px;
                padding: 12px;
            }
        """)

        layout = QVBoxLayout(container)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(12)

        titleLabel = QLabel("⚡ Today's Telemetry")
        titleLabel.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        layout.addWidget(titleLabel)

        # Telemetry grid (4 columns)
        telemetryLayout = QGridLayout()
        telemetryLayout.setSpacing(10)

        telemetry_items = [
            ("💵", "$18,450", "Sales Today"),
            ("📊", "142", "Leads Allocated"),
            ("📞", "384", "Calls Done"),
            ("💬", "820", "Msgs Sent"),
        ]

        for idx, (icon, value, label) in enumerate(telemetry_items):
            card = QFrame()
            card.setStyleSheet("""
                QFrame {
                    background-color: #020617;
                    border: 1px solid #1e293b;
                    border-radius: 10px;
                    padding: 10px;
                }
            """)

            cardLayout = QVBoxLayout(card)
            cardLayout.setContentsMargins(10, 10, 10, 10)

            iconLabel = QLabel(icon)
            iconLabel.setFont(QFont("Segoe UI", 12))

            valueLabel = QLabel(value)
            valueLabel.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
            valueLabel.setStyleSheet("color: #34d399;")

            labelLabel = QLabel(label)
            labelLabel.setFont(QFont("Segoe UI", 9))
            labelLabel.setStyleSheet("color: #94a3b8;")

            cardLayout.addWidget(iconLabel)
            cardLayout.addWidget(valueLabel)
            cardLayout.addWidget(labelLabel)

            telemetryLayout.addWidget(card, 0, idx)

        layout.addLayout(telemetryLayout)

        return container

    def _build_ingestion_section(self) -> QFrame:
        """Build multi-source ingestion telemetry section"""
        container = QFrame()
        container.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 16px;
                padding: 12px;
            }
        """)

        layout = QVBoxLayout(container)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(8)

        titleLabel = QLabel("🟢 Multi-Source Lead Ingestion Telemetry")
        titleLabel.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        layout.addWidget(titleLabel)

        ingestion_sources = [
            ("🟢 Google Sheets Live Sync", "1,890 leads ingested", "Active 2-way sync"),
            ("📥 CSV / Excel Uploads", "1,240 leads processed", "SheetJS engine"),
            ("🌐 Meta Webhooks", "340 leads ingested", "Real-time events"),
        ]

        for title, count, status in ingestion_sources:
            card = QFrame()
            card.setStyleSheet("""
                QFrame {
                    background-color: #020617;
                    border: 1px solid #1e293b;
                    border-radius: 10px;
                    padding: 10px;
                }
            """)

            cardLayout = QHBoxLayout(card)

            textLayout = QVBoxLayout()
            titleLabel = QLabel(title)
            titleLabel.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
            titleLabel.setStyleSheet("color: #ffffff;")
            countLabel = QLabel(count)
            countLabel.setFont(QFont("Segoe UI", 9))
            countLabel.setStyleSheet("color: #94a3b8;")
            statusLabel = QLabel(status)
            statusLabel.setFont(QFont("Segoe UI", 9))
            statusLabel.setStyleSheet("color: #34d399; font-weight: bold;")

            textLayout.addWidget(titleLabel)
            textLayout.addWidget(countLabel)
            textLayout.addWidget(statusLabel)

            cardLayout.addLayout(textLayout, 1)
            cardLayout.addStretch()

            layout.addWidget(card)

        return container

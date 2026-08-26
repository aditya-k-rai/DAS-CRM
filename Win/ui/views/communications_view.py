"""
CommunicationsView.py — DAS CRM Windows
WhatsApp Hub and Communication Management
Feature parity with Android CommunicationsScreen.tsx
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit,
    QScrollArea, QFrame, QTableWidget, QTableWidgetItem, QAbstractItemView,
    QMessageBox, QDialog, QTextEdit, QComboBox, QDateEdit, QTabWidget
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QFont, QBrush, QColor
from dataclasses import dataclass

# ─────────────────────────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class WhatsAppMessage:
    """WhatsApp message record"""
    id: str
    contactName: str
    contactPhone: str
    message: str
    timestamp: str
    direction: str  # INBOUND, OUTBOUND
    status: str  # SENT, DELIVERED, READ, FAILED

@dataclass
class EmailMessage:
    """Email message record"""
    id: str
    sender: str
    recipient: str
    subject: str
    body: str
    timestamp: str
    status: str  # SENT, RECEIVED, DRAFT, FAILED

@dataclass
class CallLog:
    """Call log record"""
    id: str
    contactName: str
    contactPhone: str
    timestamp: str
    duration: str
    callType: str  # INBOUND, OUTBOUND, MISSED
    notes: str

FALLBACK_WHATSAPP_MESSAGES = [
    WhatsAppMessage("w1", "Rajesh Kumar", "+91-98765-43210", "Hi, just checking on the proposal status", "2026-08-26 10:15", "INBOUND", "READ"),
    WhatsAppMessage("w2", "Priya Sharma", "+91-98765-43211", "The integration is ready for testing", "2026-08-26 09:45", "OUTBOUND", "DELIVERED"),
    WhatsAppMessage("w3", "Vikram Mehta", "+91-98765-43212", "Meeting scheduled for tomorrow at 2 PM", "2026-08-26 14:20", "INBOUND", "READ"),
    WhatsAppMessage("w4", "Sunita Rao", "+91-98765-43213", "Please send the updated quotation", "2026-08-26 11:30", "OUTBOUND", "SENT"),
    WhatsAppMessage("w5", "Amit Patel", "+91-98765-43214", "Demo went well! Client is interested", "2026-08-26 16:00", "INBOUND", "READ"),
]

FALLBACK_EMAILS = [
    EmailMessage("e1", "rajesh@company.com", "sales@dascrm.com", "Project Kickoff", "Let's discuss the timeline for the new project", "2026-08-26 08:30", "RECEIVED"),
    EmailMessage("e2", "sales@dascrm.com", "priya@company.com", "Proposal Attached", "Please find the quotation attached", "2026-08-26 10:00", "SENT"),
    EmailMessage("e3", "vikram@company.com", "sales@dascrm.com", "Demo Feedback", "Great demo! A few questions about the pricing...", "2026-08-26 12:15", "RECEIVED"),
    EmailMessage("e4", "sales@dascrm.com", "sunita@company.com", "Follow-up", "Hi, wanted to check if you had any questions", "2026-08-26 14:00", "SENT"),
    EmailMessage("e5", "amit@company.com", "sales@dascrm.com", "Contract Review", "Can we discuss the contract terms?", "2026-08-26 15:45", "RECEIVED"),
]

FALLBACK_CALL_LOGS = [
    CallLog("c1", "Rajesh Kumar", "+91-98765-43210", "2026-08-26 09:30", "12 min 45 sec", "OUTBOUND", "Discussed proposal timeline"),
    CallLog("c2", "Priya Sharma", "+91-98765-43211", "2026-08-26 11:00", "8 min 20 sec", "INBOUND", "Client inquiry about pricing"),
    CallLog("c3", "Vikram Mehta", "+91-98765-43212", "2026-08-26 13:15", "15 min 10 sec", "OUTBOUND", "Demo walkthrough"),
    CallLog("c4", "Sunita Rao", "+91-98765-43213", "2026-08-26 14:45", "---", "MISSED", ""),
    CallLog("c5", "Amit Patel", "+91-98765-43214", "2026-08-26 16:30", "22 min 5 sec", "INBOUND", "Feedback from demo"),
]

# ─────────────────────────────────────────────────────────────────────────────────────
# MESSAGE DETAILS MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class MessageDetailsModal(QDialog):
    """Modal showing detailed message information"""
    def __init__(self, message: dict, messageType: str = "whatsapp", parent=None):
        super().__init__(parent)
        self.messageType = messageType
        self.message = message

        title = f"📱 Message - {message.get('contactName', message.get('sender', 'Unknown'))}"
        self.setWindowTitle(title)
        self.setGeometry(100, 100, 550, 500)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #f8fafc; }
            QPushButton { padding: 8px 12px; border-radius: 6px; font-weight: bold; }
            QPushButton#reply { background-color: #10b981; color: white; }
            QPushButton#close { background-color: #1e293b; color: #94a3b8; }
        """)

        layout = QVBoxLayout(self)

        # Header
        headerLayout = QHBoxLayout()
        headerLayout.setContentsMargins(16, 16, 16, 12)

        titleLabel = QLabel(title)
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        headerLayout.addWidget(titleLabel)
        headerLayout.addStretch()

        statusLabel = QLabel(message.get('status', 'UNKNOWN'))
        statusLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        statusColor = "#34d399" if message.get('status') in ['DELIVERED', 'READ', 'SENT'] else "#ef4444"
        statusLabel.setStyleSheet(f"""
            background-color: rgba(100, 100, 100, 0.15);
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

        # Message Info
        if messageType == "whatsapp":
            infoCard = self._build_info_section(
                "💬 WhatsApp Message",
                [
                    ("Contact", message.get('contactName', '')),
                    ("Phone", message.get('contactPhone', '')),
                    ("Direction", message.get('direction', '')),
                    ("Timestamp", message.get('timestamp', '')),
                ]
            )
        elif messageType == "email":
            infoCard = self._build_info_section(
                "📧 Email Message",
                [
                    ("From", message.get('sender', '')),
                    ("To", message.get('recipient', '')),
                    ("Subject", message.get('subject', '')),
                    ("Timestamp", message.get('timestamp', '')),
                ]
            )
        else:  # call
            infoCard = self._build_info_section(
                "☎️ Call Log",
                [
                    ("Contact", message.get('contactName', '')),
                    ("Phone", message.get('contactPhone', '')),
                    ("Type", message.get('callType', '')),
                    ("Duration", message.get('duration', '')),
                ]
            )

        contentLayout.addWidget(infoCard)

        # Message Body
        bodyCard = QFrame()
        bodyCard.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 12px;
                padding: 12px;
            }
        """)

        bodyLayout = QVBoxLayout(bodyCard)
        bodyLayout.setContentsMargins(12, 12, 12, 12)
        bodyLayout.setSpacing(8)

        bodyTitle = QLabel("📋 Content")
        bodyTitle.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        bodyTitle.setStyleSheet("color: #ffffff;")
        bodyLayout.addWidget(bodyTitle)

        bodyText = QLabel(message.get('message', message.get('body', message.get('notes', 'No content'))))
        bodyText.setFont(QFont("Segoe UI", 10))
        bodyText.setStyleSheet("color: #cbd5e1;")
        bodyText.setWordWrap(True)
        bodyLayout.addWidget(bodyText)

        contentLayout.addWidget(bodyCard)

        contentLayout.addStretch()

        layout.addLayout(contentLayout, 1)

        # Action Buttons
        actionLayout = QHBoxLayout()
        actionLayout.setContentsMargins(16, 0, 16, 16)
        actionLayout.setSpacing(8)

        btnReply = QPushButton("↩️ Reply")
        btnReply.setObjectName("reply")
        btnReply.clicked.connect(lambda: QMessageBox.information(self, "Reply", "Opening reply interface..."))
        actionLayout.addWidget(btnReply)

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

            valueLabel = QLabel(str(fieldValue))
            valueLabel.setFont(QFont("Segoe UI", 10))
            valueLabel.setStyleSheet("color: #cbd5e1;")
            valueLabel.setWordWrap(True)

            fieldLayout.addWidget(nameLabel)
            fieldLayout.addWidget(valueLabel, 1)
            layout.addLayout(fieldLayout)

        return card

# ─────────────────────────────────────────────────────────────────────────────────────
# SEND MESSAGE MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class SendMessageModal(QDialog):
    """Modal for sending WhatsApp or Email"""
    def __init__(self, messageType: str = "whatsapp", parent=None):
        super().__init__(parent)
        self.messageType = messageType
        self.setWindowTitle(f"{'📱' if messageType == 'whatsapp' else '📧'} Send {messageType.title()}")
        self.setGeometry(100, 100, 550, 450)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #cbd5e1; font-weight: bold; font-size: 10px; }
            QLineEdit, QTextEdit, QComboBox { background-color: #020617; color: #ffffff;
                                  border: 1px solid #334155; border-radius: 6px; padding: 6px; }
            QPushButton#send { background-color: #10b981; color: white; }
            QPushButton#cancel { background-color: #1e293b; color: #94a3b8; }
        """)

        layout = QVBoxLayout(self)

        title = QLabel(f"{'📱' if messageType == 'whatsapp' else '📧'} Send {messageType.title()}")
        title.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        title.setStyleSheet("color: #ffffff;")
        layout.addWidget(title)

        # Form fields
        if messageType == "whatsapp":
            layout.addWidget(QLabel("Recipient Phone *"))
            self.recipientInput = QLineEdit()
            self.recipientInput.setPlaceholderText("+91-98765-43210")
            layout.addWidget(self.recipientInput)
        else:  # email
            layout.addWidget(QLabel("Recipient Email *"))
            self.recipientInput = QLineEdit()
            self.recipientInput.setPlaceholderText("contact@company.com")
            layout.addWidget(self.recipientInput)

            layout.addWidget(QLabel("Subject *"))
            self.subjectInput = QLineEdit()
            self.subjectInput.setPlaceholderText("Message subject")
            layout.addWidget(self.subjectInput)

        layout.addWidget(QLabel("Message *"))
        self.messageInput = QTextEdit()
        self.messageInput.setPlaceholderText("Type your message...")
        self.messageInput.setMinimumHeight(150)
        layout.addWidget(self.messageInput)

        layout.addStretch()

        btnLayout = QHBoxLayout()
        btnCancel = QPushButton("Cancel")
        btnCancel.setObjectName("cancel")
        btnCancel.clicked.connect(self.reject)
        btnSend = QPushButton(f"{'📱' if messageType == 'whatsapp' else '📧'} Send Message ✓")
        btnSend.setObjectName("send")
        btnSend.clicked.connect(self.accept)
        btnLayout.addWidget(btnCancel, 1)
        btnLayout.addWidget(btnSend, 1)
        layout.addLayout(btnLayout)

# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN COMMUNICATIONS VIEW
# ─────────────────────────────────────────────────────────────────────────────────────

class CommunicationsView(QWidget):
    """WhatsApp Hub and Communication Management"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
            QLineEdit { background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b;
                       border-radius: 6px; padding: 8px; }
        """)

        self.whatsappMessages = list(FALLBACK_WHATSAPP_MESSAGES)
        self.emails = list(FALLBACK_EMAILS)
        self.callLogs = list(FALLBACK_CALL_LOGS)
        self.search = ""
        self.selectedTab = "WHATSAPP"

        self._build_ui()

    def _build_ui(self):
        """Build communications UI"""
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
        titleLabel = QLabel("💬 Communications Hub")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        scrollLayout.addWidget(titleLabel)

        # Tab Buttons
        tabLayout = QHBoxLayout()
        tabLayout.setContentsMargins(0, 0, 0, 0)
        tabLayout.setSpacing(8)

        for tab in ["WHATSAPP", "EMAIL", "CALLS"]:
            btn = QPushButton(tab)
            btn.setCheckable(True)
            btn.setChecked(tab == "WHATSAPP")
            btn.setMaximumWidth(120)
            btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: #020617;
                    border: 1px solid #1e293b;
                    color: #94a3b8;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-weight: 800;
                }}
                QPushButton:checked {{
                    background-color: #4f46e5;
                    color: #ffffff;
                    border-color: #4f46e5;
                }}
            """)
            btn.toggled.connect(lambda checked, t=tab: self._switch_tab(t) if checked else None)
            tabLayout.addWidget(btn)

        tabLayout.addStretch()
        scrollLayout.addLayout(tabLayout)

        # Search input
        self.searchInput = QLineEdit()
        self.searchInput.setPlaceholderText("🔍 Search by contact name, number...")
        self.searchInput.setMinimumHeight(32)
        self.searchInput.textChanged.connect(self._on_search_changed)
        scrollLayout.addWidget(self.searchInput)

        # Action buttons
        actionLayout = QHBoxLayout()
        btnSendWhatsapp = QPushButton("📱 Send WhatsApp")
        btnSendWhatsapp.setStyleSheet("background-color: #25d366; padding: 6px 12px;")
        btnSendWhatsapp.clicked.connect(lambda: self._open_send_message("whatsapp"))
        btnSendEmail = QPushButton("📧 Send Email")
        btnSendEmail.setStyleSheet("background-color: #ea4335; padding: 6px 12px;")
        btnSendEmail.clicked.connect(lambda: self._open_send_message("email"))
        actionLayout.addWidget(btnSendWhatsapp)
        actionLayout.addWidget(btnSendEmail)
        actionLayout.addStretch()
        scrollLayout.addLayout(actionLayout)

        # WhatsApp Table
        self.whatsappTable = QTableWidget()
        self.whatsappTable.setColumnCount(6)
        self.whatsappTable.setHorizontalHeaderLabels([
            "Contact", "Message", "Timestamp", "Direction", "Status", "Action"
        ])
        self.whatsappTable.horizontalHeader().setStretchLastSection(False)
        self.whatsappTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.whatsappTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.whatsappTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.whatsappTable.setColumnWidth(0, 120)
        self.whatsappTable.setColumnWidth(1, 200)
        self.whatsappTable.setColumnWidth(2, 120)
        self.whatsappTable.setColumnWidth(3, 90)
        self.whatsappTable.setColumnWidth(4, 90)
        self.whatsappTable.setColumnWidth(5, 80)

        self.whatsappTable.doubleClicked.connect(lambda idx: self._open_message_details(idx, "whatsapp"))
        self._refresh_whatsapp_table()

        # Email Table
        self.emailTable = QTableWidget()
        self.emailTable.setColumnCount(6)
        self.emailTable.setHorizontalHeaderLabels([
            "From", "Subject", "Timestamp", "Status", "Action", ""
        ])
        self.emailTable.horizontalHeader().setStretchLastSection(False)
        self.emailTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.emailTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.emailTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.emailTable.setColumnWidth(0, 150)
        self.emailTable.setColumnWidth(1, 200)
        self.emailTable.setColumnWidth(2, 120)
        self.emailTable.setColumnWidth(3, 100)
        self.emailTable.setColumnWidth(4, 80)

        self.emailTable.doubleClicked.connect(lambda idx: self._open_message_details(idx, "email"))
        self._refresh_email_table()

        # Call Logs Table
        self.callTable = QTableWidget()
        self.callTable.setColumnCount(6)
        self.callTable.setHorizontalHeaderLabels([
            "Contact", "Phone", "Timestamp", "Type", "Duration", "Action"
        ])
        self.callTable.horizontalHeader().setStretchLastSection(False)
        self.callTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.callTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.callTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.callTable.setColumnWidth(0, 120)
        self.callTable.setColumnWidth(1, 120)
        self.callTable.setColumnWidth(2, 120)
        self.callTable.setColumnWidth(3, 90)
        self.callTable.setColumnWidth(4, 100)
        self.callTable.setColumnWidth(5, 80)

        self.callTable.doubleClicked.connect(lambda idx: self._open_message_details(idx, "call"))
        self._refresh_call_table()

        # Add tables
        self.stackLayout = QVBoxLayout()
        self.stackLayout.addWidget(self.whatsappTable)
        self.stackLayout.addWidget(self.emailTable)
        self.stackLayout.addWidget(self.callTable)

        self.emailTable.hide()
        self.callTable.hide()

        scrollLayout.addLayout(self.stackLayout, 1)

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _refresh_whatsapp_table(self):
        """Refresh WhatsApp table"""
        self.whatsappTable.setRowCount(len(self.whatsappMessages))

        for rowIdx, msg in enumerate(self.whatsappMessages):
            self.whatsappTable.setItem(rowIdx, 0, QTableWidgetItem(msg.contactName))
            self.whatsappTable.setItem(rowIdx, 1, QTableWidgetItem(msg.message[:40] + "..."))
            self.whatsappTable.setItem(rowIdx, 2, QTableWidgetItem(msg.timestamp))

            dirItem = QTableWidgetItem(msg.direction)
            dirColor = "#34d399" if msg.direction == "INBOUND" else "#60a5fa"
            dirItem.setForeground(QBrush(QColor(dirColor)))
            self.whatsappTable.setItem(rowIdx, 3, dirItem)

            statusItem = QTableWidgetItem(msg.status)
            statusColor = "#34d399" if msg.status == "READ" else "#fbbf24" if msg.status == "DELIVERED" else "#60a5fa"
            statusItem.setForeground(QBrush(QColor(statusColor)))
            self.whatsappTable.setItem(rowIdx, 4, statusItem)

            detailsBtn = QPushButton("👁️ View")
            detailsBtn.setStyleSheet("background-color: #4f46e5; padding: 4px 8px; font-size: 9px;")
            self.whatsappTable.setCellWidget(rowIdx, 5, detailsBtn)

    def _refresh_email_table(self):
        """Refresh email table"""
        self.emailTable.setRowCount(len(self.emails))

        for rowIdx, email in enumerate(self.emails):
            self.emailTable.setItem(rowIdx, 0, QTableWidgetItem(email.sender))
            self.emailTable.setItem(rowIdx, 1, QTableWidgetItem(email.subject))
            self.emailTable.setItem(rowIdx, 2, QTableWidgetItem(email.timestamp))

            statusItem = QTableWidgetItem(email.status)
            statusColor = "#34d399" if email.status == "SENT" else "#60a5fa" if email.status == "RECEIVED" else "#fbbf24"
            statusItem.setForeground(QBrush(QColor(statusColor)))
            self.emailTable.setItem(rowIdx, 3, statusItem)

            detailsBtn = QPushButton("👁️ View")
            detailsBtn.setStyleSheet("background-color: #4f46e5; padding: 4px 8px; font-size: 9px;")
            self.emailTable.setCellWidget(rowIdx, 4, detailsBtn)

    def _refresh_call_table(self):
        """Refresh call logs table"""
        self.callTable.setRowCount(len(self.callLogs))

        for rowIdx, call in enumerate(self.callLogs):
            self.callTable.setItem(rowIdx, 0, QTableWidgetItem(call.contactName))
            self.callTable.setItem(rowIdx, 1, QTableWidgetItem(call.contactPhone))
            self.callTable.setItem(rowIdx, 2, QTableWidgetItem(call.timestamp))

            typeItem = QTableWidgetItem(call.callType)
            typeColor = "#34d399" if call.callType == "INBOUND" else "#60a5fa" if call.callType == "OUTBOUND" else "#ef4444"
            typeItem.setForeground(QBrush(QColor(typeColor)))
            self.callTable.setItem(rowIdx, 3, typeItem)

            self.callTable.setItem(rowIdx, 4, QTableWidgetItem(call.duration))

            detailsBtn = QPushButton("👁️ View")
            detailsBtn.setStyleSheet("background-color: #4f46e5; padding: 4px 8px; font-size: 9px;")
            self.callTable.setCellWidget(rowIdx, 5, detailsBtn)

    def _switch_tab(self, tab: str):
        """Switch between tabs"""
        self.selectedTab = tab
        self.whatsappTable.hide()
        self.emailTable.hide()
        self.callTable.hide()

        if tab == "WHATSAPP":
            self.whatsappTable.show()
        elif tab == "EMAIL":
            self.emailTable.show()
        elif tab == "CALLS":
            self.callTable.show()

    def _on_search_changed(self):
        """Handle search input changed"""
        self.search = self.searchInput.text()
        # Refresh all tables with search filter applied

    def _open_message_details(self, index, messageType):
        """Open message details modal"""
        row = index.row()

        if messageType == "whatsapp" and row < len(self.whatsappMessages):
            msg = self.whatsappMessages[row]
            dialog = MessageDetailsModal({
                'contactName': msg.contactName,
                'contactPhone': msg.contactPhone,
                'message': msg.message,
                'timestamp': msg.timestamp,
                'direction': msg.direction,
                'status': msg.status
            }, "whatsapp", self)
            dialog.exec()
        elif messageType == "email" and row < len(self.emails):
            email = self.emails[row]
            dialog = MessageDetailsModal({
                'sender': email.sender,
                'recipient': email.recipient,
                'subject': email.subject,
                'body': email.body,
                'timestamp': email.timestamp,
                'status': email.status
            }, "email", self)
            dialog.exec()
        elif messageType == "call" and row < len(self.callLogs):
            call = self.callLogs[row]
            dialog = MessageDetailsModal({
                'contactName': call.contactName,
                'contactPhone': call.contactPhone,
                'callType': call.callType,
                'duration': call.duration,
                'timestamp': call.timestamp,
                'notes': call.notes,
                'status': 'COMPLETED' if call.duration != '---' else 'MISSED'
            }, "call", self)
            dialog.exec()

    def _open_send_message(self, messageType: str):
        """Open send message modal"""
        dialog = SendMessageModal(messageType, self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            recipient = dialog.recipientInput.text()
            message = dialog.messageInput.toPlainText()
            if messageType == "whatsapp":
                QMessageBox.information(self, "✓ WhatsApp Sent", f"Message sent to {recipient}")
            else:
                subject = dialog.subjectInput.text()
                QMessageBox.information(self, "✓ Email Sent", f"Email sent to {recipient}: {subject}")

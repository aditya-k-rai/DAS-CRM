"""
IntegrationsView.py — DAS CRM Windows
Third-Party Integration Management and Configuration
Feature parity with Android IntegrationsScreen.tsx
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit,
    QScrollArea, QFrame, QTableWidget, QTableWidgetItem, QAbstractItemView,
    QMessageBox, QDialog, QComboBox, QCheckBox, QTextEdit
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont, QBrush, QColor
from dataclasses import dataclass

# ─────────────────────────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class Integration:
    """Third-party integration record"""
    id: str
    name: str
    category: str  # CRM, COMMUNICATION, ANALYTICS, PAYMENT, STORAGE, OTHER
    provider: str  # Salesforce, Slack, Mailchimp, Stripe, etc.
    status: str  # ACTIVE, INACTIVE, ERROR
    lastSyncedAt: str
    syncEnabled: bool
    apiKey: str  # masked in UI

INTEGRATION_CATEGORIES = [
    "CRM",
    "COMMUNICATION",
    "ANALYTICS",
    "PAYMENT",
    "STORAGE",
    "OTHER"
]

FALLBACK_INTEGRATIONS = [
    Integration("i1", "Salesforce Sync", "CRM", "Salesforce", "ACTIVE", "2 hours ago", True, "****...key1"),
    Integration("i2", "Slack Notifications", "COMMUNICATION", "Slack", "ACTIVE", "1 hour ago", True, "****...key2"),
    Integration("i3", "Google Analytics", "ANALYTICS", "Google", "ACTIVE", "3 hours ago", True, "****...key3"),
    Integration("i4", "Stripe Payments", "PAYMENT", "Stripe", "INACTIVE", "Never", False, "****...key4"),
    Integration("i5", "AWS S3 Storage", "STORAGE", "Amazon", "ACTIVE", "30 minutes ago", True, "****...key5"),
]

# ─────────────────────────────────────────────────────────────────────────────────────
# INTEGRATION DETAILS MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class IntegrationDetailsModal(QDialog):
    """Modal showing detailed integration information"""
    def __init__(self, integration: Integration, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"🔗 Integration - {integration.name}")
        self.setGeometry(100, 100, 550, 500)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #f8fafc; }
            QPushButton { padding: 8px 12px; border-radius: 6px; font-weight: bold; }
            QPushButton#edit { background-color: #f97316; color: white; }
            QPushButton#test { background-color: #4f46e5; color: white; }
            QPushButton#disconnect { background-color: #ef4444; color: white; }
            QPushButton#close { background-color: #1e293b; color: #94a3b8; }
        """)

        layout = QVBoxLayout(self)

        # Header
        headerLayout = QHBoxLayout()
        headerLayout.setContentsMargins(16, 16, 16, 12)

        titleLabel = QLabel(f"🔗 {integration.name}")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        headerLayout.addWidget(titleLabel)
        headerLayout.addStretch()

        statusLabel = QLabel(integration.status)
        statusLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        statusColor = "#34d399" if integration.status == "ACTIVE" else "#fbbf24" if integration.status == "INACTIVE" else "#ef4444"
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

        # Integration Info
        infoCard = self._build_info_section(
            "📋 Integration Details",
            [
                ("Name", integration.name),
                ("Provider", integration.provider),
                ("Category", integration.category),
                ("Status", integration.status),
                ("Last Synced", integration.lastSyncedAt),
            ]
        )
        contentLayout.addWidget(infoCard)

        # Sync Status
        syncCard = self._build_info_section(
            "🔄 Sync Status",
            [
                ("Auto Sync", "Enabled" if integration.syncEnabled else "Disabled"),
                ("Sync Frequency", "Real-time" if integration.syncEnabled else "Manual"),
            ]
        )
        contentLayout.addWidget(syncCard)

        contentLayout.addStretch()

        layout.addLayout(contentLayout, 1)

        # Action Buttons
        actionLayout = QHBoxLayout()
        actionLayout.setContentsMargins(16, 0, 16, 16)
        actionLayout.setSpacing(8)

        btnTest = QPushButton("🧪 Test Connection")
        btnTest.setObjectName("test")
        btnTest.clicked.connect(lambda: QMessageBox.information(self, "Test", f"Testing {integration.name}..."))
        actionLayout.addWidget(btnTest)

        btnDisconnect = QPushButton("🔌 Disconnect")
        btnDisconnect.setObjectName("disconnect")
        btnDisconnect.clicked.connect(lambda: QMessageBox.question(self, "⚠️ Disconnect?", f"Disconnect {integration.name}?"))
        actionLayout.addWidget(btnDisconnect)

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
            nameLabel.setMaximumWidth(120)

            valueLabel = QLabel(fieldValue)
            valueLabel.setFont(QFont("Segoe UI", 10))
            valueLabel.setStyleSheet("color: #cbd5e1;")
            valueLabel.setWordWrap(True)

            fieldLayout.addWidget(nameLabel)
            fieldLayout.addWidget(valueLabel, 1)
            layout.addLayout(fieldLayout)

        return card

# ─────────────────────────────────────────────────────────────────────────────────────
# ADD INTEGRATION MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class AddIntegrationModal(QDialog):
    """Modal for adding new integration"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("🔗 Add New Integration")
        self.setGeometry(100, 100, 550, 500)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #cbd5e1; font-weight: bold; font-size: 10px; }
            QLineEdit, QTextEdit, QComboBox { background-color: #020617; color: #ffffff;
                                  border: 1px solid #334155; border-radius: 6px; padding: 6px; }
            QPushButton#add { background-color: #10b981; color: white; }
            QPushButton#cancel { background-color: #1e293b; color: #94a3b8; }
        """)

        layout = QVBoxLayout(self)

        title = QLabel("🔗 Add New Integration")
        title.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        title.setStyleSheet("color: #ffffff;")
        layout.addWidget(title)

        desc = QLabel("Connect a third-party service to DAS CRM.")
        desc.setStyleSheet("color: #94a3b8; margin-bottom: 12px;")
        layout.addWidget(desc)

        # Form fields
        layout.addWidget(QLabel("Integration Name *"))
        self.nameInput = QLineEdit()
        self.nameInput.setPlaceholderText("e.g. Salesforce Sync")
        layout.addWidget(self.nameInput)

        layout.addWidget(QLabel("Provider *"))
        self.providerCombo = QComboBox()
        self.providerCombo.addItems(["Salesforce", "Slack", "Google", "Stripe", "AWS", "Microsoft", "Other"])
        layout.addWidget(self.providerCombo)

        layout.addWidget(QLabel("Category *"))
        self.categoryCombo = QComboBox()
        self.categoryCombo.addItems(INTEGRATION_CATEGORIES)
        layout.addWidget(self.categoryCombo)

        layout.addWidget(QLabel("API Key / Token *"))
        self.apiKeyInput = QLineEdit()
        self.apiKeyInput.setPlaceholderText("Paste your API key or token")
        self.apiKeyInput.setEchoMode(QLineEdit.EchoMode.Password)
        layout.addWidget(self.apiKeyInput)

        self.enableSyncCheckbox = QCheckBox("Enable Auto Sync")
        self.enableSyncCheckbox.setChecked(True)
        layout.addWidget(self.enableSyncCheckbox)

        layout.addStretch()

        btnLayout = QHBoxLayout()
        btnCancel = QPushButton("Cancel")
        btnCancel.setObjectName("cancel")
        btnCancel.clicked.connect(self.reject)
        btnAdd = QPushButton("🔗 Add Integration ✓")
        btnAdd.setObjectName("add")
        btnAdd.clicked.connect(self.accept)
        btnLayout.addWidget(btnCancel, 1)
        btnLayout.addWidget(btnAdd, 1)
        layout.addLayout(btnLayout)

# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN INTEGRATIONS VIEW
# ─────────────────────────────────────────────────────────────────────────────────────

class IntegrationsView(QWidget):
    """Third-Party Integration Management"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
            QLineEdit { background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b;
                       border-radius: 6px; padding: 8px; }
        """)

        self.integrationsList = list(FALLBACK_INTEGRATIONS)
        self.search = ""

        self._build_ui()

    def _build_ui(self):
        """Build integrations UI"""
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
        titleLabel = QLabel("🔗 Integrations")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        scrollLayout.addWidget(titleLabel)

        # Search & Filter Bar
        searchLayout = QVBoxLayout()
        searchLayout.setContentsMargins(0, 0, 0, 0)
        searchLayout.setSpacing(8)

        # Search input
        self.searchInput = QLineEdit()
        self.searchInput.setPlaceholderText("🔍 Search by integration name, provider...")
        self.searchInput.setMinimumHeight(32)
        self.searchInput.textChanged.connect(self._on_search_changed)
        searchLayout.addWidget(self.searchInput)

        # Action buttons
        actionLayout = QHBoxLayout()
        btnAdd = QPushButton("🔗 Add Integration")
        btnAdd.setStyleSheet("background-color: #10b981; padding: 6px 12px;")
        btnAdd.clicked.connect(self._open_add_integration)
        actionLayout.addWidget(btnAdd)

        actionLayout.addStretch()
        searchLayout.addLayout(actionLayout)

        scrollLayout.addLayout(searchLayout)

        # Integrations Table
        self.integrationsTable = QTableWidget()
        self.integrationsTable.setColumnCount(6)
        self.integrationsTable.setHorizontalHeaderLabels([
            "Name", "Provider", "Category", "Status", "Last Synced", "Action"
        ])
        self.integrationsTable.horizontalHeader().setStretchLastSection(False)
        self.integrationsTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.integrationsTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.integrationsTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.integrationsTable.setColumnWidth(0, 150)
        self.integrationsTable.setColumnWidth(1, 120)
        self.integrationsTable.setColumnWidth(2, 110)
        self.integrationsTable.setColumnWidth(3, 90)
        self.integrationsTable.setColumnWidth(4, 120)
        self.integrationsTable.setColumnWidth(5, 80)

        self.integrationsTable.doubleClicked.connect(self._open_integration_details)

        self._refresh_integrations_table()

        scrollLayout.addWidget(self.integrationsTable, 1)

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _refresh_integrations_table(self):
        """Refresh integrations table"""
        filtered = self._get_filtered_integrations()

        self.integrationsTable.setRowCount(len(filtered))

        for rowIdx, integration in enumerate(filtered):
            self.integrationsTable.setItem(rowIdx, 0, QTableWidgetItem(integration.name))
            self.integrationsTable.setItem(rowIdx, 1, QTableWidgetItem(integration.provider))
            self.integrationsTable.setItem(rowIdx, 2, QTableWidgetItem(integration.category))

            statusItem = QTableWidgetItem(integration.status)
            statusColor = "#34d399" if integration.status == "ACTIVE" else "#fbbf24" if integration.status == "INACTIVE" else "#ef4444"
            statusItem.setForeground(QBrush(QColor(statusColor)))
            self.integrationsTable.setItem(rowIdx, 3, statusItem)

            self.integrationsTable.setItem(rowIdx, 4, QTableWidgetItem(integration.lastSyncedAt))

            detailsBtn = QPushButton("👁️ View")
            detailsBtn.setStyleSheet("background-color: #4f46e5; padding: 4px 8px; font-size: 9px;")
            self.integrationsTable.setCellWidget(rowIdx, 5, detailsBtn)

    def _get_filtered_integrations(self) -> list:
        """Get filtered integrations"""
        result = []

        for integration in self.integrationsList:
            # Search filter
            if self.search.strip():
                q = self.search.lower()
                matches = (
                    q in integration.name.lower() or
                    q in integration.provider.lower()
                )
                if not matches:
                    continue

            result.append(integration)

        return result

    def _on_search_changed(self):
        """Handle search input changed"""
        self.search = self.searchInput.text()
        self._refresh_integrations_table()

    def _open_add_integration(self):
        """Open add integration modal"""
        dialog = AddIntegrationModal(self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            name = dialog.nameInput.text()
            QMessageBox.information(self, "✓ Integration Added", f"Added integration: {name}")

    def _open_integration_details(self, index):
        """Open integration details modal"""
        row = index.row()
        filtered = self._get_filtered_integrations()

        if row < len(filtered):
            integration = filtered[row]
            dialog = IntegrationDetailsModal(integration, self)
            dialog.exec()

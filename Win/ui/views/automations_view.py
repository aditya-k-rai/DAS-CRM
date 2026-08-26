"""
AutomationsView.py — DAS CRM Windows
Workflow Automation Engine with Rules and Triggers
Feature parity with Android AutomationsScreen.tsx
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit,
    QScrollArea, QFrame, QTableWidget, QTableWidgetItem, QAbstractItemView,
    QMessageBox, QDialog, QComboBox, QCheckBox, QSpinBox
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont, QBrush, QColor
from dataclasses import dataclass

# ─────────────────────────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class AutomationRule:
    """Represents an automation rule"""
    id: str
    name: str
    description: str
    trigger: str  # LEAD_CREATED, DEAL_UPDATED, EMAIL_OPENED, etc.
    action: str  # SEND_EMAIL, ASSIGN_TASK, UPDATE_FIELD, NOTIFY, etc.
    isActive: bool
    executionCount: int
    lastExecuted: str

TRIGGER_OPTIONS = [
    "LEAD_CREATED",
    "DEAL_UPDATED",
    "EMAIL_OPENED",
    "CALL_COMPLETED",
    "MEETING_SCHEDULED",
    "QUOTATION_SENT",
]

ACTION_OPTIONS = [
    "SEND_EMAIL",
    "ASSIGN_TASK",
    "UPDATE_FIELD",
    "NOTIFY_TEAM",
    "CREATE_ACTIVITY",
    "SEND_SMS",
]

FALLBACK_AUTOMATIONS = [
    AutomationRule("a1", "Auto-assign new leads", "Automatically assign leads to sales reps",
                  "LEAD_CREATED", "ASSIGN_TASK", True, 342, "2 hours ago"),
    AutomationRule("a2", "Send follow-up email", "Send email 24h after lead creation",
                  "LEAD_CREATED", "SEND_EMAIL", True, 156, "1 day ago"),
    AutomationRule("a3", "Update deal stage", "Auto-update deal status based on activity",
                  "CALL_COMPLETED", "UPDATE_FIELD", True, 89, "3 days ago"),
    AutomationRule("a4", "Meeting notification", "Notify team when meeting is scheduled",
                  "MEETING_SCHEDULED", "NOTIFY_TEAM", False, 0, "Never"),
    AutomationRule("a5", "Quotation reminder", "Send reminder 3 days before quotation expires",
                  "QUOTATION_SENT", "SEND_EMAIL", True, 23, "5 days ago"),
]

# ─────────────────────────────────────────────────────────────────────────────────────
# AUTOMATION DETAILS MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class AutomationDetailsModal(QDialog):
    """Modal showing detailed automation information"""
    def __init__(self, automation: AutomationRule, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"⚙️ Automation - {automation.name}")
        self.setGeometry(100, 100, 550, 500)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #f8fafc; }
            QPushButton { padding: 8px 12px; border-radius: 6px; font-weight: bold; }
            QPushButton#edit { background-color: #f97316; color: white; }
            QPushButton#toggle { background-color: #4f46e5; color: white; }
            QPushButton#close { background-color: #1e293b; color: #94a3b8; }
        """)

        layout = QVBoxLayout(self)

        # Header
        headerLayout = QHBoxLayout()
        headerLayout.setContentsMargins(16, 16, 16, 12)

        titleLabel = QLabel(f"⚙️ {automation.name}")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        headerLayout.addWidget(titleLabel)
        headerLayout.addStretch()

        statusLabel = QLabel("ACTIVE" if automation.isActive else "INACTIVE")
        statusLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        statusColor = "#34d399" if automation.isActive else "#ef4444"
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

        # Automation Info
        infoCard = self._build_info_section(
            "📋 Automation Details",
            [
                ("Name", automation.name),
                ("Description", automation.description),
                ("Trigger", automation.trigger),
                ("Action", automation.action),
            ]
        )
        contentLayout.addWidget(infoCard)

        # Statistics
        statsCard = self._build_info_section(
            "📊 Statistics",
            [
                ("Execution Count", str(automation.executionCount)),
                ("Last Executed", automation.lastExecuted),
                ("Status", "Active" if automation.isActive else "Inactive"),
            ]
        )
        contentLayout.addWidget(statsCard)

        contentLayout.addStretch()

        layout.addLayout(contentLayout, 1)

        # Action Buttons
        actionLayout = QHBoxLayout()
        actionLayout.setContentsMargins(16, 0, 16, 16)
        actionLayout.setSpacing(8)

        btnEdit = QPushButton("✏️ Edit")
        btnEdit.setObjectName("edit")
        btnEdit.clicked.connect(lambda: QMessageBox.information(self, "Edit", f"Editing {automation.name}..."))
        actionLayout.addWidget(btnEdit)

        btnToggle = QPushButton("🔄 Toggle")
        btnToggle.setObjectName("toggle")
        btnToggle.clicked.connect(lambda: QMessageBox.information(self, "Toggle", f"Toggled {automation.name}..."))
        actionLayout.addWidget(btnToggle)

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
# CREATE AUTOMATION MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class CreateAutomationModal(QDialog):
    """Modal for creating new automation"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("➕ Create New Automation")
        self.setGeometry(100, 100, 550, 550)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #cbd5e1; font-weight: bold; font-size: 10px; }
            QLineEdit, QComboBox { background-color: #020617; color: #ffffff;
                                  border: 1px solid #334155; border-radius: 6px; padding: 6px; }
            QPushButton#create { background-color: #10b981; color: white; }
            QPushButton#cancel { background-color: #1e293b; color: #94a3b8; }
        """)

        layout = QVBoxLayout(self)

        title = QLabel("➕ Create New Automation")
        title.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        title.setStyleSheet("color: #ffffff;")
        layout.addWidget(title)

        desc = QLabel("Set up a new workflow automation rule.")
        desc.setStyleSheet("color: #94a3b8; margin-bottom: 12px;")
        layout.addWidget(desc)

        # Form fields
        layout.addWidget(QLabel("Rule Name *"))
        self.nameInput = QLineEdit()
        self.nameInput.setPlaceholderText("e.g. Auto-assign new leads")
        layout.addWidget(self.nameInput)

        layout.addWidget(QLabel("Description"))
        self.descInput = QLineEdit()
        self.descInput.setPlaceholderText("What does this automation do?")
        layout.addWidget(self.descInput)

        layout.addWidget(QLabel("When (Trigger) *"))
        self.triggerCombo = QComboBox()
        self.triggerCombo.addItems(TRIGGER_OPTIONS)
        layout.addWidget(self.triggerCombo)

        layout.addWidget(QLabel("Then (Action) *"))
        self.actionCombo = QComboBox()
        self.actionCombo.addItems(ACTION_OPTIONS)
        layout.addWidget(self.actionCombo)

        self.activeCheckbox = QCheckBox("Activate immediately")
        self.activeCheckbox.setChecked(True)
        layout.addWidget(self.activeCheckbox)

        layout.addStretch()

        btnLayout = QHBoxLayout()
        btnCancel = QPushButton("Cancel")
        btnCancel.setObjectName("cancel")
        btnCancel.clicked.connect(self.reject)
        btnCreate = QPushButton("Create Automation ✓")
        btnCreate.setObjectName("create")
        btnCreate.clicked.connect(self.accept)
        btnLayout.addWidget(btnCancel, 1)
        btnLayout.addWidget(btnCreate, 1)
        layout.addLayout(btnLayout)

    def get_automation(self) -> AutomationRule:
        """Return created automation"""
        return AutomationRule(
            id=f"a-{id(self)}",
            name=self.nameInput.text().strip(),
            description=self.descInput.text().strip(),
            trigger=self.triggerCombo.currentText(),
            action=self.actionCombo.currentText(),
            isActive=self.activeCheckbox.isChecked(),
            executionCount=0,
            lastExecuted="Never"
        )

# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN AUTOMATIONS VIEW
# ─────────────────────────────────────────────────────────────────────────────────────

class AutomationsView(QWidget):
    """Workflow Automation Engine"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
            QLineEdit { background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b;
                       border-radius: 6px; padding: 8px; }
        """)

        self.automationsList = list(FALLBACK_AUTOMATIONS)
        self.search = ""

        self._build_ui()

    def _build_ui(self):
        """Build automations UI"""
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
        titleLabel = QLabel("⚙️ Workflow Automations")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        scrollLayout.addWidget(titleLabel)

        # Search & Filter Bar
        searchLayout = QVBoxLayout()
        searchLayout.setContentsMargins(0, 0, 0, 0)
        searchLayout.setSpacing(8)

        # Search input
        self.searchInput = QLineEdit()
        self.searchInput.setPlaceholderText("🔍 Search by rule name, trigger...")
        self.searchInput.setMinimumHeight(32)
        self.searchInput.textChanged.connect(self._on_search_changed)
        searchLayout.addWidget(self.searchInput)

        # Action buttons
        actionLayout = QHBoxLayout()
        btnAdd = QPushButton("➕ New Automation")
        btnAdd.setStyleSheet("background-color: #10b981; padding: 6px 12px;")
        btnAdd.clicked.connect(self._open_create_automation)
        actionLayout.addWidget(btnAdd)

        actionLayout.addStretch()
        searchLayout.addLayout(actionLayout)

        scrollLayout.addLayout(searchLayout)

        # Automations Table
        self.automationsTable = QTableWidget()
        self.automationsTable.setColumnCount(6)
        self.automationsTable.setHorizontalHeaderLabels([
            "Rule Name", "Trigger", "Action", "Status", "Executions", "Last Run"
        ])
        self.automationsTable.horizontalHeader().setStretchLastSection(False)
        self.automationsTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.automationsTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.automationsTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.automationsTable.setColumnWidth(0, 180)
        self.automationsTable.setColumnWidth(1, 140)
        self.automationsTable.setColumnWidth(2, 130)
        self.automationsTable.setColumnWidth(3, 90)
        self.automationsTable.setColumnWidth(4, 100)
        self.automationsTable.setColumnWidth(5, 120)

        self.automationsTable.doubleClicked.connect(self._open_automation_details)

        self._refresh_automations_table()

        scrollLayout.addWidget(self.automationsTable, 1)

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _refresh_automations_table(self):
        """Refresh automations table"""
        filtered = self._get_filtered_automations()

        self.automationsTable.setRowCount(len(filtered))

        for rowIdx, automation in enumerate(filtered):
            self.automationsTable.setItem(rowIdx, 0, QTableWidgetItem(automation.name))
            self.automationsTable.setItem(rowIdx, 1, QTableWidgetItem(automation.trigger))
            self.automationsTable.setItem(rowIdx, 2, QTableWidgetItem(automation.action))

            statusItem = QTableWidgetItem("ACTIVE" if automation.isActive else "INACTIVE")
            statusColor = "#34d399" if automation.isActive else "#ef4444"
            statusItem.setForeground(QBrush(QColor(statusColor)))
            self.automationsTable.setItem(rowIdx, 3, statusItem)

            countItem = QTableWidgetItem(str(automation.executionCount))
            countItem.setForeground(QBrush(QColor("#60a5fa")))
            self.automationsTable.setItem(rowIdx, 4, countItem)

            self.automationsTable.setItem(rowIdx, 5, QTableWidgetItem(automation.lastExecuted))

    def _get_filtered_automations(self) -> list:
        """Get filtered automations"""
        result = []

        for automation in self.automationsList:
            # Search filter
            if self.search.strip():
                q = self.search.lower()
                matches = (
                    q in automation.name.lower() or
                    q in automation.trigger.lower() or
                    q in automation.action.lower()
                )
                if not matches:
                    continue

            result.append(automation)

        return result

    def _on_search_changed(self):
        """Handle search input changed"""
        self.search = self.searchInput.text()
        self._refresh_automations_table()

    def _open_create_automation(self):
        """Open create automation modal"""
        dialog = CreateAutomationModal(self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            automation = dialog.get_automation()
            self.automationsList.insert(0, automation)
            self._refresh_automations_table()
            QMessageBox.information(self, "✓ Automation Created", f"Created automation: {automation.name}")

    def _open_automation_details(self, index):
        """Open automation details modal"""
        row = index.row()
        filtered = self._get_filtered_automations()

        if row < len(filtered):
            automation = filtered[row]
            dialog = AutomationDetailsModal(automation, self)
            dialog.exec()

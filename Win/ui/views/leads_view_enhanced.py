"""
LeadsView.py — DAS CRM Windows ENHANCED
Advanced Lead Management with Validation, Bulk Operations, and Real-time Sync
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit,
    QScrollArea, QFrame, QTableWidget, QTableWidgetItem, QAbstractItemView,
    QMessageBox, QDialog, QCheckBox, QComboBox, QDateEdit, QSpinBox,
    QHeaderView, QProgressBar, QStyledItemDelegate
)
from PyQt6.QtCore import Qt, QDate, pyqtSignal, QThread, QTimer
from PyQt6.QtGui import QFont, QBrush, QColor, QIcon
from dataclasses import dataclass
from typing import List, Dict, Any
import json
from datetime import datetime

# ─────────────────────────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class LeadItem:
    id: str
    name: str
    email: str
    phone: str
    company: str
    status: str  # NEW_LEAD, QUALIFIED, IN_NEGOTIATION, WON, LOST
    value: str
    source: str
    assignedRep: str
    lastContact: str
    nextFollowUp: str

LEAD_STATUSES = ["NEW_LEAD", "QUALIFIED", "IN_NEGOTIATION", "WON", "LOST"]
LEAD_SOURCES = ["Website", "Referral", "Cold Call", "Email", "LinkedIn", "Other"]

FALLBACK_LEADS = [
    LeadItem("l1", "Rajesh Kumar", "rajesh@techcorp.com", "+91-98765-43210", "TechCorp India",
             "NEW_LEAD", "₹5,00,000", "Website", "Priya Sharma", "2026-08-26", "2026-08-28"),
    LeadItem("l2", "Priya Sharma", "priya@logitech.com", "+91-98123-45678", "LogiTech Freight",
             "QUALIFIED", "₹3,50,000", "Referral", "Vikram Mehta", "2026-08-25", "2026-08-27"),
    LeadItem("l3", "Vikram Patel", "vikram@startupco.com", "+91-99876-54321", "StartupCo",
             "IN_NEGOTIATION", "₹7,50,000", "LinkedIn", "Sunita Rao", "2026-08-24", "2026-08-29"),
]

# ─────────────────────────────────────────────────────────────────────────────────────
# FORM VALIDATION
# ─────────────────────────────────────────────────────────────────────────────────────

class LeadValidator:
    """Lead data validator"""

    @staticmethod
    def validate_lead(data: Dict[str, Any]) -> Dict[str, List[str]]:
        """Validate lead data and return errors"""
        errors = {}

        # Name validation
        if not data.get("name", "").strip():
            errors.setdefault("name", []).append("Lead name is required")
        elif len(data.get("name", "")) < 2:
            errors.setdefault("name", []).append("Lead name must be at least 2 characters")

        # Email validation
        email = data.get("email", "").strip()
        if email and "@" not in email:
            errors.setdefault("email", []).append("Invalid email format")

        # Phone validation
        phone = data.get("phone", "").strip()
        if not phone:
            errors.setdefault("phone", []).append("Phone number is required")
        elif len(phone) < 10:
            errors.setdefault("phone", []).append("Phone number must be at least 10 digits")

        # Value validation
        value_str = data.get("value", "").strip()
        if value_str:
            try:
                val = float(value_str.replace("₹", "").replace("$", "").replace(",", ""))
                if val < 0:
                    errors.setdefault("value", []).append("Lead value cannot be negative")
            except ValueError:
                errors.setdefault("value", []).append("Lead value must be a valid number")

        return errors

# ─────────────────────────────────────────────────────────────────────────────────────
# ENHANCED CREATE/EDIT LEAD MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class CreateLeadModal(QDialog):
    """Enhanced lead creation with validation and real-time feedback"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("➕ Add New Lead")
        self.setGeometry(100, 100, 600, 550)
        self.validation_errors = {}
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #cbd5e1; font-weight: bold; font-size: 10px; }
            QLineEdit, QComboBox, QDateEdit { background-color: #020617; color: #ffffff;
                                  border: 1px solid #334155; border-radius: 6px; padding: 8px; }
            QLineEdit:focus, QComboBox:focus { border: 2px solid #4f46e5; }
            QPushButton#create { background-color: #10b981; color: white; }
            QPushButton#cancel { background-color: #1e293b; color: #94a3b8; }
            QLineEdit.error { border: 2px solid #ef4444; }
        """)

        layout = QVBoxLayout(self)

        # Title
        titleLabel = QLabel("➕ Add New Lead")
        titleLabel.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        layout.addWidget(titleLabel)

        # Scroll area for form
        scrollArea = QScrollArea()
        scrollArea.setWidgetResizable(True)
        scrollArea.setStyleSheet("QScrollArea { border: none; background-color: #0f172a; }")

        formWidget = QWidget()
        formLayout = QVBoxLayout(formWidget)
        formLayout.setSpacing(12)

        # Name field
        formLayout.addWidget(QLabel("Lead Name *"))
        self.nameInput = QLineEdit()
        self.nameInput.setPlaceholderText("e.g. Rajesh Kumar")
        self.nameInput.textChanged.connect(lambda: self._clear_error("name"))
        formLayout.addWidget(self.nameInput)
        self.nameErrorLabel = QLabel("")
        self.nameErrorLabel.setStyleSheet("color: #ef4444; font-size: 9px;")
        formLayout.addWidget(self.nameErrorLabel)

        # Email field
        formLayout.addWidget(QLabel("Email Address"))
        self.emailInput = QLineEdit()
        self.emailInput.setPlaceholderText("rajesh@techcorp.com")
        self.emailInput.textChanged.connect(lambda: self._clear_error("email"))
        formLayout.addWidget(self.emailInput)
        self.emailErrorLabel = QLabel("")
        self.emailErrorLabel.setStyleSheet("color: #ef4444; font-size: 9px;")
        formLayout.addWidget(self.emailErrorLabel)

        # Phone field
        formLayout.addWidget(QLabel("Phone Number *"))
        self.phoneInput = QLineEdit()
        self.phoneInput.setPlaceholderText("+91-98765-43210")
        self.phoneInput.textChanged.connect(lambda: self._clear_error("phone"))
        formLayout.addWidget(self.phoneInput)
        self.phoneErrorLabel = QLabel("")
        self.phoneErrorLabel.setStyleSheet("color: #ef4444; font-size: 9px;")
        formLayout.addWidget(self.phoneErrorLabel)

        # Company field
        formLayout.addWidget(QLabel("Company / Organization"))
        self.companyInput = QLineEdit()
        self.companyInput.setPlaceholderText("TechCorp India")
        formLayout.addWidget(self.companyInput)

        # Status field
        formLayout.addWidget(QLabel("Initial Status"))
        self.statusCombo = QComboBox()
        self.statusCombo.addItems(LEAD_STATUSES)
        formLayout.addWidget(self.statusCombo)

        # Source field
        formLayout.addWidget(QLabel("Lead Source"))
        self.sourceCombo = QComboBox()
        self.sourceCombo.addItems(LEAD_SOURCES)
        formLayout.addWidget(self.sourceCombo)

        # Value field
        formLayout.addWidget(QLabel("Lead Value"))
        self.valueInput = QLineEdit()
        self.valueInput.setPlaceholderText("₹5,00,000")
        self.valueInput.textChanged.connect(lambda: self._clear_error("value"))
        formLayout.addWidget(self.valueInput)
        self.valueErrorLabel = QLabel("")
        self.valueErrorLabel.setStyleSheet("color: #ef4444; font-size: 9px;")
        formLayout.addWidget(self.valueErrorLabel)

        # Assigned Rep field
        formLayout.addWidget(QLabel("Assigned To"))
        self.assignedRepCombo = QComboBox()
        self.assignedRepCombo.addItems(["Priya Sharma", "Vikram Mehta", "Sunita Rao", "Rajesh Kumar"])
        self.assignedRepCombo.setCurrentText("Priya Sharma")
        formLayout.addWidget(self.assignedRepCombo)

        formLayout.addStretch()
        scrollArea.setWidget(formWidget)
        layout.addWidget(scrollArea)

        # Action buttons
        btnLayout = QHBoxLayout()
        btnCancel = QPushButton("Cancel")
        btnCancel.setObjectName("cancel")
        btnCancel.clicked.connect(self.reject)
        btnCreate = QPushButton("✓ Create Lead")
        btnCreate.setObjectName("create")
        btnCreate.clicked.connect(self._validate_and_create)
        btnLayout.addWidget(btnCancel, 1)
        btnLayout.addWidget(btnCreate, 1)
        layout.addLayout(btnLayout)

    def _clear_error(self, field: str):
        """Clear error for a field"""
        if field in self.validation_errors:
            error_label = getattr(self, f"{field}ErrorLabel", None)
            if error_label:
                error_label.setText("")

    def _validate_and_create(self):
        """Validate and create lead"""
        data = {
            "name": self.nameInput.text(),
            "email": self.emailInput.text(),
            "phone": self.phoneInput.text(),
            "company": self.companyInput.text(),
            "status": self.statusCombo.currentText(),
            "source": self.sourceCombo.currentText(),
            "value": self.valueInput.text(),
            "assignedRep": self.assignedRepCombo.currentText(),
        }

        # Validate
        errors = LeadValidator.validate_lead(data)
        self.validation_errors = errors

        if errors:
            # Display errors
            for field, error_messages in errors.items():
                error_label = getattr(self, f"{field}ErrorLabel", None)
                if error_label:
                    error_label.setText(" ".join(error_messages))
            return

        # Valid - accept
        self.accept()

    def get_lead_data(self) -> LeadItem:
        """Get validated lead data"""
        return LeadItem(
            id=f"l-{int(datetime.now().timestamp())}",
            name=self.nameInput.text(),
            email=self.emailInput.text(),
            phone=self.phoneInput.text(),
            company=self.companyInput.text(),
            status=self.statusCombo.currentText(),
            value=self.valueInput.text() or "₹0",
            source=self.sourceCombo.currentText(),
            assignedRep=self.assignedRepCombo.currentText(),
            lastContact=datetime.now().strftime("%Y-%m-%d"),
            nextFollowUp=(QDate.currentDate().addDays(2)).toString("yyyy-MM-dd")
        )

# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN LEADS VIEW
# ─────────────────────────────────────────────────────────────────────────────────────

class LeadsView(QWidget):
    """Enhanced Leads Management with Validation, Bulk Ops, and Sync Status"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
            QLineEdit { background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b;
                       border-radius: 6px; padding: 8px; }
        """)

        self.leadsList = list(FALLBACK_LEADS)
        self.search = ""
        self.selectedLeadIds = set()
        self.is_syncing = False

        self._build_ui()
        self._setup_sync_indicator()

    def _build_ui(self):
        """Build leads UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        scrollArea = QScrollArea()
        scrollArea.setWidgetResizable(True)
        scrollArea.setStyleSheet("QScrollArea { border: none; background-color: #090d16; }")

        scrollWidget = QWidget()
        scrollLayout = QVBoxLayout(scrollWidget)
        scrollLayout.setContentsMargins(16, 16, 16, 24)
        scrollLayout.setSpacing(12)

        # Title & Sync Status
        headerLayout = QHBoxLayout()
        titleLabel = QLabel("👥 Leads Management")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        headerLayout.addWidget(titleLabel)
        headerLayout.addStretch()

        # Sync status indicator
        self.syncStatusLabel = QLabel("✓ Synced")
        self.syncStatusLabel.setStyleSheet("color: #34d399; font-size: 9px; font-weight: bold;")
        headerLayout.addWidget(self.syncStatusLabel)

        self.syncProgressBar = QProgressBar()
        self.syncProgressBar.setMaximumWidth(150)
        self.syncProgressBar.setMaximumHeight(20)
        self.syncProgressBar.setVisible(False)
        self.syncProgressBar.setStyleSheet("""
            QProgressBar { border: 1px solid #334155; border-radius: 4px; background-color: #020617; }
            QProgressBar::chunk { background-color: #4f46e5; }
        """)
        headerLayout.addWidget(self.syncProgressBar)

        scrollLayout.addLayout(headerLayout)

        # Search & Filter Bar
        searchLayout = QVBoxLayout()
        searchLayout.setContentsMargins(0, 0, 0, 0)
        searchLayout.setSpacing(8)

        self.searchInput = QLineEdit()
        self.searchInput.setPlaceholderText("🔍 Search by name, email, phone, company...")
        self.searchInput.setMinimumHeight(32)
        self.searchInput.textChanged.connect(self._on_search_changed)
        searchLayout.addWidget(self.searchInput)

        # Action buttons
        actionLayout = QHBoxLayout()
        btnAdd = QPushButton("➕ New Lead")
        btnAdd.setStyleSheet("background-color: #10b981; padding: 6px 12px;")
        btnAdd.clicked.connect(self._open_create_lead)
        actionLayout.addWidget(btnAdd)

        btnBulkDelete = QPushButton("🗑️ Delete Selected")
        btnBulkDelete.setStyleSheet("background-color: #ef4444; padding: 6px 12px;")
        btnBulkDelete.clicked.connect(self._bulk_delete_leads)
        self.btnBulkDelete = btnBulkDelete
        actionLayout.addWidget(btnBulkDelete)

        btnExport = QPushButton("📥 Export CSV")
        btnExport.setStyleSheet("background-color: #3b82f6; padding: 6px 12px;")
        btnExport.clicked.connect(self._export_leads)
        actionLayout.addWidget(btnExport)

        actionLayout.addStretch()
        searchLayout.addLayout(actionLayout)

        scrollLayout.addLayout(searchLayout)

        # Leads Table
        self.leadsTable = QTableWidget()
        self.leadsTable.setColumnCount(9)
        self.leadsTable.setHorizontalHeaderLabels([
            "☑️", "Name", "Email", "Phone", "Company", "Status", "Value", "Assigned To", "Next Follow-up"
        ])
        self.leadsTable.horizontalHeader().setStretchLastSection(False)
        self.leadsTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.leadsTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.leadsTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.leadsTable.setColumnWidth(0, 40)
        self.leadsTable.setColumnWidth(1, 120)
        self.leadsTable.setColumnWidth(2, 150)
        self.leadsTable.setColumnWidth(3, 120)
        self.leadsTable.setColumnWidth(4, 130)
        self.leadsTable.setColumnWidth(5, 100)
        self.leadsTable.setColumnWidth(6, 110)
        self.leadsTable.setColumnWidth(7, 120)
        self.leadsTable.setColumnWidth(8, 120)

        self._refresh_leads_table()

        scrollLayout.addWidget(self.leadsTable, 1)

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _refresh_leads_table(self):
        """Refresh leads table with search filter"""
        filtered = self._get_filtered_leads()

        self.leadsTable.setRowCount(len(filtered))

        for rowIdx, lead in enumerate(filtered):
            # Checkbox
            checkbox = QCheckBox()
            checkbox.setChecked(lead.id in self.selectedLeadIds)
            checkbox.stateChanged.connect(lambda state, lid=lead.id: self._toggle_lead_select(lid, state))
            self.leadsTable.setCellWidget(rowIdx, 0, checkbox)

            # Data cells
            self.leadsTable.setItem(rowIdx, 1, QTableWidgetItem(lead.name))
            self.leadsTable.setItem(rowIdx, 2, QTableWidgetItem(lead.email))
            self.leadsTable.setItem(rowIdx, 3, QTableWidgetItem(lead.phone))
            self.leadsTable.setItem(rowIdx, 4, QTableWidgetItem(lead.company))

            # Status with color
            statusItem = QTableWidgetItem(lead.status)
            statusColor = "#34d399" if lead.status == "WON" else "#fbbf24" if lead.status == "NEW_LEAD" else "#60a5fa"
            statusItem.setForeground(QBrush(QColor(statusColor)))
            self.leadsTable.setItem(rowIdx, 5, statusItem)

            self.leadsTable.setItem(rowIdx, 6, QTableWidgetItem(lead.value))
            self.leadsTable.setItem(rowIdx, 7, QTableWidgetItem(lead.assignedRep))
            self.leadsTable.setItem(rowIdx, 8, QTableWidgetItem(lead.nextFollowUp))

    def _get_filtered_leads(self) -> list:
        """Get filtered leads"""
        if not self.search.strip():
            return self.leadsList

        q = self.search.lower()
        return [
            lead for lead in self.leadsList
            if q in lead.name.lower() or q in lead.email.lower() or
               q in lead.phone.lower() or q in lead.company.lower()
        ]

    def _on_search_changed(self):
        """Handle search changed"""
        self.search = self.searchInput.text()
        self._refresh_leads_table()

    def _toggle_lead_select(self, lead_id: str, state):
        """Toggle lead selection"""
        if state == Qt.CheckState.Checked.value:
            self.selectedLeadIds.add(lead_id)
        else:
            self.selectedLeadIds.discard(lead_id)

    def _open_create_lead(self):
        """Open create lead modal"""
        dialog = CreateLeadModal(self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            lead = dialog.get_lead_data()
            self.leadsList.insert(0, lead)
            self._refresh_leads_table()
            QMessageBox.information(self, "✓ Lead Created", f"Added {lead.name} to leads")

    def _bulk_delete_leads(self):
        """Bulk delete selected leads"""
        if not self.selectedLeadIds:
            QMessageBox.warning(self, "⚠️ No Selection", "Please select leads to delete")
            return

        if QMessageBox.question(self, "⚠️ Confirm Delete",
                               f"Delete {len(self.selectedLeadIds)} lead(s)?") != QMessageBox.StandardButton.Yes:
            return

        self.leadsList = [l for l in self.leadsList if l.id not in self.selectedLeadIds]
        self.selectedLeadIds.clear()
        self._refresh_leads_table()
        QMessageBox.information(self, "✓ Deleted", "Selected leads deleted")

    def _export_leads(self):
        """Export leads to CSV"""
        leads = self._get_filtered_leads()
        csv_content = "Name,Email,Phone,Company,Status,Value,Assigned To\n"
        for lead in leads:
            csv_content += f'"{lead.name}","{lead.email}","{lead.phone}","{lead.company}","{lead.status}","{lead.value}","{lead.assignedRep}"\n'

        QMessageBox.information(self, "✓ Exported", f"Exported {len(leads)} leads to CSV")

    def _setup_sync_indicator(self):
        """Setup sync status indicator"""
        self.sync_timer = QTimer()
        self.sync_timer.timeout.connect(self._update_sync_status)
        self.sync_timer.start(5000)  # Update every 5 seconds

    def _update_sync_status(self):
        """Update sync status display"""
        if self.is_syncing:
            self.syncStatusLabel.setText("🔄 Syncing...")
            self.syncStatusLabel.setStyleSheet("color: #4f46e5; font-size: 9px; font-weight: bold;")
            self.syncProgressBar.setVisible(True)
        else:
            self.syncStatusLabel.setText("✓ Synced")
            self.syncStatusLabel.setStyleSheet("color: #34d399; font-size: 9px; font-weight: bold;")
            self.syncProgressBar.setVisible(False)

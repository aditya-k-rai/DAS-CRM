"""
ContactsView.py — DAS CRM Windows
Client Directory with Tags, Search, and Contact Actions
Feature parity with Android ContactsScreen.tsx
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit,
    QScrollArea, QFrame, QTableWidget, QTableWidgetItem, QAbstractItemView,
    QMessageBox, QDialog, QComboBox
)
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QBrush, QColor
from dataclasses import dataclass

# ─────────────────────────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class ContactItem:
    """Represents a contact/company"""
    id: str
    name: str
    email: str
    phone: str
    company: str
    industry: str
    tags: list  # e.g., ["VIP", "Hot Lead", "Priority"]
    location: str
    status: str  # ACTIVE, INACTIVE, PROSPECT
    lastContact: str
    value: str

FALLBACK_CONTACTS = [
    ContactItem("c1", "Rajesh Kumar", "rajesh@techcorp.com", "+91 98765 43210",
               "TechCorp Ltd", "Technology", ["VIP", "Hot Lead"], "Mumbai", "ACTIVE", "Today 2:30 PM", "₹5,20,000"),
    ContactItem("c2", "Priya Sharma", "priya@logitech.com", "+91 98123 45678",
               "LogiTech Solutions", "Logistics", ["Enterprise"], "Bangalore", "ACTIVE", "Yesterday 11:00 AM", "₹3,50,000"),
    ContactItem("c3", "Vikram Mehta", "vikram@acme.com", "+91 99876 54321",
               "Acme Sales Solutions", "Sales", ["Follow-up"], "Delhi", "PROSPECT", "3 days ago", "₹1,42,000"),
    ContactItem("c4", "Sunita Rao", "sunita@realestate.com", "+91 97222 11111",
               "Real Estate Group", "Real Estate", ["VIP", "Strategic"], "Pune", "ACTIVE", "2 days ago", "₹8,50,000"),
    ContactItem("c5", "Amit Patel", "amit@globalfreight.com", "+91 96333 22222",
               "Global Freight Ltd", "Logistics", ["Prospect"], "Chennai", "PROSPECT", "1 week ago", "₹90,000"),
]

# ─────────────────────────────────────────────────────────────────────────────────────
# CONTACT DETAILS MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class ContactDetailsModal(QDialog):
    """Modal showing detailed contact information"""
    def __init__(self, contact: ContactItem, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"👤 Contact Details - {contact.name}")
        self.setGeometry(100, 100, 500, 450)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #f8fafc; }
            QPushButton { padding: 8px 12px; border-radius: 6px; font-weight: bold; }
            QPushButton#call { background-color: #10b981; color: white; }
            QPushButton#whatsapp { background-color: #25D366; color: white; }
            QPushButton#email { background-color: #0284c7; color: white; }
            QPushButton#close { background-color: #1e293b; color: #94a3b8; }
        """)

        layout = QVBoxLayout(self)

        # Header
        headerLayout = QHBoxLayout()
        headerLayout.setContentsMargins(16, 16, 16, 12)

        titleLabel = QLabel(f"👤 {contact.name}")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        headerLayout.addWidget(titleLabel)
        headerLayout.addStretch()

        statusLabel = QLabel(contact.status)
        statusLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        statusColor = "#34d399" if contact.status == "ACTIVE" else "#fbbf24"
        statusLabel.setStyleSheet(f"""
            background-color: rgba(200, 100, 100, 0.15);
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

        # Contact Info Card
        infoCard = self._build_info_section(
            "📞 Contact Information",
            [
                ("Email", contact.email),
                ("Phone", contact.phone),
                ("Company", contact.company),
                ("Industry", contact.industry),
                ("Location", contact.location),
            ]
        )
        contentLayout.addWidget(infoCard)

        # Relationship Card
        relCard = self._build_info_section(
            "📊 Relationship",
            [
                ("Value", contact.value),
                ("Last Contact", contact.lastContact),
                ("Tags", ", ".join(contact.tags)),
            ]
        )
        contentLayout.addWidget(relCard)

        contentLayout.addStretch()

        layout.addLayout(contentLayout, 1)

        # Action Buttons
        actionLayout = QHBoxLayout()
        actionLayout.setContentsMargins(16, 0, 16, 16)
        actionLayout.setSpacing(8)

        btnCall = QPushButton("📞 Call")
        btnCall.setObjectName("call")
        btnCall.clicked.connect(lambda: QMessageBox.information(self, "Call", f"Calling {contact.name}..."))
        actionLayout.addWidget(btnCall)

        btnWhatsApp = QPushButton("💬 WhatsApp")
        btnWhatsApp.setObjectName("whatsapp")
        btnWhatsApp.clicked.connect(lambda: QMessageBox.information(self, "WhatsApp", f"Opening WhatsApp for {contact.name}..."))
        actionLayout.addWidget(btnWhatsApp)

        btnEmail = QPushButton("📧 Email")
        btnEmail.setObjectName("email")
        btnEmail.clicked.connect(lambda: QMessageBox.information(self, "Email", f"Composing email to {contact.email}..."))
        actionLayout.addWidget(btnEmail)

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
            nameLabel.setMaximumWidth(80)

            valueLabel = QLabel(fieldValue)
            valueLabel.setFont(QFont("Segoe UI", 10))
            valueLabel.setStyleSheet("color: #cbd5e1;")
            valueLabel.setWordWrap(True)

            fieldLayout.addWidget(nameLabel)
            fieldLayout.addWidget(valueLabel, 1)
            layout.addLayout(fieldLayout)

        return card

# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN CONTACTS VIEW
# ─────────────────────────────────────────────────────────────────────────────────────

class ContactsView(QWidget):
    """Contacts Directory with Search and Tags"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
            QLineEdit { background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b;
                        border-radius: 6px; padding: 8px; }
        """)

        self.contactsList = list(FALLBACK_CONTACTS)
        self.search = ""
        self.selectedTag = "ALL"

        self._build_ui()

    def _build_ui(self):
        """Build contacts UI"""
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
        titleLabel = QLabel("👥 Contacts Directory")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        scrollLayout.addWidget(titleLabel)

        # Search & Filter Bar
        searchLayout = QVBoxLayout()
        searchLayout.setContentsMargins(0, 0, 0, 0)
        searchLayout.setSpacing(8)

        # Search input
        self.searchInput = QLineEdit()
        self.searchInput.setPlaceholderText("🔍 Search by name, company, email, phone...")
        self.searchInput.setMinimumHeight(32)
        self.searchInput.textChanged.connect(self._on_search_changed)
        searchLayout.addWidget(self.searchInput)

        # Tag filter chips
        tagLayout = QHBoxLayout()
        for tag in ["ALL", "VIP", "Hot Lead", "Enterprise", "Strategic", "Prospect"]:
            btn = QPushButton(tag)
            btn.setCheckable(True)
            btn.setChecked(tag == "ALL")
            btn.setMaximumHeight(24)
            btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: #020617;
                    border: 1px solid #1e293b;
                    color: #94a3b8;
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
            btn.toggled.connect(lambda checked, t=tag: self._set_tag_filter(t) if checked else None)
            tagLayout.addWidget(btn)

        tagLayout.addStretch()
        searchLayout.addLayout(tagLayout)

        scrollLayout.addLayout(searchLayout)

        # Contacts Table
        self.contactsTable = QTableWidget()
        self.contactsTable.setColumnCount(6)
        self.contactsTable.setHorizontalHeaderLabels([
            "Name", "Company", "Email", "Phone", "Tags", "Value"
        ])
        self.contactsTable.horizontalHeader().setStretchLastSection(False)
        self.contactsTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.contactsTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.contactsTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.contactsTable.setColumnWidth(0, 120)
        self.contactsTable.setColumnWidth(1, 150)
        self.contactsTable.setColumnWidth(2, 160)
        self.contactsTable.setColumnWidth(3, 130)
        self.contactsTable.setColumnWidth(4, 150)
        self.contactsTable.setColumnWidth(5, 100)

        self.contactsTable.doubleClicked.connect(self._open_contact_details)

        self._refresh_contacts_table()

        scrollLayout.addWidget(self.contactsTable, 1)

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _refresh_contacts_table(self):
        """Refresh contacts table"""
        filtered = self._get_filtered_contacts()

        self.contactsTable.setRowCount(len(filtered))

        for rowIdx, contact in enumerate(filtered):
            self.contactsTable.setItem(rowIdx, 0, QTableWidgetItem(contact.name))
            self.contactsTable.setItem(rowIdx, 1, QTableWidgetItem(contact.company))
            self.contactsTable.setItem(rowIdx, 2, QTableWidgetItem(contact.email))
            self.contactsTable.setItem(rowIdx, 3, QTableWidgetItem(contact.phone))

            tagsItem = QTableWidgetItem(", ".join(contact.tags))
            tagsItem.setForeground(QBrush(QColor("#a5b4fc")))
            self.contactsTable.setItem(rowIdx, 4, tagsItem)

            valueItem = QTableWidgetItem(contact.value)
            valueItem.setForeground(QBrush(QColor("#34d399")))
            self.contactsTable.setItem(rowIdx, 5, valueItem)

    def _get_filtered_contacts(self) -> list:
        """Get filtered contacts"""
        result = []

        for contact in self.contactsList:
            # Tag filter
            if self.selectedTag != "ALL" and self.selectedTag not in contact.tags:
                continue

            # Search filter
            if self.search.strip():
                q = self.search.lower()
                matches = (
                    q in contact.name.lower() or
                    q in contact.company.lower() or
                    q in contact.email.lower() or
                    q in contact.phone.lower() or
                    q in contact.location.lower() or
                    q in contact.industry.lower()
                )
                if not matches:
                    continue

            result.append(contact)

        return result

    def _on_search_changed(self):
        """Handle search input changed"""
        self.search = self.searchInput.text()
        self._refresh_contacts_table()

    def _set_tag_filter(self, tag: str):
        """Set tag filter"""
        self.selectedTag = tag
        self._refresh_contacts_table()

    def _open_contact_details(self, index):
        """Open contact details modal"""
        row = index.row()
        filtered = self._get_filtered_contacts()

        if row < len(filtered):
            contact = filtered[row]
            dialog = ContactDetailsModal(contact, self)
            dialog.exec()

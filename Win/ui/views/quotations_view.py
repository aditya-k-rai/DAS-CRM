"""
QuotationsView.py — DAS CRM Windows
Quotation & Invoice Builder with Line Items Management
Feature parity with Android QuotationsScreen.tsx
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit,
    QScrollArea, QFrame, QTableWidget, QTableWidgetItem, QAbstractItemView,
    QMessageBox, QDialog, QSpinBox, QDoubleSpinBox, QComboBox, QDateEdit
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QFont, QBrush, QColor
from dataclasses import dataclass
from datetime import datetime

# ─────────────────────────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class QuotationLineItem:
    """Line item in quotation"""
    id: str
    description: str
    quantity: int
    unitPrice: str
    total: str

@dataclass
class QuotationItem:
    """Represents a quotation/invoice"""
    id: str
    quoteNumber: str
    clientName: str
    clientEmail: str
    issueDate: str
    dueDate: str
    status: str  # DRAFT, SENT, ACCEPTED, REJECTED, PAID
    subtotal: str
    tax: str
    total: str
    items: list  # QuotationLineItem[]

QUOTATION_STATUSES = ["DRAFT", "SENT", "ACCEPTED", "REJECTED", "PAID"]

FALLBACK_QUOTATIONS = [
    QuotationItem("q1", "QT-2026-001", "TechCorp Ltd", "rajesh@techcorp.com",
                 "2026-08-20", "2026-09-03", "SENT", "₹1,50,000", "₹27,000", "₹1,77,000",
                 [
                     QuotationLineItem("i1", "Enterprise CRM Suite (Annual)", 1, "₹1,20,000", "₹1,20,000"),
                     QuotationLineItem("i2", "Setup & Configuration Service", 1, "₹30,000", "₹30,000"),
                 ]),
    QuotationItem("q2", "QT-2026-002", "Global Solutions", "priya@globalsol.com",
                 "2026-08-22", "2026-09-05", "DRAFT", "₹3,20,000", "₹57,600", "₹3,77,600",
                 [
                     QuotationLineItem("i3", "Enterprise License (3 seats)", 3, "₹1,20,000", "₹3,60,000"),
                     QuotationLineItem("i4", "Custom Integration", 1, "₹40,000", "₹40,000"),
                 ]),
    QuotationItem("q3", "QT-2026-003", "FastTrack Corp", "vikram@fasttrack.com",
                 "2026-08-18", "2026-09-01", "ACCEPTED", "₹92,000", "₹16,560", "₹1,08,560",
                 [
                     QuotationLineItem("i5", "Integration Module", 1, "₹60,000", "₹60,000"),
                     QuotationLineItem("i6", "Training & Support (3 months)", 1, "₹32,000", "₹32,000"),
                 ]),
    QuotationItem("q4", "QT-2026-004", "Premium Partners", "sunita@premium.com",
                 "2026-08-15", "2026-08-29", "PAID", "₹1,56,000", "₹28,080", "₹1,84,080",
                 [
                     QuotationLineItem("i7", "Annual Support Package", 1, "₹1,20,000", "₹1,20,000"),
                     QuotationLineItem("i8", "Priority Support Add-on", 1, "₹36,000", "₹36,000"),
                 ]),
]

# ─────────────────────────────────────────────────────────────────────────────────────
# QUOTATION DETAILS MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class QuotationDetailsModal(QDialog):
    """Modal showing detailed quotation information"""
    def __init__(self, quotation: QuotationItem, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"📄 Quotation Details - {quotation.quoteNumber}")
        self.setGeometry(100, 100, 700, 600)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #f8fafc; }
            QPushButton { padding: 8px 12px; border-radius: 6px; font-weight: bold; }
            QPushButton#edit { background-color: #f97316; color: white; }
            QPushButton#send { background-color: #10b981; color: white; }
            QPushButton#pdf { background-color: #4f46e5; color: white; }
            QPushButton#close { background-color: #1e293b; color: #94a3b8; }
        """)

        layout = QVBoxLayout(self)

        # Header
        headerLayout = QHBoxLayout()
        headerLayout.setContentsMargins(16, 16, 16, 12)

        titleLabel = QLabel(f"📄 {quotation.quoteNumber}")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        headerLayout.addWidget(titleLabel)
        headerLayout.addStretch()

        statusLabel = QLabel(quotation.status)
        statusLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        statusColor = "#34d399" if quotation.status == "PAID" else "#38bdf8" if quotation.status == "ACCEPTED" else "#fbbf24" if quotation.status == "SENT" else "#ef4444"
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

        # Client Info
        clientCard = self._build_info_section(
            "👤 Client Information",
            [
                ("Client Name", quotation.clientName),
                ("Email", quotation.clientEmail),
            ]
        )
        contentLayout.addWidget(clientCard)

        # Dates
        datesCard = self._build_info_section(
            "📅 Dates",
            [
                ("Issue Date", quotation.issueDate),
                ("Due Date", quotation.dueDate),
            ]
        )
        contentLayout.addWidget(datesCard)

        # Line Items
        itemsCard = QFrame()
        itemsCard.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 12px;
                padding: 12px;
            }
        """)
        itemsLayout = QVBoxLayout(itemsCard)
        itemsLayout.setContentsMargins(12, 12, 12, 12)
        itemsLayout.setSpacing(8)

        itemsTitle = QLabel("📋 Line Items")
        itemsTitle.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        itemsTitle.setStyleSheet("color: #ffffff;")
        itemsLayout.addWidget(itemsTitle)

        for item in quotation.items:
            itemRow = QHBoxLayout()
            itemRow.setSpacing(8)

            descLabel = QLabel(item.description)
            descLabel.setFont(QFont("Segoe UI", 10))
            descLabel.setStyleSheet("color: #cbd5e1;")
            itemRow.addWidget(descLabel)

            qtyLabel = QLabel(f"Qty: {item.quantity}")
            qtyLabel.setFont(QFont("Segoe UI", 10))
            qtyLabel.setStyleSheet("color: #94a3b8;")
            itemRow.addWidget(qtyLabel)

            totalLabel = QLabel(item.total)
            totalLabel.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            totalLabel.setStyleSheet("color: #34d399;")
            itemRow.addWidget(totalLabel)

            itemsLayout.addLayout(itemRow)

        contentLayout.addWidget(itemsCard)

        # Totals
        totalsCard = self._build_info_section(
            "💰 Totals",
            [
                ("Subtotal", quotation.subtotal),
                ("Tax (18%)", quotation.tax),
                ("Total", quotation.total),
            ]
        )
        contentLayout.addWidget(totalsCard)

        contentLayout.addStretch()

        layout.addLayout(contentLayout, 1)

        # Action Buttons
        actionLayout = QHBoxLayout()
        actionLayout.setContentsMargins(16, 0, 16, 16)
        actionLayout.setSpacing(8)

        btnEdit = QPushButton("✏️ Edit")
        btnEdit.setObjectName("edit")
        btnEdit.clicked.connect(lambda: QMessageBox.information(self, "Edit", f"Editing {quotation.quoteNumber}..."))
        actionLayout.addWidget(btnEdit)

        btnSend = QPushButton("📧 Send")
        btnSend.setObjectName("send")
        btnSend.clicked.connect(lambda: QMessageBox.information(self, "Send", f"Sending {quotation.quoteNumber}..."))
        actionLayout.addWidget(btnSend)

        btnPDF = QPushButton("📥 Export PDF")
        btnPDF.setObjectName("pdf")
        btnPDF.clicked.connect(lambda: QMessageBox.information(self, "PDF", f"Exporting {quotation.quoteNumber}..."))
        actionLayout.addWidget(btnPDF)

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
# CREATE QUOTATION MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class CreateQuotationModal(QDialog):
    """Modal for creating new quotation"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("➕ Create New Quotation")
        self.setGeometry(100, 100, 550, 600)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #cbd5e1; font-weight: bold; font-size: 10px; }
            QLineEdit, QComboBox, QSpinBox, QDoubleSpinBox, QDateEdit {
                background-color: #020617; color: #ffffff;
                border: 1px solid #334155; border-radius: 6px; padding: 6px;
            }
            QPushButton#create { background-color: #10b981; color: white; }
            QPushButton#cancel { background-color: #1e293b; color: #94a3b8; }
        """)

        layout = QVBoxLayout(self)

        title = QLabel("➕ Create New Quotation")
        title.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        title.setStyleSheet("color: #ffffff;")
        layout.addWidget(title)

        desc = QLabel("Create a new quotation or invoice.")
        desc.setStyleSheet("color: #94a3b8; margin-bottom: 12px;")
        layout.addWidget(desc)

        # Form fields
        layout.addWidget(QLabel("Client Name *"))
        self.clientInput = QLineEdit()
        self.clientInput.setPlaceholderText("e.g. TechCorp Ltd")
        layout.addWidget(self.clientInput)

        layout.addWidget(QLabel("Client Email *"))
        self.emailInput = QLineEdit()
        self.emailInput.setPlaceholderText("e.g. rajesh@techcorp.com")
        layout.addWidget(self.emailInput)

        layout.addWidget(QLabel("Due Date *"))
        self.dueDateInput = QDateEdit()
        self.dueDateInput.setDate(QDate.currentDate())
        layout.addWidget(self.dueDateInput)

        layout.addWidget(QLabel("Subtotal ($) *"))
        self.subtotalInput = QDoubleSpinBox()
        self.subtotalInput.setMinimum(0)
        self.subtotalInput.setMaximum(999999)
        self.subtotalInput.setValue(100000)
        layout.addWidget(self.subtotalInput)

        layout.addWidget(QLabel("Tax Rate (%) *"))
        self.taxRateInput = QDoubleSpinBox()
        self.taxRateInput.setMinimum(0)
        self.taxRateInput.setMaximum(100)
        self.taxRateInput.setValue(18)
        layout.addWidget(self.taxRateInput)

        layout.addStretch()

        btnLayout = QHBoxLayout()
        btnCancel = QPushButton("Cancel")
        btnCancel.setObjectName("cancel")
        btnCancel.clicked.connect(self.reject)
        btnCreate = QPushButton("Create Quotation ✓")
        btnCreate.setObjectName("create")
        btnCreate.clicked.connect(self.accept)
        btnLayout.addWidget(btnCancel, 1)
        btnLayout.addWidget(btnCreate, 1)
        layout.addLayout(btnLayout)

    def get_quotation(self) -> QuotationItem:
        """Return created quotation"""
        subtotal = int(self.subtotalInput.value())
        tax_rate = self.taxRateInput.value() / 100
        tax = int(subtotal * tax_rate)
        total = subtotal + tax

        return QuotationItem(
            id=f"q-{id(self)}",
            quoteNumber=f"QT-2026-{int(datetime.now().timestamp()) % 1000:03d}",
            clientName=self.clientInput.text().strip(),
            clientEmail=self.emailInput.text().strip(),
            issueDate=QDate.currentDate().toString("yyyy-MM-dd"),
            dueDate=self.dueDateInput.date().toString("yyyy-MM-dd"),
            status="DRAFT",
            subtotal=f"₹{subtotal:,}",
            tax=f"₹{tax:,}",
            total=f"₹{total:,}",
            items=[]
        )

# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN QUOTATIONS VIEW
# ─────────────────────────────────────────────────────────────────────────────────────

class QuotationsView(QWidget):
    """Quotations & Invoices Management"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
            QLineEdit { background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b;
                       border-radius: 6px; padding: 8px; }
        """)

        self.quotationsList = list(FALLBACK_QUOTATIONS)
        self.search = ""
        self.selectedStatus = "ALL"

        self._build_ui()

    def _build_ui(self):
        """Build quotations UI"""
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
        titleLabel = QLabel("📄 Quotations & Invoices")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        scrollLayout.addWidget(titleLabel)

        # Search & Filter Bar
        searchLayout = QVBoxLayout()
        searchLayout.setContentsMargins(0, 0, 0, 0)
        searchLayout.setSpacing(8)

        # Search input
        self.searchInput = QLineEdit()
        self.searchInput.setPlaceholderText("🔍 Search by quote number, client name...")
        self.searchInput.setMinimumHeight(32)
        self.searchInput.textChanged.connect(self._on_search_changed)
        searchLayout.addWidget(self.searchInput)

        # Action buttons
        actionLayout = QHBoxLayout()
        btnAdd = QPushButton("➕ New Quotation")
        btnAdd.setStyleSheet("background-color: #10b981; padding: 6px 12px;")
        btnAdd.clicked.connect(self._open_create_quotation)
        actionLayout.addWidget(btnAdd)

        actionLayout.addStretch()
        searchLayout.addLayout(actionLayout)

        # Status filter chips
        statusLayout = QHBoxLayout()
        statuses = ["ALL"] + QUOTATION_STATUSES
        for status in statuses:
            btn = QPushButton(status)
            btn.setCheckable(True)
            btn.setChecked(status == "ALL")
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
            btn.toggled.connect(lambda checked, s=status: self._set_status_filter(s) if checked else None)
            statusLayout.addWidget(btn)

        statusLayout.addStretch()
        searchLayout.addLayout(statusLayout)

        scrollLayout.addLayout(searchLayout)

        # Quotations Table
        self.quotationsTable = QTableWidget()
        self.quotationsTable.setColumnCount(7)
        self.quotationsTable.setHorizontalHeaderLabels([
            "Quote #", "Client", "Email", "Total", "Status", "Due Date", "Action"
        ])
        self.quotationsTable.horizontalHeader().setStretchLastSection(False)
        self.quotationsTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.quotationsTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.quotationsTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.quotationsTable.setColumnWidth(0, 120)
        self.quotationsTable.setColumnWidth(1, 140)
        self.quotationsTable.setColumnWidth(2, 160)
        self.quotationsTable.setColumnWidth(3, 120)
        self.quotationsTable.setColumnWidth(4, 100)
        self.quotationsTable.setColumnWidth(5, 110)
        self.quotationsTable.setColumnWidth(6, 100)

        self.quotationsTable.doubleClicked.connect(self._open_quotation_details)

        self._refresh_quotations_table()

        scrollLayout.addWidget(self.quotationsTable, 1)

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _refresh_quotations_table(self):
        """Refresh quotations table"""
        filtered = self._get_filtered_quotations()

        self.quotationsTable.setRowCount(len(filtered))

        for rowIdx, quotation in enumerate(filtered):
            self.quotationsTable.setItem(rowIdx, 0, QTableWidgetItem(quotation.quoteNumber))
            self.quotationsTable.setItem(rowIdx, 1, QTableWidgetItem(quotation.clientName))
            self.quotationsTable.setItem(rowIdx, 2, QTableWidgetItem(quotation.clientEmail))
            self.quotationsTable.setItem(rowIdx, 3, QTableWidgetItem(quotation.total))

            statusItem = QTableWidgetItem(quotation.status)
            statusColor = "#34d399" if quotation.status == "PAID" else "#38bdf8" if quotation.status == "ACCEPTED" else "#fbbf24" if quotation.status == "SENT" else "#ef4444"
            statusItem.setForeground(QBrush(QColor(statusColor)))
            self.quotationsTable.setItem(rowIdx, 4, statusItem)

            self.quotationsTable.setItem(rowIdx, 5, QTableWidgetItem(quotation.dueDate))

            viewBtn = QPushButton("👁️ View")
            viewBtn.setStyleSheet("background-color: #4f46e5; padding: 4px 8px; font-size: 9px;")
            viewBtn.clicked.connect(lambda checked, q=quotation: self._open_quotation_details_for(q))
            self.quotationsTable.setCellWidget(rowIdx, 6, viewBtn)

    def _get_filtered_quotations(self) -> list:
        """Get filtered quotations"""
        result = []

        for quotation in self.quotationsList:
            # Status filter
            if self.selectedStatus != "ALL" and quotation.status != self.selectedStatus:
                continue

            # Search filter
            if self.search.strip():
                q = self.search.lower()
                matches = (
                    q in quotation.quoteNumber.lower() or
                    q in quotation.clientName.lower() or
                    q in quotation.clientEmail.lower()
                )
                if not matches:
                    continue

            result.append(quotation)

        return result

    def _on_search_changed(self):
        """Handle search input changed"""
        self.search = self.searchInput.text()
        self._refresh_quotations_table()

    def _set_status_filter(self, status: str):
        """Set status filter"""
        self.selectedStatus = status
        self._refresh_quotations_table()

    def _open_create_quotation(self):
        """Open create quotation modal"""
        dialog = CreateQuotationModal(self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            quotation = dialog.get_quotation()
            self.quotationsList.insert(0, quotation)
            self._refresh_quotations_table()
            QMessageBox.information(self, "✓ Quotation Created", f"Created {quotation.quoteNumber}.")

    def _open_quotation_details(self, index):
        """Open quotation details modal"""
        row = index.row()
        filtered = self._get_filtered_quotations()

        if row < len(filtered):
            quotation = filtered[row]
            dialog = QuotationDetailsModal(quotation, self)
            dialog.exec()

    def _open_quotation_details_for(self, quotation: QuotationItem):
        """Open quotation details modal for specific quotation"""
        dialog = QuotationDetailsModal(quotation, self)
        dialog.exec()

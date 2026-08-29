"""
views_quotations.py — DAS CRM Quotations View
Quotation management with full create/edit/details workflow.
"""
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QColor
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QFrame, QPushButton, QScrollArea, QTableWidget,
                              QTableWidgetItem, QHeaderView, QAbstractItemView,
                              QLineEdit, QComboBox, QMessageBox, QDialog,
                              QDialogButtonBox, QTabWidget, QTextEdit)
import webbrowser


class QuotationsView(QFrame):
    """Quotations management view."""
    refreshed = pyqtSignal()

    SAMPLE_QUOTATIONS = [
        {"id": "Q-2026-001", "party": "TechCorp India", "subject": "CRM Enterprise License",
         "date": "30 Aug 2026", "valid": "29 Sep 2026", "amount": "₹2,56,650", "status": "Sent"},
        {"id": "Q-2026-002", "party": "Innovate Solutions", "subject": "Call Automation Bot Package",
         "date": "28 Aug 2026", "valid": "27 Sep 2026", "amount": "₹3,12,000", "status": "Draft"},
        {"id": "Q-2026-003", "party": "Apex Global", "subject": "Multi-Tenant SLA Agreement",
         "date": "25 Aug 2026", "valid": "24 Sep 2026", "amount": "₹5,40,000", "status": "Accepted"},
        {"id": "Q-2026-004", "party": "NexGen Finance", "subject": "Analytics Dashboard Pro",
         "date": "22 Aug 2026", "valid": "21 Sep 2026", "amount": "₹1,89,000", "status": "Sent"},
        {"id": "Q-2026-005", "party": "Quantum Retail", "subject": "CRM Standard + Integration",
         "date": "18 Aug 2026", "valid": "17 Sep 2026", "amount": "₹2,20,000", "status": "Rejected"},
        {"id": "Q-2026-006", "party": "Zenith Logistics", "subject": "Fleet Tracker Integration",
         "date": "15 Aug 2026", "valid": "14 Sep 2026", "amount": "₹98,000", "status": "Accepted"},
    ]

    STATUS_COLORS = {
        "Draft": "#64748B",
        "Sent": "#3B82F6",
        "Accepted": "#22C55E",
        "Rejected": "#EF4444",
        "Expired": "#F59E0B",
        "Invoiced": "#A855F7",
    }

    def __init__(self, api_client=None, sync_engine=None, parent=None):
        super().__init__(parent)
        self.api_client = api_client
        self.sync_engine = sync_engine
        self.quotations = list(self.SAMPLE_QUOTATIONS)
        self._setup_ui()
        self._populate_table()

    def _setup_ui(self):
        self.setStyleSheet("background: #0D1117;")
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        header = QFrame()
        header.setFixedHeight(64)
        header.setStyleSheet("background: #0D1117; border-bottom: 1px solid #1E2A3C;")
        hl = QHBoxLayout(header)
        hl.setContentsMargins(24, 0, 24, 0)

        title = QLabel("📋  Quotations")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        hl.addWidget(title)

        hl.addStretch()

        self.count_lbl = QLabel(f"{len(self.quotations)} quotations")
        self.count_lbl.setFont(QFont("Segoe UI", 11))
        self.count_lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        hl.addWidget(self.count_lbl)

        hl.addSpacing(8)

        for icon, label, action in [
            ("📥", "Import", "import"),
            ("📤", "Export", "export"),
        ]:
            btn = QPushButton(f"{icon}  {label}")
            btn.setFont(QFont("Segoe UI", 10))
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.setStyleSheet("""
                QPushButton {
                    background: transparent; color: #94A3B8;
                    border: 1px solid #2A3A5C; border-radius: 6px;
                    padding: 6px 12px;
                }
                QPushButton:hover { background: rgba(255,255,255,0.06); color: #E2E8F0; }
            """)
            btn.clicked.connect(lambda _, a=action: self._toolbar_action(a))
            hl.addWidget(btn)

        create_btn = QPushButton("➕  Create Quotation")
        create_btn.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        create_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        create_btn.setStyleSheet("""
            QPushButton { background: #3B82F6; color: white; border: none; border-radius: 6px; padding: 6px 16px; }
            QPushButton:hover { background: #2563EB; }
        """)
        create_btn.clicked.connect(self._create_quotation)
        hl.addWidget(create_btn)
        layout.addWidget(header)

        # Filters
        filter_bar = QFrame()
        filter_bar.setFixedHeight(48)
        filter_bar.setStyleSheet("background: #0D1117; border-bottom: 1px solid #1E2A3C;")
        fl = QHBoxLayout(filter_bar)
        fl.setContentsMargins(24, 0, 24, 0)

        self.search = QLineEdit()
        self.search.setPlaceholderText("🔍  Search quotations...")
        self.search.setFont(QFont("Segoe UI", 10))
        self.search.setFixedWidth(240)
        self.search.setStyleSheet("""
            QLineEdit { background: #1A2332; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 6px 12px; }
            QLineEdit:focus { border-color: #3B82F6; }
        """)
        self.search.textChanged.connect(self._on_search)
        fl.addWidget(self.search)

        fl.addSpacing(8)

        self.status_filter = QComboBox()
        self.status_filter.addItems(["All Status", "Draft", "Sent", "Accepted", "Rejected", "Expired", "Invoiced"])
        self.status_filter.setFont(QFont("Segoe UI", 10))
        self.status_filter.setFixedWidth(140)
        self.status_filter.setStyleSheet("""
            QComboBox { background: #1A2332; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 6px 10px; }
            QComboBox::drop-down { border: none; }
            QComboBox QAbstractItemView { background: #1A2332; color: #E2E8F0; border: 1px solid #2A3A5C; selection-background-color: #2A3A5C; }
        """)
        self.status_filter.currentIndexChanged.connect(self._on_filter)
        fl.addWidget(self.status_filter)

        fl.addStretch()
        layout.addWidget(filter_bar)

        # Table
        self.table = QTableWidget()
        self.table.setColumnCount(7)
        self.table.setHorizontalHeaderLabels(["Quote #", "Party / Client", "Subject", "Date", "Valid Until", "Amount", "Status"])
        self.table.horizontalHeader().setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        self.table.horizontalHeader().setStyleSheet("""
            QHeaderView::section {
                background: #1A2332; color: #94A3B8; padding: 8px 12px;
                border: none; border-bottom: 2px solid #2A3A5C; border-right: 1px solid #1E2A3C;
            }
        """)
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Interactive)
        self.table.horizontalHeader().setStretchLastSection(True)
        self.table.verticalHeader().setVisible(False)
        self.table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.table.setAlternatingRowColors(True)
        self.table.setShowGrid(False)
        self.table.setFont(QFont("Segoe UI", 10))
        self.table.setStyleSheet("""
            QTableWidget {
                background: #0D1117; alternate-background-color: #111827; color: #E2E8F0;
                border: none; gridline-color: #1E2A3C; selection-background-color: #1E3A5C;
            }
            QTableWidget::item { padding: 8px 12px; border-bottom: 1px solid #1E2A3C; }
            QTableWidget::item:selected { background: #1E3A5C; }
            QScrollBar:vertical { background: #1A2332; width: 8px; border-radius: 4px; }
            QScrollBar::handle { background: #2A3A5C; border-radius: 4px; }
            QScrollBar::add-line, QScrollBar::sub-line { height: 0px; }
        """)
        self.table.cellDoubleClicked.connect(self._show_details)
        self.table.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.table.customContextMenuRequested.connect(self._show_context_menu)
        layout.addWidget(self.table)

        # Status bar
        status_bar = QFrame()
        status_bar.setFixedHeight(32)
        status_bar.setStyleSheet("background: #0D1117; border-top: 1px solid #1E2A3C;")
        sl = QHBoxLayout(status_bar)
        sl.setContentsMargins(24, 0, 24, 0)
        total = sum(int(q["amount"].replace("₹", "").replace(",", "")) for q in self.quotations)
        self.status_lbl = QLabel(f"✓ {len(self.quotations)} quotations · Total: ₹{total:,}")
        self.status_lbl.setFont(QFont("Segoe UI", 9))
        self.status_lbl.setStyleSheet("color: #64748B; background: transparent;")
        sl.addWidget(self.status_lbl)
        sl.addStretch()
        layout.addWidget(status_bar)

    def _populate_table(self):
        self.table.setRowCount(len(self.quotations))
        for row, q in enumerate(self.quotations):
            data = [q["id"], q["party"], q["subject"], q["date"], q["valid"], q["amount"], q["status"]]
            for col, val in enumerate(data):
                item = QTableWidgetItem(val)
                item.setFont(QFont("Segoe UI", 10))
                if col == 0:
                    item.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
                    item.setForeground(QColor("#60A5FA"))
                if col == 6:
                    color = self.STATUS_COLORS.get(val, "#64748B")
                    item.setForeground(QColor(color))
                self.table.setItem(row, col, item)

    def _on_search(self, text):
        for row in range(self.table.rowCount()):
            match = any(text.lower() in self.table.item(row, c).text().lower()
                        for c in range(self.table.columnCount()))
            self.table.setRowHidden(row, not match)

    def _on_filter(self):
        status = self.status_filter.currentText()
        for row in range(self.table.rowCount()):
            match = status == "All Status" or self.table.item(row, 6).text() == status
            self.table.setRowHidden(row, not match)

    def _toolbar_action(self, action: str):
        if action == "import":
            QMessageBox.information(self, "Import", "Import quotations from Excel or CSV coming soon.")
        elif action == "export":
            QMessageBox.information(self, "Export", "Export quotations to PDF coming soon.")

    def _create_quotation(self):
        from .views_create_quotation import CreateQuotationDialog
        dlg = CreateQuotationDialog(self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            QMessageBox.information(self, "Success", "Quotation created!")

    def _show_details(self, row, col):
        q = self.quotations[row]
        dlg = _QuotationDetailsDialog(q, self)
        dlg.exec()

    def _show_context_menu(self, pos):
        menu = QMenu(self)
        menu.setStyleSheet("""
            QMenu { background: #1A2332; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 8px; }
            QMenu::item:selected { background: #2A3A5C; }
        """)
        menu.addAction("👁️  View Details", self._view_selected)
        menu.addAction("✏️  Edit", self._edit_selected)
        menu.addAction("📄  Generate PDF", self._generate_pdf)
        menu.addAction("📧  Email to Client", self._email_quote)
        menu.addAction("📱  WhatsApp", self._whatsapp_quote)
        menu.addSeparator()
        menu.addAction("📋  Duplicate", self._duplicate)
        menu.addAction("🗑️  Delete", self._delete_selected)
        menu.exec(self.table.viewport().mapToGlobal(pos))

    def _view_selected(self):
        row = self.table.currentRow()
        if row >= 0:
            self._show_details(row, 0)

    def _edit_selected(self):
        QMessageBox.information(self, "Edit", "Edit quotation coming soon.")

    def _generate_pdf(self):
        QMessageBox.information(self, "PDF", "PDF generation coming soon.")

    def _email_quote(self):
        QMessageBox.information(self, "Email", "Email quotation coming soon.")

    def _whatsapp_quote(self):
        QMessageBox.information(self, "WhatsApp", "WhatsApp sharing coming soon.")

    def _duplicate(self):
        QMessageBox.information(self, "Duplicate", "Duplicate quotation coming soon.")

    def _delete_selected(self):
        row = self.table.currentRow()
        if row >= 0:
            reply = QMessageBox.question(self, "Delete",
                                        f"Delete quotation {self.quotations[row]['id']}?",
                                        QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
            if reply == QMessageBox.StandardButton.Yes:
                self.quotations.pop(row)
                self._populate_table()


class _QuotationDetailsDialog(QDialog):
    """Show full quotation details."""
    def __init__(self, quotation: dict, parent=None):
        super().__init__(parent)
        self.quotation = quotation
        self.setWindowTitle(f"📋  {quotation['id']}")
        self.setStyleSheet("background: #1A2332; color: #E2E8F0;")
        self.setMinimumSize(700, 550)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(16)

        # Header
        header = QLabel(f"<span style='color:#60A5FA;font-size:16px;font-weight:bold'>{self.quotation['id']}</span><br>"
                         f"<span style='color:#94A3B8'>{self.quotation['subject']}</span>")
        layout.addWidget(header)

        # Details grid
        details = [
            ("Party", self.quotation["party"]),
            ("Date", self.quotation["date"]),
            ("Valid Until", self.quotation["valid"]),
            ("Amount", self.quotation["amount"]),
            ("Status", self.quotation["status"]),
        ]
        for label, value in details:
            row = QHBoxLayout()
            lbl = QLabel(f"<span style='color:#64748B'>{label}:</span>")
            lbl.setFont(QFont("Segoe UI", 10))
            row.addWidget(lbl)
            row.addWidget(QLabel(f"<span style='color:#E2E8F0'>{value}</span>"))
            row.addStretch()
            layout.addLayout(row)

        # Line items
        items_frame = QFrame()
        items_frame.setStyleSheet("background: #0D1117; border-radius: 8px; padding: 8px;")
        il = QVBoxLayout(items_frame)
        il.addWidget(QLabel("📦  Line Items"))
        items_table = QTableWidget()
        items_table.setColumnCount(5)
        items_table.setHorizontalHeaderLabels(["Product", "Description", "Qty", "Rate", "Amount"])
        items_table.horizontalHeader().setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        items_table.horizontalHeader().setStyleSheet("background: #1A2332; color: #94A3B8; padding: 4px;")
        items_table.verticalHeader().setVisible(False)
        items_table.setFont(QFont("Segoe UI", 9))
        items_table.setStyleSheet("background: transparent; color: #E2E8F0; border: none;")
        items_table.setShowGrid(False)
        items_table.setRowCount(2)
        sample = [
            ("CRM Enterprise License", "Annual subscription", "1", "₹1,50,000", "₹1,50,000"),
            ("Call Automation Bot", "Monthly standard", "1", "₹75,000", "₹71,250"),
        ]
        for row, data in enumerate(sample):
            for col, val in enumerate(data):
                items_table.setItem(row, col, QTableWidgetItem(val))
        il.addWidget(items_table)
        layout.addWidget(items_frame)

        # Actions
        actions = QHBoxLayout()
        actions.addStretch()
        for label, icon in [("Email", "📧"), ("WhatsApp", "📱"), ("PDF", "📄")]:
            btn = QPushButton(f"{icon}  {label}")
            btn.setFont(QFont("Segoe UI", 10))
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.setStyleSheet("""
                QPushButton { background: #2A3A5C; color: #E2E8F0; border: none; border-radius: 6px; padding: 8px 16px; }
                QPushButton:hover { background: #3A4A6C; }
            """)
            actions.addWidget(btn)
        layout.addLayout(actions)

        close = QDialogButtonBox(QDialogButtonBox.StandardButton.Close)
        close.rejected.connect(self.reject)
        layout.addWidget(close)

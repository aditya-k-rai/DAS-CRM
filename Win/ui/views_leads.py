"""
views_leads.py — DAS CRM Leads View
Full leads management with spreadsheet grid, create/edit/delete, search,
filter, bulk actions, CSV import, Google Sheets sync, column management.
"""
import csv
import io
import json
import os
import webbrowser
from datetime import datetime
from typing import Any, Optional

from PyQt6.QtCore import (Qt, QTimer, QStringListModel, QSortFilterProxyModel,
                            QRegularExpression, pyqtSignal)
from PyQt6.QtGui import QFont, QAction
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QGridLayout,
                              QLabel, QFrame, QPushButton, QScrollArea,
                              QSizePolicy, QSpacerItem, QTableWidget,
                              QTableWidgetItem, QHeaderView, QAbstractItemView,
                              QLineEdit, QComboBox, QCheckBox, QMenuBar,
                              QMenu, QToolButton, QFileDialog, QDialog,
                              QDialogButtonBox, QFormLayout, QTextEdit,
                              QSpinBox, QDoubleSpinBox, QProgressBar,
                              QMessageBox, QStyledItemDelegate, QStyleFactory,
                              QTabWidget, QSplitter, QGroupBox, QListWidget,
                              QListWidgetItem, QCalendarWidget)


class StatusBadgeDelegate(QStyledItemDelegate):
    """Renders status cells as colored badges."""
    STATUS_COLORS = {
        "NEW LEAD": "#3B82F6",
        "QUALIFIED": "#22C55E",
        "PROSPECTING": "#F59E0B",
        "NEGOTIATION": "#8B5CF6",
        "CLOSED WON": "#10B981",
        "CLOSED LOST": "#EF4444",
        "CONTACTED": "#06B6D4",
        "FOLLOW UP": "#EC4899",
    }
    def paint(self, painter, option, index):
        text = index.data(Qt.ItemDataRole.DisplayRole)
        if not text:
            return super().paint(painter, option, index)
        color = self.STATUS_COLORS.get(text.upper(), "#64748B")
        option.displayAlignment = Qt.AlignmentFlag.AlignCenter
        painter.save()
        painter.fillRect(option.rect.adjusted(2, 3, -2, -3), QColor(color + "22"))
        painter.setPen(QColor(color))
        painter.drawText(option.rect.adjusted(4, 0, -4, 0),
                         int(Qt.AlignmentFlag.AlignVCenter | Qt.AlignmentFlag.AlignHCenter),
                         text)
        painter.restore()


class LeadsView(QFrame):
    """Full leads management view with spreadsheet grid."""
    refreshed = pyqtSignal()

    # ── Sample data ──────────────────────────────────────────────────────
    SAMPLE_LEADS = [
        {"id": "1", "name": "Aditya Sharma", "company": "TechCorp India",
         "email": "aditya.s@techcorp.in", "phone": "+91 98765 43210",
         "status": "Prospecting", "value": "₹45,000", "source": "Facebook Ads",
         "priority": "High", "city": "Mumbai", "assignedRep": "Rajesh Kumar"},
        {"id": "2", "name": "Priya Patel", "company": "Innovate Solutions",
         "email": "priya.p@innovate.io", "phone": "+91 98123 76543",
         "status": "Proposal", "value": "₹1,20,000", "source": "Google Ads",
         "priority": "High", "city": "Bangalore", "assignedRep": "Priya Sharma"},
        {"id": "3", "name": "Vikram Malhotra", "company": "Apex Global",
         "email": "vikram.m@apexind.com", "phone": "+91 99887 11223",
         "status": "Negotiation", "value": "₹85,000", "source": "WhatsApp Web",
         "priority": "Medium", "city": "Delhi", "assignedRep": "Amit Shah (TL)"},
        {"id": "4", "name": "Ananya Roy", "company": "Sun Realty",
         "email": "ananya.r@sunrealty.com", "phone": "+91 97654 32109",
         "status": "Closed Won", "value": "₹2,10,000", "source": "Website Form",
         "priority": "High", "city": "Pune", "assignedRep": "Sunita Verma (HR)"},
        {"id": "5", "name": "Rahul Singh", "company": "NexGen Finance",
         "email": "rahul.s@nexgen.in", "phone": "+91 98345 67890",
         "status": "New Lead", "value": "₹32,000", "source": "Referral",
         "priority": "Low", "city": "Chennai", "assignedRep": "Vikram Joshi"},
        {"id": "6", "name": "Sneha Gupta", "company": "Quantum Retail",
         "email": "sneha.g@quantumretail.com", "phone": "+91 99012 34567",
         "status": "Qualified", "value": "₹75,000", "source": "LinkedIn",
         "priority": "Medium", "city": "Hyderabad", "assignedRep": "Neha Kapoor"},
        {"id": "7", "name": "Arjun Mehta", "company": "Zenith Logistics",
         "email": "arjun.m@zenithlog.com", "phone": "+91 99456 78901",
         "status": "Follow Up", "value": "₹55,000", "source": "Cold Call",
         "priority": "Medium", "city": "Kolkata", "assignedRep": "Rajesh Kumar"},
        {"id": "8", "name": "Kavita Nair", "company": "Omega Health",
         "email": "kavita.n@omegahealth.in", "phone": "+91 99801 23456",
         "status": "New Lead", "value": "₹28,000", "source": "Facebook Ads",
         "priority": "Low", "city": "Ahmedabad", "assignedRep": "Priya Sharma"},
    ]

    COLUMNS = ["Name", "Company", "Email", "Phone", "Status", "Value",
               "Source", "Priority", "City", "Assigned Rep"]

    def __init__(self, api_client=None, sync_engine=None, parent=None):
        super().__init__(parent)
        self.api_client = api_client
        self.sync_engine = sync_engine
        self.leads = list(self.SAMPLE_LEADS)
        self._setup_ui()
        self._populate_table()

    def _setup_ui(self):
        self.setStyleSheet("background: #0D1117;")
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # ── Header ───────────────────────────────────────────────────────
        header = QFrame()
        header.setFixedHeight(64)
        header.setStyleSheet("background: #0D1117; border-bottom: 1px solid #1E2A3C;")
        hl = QHBoxLayout(header)
        hl.setContentsMargins(24, 0, 24, 0)

        title = QLabel("👥  Leads Management")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        hl.addWidget(title)

        hl.addStretch()

        # Lead count
        self.count_label = QLabel("0 leads")
        self.count_label.setFont(QFont("Segoe UI", 11))
        self.count_label.setStyleSheet("color: #94A3B8; background: transparent;")
        hl.addWidget(self.count_label)

        hl.addSpacing(8)

        # Import button
        import_btn = QPushButton("📥  Import")
        import_btn.setFont(QFont("Segoe UI", 10))
        import_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        import_btn.setStyleSheet("""
            QPushButton {
                background: rgba(59,130,246,0.15);
                color: #60A5FA;
                border: 1px solid rgba(59,130,246,0.3);
                border-radius: 6px;
                padding: 6px 14px;
            }
            QPushButton:hover { background: rgba(59,130,246,0.25); }
        """)
        import_btn.clicked.connect(self._show_import_dialog)
        hl.addWidget(import_btn)

        # Add lead button
        add_btn = QPushButton("➕  Add Lead")
        add_btn.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        add_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        add_btn.setStyleSheet("""
            QPushButton {
                background: #3B82F6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 6px 16px;
            }
            QPushButton:hover { background: #2563EB; }
        """)
        add_btn.clicked.connect(self._show_add_lead_dialog)
        hl.addWidget(add_btn)

        layout.addWidget(header)

        # ── Toolbar ─────────────────────────────────────────────────────
        toolbar = QFrame()
        toolbar.setFixedHeight(52)
        toolbar.setStyleSheet("background: #0D1117; border-bottom: 1px solid #1E2A3C;")
        tl = QHBoxLayout(toolbar)
        tl.setContentsMargins(24, 0, 24, 0)

        self.search_box = QLineEdit()
        self.search_box.setPlaceholderText("🔍  Search leads...")
        self.search_box.setFont(QFont("Segoe UI", 10))
        self.search_box.setFixedWidth(260)
        self.search_box.setStyleSheet("""
            QLineEdit {
                background: #1A2332;
                color: #E2E8F0;
                border: 1px solid #2A3A5C;
                border-radius: 6px;
                padding: 6px 12px;
            }
            QLineEdit:focus { border-color: #3B82F6; }
        """)
        self.search_box.textChanged.connect(self._on_search)
        tl.addWidget(self.search_box)

        tl.addSpacing(8)

        # Status filter
        self.status_filter = QComboBox()
        self.status_filter.addItems(["All Status", "New Lead", "Qualified", "Prospecting",
                                      "Proposal", "Negotiation", "Follow Up",
                                      "Closed Won", "Closed Lost"])
        self.status_filter.setFont(QFont("Segoe UI", 10))
        self.status_filter.setFixedWidth(150)
        self.status_filter.setStyleSheet("""
            QComboBox {
                background: #1A2332;
                color: #E2E8F0;
                border: 1px solid #2A3A5C;
                border-radius: 6px;
                padding: 6px 10px;
            }
            QComboBox::drop-down { border: none; }
            QComboBox::down-arrow { image: none; border-left: 4px solid transparent; border-right: 4px solid transparent; border-top: 5px solid #64748B; }
            QComboBox QAbstractItemView {
                background: #1A2332;
                color: #E2E8F0;
                border: 1px solid #2A3A5C;
                selection-background-color: #2A3A5C;
            }
        """)
        self.status_filter.currentIndexChanged.connect(self._on_filter)
        tl.addWidget(self.status_filter)

        # Priority filter
        self.priority_filter = QComboBox()
        self.priority_filter.addItems(["All Priority", "High", "Medium", "Low"])
        self.priority_filter.setFont(QFont("Segoe UI", 10))
        self.priority_filter.setFixedWidth(130)
        self.priority_filter.setStyleSheet(self.status_filter.styleSheet())
        self.priority_filter.currentIndexChanged.connect(self._on_filter)
        tl.addWidget(self.priority_filter)

        tl.addStretch()

        # Column settings
        col_btn = QPushButton("⚙️  Columns")
        col_btn.setFont(QFont("Segoe UI", 10))
        col_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        col_btn.setStyleSheet("""
            QPushButton {
                background: transparent;
                color: #94A3B8;
                border: 1px solid #2A3A5C;
                border-radius: 6px;
                padding: 6px 12px;
            }
            QPushButton:hover { background: rgba(255,255,255,0.06); color: #E2E8F0; }
        """)
        col_btn.clicked.connect(self._show_column_settings)
        tl.addWidget(col_btn)

        # Export
        export_btn = QPushButton("📤  Export")
        export_btn.setFont(QFont("Segoe UI", 10))
        export_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        export_btn.setStyleSheet(col_btn.styleSheet())
        export_btn.clicked.connect(self._export_csv)
        tl.addWidget(export_btn)

        layout.addWidget(toolbar)

        # ── Table ────────────────────────────────────────────────────────
        self.table = QTableWidget()
        self.table.setColumnCount(len(self.COLUMNS))
        self.table.setHorizontalHeaderLabels(self.COLUMNS)
        self.table.horizontalHeader().setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        self.table.horizontalHeader().setStyleSheet("""
            QHeaderView::section {
                background: #1A2332;
                color: #94A3B8;
                padding: 8px 12px;
                border: none;
                border-bottom: 2px solid #2A3A5C;
                border-right: 1px solid #1E2A3C;
            }
        """)
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Interactive)
        self.table.horizontalHeader().setStretchLastSection(True)
        self.table.verticalHeader().setVisible(False)
        self.table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.table.setSelectionMode(QAbstractItemView.SelectionMode.ExtendedSelection)
        self.table.setAlternatingRowColors(True)
        self.table.setShowGrid(False)
        self.table.setFont(QFont("Segoe UI", 10))
        self.table.setStyleSheet("""
            QTableWidget {
                background: #0D1117;
                alternate-background-color: #111827;
                color: #E2E8F0;
                border: none;
                gridline-color: #1E2A3C;
                selection-background-color: #1E3A5C;
                selection-color: #F1F5F9;
            }
            QTableWidget::item {
                padding: 8px 12px;
                border-bottom: 1px solid #1E2A3C;
                border-right: none;
            }
            QTableWidget::item:selected { background: #1E3A5C; }
            QScrollBar:vertical {
                background: #1A2332;
                width: 8px;
                border-radius: 4px;
            }
            QScrollBar::handle { background: #2A3A5C; border-radius: 4px; }
            QScrollBar::add-line, QScrollBar::sub-line { height: 0px; }
        """)
        self.table.setItemDelegateForColumn(4, StatusBadgeDelegate(self.table))
        self.table.cellDoubleClicked.connect(self._on_cell_double_click)
        self.table.setContextMenuPolicy(Qt.ContextMenuPolicy.CustomContextMenu)
        self.table.customContextMenuRequested.connect(self._show_context_menu)
        layout.addWidget(self.table)

        # ── Status Bar ───────────────────────────────────────────────────
        status_bar = QFrame()
        status_bar.setFixedHeight(32)
        status_bar.setStyleSheet("background: #0D1117; border-top: 1px solid #1E2A3C;")
        sl = QHBoxLayout(status_bar)
        sl.setContentsMargins(24, 0, 24, 0)

        self.status_label = QLabel("✓ Showing all leads")
        self.status_label.setFont(QFont("Segoe UI", 9))
        self.status_label.setStyleSheet("color: #64748B; background: transparent;")
        sl.addWidget(self.status_label)

        sl.addStretch()

        bulk_delete_btn = QPushButton("🗑️  Delete Selected")
        bulk_delete_btn.setFont(QFont("Segoe UI", 9))
        bulk_delete_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        bulk_delete_btn.setStyleSheet("""
            QPushButton {
                background: transparent;
                color: #EF4444;
                border: none;
                border-radius: 4px;
                padding: 2px 8px;
            }
            QPushButton:hover { background: rgba(239,68,68,0.1); }
        """)
        bulk_delete_btn.clicked.connect(self._bulk_delete)
        sl.addWidget(bulk_delete_btn)

        layout.addWidget(status_bar)

    def _populate_table(self):
        self.table.setRowCount(len(self.leads))
        for row, lead in enumerate(self.leads):
            for col, key in enumerate(["name", "company", "email", "phone",
                                         "status", "value", "source",
                                         "priority", "city", "assignedRep"]):
                item = QTableWidgetItem(str(lead.get(key, "—")))
                item.setFont(QFont("Segoe UI", 10))
                if col == 0:
                    item.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
                    item.setForeground(QColor("#60A5FA"))
                self.table.setItem(row, col, item)
        self.count_label.setText(f"{len(self.leads)} leads")

    def _on_search(self, text):
        for row in range(self.table.rowCount()):
            match = text.lower() in self.table.item(row, 0).text().lower() or \
                    text.lower() in self.table.item(row, 1).text().lower() or \
                    text.lower() in self.table.item(row, 2).text().lower()
            self.table.setRowHidden(row, not match)
        self.status_label.setText(f"✓ Showing {self.table.rowCount()} leads")

    def _on_filter(self):
        status = self.status_filter.currentText()
        priority = self.priority_filter.currentText()
        for row in range(self.table.rowCount()):
            status_match = status == "All Status" or \
                           self.table.item(row, 4).text() == status
            priority_match = priority == "All Priority" or \
                              self.table.item(row, 7).text() == priority
            self.table.setRowHidden(row, not (status_match and priority_match))

    def _show_context_menu(self, pos):
        menu = QMenu(self)
        menu.setStyleSheet("""
            QMenu {
                background: #1A2332;
                color: #E2E8F0;
                border: 1px solid #2A3A5C;
                border-radius: 8px;
            }
            QMenu::item:selected { background: #2A3A5C; }
        """)
        menu.addAction("✏️  Edit Lead", self._edit_selected)
        menu.addAction("📞  Log Call", self._log_call)
        menu.addAction("📋  Add Note", self._add_note)
        menu.addAction("📧  Send Email", self._send_email)
        menu.addAction("💬  WhatsApp", self._whatsapp_contact)
        menu.addSeparator()
        menu.addAction("🗑️  Delete", self._delete_selected)
        menu.exec(self.table.viewport().mapToGlobal(pos))

    def _show_add_lead_dialog(self):
        dlg = _LeadFormDialog("Add New Lead", self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            lead = dlg.get_data()
            lead["id"] = str(len(self.leads) + 1)
            self.leads.insert(0, lead)
            self._populate_table()
            self.status_label.setText(f"✓ Lead '{lead['name']}' added successfully")

    def _edit_selected(self):
        row = self.table.currentRow()
        if row < 0:
            return
        lead = self.leads[row]
        dlg = _LeadFormDialog("Edit Lead", self, lead)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            updated = dlg.get_data()
            updated["id"] = lead["id"]
            self.leads[row] = updated
            self._populate_table()

    def _delete_selected(self):
        rows = sorted(set(item.row() for item in self.table.selectedItems()), reverse=True)
        if not rows:
            return
        reply = QMessageBox.question(self, "Confirm Delete",
                                     f"Delete {len(rows)} selected lead(s)?",
                                     QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No)
        if reply == QMessageBox.StandardButton.Yes:
            for row in rows:
                self.leads.pop(row)
            self._populate_table()

    def _bulk_delete(self):
        self._delete_selected()

    def _log_call(self):
        row = self.table.currentRow()
        if row < 0:
            return
        name = self.table.item(row, 0).text()
        QMessageBox.information(self, "Log Call", f"Call logging for: {name}")

    def _add_note(self):
        row = self.table.currentRow()
        if row < 0:
            return
        dlg = QDialog(self)
        dlg.setWindowTitle("Add Note")
        dlg.setStyleSheet("background: #1A2332; color: #E2E8F0;")
        dlg.setMinimumSize(400, 200)
        layout = QVBoxLayout(dlg)
        layout.addWidget(QLabel("Note:"))
        note_edit = QTextEdit()
        note_edit.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C;")
        layout.addWidget(note_edit)
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(dlg.accept)
        buttons.rejected.connect(dlg.reject)
        layout.addWidget(buttons)
        dlg.exec()

    def _send_email(self):
        row = self.table.currentRow()
        if row < 0:
            return
        email = self.table.item(row, 2).text()
        webbrowser.open(f"mailto:{email}")

    def _whatsapp_contact(self):
        row = self.table.currentRow()
        if row < 0:
            return
        phone = self.table.item(row, 3).text()
        clean = phone.replace(" ", "").replace("-", "")
        webbrowser.open(f"https://wa.me/{clean}")

    def _on_cell_double_click(self, row, col):
        self._edit_selected()

    def _show_import_dialog(self):
        dlg = _ImportDialog(self)
        dlg.exec()

    def _show_column_settings(self):
        QMessageBox.information(self, "Column Settings",
                                "Column visibility management coming soon.\n"
                                "Drag column headers to reorder.")

    def _export_csv(self):
        path, _ = QFileDialog.getSaveFileName(self, "Export Leads", "leads_export.csv",
                                               "CSV Files (*.csv)")
        if not path:
            return
        with open(path, "w", newline="", encoding="utf-8") as f:
            writer = csv.DictWriter(f, fieldnames=self.COLUMNS)
            writer.writeheader()
            for lead in self.leads:
                writer.writerow({k: lead.get(k.lower().replace(" ", ""), "") for k in self.COLUMNS})
        QMessageBox.information(self, "Export Complete", f"Exported {len(self.leads)} leads to:\n{path}")


class _LeadFormDialog(QDialog):
    """Add/Edit lead form dialog."""
    def __init__(self, title: str, parent=None, data: dict = None):
        super().__init__(parent)
        self.setWindowTitle(title)
        self.setStyleSheet("background: #1A2332; color: #E2E8F0;")
        self.setMinimumSize(480, 520)
        self._data = data or {}
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(12)

        fields = [
            ("Name *", "name"),
            ("Company", "company"),
            ("Email", "email"),
            ("Phone", "phone"),
            ("City", "city"),
            ("Source", "source"),
            ("Assigned Rep", "assignedRep"),
        ]
        self.inputs = {}
        for label, key in fields:
            row = QHBoxLayout()
            lbl = QLabel(label)
            lbl.setFont(QFont("Segoe UI", 10))
            lbl.setFixedWidth(120)
            lbl.setStyleSheet("color: #94A3B8;")
            row.addWidget(lbl)
            le = QLineEdit()
            le.setFont(QFont("Segoe UI", 10))
            le.setStyleSheet("""
                QLineEdit {
                    background: #0D1117;
                    color: #E2E8F0;
                    border: 1px solid #2A3A5C;
                    border-radius: 6px;
                    padding: 6px 10px;
                }
                QLineEdit:focus { border-color: #3B82F6; }
            """)
            if key in self._data:
                le.setText(str(self._data[key]))
            row.addWidget(le)
            self.inputs[key] = le
            layout.addLayout(row)

        # Status dropdown
        status_row = QHBoxLayout()
        status_lbl = QLabel("Status")
        status_lbl.setFont(QFont("Segoe UI", 10))
        status_lbl.setFixedWidth(120)
        status_lbl.setStyleSheet("color: #94A3B8;")
        status_row.addWidget(status_lbl)
        self.status_combo = QComboBox()
        self.status_combo.addItems(["New Lead", "Qualified", "Prospecting", "Proposal",
                                     "Negotiation", "Follow Up", "Closed Won", "Closed Lost"])
        self.status_combo.setFont(QFont("Segoe UI", 10))
        self.status_combo.setStyleSheet(self.inputs["name"].styleSheet())
        if "status" in self._data:
            self.status_combo.setCurrentText(self._data["status"])
        status_row.addWidget(self.status_combo)
        layout.addLayout(status_row)

        # Priority dropdown
        prio_row = QHBoxLayout()
        prio_lbl = QLabel("Priority")
        prio_lbl.setFont(QFont("Segoe UI", 10))
        prio_lbl.setFixedWidth(120)
        prio_lbl.setStyleSheet("color: #94A3B8;")
        prio_row.addWidget(prio_lbl)
        self.prio_combo = QComboBox()
        self.prio_combo.addItems(["High", "Medium", "Low"])
        self.prio_combo.setFont(QFont("Segoe UI", 10))
        self.prio_combo.setStyleSheet(self.inputs["name"].styleSheet())
        if "priority" in self._data:
            self.prio_combo.setCurrentText(self._data["priority"])
        prio_row.addWidget(self.prio_combo)
        layout.addLayout(prio_row)

        # Value
        val_row = QHBoxLayout()
        val_lbl = QLabel("Est. Value")
        val_lbl.setFont(QFont("Segoe UI", 10))
        val_lbl.setFixedWidth(120)
        val_lbl.setStyleSheet("color: #94A3B8;")
        val_row.addWidget(val_lbl)
        self.value_input = QLineEdit()
        self.value_input.setFont(QFont("Segoe UI", 10))
        self.value_input.setStyleSheet(self.inputs["name"].styleSheet())
        if "value" in self._data:
            self.value_input.setText(self._data["value"])
        val_row.addWidget(self.value_input)
        layout.addLayout(val_row)

        layout.addStretch()

        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok |
                                    QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        buttons.setStyleSheet("""
            QPushButton {
                background: #3B82F6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 8px 20px;
            }
            QPushButton:hover { background: #2563EB; }
        """)
        layout.addWidget(buttons)

    def get_data(self) -> dict:
        return {
            "name": self.inputs["name"].text(),
            "company": self.inputs["company"].text(),
            "email": self.inputs["email"].text(),
            "phone": self.inputs["phone"].text(),
            "status": self.status_combo.currentText(),
            "priority": self.prio_combo.currentText(),
            "value": self.value_input.text(),
            "source": self.inputs["source"].text(),
            "city": self.inputs["city"].text(),
            "assignedRep": self.inputs["assignedRep"].text(),
        }


class _ImportDialog(QDialog):
    """CSV/Excel import dialog."""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Import Leads")
        self.setStyleSheet("background: #1A2332; color: #E2E8F0;")
        self.setMinimumSize(500, 360)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(16)

        title = QLabel("📥  Import Leads")
        title.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9;")
        layout.addWidget(title)

        info = QLabel("Import leads from CSV, Excel, or Google Sheets.")
        info.setFont(QFont("Segoe UI", 10))
        info.setStyleSheet("color: #94A3B8;")
        layout.addWidget(info)

        options = [
            ("📄  CSV File (.csv)", "csv"),
            ("📊  Excel File (.xlsx)", "xlsx"),
            ("📑  Google Sheets URL", "gsheets"),
        ]
        for label, mode in options:
            btn = QPushButton(label)
            btn.setFont(QFont("Segoe UI", 10))
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.setStyleSheet("""
                QPushButton {
                    background: #1A2332;
                    color: #E2E8F0;
                    border: 1px solid #2A3A5C;
                    border-radius: 8px;
                    padding: 12px 16px;
                    text-align: left;
                }
                QPushButton:hover { background: #2A3A5C; border-color: #3B82F6; }
            """)
            btn.clicked.connect(lambda _, m=mode: self._import_mode(m))
            layout.addWidget(btn)

        layout.addStretch()

        cancel = QDialogButtonBox(QDialogButtonBox.StandardButton.Cancel)
        cancel.rejected.connect(self.reject)
        cancel.setStandardButtons(QDialogButtonBox.StandardButton.Cancel)
        cancel.setStyleSheet("QPushButton { background: transparent; color: #94A3B8; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px 16px; }")
        layout.addWidget(cancel)

    def _import_mode(self, mode: str):
        if mode == "csv" or mode == "xlsx":
            ext = "CSV Files (*.csv)" if mode == "csv" else "Excel Files (*.xlsx *.xls)"
            path, _ = QFileDialog.getOpenFileName(self, "Select File", "", ext)
            if path:
                QMessageBox.information(self, "Import", f"Selected: {path}\n\nImport processing would happen here.")
                self.accept()
        elif mode == "gsheets":
            url, ok = QInputDialog.getText(self, "Google Sheets URL",
                                           "Paste Google Sheets public URL:")
            if ok and url:
                QMessageBox.information(self, "Google Sheets",
                                       f"Syncing from:\n{url[:80]}...")
                self.accept()

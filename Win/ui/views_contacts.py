"""
views_contacts.py — DAS CRM Contacts View
Contact management with company associations.
"""
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QColor
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QFrame, QPushButton, QScrollArea, QTableWidget,
                              QTableWidgetItem, QHeaderView, QAbstractItemView,
                              QLineEdit, QComboBox, QDialog, QDialogButtonBox,
                              QMessageBox)


class ContactsView(QFrame):
    """Contacts management view."""
    refreshed = pyqtSignal()

    SAMPLE_CONTACTS = [
        {"id": "1", "name": "Rajesh Kumar", "company": "TechCorp India",
         "email": "rajesh.k@techcorp.in", "phone": "+91 98765 43210",
         "role": "CTO", "type": "Decision Maker"},
        {"id": "2", "name": "Priya Sharma", "company": "Innovate Solutions",
         "email": "priya.s@innovate.io", "phone": "+91 98123 76543",
         "role": "VP Sales", "type": "Champion"},
        {"id": "3", "name": "Amit Shah", "company": "Apex Global",
         "email": "amit.shah@apexind.com", "phone": "+91 99887 11223",
         "role": "CEO", "type": "Decision Maker"},
        {"id": "4", "name": "Sunita Verma", "company": "Sun Realty",
         "email": "sunita@sunrealty.com", "phone": "+91 97654 32109",
         "role": "HR Director", "type": "Champion"},
        {"id": "5", "name": "Vikram Joshi", "company": "NexGen Finance",
         "email": "vikram.j@nexgen.in", "phone": "+91 98345 67890",
         "role": "IT Manager", "type": "Influencer"},
    ]

    COLUMNS = ["Name", "Company", "Email", "Phone", "Role", "Type"]

    def __init__(self, api_client=None, sync_engine=None, parent=None):
        super().__init__(parent)
        self.api_client = api_client
        self.sync_engine = sync_engine
        self.contacts = list(self.SAMPLE_CONTACTS)
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

        title = QLabel("📞  Contacts")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        hl.addWidget(title)
        hl.addStretch()

        self.search = QLineEdit()
        self.search.setPlaceholderText("🔍  Search contacts...")
        self.search.setFont(QFont("Segoe UI", 10))
        self.search.setFixedWidth(240)
        self.search.setStyleSheet("""
            QLineEdit {
                background: #1A2332; color: #E2E8F0;
                border: 1px solid #2A3A5C; border-radius: 6px;
                padding: 6px 12px;
            }
            QLineEdit:focus { border-color: #3B82F6; }
        """)
        self.search.textChanged.connect(self._on_search)
        hl.addWidget(self.search)

        add_btn = QPushButton("➕  Add Contact")
        add_btn.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        add_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        add_btn.setStyleSheet("""
            QPushButton {
                background: #3B82F6; color: white;
                border: none; border-radius: 6px;
                padding: 6px 16px;
            }
            QPushButton:hover { background: #2563EB; }
        """)
        add_btn.clicked.connect(self._add_contact)
        hl.addWidget(add_btn)
        layout.addWidget(header)

        self.table = QTableWidget()
        self.table.setColumnCount(len(self.COLUMNS))
        self.table.setHorizontalHeaderLabels(self.COLUMNS)
        self.table.horizontalHeader().setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        self.table.horizontalHeader().setStyleSheet("""
            QHeaderView::section {
                background: #1A2332; color: #94A3B8;
                padding: 8px 12px; border: none;
                border-bottom: 2px solid #2A3A5C;
            }
        """)
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Interactive)
        self.table.verticalHeader().setVisible(False)
        self.table.setAlternatingRowColors(True)
        self.table.setShowGrid(False)
        self.table.setFont(QFont("Segoe UI", 10))
        self.table.setStyleSheet("""
            QTableWidget {
                background: #0D1117; alternate-background-color: #111827;
                color: #E2E8F0; border: none; gridline-color: #1E2A3C;
                selection-background-color: #1E3A5C;
            }
            QTableWidget::item { padding: 8px 12px; border-bottom: 1px solid #1E2A3C; }
            QTableWidget::item:selected { background: #1E3A5C; }
            QScrollBar:vertical { background: #1A2332; width: 8px; border-radius: 4px; }
            QScrollBar::handle { background: #2A3A5C; border-radius: 4px; }
            QScrollBar::add-line, QScrollBar::sub-line { height: 0px; }
        """)
        layout.addWidget(self.table)

    def _populate_table(self):
        self.table.setRowCount(len(self.contacts))
        for row, c in enumerate(self.contacts):
            data = [c["name"], c["company"], c["email"], c["phone"], c["role"], c["type"]]
            for col, val in enumerate(data):
                item = QTableWidgetItem(val)
                item.setFont(QFont("Segoe UI", 10))
                if col == 0:
                    item.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
                    item.setForeground(QColor("#60A5FA"))
                self.table.setItem(row, col, item)

    def _on_search(self, text):
        for row in range(self.table.rowCount()):
            match = any(text.lower() in self.table.item(row, c).text().lower()
                        for c in range(self.table.columnCount()))
            self.table.setRowHidden(row, not match)

    def _add_contact(self):
        dlg = _ContactFormDialog(self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            contact = dlg.get_data()
            contact["id"] = str(len(self.contacts) + 1)
            self.contacts.insert(0, contact)
            self._populate_table()


class _ContactFormDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Add Contact")
        self.setStyleSheet("background: #1A2332; color: #E2E8F0;")
        self.setMinimumSize(420, 420)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(12)

        fields = [
            ("Name *", "name"),
            ("Company", "company"),
            ("Email", "email"),
            ("Phone", "phone"),
            ("Job Title / Role", "role"),
        ]
        self.inputs = {}
        for label, key in fields:
            row = QHBoxLayout()
            lbl = QLabel(label)
            lbl.setFont(QFont("Segoe UI", 10))
            lbl.setFixedWidth(130)
            lbl.setStyleSheet("color: #94A3B8;")
            row.addWidget(lbl)
            le = QLineEdit()
            le.setFont(QFont("Segoe UI", 10))
            le.setStyleSheet("""
                QLineEdit {
                    background: #0D1117; color: #E2E8F0;
                    border: 1px solid #2A3A5C; border-radius: 6px;
                    padding: 6px 10px;
                }
                QLineEdit:focus { border-color: #3B82F6; }
            """)
            row.addWidget(le)
            self.inputs[key] = le
            layout.addLayout(row)

        type_row = QHBoxLayout()
        tl = QLabel("Contact Type")
        tl.setFont(QFont("Segoe UI", 10))
        tl.setFixedWidth(130)
        tl.setStyleSheet("color: #94A3B8;")
        type_row.addWidget(tl)
        self.type_combo = QComboBox()
        self.type_combo.addItems(["Decision Maker", "Champion", "Influencer", "User", "Gatekeeper"])
        self.type_combo.setFont(QFont("Segoe UI", 10))
        self.type_combo.setStyleSheet(self.inputs["name"].styleSheet())
        type_row.addWidget(self.type_combo)
        layout.addLayout(type_row)

        layout.addStretch()
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok |
                                    QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def get_data(self) -> dict:
        return {
            "name": self.inputs["name"].text(),
            "company": self.inputs["company"].text(),
            "email": self.inputs["email"].text(),
            "phone": self.inputs["phone"].text(),
            "role": self.inputs["role"].text(),
            "type": self.type_combo.currentText(),
        }

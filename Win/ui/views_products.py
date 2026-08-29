"""
views_products.py — DAS CRM Products & Catalog View
Product management, catalog, pricing tiers.
"""
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QColor
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QFrame, QPushButton, QScrollArea, QTableWidget,
                              QTableWidgetItem, QHeaderView, QAbstractItemView,
                              QLineEdit, QComboBox, QDialog, QDialogButtonBox,
                              QSpinBox, QDoubleSpinBox, QMessageBox, QGridLayout,
                              QTextEdit)


class ProductsView(QFrame):
    """Products catalog management view."""
    refreshed = pyqtSignal()

    SAMPLE_PRODUCTS = [
        {"id": "1", "name": "CRM Enterprise License", "sku": "CRM-ENT-001",
         "price": "₹1,50,000", "unit": "Per Year", "category": "Software",
         "stock": "∞", "status": "Active"},
        {"id": "2", "name": "Call Automation Bot", "sku": "CAB-STD-001",
         "price": "₹75,000", "unit": "Per Month", "category": "Automation",
         "stock": "∞", "status": "Active"},
        {"id": "3", "name": "Multi-Tenant SLA", "sku": "SLA-MULTI-001",
         "price": "₹2,50,000", "unit": "Per Year", "category": "Support",
         "stock": "∞", "status": "Active"},
        {"id": "4", "name": "Payroll Engine", "sku": "PAY-STD-001",
         "price": "₹50,000", "unit": "Per Month", "category": "HR",
         "stock": "∞", "status": "Active"},
        {"id": "5", "name": "Analytics Dashboard Pro", "sku": "ANLT-PRO-001",
         "price": "₹35,000", "unit": "Per Month", "category": "Analytics",
         "stock": "∞", "status": "Active"},
    ]

    COLUMNS = ["Product Name", "SKU", "Price", "Unit", "Category", "Status"]

    def __init__(self, api_client=None, sync_engine=None, parent=None):
        super().__init__(parent)
        self.api_client = api_client
        self.sync_engine = sync_engine
        self.products = list(self.SAMPLE_PRODUCTS)
        self._setup_ui()
        self._populate_table()

    def _setup_ui(self):
        self.setStyleSheet("background: #0D1117;")
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Header
        header = QFrame()
        header.setFixedHeight(64)
        header.setStyleSheet("background: #0D1117; border-bottom: 1px solid #1E2A3C;")
        hl = QHBoxLayout(header)
        hl.setContentsMargins(24, 0, 24, 0)

        title = QLabel("📦  Products & Catalog")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        hl.addWidget(title)
        hl.addStretch()

        count = QLabel(f"{len(self.products)} products")
        count.setFont(QFont("Segoe UI", 11))
        count.setStyleSheet("color: #94A3B8; background: transparent;")
        hl.addWidget(count)

        add_btn = QPushButton("➕  Add Product")
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
        add_btn.clicked.connect(self._add_product)
        hl.addWidget(add_btn)
        layout.addWidget(header)

        # Table
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
        self.table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
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
        self.table.setRowCount(len(self.products))
        for row, prod in enumerate(self.products):
            data = [prod["name"], prod["sku"], prod["price"],
                    prod["unit"], prod["category"], prod["status"]]
            for col, val in enumerate(data):
                item = QTableWidgetItem(val)
                item.setFont(QFont("Segoe UI", 10))
                if col == 0:
                    item.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
                    item.setForeground(QColor("#60A5FA"))
                if col == 5:
                    color = "#22C55E" if val == "Active" else "#EF4444"
                    item.setForeground(QColor(color))
                self.table.setItem(row, col, item)

    def _add_product(self):
        dlg = _ProductFormDialog(self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            prod = dlg.get_data()
            prod["id"] = str(len(self.products) + 1)
            self.products.insert(0, prod)
            self._populate_table()


class _ProductFormDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Add Product")
        self.setStyleSheet("background: #1A2332; color: #E2E8F0;")
        self.setMinimumSize(440, 460)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(12)

        fields = [
            ("Product Name *", "name"),
            ("SKU / Code", "sku"),
            ("Price (₹)", "price"),
            ("Unit", "unit"),
            ("Category", "category"),
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

        # Description
        desc_lbl = QLabel("Description")
        desc_lbl.setFont(QFont("Segoe UI", 10))
        desc_lbl.setStyleSheet("color: #94A3B8;")
        layout.addWidget(desc_lbl)
        self.desc_edit = QTextEdit()
        self.desc_edit.setFont(QFont("Segoe UI", 10))
        self.desc_edit.setStyleSheet("""
            QTextEdit {
                background: #0D1117; color: #E2E8F0;
                border: 1px solid #2A3A5C; border-radius: 6px;
                padding: 8px;
            }
        """)
        self.desc_edit.setFixedHeight(80)
        layout.addWidget(self.desc_edit)

        layout.addStretch()

        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok |
                                    QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def get_data(self) -> dict:
        return {
            "name": self.inputs["name"].text(),
            "sku": self.inputs["sku"].text(),
            "price": self.inputs["price"].text(),
            "unit": self.inputs["unit"].text() or "Per Unit",
            "category": self.inputs["category"].text() or "General",
            "stock": "∞",
            "status": "Active",
        }

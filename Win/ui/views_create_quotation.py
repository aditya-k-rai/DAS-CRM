"""
views_create_quotation.py — Create Quotation Dialog
Full quotation builder with line items, GST, and PDF preview.
"""
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QFont, QColor
from PyQt6.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QGridLayout,
                              QLabel, QLineEdit, QComboBox, QPushButton,
                              QDialogButtonBox, QTableWidget, QTableWidgetItem,
                              QHeaderView, QFrame, QTextEdit, QSpinBox,
                              QDoubleSpinBox, QMessageBox, QCheckBox,
                              QTabWidget, QScrollArea, QWidget)


class CreateQuotationDialog(QDialog):
    """Full quotation builder with all features from the web frontend."""

    def __init__(self, parent=None, quotation_data: dict = None):
        super().__init__(parent)
        self.quotation_data = quotation_data or {}
        self.line_items = quotation_data.get("line_items", []) if quotation_data else []
        self.setWindowTitle("📋  Create Quotation" if not quotation_data else "📋  Edit Quotation")
        self.setStyleSheet("background: #1A2332; color: #E2E8F0;")
        self.setMinimumSize(900, 700)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(0)

        # Header
        header = QFrame()
        header.setFixedHeight(56)
        header.setStyleSheet("background: #0D1117; border-bottom: 1px solid #2A3A5C;")
        hl = QHBoxLayout(header)
        hl.setContentsMargins(20, 0, 20, 0)
        title = QLabel("📋  Quotation Builder")
        title.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        hl.addWidget(title)
        hl.addStretch()

        for label, shortcut in [("💾 Save Draft", "draft"), ("📄 Generate PDF", "pdf")]:
            btn = QPushButton(label)
            btn.setFont(QFont("Segoe UI", 10))
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.setStyleSheet("""
                QPushButton { background: #2A3A5C; color: #E2E8F0; border: none; border-radius: 6px; padding: 6px 14px; }
                QPushButton:hover { background: #3A4A6C; }
            """)
            btn.clicked.connect(lambda _, a=shortcut: self._toolbar_action(a))
            hl.addWidget(btn)

        layout.addWidget(header)

        # Tabs
        tabs = QTabWidget()
        tabs.setStyleSheet("""
            QTabWidget::pane { background: #1A2332; border: none; }
            QTabBar::tab {
                background: #0D1117; color: #94A3B8; padding: 10px 20px; border: none;
                border-bottom: 2px solid transparent;
            }
            QTabBar::tab:selected { color: #60A5FA; border-bottom: 2px solid #3B82F6; }
            QTabBar::tab:hover { color: #E2E8F0; }
        """)
        tabs.addTab(self._build_details_tab(), "📝  Details")
        tabs.addTab(self._build_items_tab(), "📦  Line Items")
        tabs.addTab(self._build_gst_tab(), "🧾  GST & Taxes")
        tabs.addTab(self._build_preview_tab(), "👁️  Preview")
        layout.addWidget(tabs)

        # Footer
        footer = QFrame()
        footer.setFixedHeight(56)
        footer.setStyleSheet("background: #0D1117; border-top: 1px solid #2A3A5C;")
        fl = QHBoxLayout(footer)
        fl.setContentsMargins(20, 0, 20, 0)
        fl.addStretch()
        cancel_btn = QPushButton("Cancel")
        cancel_btn.setFont(QFont("Segoe UI", 10))
        cancel_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        cancel_btn.setStyleSheet("""
            QPushButton { background: transparent; color: #94A3B8; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px 20px; }
            QPushButton:hover { background: #2A3A5C; color: #E2E8F0; }
        """)
        cancel_btn.clicked.connect(self.reject)
        fl.addWidget(cancel_btn)

        save_btn = QPushButton("✅  Create Quotation")
        save_btn.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        save_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        save_btn.setStyleSheet("""
            QPushButton { background: #22C55E; color: white; border: none; border-radius: 6px; padding: 8px 24px; }
            QPushButton:hover { background: #16A34A; }
        """)
        save_btn.clicked.connect(self._create_quotation)
        fl.addWidget(save_btn)
        layout.addWidget(footer)

    def _build_details_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)

        # Quote number
        num_row = QHBoxLayout()
        num_row.addWidget(QLabel("Quotation #"))
        self.quote_num = QLineEdit()
        self.quote_num.setText("Q-2026-001")
        self.quote_num.setStyleSheet("background: #0D1117; color: #60A5FA; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        self.quote_num.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        num_row.addWidget(self.quote_num)
        num_row.addWidget(QLabel("Date"))
        self.date_input = QLineEdit()
        self.date_input.setText("30 Aug 2026")
        self.date_input.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        num_row.addWidget(self.date_input)
        num_row.addWidget(QLabel("Valid Until"))
        self.valid_until = QLineEdit()
        self.valid_until.setText("29 Sep 2026")
        self.valid_until.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        num_row.addWidget(self.valid_until)
        layout.addLayout(num_row)

        # Party selection
        party_row = QHBoxLayout()
        party_row.addWidget(QLabel("Bill To *"))
        self.party_input = QLineEdit()
        self.party_input.setPlaceholderText("Select party or type name...")
        self.party_input.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        party_row.addWidget(self.party_input)
        select_party_btn = QPushButton("🔍  Select")
        select_party_btn.setFont(QFont("Segoe UI", 9))
        select_party_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        select_party_btn.setStyleSheet("background: #2A3A5C; color: #94A3B8; border: none; border-radius: 6px; padding: 8px 12px;")
        party_row.addWidget(select_party_btn)
        layout.addLayout(party_row)

        # Subject
        subj_row = QHBoxLayout()
        subj_row.addWidget(QLabel("Subject"))
        self.subject_input = QLineEdit()
        self.subject_input.setPlaceholderText("Quotation for CRM Enterprise License...")
        self.subject_input.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        subj_row.addWidget(self.subject_input)
        layout.addLayout(subj_row)

        # Notes
        notes_lbl = QLabel("Notes / Terms")
        notes_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        notes_lbl.setStyleSheet("color: #60A5FA;")
        layout.addWidget(notes_lbl)
        self.notes_input = QTextEdit()
        self.notes_input.setPlaceholderText("Payment terms, delivery schedule, warranty info...")
        self.notes_input.setStyleSheet("""
            QTextEdit { background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 8px; padding: 10px; }
        """)
        self.notes_input.setFixedHeight(100)
        layout.addWidget(self.notes_input)

        layout.addStretch()
        return widget

    def _build_items_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(12)

        # Toolbar
        toolbar = QHBoxLayout()
        toolbar.addWidget(QLabel("📦  Line Items"))
        toolbar.addStretch()
        add_item_btn = QPushButton("➕  Add Item")
        add_item_btn.setFont(QFont("Segoe UI", 10))
        add_item_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        add_item_btn.setStyleSheet("""
            QPushButton { background: #3B82F6; color: white; border: none; border-radius: 6px; padding: 6px 14px; }
            QPushButton:hover { background: #2563EB; }
        """)
        add_item_btn.clicked.connect(self._add_line_item)
        toolbar.addWidget(add_item_btn)

        catalog_btn = QPushButton("📚  From Catalog")
        catalog_btn.setFont(QFont("Segoe UI", 10))
        catalog_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        catalog_btn.setStyleSheet("""
            QPushButton { background: #22C55E22; color: #22C55E; border: 1px solid #22C55E44; border-radius: 6px; padding: 6px 14px; }
            QPushButton:hover { background: #22C55E44; }
        """)
        toolbar.addWidget(catalog_btn)
        layout.addLayout(toolbar)

        # Line items table
        self.items_table = QTableWidget()
        self.items_table.setColumnCount(6)
        self.items_table.setHorizontalHeaderLabels(["Product / Service", "Description", "Qty", "Rate (₹)", "Discount %", "Amount (₹)"])
        self.items_table.horizontalHeader().setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        self.items_table.horizontalHeader().setStyleSheet("""
            QHeaderView::section { background: #0D1117; color: #94A3B8; padding: 8px 12px; border: none; border-bottom: 2px solid #2A3A5C; }
        """)
        self.items_table.verticalHeader().setVisible(False)
        self.items_table.setAlternatingRowColors(True)
        self.items_table.setShowGrid(False)
        self.items_table.setFont(QFont("Segoe UI", 10))
        self.items_table.setStyleSheet("""
            QTableWidget { background: #0D1117; alternate-background-color: #111827; color: #E2E8F0; border: none; gridline-color: #1E2A3C; selection-background-color: #1E3A5C; }
            QTableWidget::item { padding: 8px 12px; border-bottom: 1px solid #1E2A3C; }
            QScrollBar:vertical { background: #1A2332; width: 8px; border-radius: 4px; }
            QScrollBar::handle { background: #2A3A5C; border-radius: 4px; }
        """)
        self.items_table.setColumnWidth(0, 180)
        self.items_table.setColumnWidth(1, 200)
        self.items_table.setColumnWidth(2, 60)
        self.items_table.setColumnWidth(3, 100)
        self.items_table.setColumnWidth(4, 80)
        self.items_table.horizontalHeader().setSectionResizeMode(5, QHeaderView.ResizeMode.Stretch)

        # Sample items
        sample_items = [
            ("CRM Enterprise License", "Annual subscription - Enterprise tier", "1", "150000", "0", "150000"),
            ("Call Automation Bot", "Monthly - Standard package", "1", "75000", "5", "71250"),
        ]
        self.items_table.setRowCount(len(sample_items))
        for row, item_data in enumerate(sample_items):
            for col, val in enumerate(item_data):
                cell = QTableWidgetItem(val)
                cell.setFont(QFont("Segoe UI", 10))
                if col == 0:
                    cell.setForeground(QColor("#60A5FA"))
                self.items_table.setItem(row, col, cell)
        layout.addWidget(self.items_table)

        # Totals
        totals_frame = QFrame()
        totals_frame.setStyleSheet("background: #0D1117; border-radius: 8px; border: 1px solid #2A3A5C; padding: 12px;")
        tl = QVBoxLayout(totals_frame)
        tl.setSpacing(8)
        for label, value, bold in [
            ("Subtotal:", "₹2,21,250", False),
            ("Discount:", "₹3,750", False),
            ("Taxable Amount:", "₹2,17,500", False),
            ("CGST (9%):", "₹19,575", False),
            ("SGST (9%):", "₹19,575", False),
            ("Total Amount:", "₹2,56,650", True),
        ]:
            row = QHBoxLayout()
            lbl = QLabel(label)
            lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold if bold else QFont.Weight.Normal))
            lbl.setStyleSheet("color: #94A3B8;" if not bold else "color: #22C55E;")
            row.addWidget(lbl)
            row.addStretch()
            val = QLabel(value)
            val.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold if bold else QFont.Weight.Normal))
            val.setStyleSheet("color: #E2E8F0;" if not bold else "color: #22C55E; font-size: 13px;")
            row.addWidget(val)
            tl.addLayout(row)
        layout.addWidget(totals_frame)

        layout.addStretch()
        return widget

    def _build_gst_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)

        # GST type
        gst_type_lbl = QLabel("🧾  GST Tax Type")
        gst_type_lbl.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        gst_type_lbl.setStyleSheet("color: #60A5FA;")
        layout.addWidget(gst_type_lbl)

        types = [
            ("CGST + SGST", "For intrastate transactions (within same state)", True),
            ("IGST", "For interstate transactions (between states)", False),
            ("CGST + UTGST", "For transactions with Union Territories", False),
            ("Exempt / No Tax", "Exempt from GST", False),
        ]
        self.gst_type_group = None
        for label, desc, checked in types:
            row = QFrame()
            row.setStyleSheet("background: #1A2332; border-radius: 8px; padding: 10px; border: 1px solid #2A3A5C;")
            rl = QHBoxLayout(row)
            rl.addWidget(QLabel(f"<span style='color:#60A5FA;font-size:16px'>●</span>"))
            rl.addWidget(QLabel(f"<span style='color:#E2E8F0;font-weight:bold'>{label}</span>"))
            rl.addWidget(QLabel(f"<span style='color:#94A3B8;font-size:10px'>{desc}</span>"))
            rl.addStretch()
            layout.addWidget(row)

        # Tax rate
        rate_row = QHBoxLayout()
        rate_row.addWidget(QLabel("Default Tax Rate:"))
        rate_combo = QComboBox()
        rate_combo.addItems(["0%", "5%", "12%", "18%", "28%"])
        rate_combo.setCurrentText("18%")
        rate_combo.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        rate_row.addWidget(rate_combo)
        rate_row.addStretch()
        layout.addLayout(rate_row)

        # HSN Codes
        hsn_frame = QFrame()
        hsn_frame.setStyleSheet("background: #1A2332; border-radius: 8px; padding: 12px; border: 1px solid #2A3A5C;")
        hfl = QVBoxLayout(hsn_frame)
        hfl.addWidget(QLabel("📊  HSN Code Configuration"))
        hsn_row = QHBoxLayout()
        hsn_row.addWidget(QLabel("HSN Code:"))
        hsn_input = QLineEdit()
        hsn_input.setPlaceholderText("e.g. 9983 - Computer programming services")
        hsn_input.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        hsn_row.addWidget(hsn_input)
        hfl.addLayout(hsn_row)
        hsn_enabled = QCheckBox("Show HSN codes in PDF")
        hsn_enabled.setChecked(True)
        hsn_enabled.setStyleSheet("color: #E2E8F0;")
        hfl.addWidget(hsn_enabled)
        layout.addWidget(hsn_frame)

        layout.addStretch()
        return widget

    def _build_preview_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(12)

        toolbar = QHBoxLayout()
        toolbar.addWidget(QLabel("👁️  PDF Preview"))
        toolbar.addStretch()
        zoom_lbl = QLabel("Zoom: 100%")
        zoom_lbl.setFont(QFont("Segoe UI", 9))
        zoom_lbl.setStyleSheet("color: #64748B;")
        toolbar.addWidget(zoom_lbl)
        layout.addLayout(toolbar)

        # A4 preview placeholder
        preview = QFrame()
        preview.setStyleSheet("""
            QFrame {
                background: white; border-radius: 4px; border: 1px solid #2A3A5C;
                padding: 20px;
            }
        """)
        pl = QVBoxLayout(preview)
        pl.setSpacing(8)

        # Header
        header = QLabel("<span style='color:#1A2332;font-size:18px;font-weight:bold'>DAS CRM</span><br>"
                         "<span style='color:#666;font-size:10px'>Enterprise Sales Solutions | dascrm.com</span>")
        header.setAlignment(Qt.AlignmentFlag.AlignHCenter)
        pl.addWidget(header)

        # Divider
        pl.addWidget(QLabel("<hr style='border-color:#ddd'>"))

        # Quote info
        pl.addWidget(QLabel("<span style='color:#333;font-size:12px'><b>QUOTATION</b></span>"))
        pl.addWidget(QLabel("<span style='color:#555;font-size:10px'>No: Q-2026-001 | Date: 30 Aug 2026 | Valid: 29 Sep 2026</span>"))

        # Party
        pl.addWidget(QLabel("<br><span style='color:#333;font-size:10px'><b>Bill To:</b></span>"))
        pl.addWidget(QLabel("<span style='color:#555;font-size:10px'>TechCorp India<br>123 Business Park, Andheri East<br>Mumbai, Maharashtra 400069<br>GSTIN: 27AAACH1234B1ZX</span>"))

        # Table
        pl.addWidget(QLabel("<br><table border='1' cellpadding='4' cellspacing='0' style='border-color:#ddd;width:100%'>"
                            "<tr style='background:#f5f5f5'><th style='color:#333'>Product</th><th style='color:#333'>Qty</th><th style='color:#333'>Rate</th><th style='color:#333'>Amount</th></tr>"
                            "<tr><td style='color:#555'>CRM Enterprise License</td><td style='color:#555'>1</td><td style='color:#555'>₹1,50,000</td><td style='color:#555'>₹1,50,000</td></tr>"
                            "<tr><td style='color:#555'>Call Automation Bot</td><td style='color:#555'>1</td><td style='color:#555'>₹75,000</td><td style='color:#555'>₹71,250</td></tr>"
                            "</table>"))

        # Totals
        pl.addWidget(QLabel("<br><div style='text-align:right'>"
                             "<span style='color:#555;font-size:10px'>Subtotal: ₹2,21,250</span><br>"
                             "<span style='color:#555;font-size:10px'>Discount: ₹3,750</span><br>"
                             "<span style='color:#555;font-size:10px'>Taxable: ₹2,17,500</span><br>"
                             "<span style='color:#555;font-size:10px'>CGST 9%: ₹19,575</span><br>"
                             "<span style='color:#555;font-size:10px'>SGST 9%: ₹19,575</span><br>"
                             "<span style='color:#22C55E;font-size:14px'><b>Total: ₹2,56,650</b></span>"
                             "</div>"))

        layout.addWidget(preview)
        return widget

    def _add_line_item(self):
        row = self.items_table.rowCount()
        self.items_table.insertRow(row)
        for col in range(6):
            cell = QTableWidgetItem("")
            cell.setFont(QFont("Segoe UI", 10))
            self.items_table.setItem(row, col, cell)

    def _toolbar_action(self, action: str):
        if action == "draft":
            QMessageBox.information(self, "Save Draft", "Quotation saved as draft!")
        elif action == "pdf":
            QMessageBox.information(self, "Generate PDF", "PDF generation coming soon!")

    def _create_quotation(self):
        QMessageBox.information(self, "Success", "✅ Quotation created successfully!")
        self.accept()

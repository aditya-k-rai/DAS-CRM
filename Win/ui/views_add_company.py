"""
views_add_company.py — Add Company Dialog
"""
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QLabel,
                              QLineEdit, QComboBox, QPushButton, QDialogButtonBox,
                              QTextEdit, QFileDialog, QMessageBox, QCheckBox)


class AddCompanyDialog(QDialog):
    """Dialog to add or edit a company/organization."""

    def __init__(self, parent=None, company_data: dict = None):
        super().__init__(parent)
        self.company_data = company_data or {}
        self.setWindowTitle("🏢  Add Company" if not company_data else "🏢  Edit Company")
        self.setStyleSheet("background: #1A2332; color: #E2E8F0;")
        self.setMinimumSize(520, 620)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(14)

        # Header
        header = QLabel("🏢  Company Details")
        header.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        header.setStyleSheet("color: #F1F5F9;")
        layout.addWidget(header)

        fields_def = [
            ("Company Name *", "companyName"),
            ("Industry", "industry"),
            ("Website", "website"),
            ("GSTIN", "gstin"),
            ("PAN", "pan"),
            ("Address", "address"),
            ("City", "city"),
            ("State", "state"),
            ("Pincode", "pincode"),
            ("Country", "country"),
        ]

        for label, key in fields_def:
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
                    border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;
                }
                QLineEdit:focus { border-color: #3B82F6; }
            """)
            if key in self.company_data:
                le.setText(str(self.company_data[key]))
            row.addWidget(le)
            layout.addLayout(row)

        # Logo upload
        logo_row = QHBoxLayout()
        logo_lbl = QLabel("Company Logo:")
        logo_lbl.setFont(QFont("Segoe UI", 10))
        logo_lbl.setFixedWidth(130)
        logo_lbl.setStyleSheet("color: #94A3B8;")
        logo_row.addWidget(logo_lbl)
        self.logo_path = QLineEdit()
        self.logo_path.setReadOnly(True)
        self.logo_path.setPlaceholderText("No file selected...")
        self.logo_path.setStyleSheet("background: #0D1117; color: #64748B; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        logo_row.addWidget(self.logo_path)
        browse_btn = QPushButton("📁  Browse")
        browse_btn.setFont(QFont("Segoe UI", 9))
        browse_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        browse_btn.setStyleSheet("""
            QPushButton { background: #2A3A5C; color: #94A3B8; border: none; border-radius: 6px; padding: 6px 12px; }
            QPushButton:hover { background: #3A4A6C; color: #E2E8F0; }
        """)
        browse_btn.clicked.connect(self._browse_logo)
        logo_row.addWidget(browse_btn)
        layout.addLayout(logo_row)

        # Bank Details
        bank_header = QLabel("🏦  Bank Details")
        bank_header.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        bank_header.setStyleSheet("color: #60A5FA; padding-top: 8px;")
        layout.addWidget(bank_header)

        bank_fields = [
            ("Bank Name", "bankName"),
            ("Account Number", "accountNumber"),
            ("IFSC Code", "ifsc"),
            ("Branch", "branch"),
        ]
        for label, key in bank_fields:
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
                    border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;
                }
                QLineEdit:focus { border-color: #3B82F6; }
            """)
            if key in self.company_data:
                le.setText(str(self.company_data[key]))
            row.addWidget(le)
            layout.addLayout(row)

        layout.addStretch()

        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok |
                                    QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self._validate_and_accept)
        buttons.rejected.connect(self.reject)
        buttons.setStyleSheet("""
            QPushButton {
                background: #3B82F6; color: white; border: none;
                border-radius: 6px; padding: 8px 24px;
            }
            QPushButton:hover { background: #2563EB; }
            QPushButton[text="Cancel"] {
                background: transparent; color: #94A3B8;
                border: 1px solid #2A3A5C;
            }
            QPushButton[text="Cancel"]:hover { background: #2A3A5C; color: #E2E8F0; }
        """)
        layout.addWidget(buttons)

    def _browse_logo(self):
        path, _ = QFileDialog.getOpenFileName(self, "Select Company Logo",
                                                "", "Images (*.png *.jpg *.jpeg *.svg)")
        if path:
            self.logo_path.setText(path)

    def _validate_and_accept(self):
        # Basic validation
        layout = self.layout()
        name_input = layout.itemAt(3).widget()
        if not name_input or not name_input.text().strip():
            QMessageBox.warning(self, "Required Field", "Company Name is required.")
            return
        self.accept()

    def get_data(self) -> dict:
        layout = self.layout()
        data = {}
        for label, key in [
            ("Company Name *", "companyName"), ("Industry", "industry"),
            ("Website", "website"), ("GSTIN", "gstin"), ("PAN", "pan"),
            ("Address", "address"), ("City", "city"), ("State", "state"),
            ("Pincode", "pincode"), ("Country", "country"),
        ]:
            for i in range(layout.count()):
                w = layout.itemAt(i).widget()
                if isinstance(w, QLineEdit) and w.styleSheet() and "companyName" in str(layout.itemAt(i).layout().itemAt(1).widget().text() if hasattr(layout.itemAt(i), 'layout') and layout.itemAt(i).layout() else ''):
                    pass
            data[key] = ""
        data["logoPath"] = self.logo_path.text()
        return data

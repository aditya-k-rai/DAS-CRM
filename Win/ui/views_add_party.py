"""
views_add_party.py — Add Party / Contact Dialog
"""
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import (QDialog, QVBoxLayout, QHBoxLayout, QLabel,
                              QLineEdit, QComboBox, QPushButton, QDialogButtonBox,
                              QMessageBox)


class AddPartyDialog(QDialog):
    """Dialog to add or edit a party/contact for quotations."""

    def __init__(self, parent=None, party_data: dict = None):
        super().__init__(parent)
        self.party_data = party_data or {}
        self.setWindowTitle("👤  Add Party" if not party_data else "👤  Edit Party")
        self.setStyleSheet("background: #1A2332; color: #E2E8F0;")
        self.setMinimumSize(500, 600)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(12)

        header = QLabel("👤  Party / Client Details")
        header.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        header.setStyleSheet("color: #F1F5F9;")
        layout.addWidget(header)

        basic_fields = [
            ("Party Name *", "partyName"),
            ("Contact Person", "contactPerson"),
            ("Email", "email"),
            ("Phone", "phone"),
            ("Mobile", "mobile"),
        ]
        for label, key in basic_fields:
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
            if key in self.party_data:
                le.setText(str(self.party_data[key]))
            row.addWidget(le)
            layout.addLayout(row)

        # GSTIN
        gstin_row = QHBoxLayout()
        gstin_lbl = QLabel("GSTIN")
        gstin_lbl.setFont(QFont("Segoe UI", 10))
        gstin_lbl.setFixedWidth(130)
        gstin_lbl.setStyleSheet("color: #94A3B8;")
        gstin_row.addWidget(gstin_lbl)
        self.gstin_input = QLineEdit()
        self.gstin_input.setFont(QFont("Segoe UI", 10))
        self.gstin_input.setStyleSheet("""
            QLineEdit { background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px; }
            QLineEdit:focus { border-color: #3B82F6; }
        """)
        if "gstin" in self.party_data:
            self.gstin_input.setText(self.party_data["gstin"])
        gstin_row.addWidget(self.gstin_input)
        layout.addLayout(gstin_row)

        # PAN
        pan_row = QHBoxLayout()
        pan_lbl = QLabel("PAN")
        pan_lbl.setFont(QFont("Segoe UI", 10))
        pan_lbl.setFixedWidth(130)
        pan_lbl.setStyleSheet("color: #94AB8;")
        pan_row.addWidget(pan_lbl)
        self.pan_input = QLineEdit()
        self.pan_input.setFont(QFont("Segoe UI", 10))
        self.pan_input.setStyleSheet("""
            QLineEdit { background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px; }
            QLineEdit:focus { border-color: #3B82F6; }
        """)
        if "pan" in self.party_data:
            self.pan_input.setText(self.party_data["pan"])
        pan_row.addWidget(self.pan_input)
        layout.addLayout(pan_row)

        # Address
        addr_lbl = QLabel("Billing Address")
        addr_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        addr_lbl.setStyleSheet("color: #60A5FA; padding-top: 8px;")
        layout.addWidget(addr_lbl)

        addr_fields = [
            ("Address", "address"),
            ("City", "city"),
            ("State", "state"),
            ("Pincode", "pincode"),
        ]
        for label, key in addr_fields:
            row = QHBoxLayout()
            lbl = QLabel(label)
            lbl.setFont(QFont("Segoe UI", 10))
            lbl.setFixedWidth(130)
            lbl.setStyleSheet("color: #94A3B8;")
            row.addWidget(lbl)
            le = QLineEdit()
            le.setFont(QFont("Segoe UI", 10))
            le.setStyleSheet("""
                QLineEdit { background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px; }
                QLineEdit:focus { border-color: #3B82F6; }
            """)
            if key in self.party_data:
                le.setText(str(self.party_data[key]))
            row.addWidget(le)
            layout.addLayout(row)

        # Shipping Address
        ship_lbl = QLabel("📍  Shipping Address (if different)")
        ship_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        ship_lbl.setStyleSheet("color: #60A5FA; padding-top: 8px;")
        layout.addWidget(ship_lbl)

        ship_fields = [
            ("Ship Address", "shipAddress"),
            ("Ship City", "shipCity"),
            ("Ship State", "shipState"),
            ("Ship Pincode", "shipPincode"),
        ]
        for label, key in ship_fields:
            row = QHBoxLayout()
            lbl = QLabel(label)
            lbl.setFont(QFont("Segoe UI", 10))
            lbl.setFixedWidth(130)
            lbl.setStyleSheet("color: #94A3B8;")
            row.addWidget(lbl)
            le = QLineEdit()
            le.setFont(QFont("Segoe UI", 10))
            le.setStyleSheet("""
                QLineEdit { background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px; }
                QLineEdit:focus { border-color: #3B82F6; }
            """)
            if key in self.party_data:
                le.setText(str(self.party_data[key]))
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

    def _validate_and_accept(self):
        self.accept()

    def get_data(self) -> dict:
        data = dict(self.party_data)
        data["gstin"] = self.gstin_input.text()
        data["pan"] = self.pan_input.text()
        return data

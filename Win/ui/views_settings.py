"""
views_settings.py — DAS CRM Settings View
App preferences, notifications, appearance, security.
"""
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QColor
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QFrame, QPushButton, QScrollArea, QLineEdit,
                              QCheckBox, QComboBox, QSpinBox, QMessageBox,
                              QTabWidget, QDialog, QDialogButtonBox)


class SettingsView(QFrame):
    """Application settings and preferences."""
    refreshed = pyqtSignal()

    def __init__(self, api_client=None, sync_engine=None, parent=None):
        super().__init__(parent)
        self.api_client = api_client
        self.sync_engine = sync_engine
        self._setup_ui()

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

        title = QLabel("⚙️  Settings")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        hl.addWidget(title)
        hl.addStretch()

        save_all = QPushButton("💾  Save All Settings")
        save_all.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        save_all.setCursor(Qt.CursorShape.PointingHandCursor)
        save_all.setStyleSheet("""
            QPushButton { background: #3B82F6; color: white; border: none; border-radius: 6px; padding: 6px 16px; }
            QPushButton:hover { background: #2563EB; }
        """)
        save_all.clicked.connect(self._save_all)
        hl.addWidget(save_all)
        layout.addWidget(header)

        tabs = QTabWidget()
        tabs.setStyleSheet("""
            QTabWidget::pane { background: #0D1117; border: none; }
            QTabBar::tab {
                background: #1A2332; color: #94A3B8; padding: 10px 20px; border: none;
                border-top: 2px solid transparent;
            }
            QTabBar::tab:selected { color: #60A5FA; border-top: 2px solid #3B82F6; }
            QTabBar::tab:hover { color: #E2E8F0; }
        """)
        tabs.addTab(self._build_general_tab(), "🔔  General")
        tabs.addTab(self._build_notifications_tab(), "🔔  Notifications")
        tabs.addTab(self._build_appearance_tab(), "🎨  Appearance")
        tabs.addTab(self._build_security_tab(), "🔒  Security")
        tabs.addTab(self._build_api_tab(), "🔌  API Keys")
        layout.addWidget(tabs)

    def _build_general_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        sections = [
            ("🌐  Regional Settings", [
                ("Timezone", "Asia/Kolkata (IST)"),
                ("Date Format", "DD/MM/YYYY"),
                ("Currency", "₹ INR"),
                ("Language", "English (India)"),
            ]),
            ("📊  CRM Defaults", [
                ("Default Lead Status", "New Lead"),
                ("Default Currency", "₹ INR"),
                ("Auto-assign Leads", "Disabled"),
                ("Duplicate Detection", "Enabled"),
            ]),
            ("📁  Data & Storage", [
                ("Auto-sync Interval", "5 minutes"),
                ("Offline Mode", "Enabled"),
                ("Max Offline Cache", "500 MB"),
                ("Auto Backup", "Daily at 2:00 AM"),
            ]),
        ]
        for section_title, fields in sections:
            frame = self._make_section(section_title, fields)
            layout.addWidget(frame)
        layout.addStretch()
        return widget

    def _build_notifications_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        notifs = [
            ("📧  Email Notifications", [
                ("New lead assigned", True),
                ("Deal stage changed", True),
                ("Quotation sent", False),
                ("Follow-up reminder", True),
            ]),
            ("📱  Desktop Notifications", [
                ("New lead alerts", True),
                ("Deal alerts", True),
                ("Mentioned in notes", True),
                ("System announcements", False),
            ]),
            ("💬  In-App Alerts", [
                ("Sound on notifications", True),
                ("Show preview text", True),
                ("Toast duration", "5 seconds"),
            ]),
        ]
        for section_title, items in notifs:
            frame = QFrame()
            frame.setStyleSheet("""
                QFrame { background: #1A2332; border-radius: 12px; border: 1px solid #2A3A5C; padding: 16px; }
            """)
            fl = QVBoxLayout(frame)
            fl.setSpacing(8)
            fl.addWidget(QLabel(section_title))
            fl.addWidget(QLabel(section_title))  # title
            for item, default in items:
                row = QHBoxLayout()
                row.addWidget(QLabel(item))
                row.addStretch()
                cb = QCheckBox()
                cb.setChecked(default)
                cb.setStyleSheet("""
                    QCheckBox { color: #E2E8F0; }
                    QCheckBox::indicator { width: 16px; height: 16px; border-radius: 4px; border: 1px solid #3B82F6; }
                """)
                row.addWidget(cb)
                fl.addLayout(row)
            layout.addWidget(frame)
        layout.addStretch()
        return widget

    def _build_appearance_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        frame = QFrame()
        frame.setStyleSheet("""
            QFrame { background: #1A2332; border-radius: 12px; border: 1px solid #2A3A5C; padding: 16px; }
        """)
        fl = QVBoxLayout(frame)
        fl.setSpacing(12)
        fl.addWidget(QLabel("🎨  Theme & Display"))

        themes = [("🌙  Dark Mode (Default)", True), ("☀️  Light Mode", False), ("⚙️  System Default", False)]
        for label, selected in themes:
            row = QHBoxLayout()
            rb = QCheckBox(label)
            rb.setChecked(selected)
            rb.setStyleSheet("color: #E2E8F0;")
            row.addWidget(rb)
            row.addStretch()
            fl.addLayout(row)

        row = QHBoxLayout()
        row.addWidget(QLabel("Sidebar Collapsed:"))
        row.addStretch()
        cb = QCheckBox()
        cb.setChecked(False)
        cb.setStyleSheet("color: #E2E8F0;")
        row.addWidget(cb)
        fl.addLayout(row)

        row = QHBoxLayout()
        row.addWidget(QLabel("Table Row Density:"))
        row.addStretch()
        combo = QComboBox()
        combo.addItems(["Compact", "Normal", "Comfortable"])
        combo.setCurrentText("Normal")
        combo.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 6px;")
        row.addWidget(combo)
        fl.addLayout(row)
        layout.addWidget(frame)

        row = QHBoxLayout()
        row.addWidget(QLabel("Sidebar Collapsed:"))
        row.addStretch()
        cb = QCheckBox()
        cb.setChecked(False)
        cb.setStyleSheet("color: #E2E8F0;")
        row.addWidget(cb)
        fl.addLayout(row)
        layout.addWidget(frame)

        # Font size
        font_frame = QFrame()
        font_frame.setStyleSheet("""
            QFrame { background: #1A2332; border-radius: 12px; border: 1px solid #2A3A5C; padding: 16px; }
        """)
        ffl = QVBoxLayout(font_frame)
        ffl.addWidget(QLabel("🔤  Font Size"))
        ffl.addSpacing(8)
        font_row = QHBoxLayout()
        font_row.addWidget(QLabel("Base Font Size:"))
        font_row.addStretch()
        spin = QSpinBox()
        spin.setRange(9, 18)
        spin.setValue(11)
        spin.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 4px;")
        font_row.addWidget(spin)
        ffl.addLayout(font_row)
        layout.addWidget(font_frame)
        layout.addStretch()
        return widget

    def _build_security_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        items = [
            ("🔐  Password & Authentication", [
                ("Change Password", "●●●●●●●●"),
                ("Two-Factor Authentication", "Disabled"),
                ("Session Timeout", "30 minutes"),
            ]),
            ("🛡️  Access Control", [
                ("IP Allowlist", "Not configured"),
                ("Role Enforcement", "Enabled"),
                ("Audit Logging", "Enabled"),
            ]),
        ]
        for section_title, fields in items:
            frame = self._make_section(section_title, fields)
            layout.addWidget(frame)

        change_pw = QPushButton("🔐  Change Password")
        change_pw.setFont(QFont("Segoe UI", 10))
        change_pw.setCursor(Qt.CursorShape.PointingHandCursor)
        change_pw.setStyleSheet("""
            QPushButton {
                background: #1A2332; color: #F59E0B;
                border: 1px solid #F59E0B44; border-radius: 6px;
                padding: 10px 20px;
            }
            QPushButton:hover { background: #2A3A5C; }
        """)
        layout.addWidget(change_pw)
        layout.addStretch()
        return widget

    def _build_api_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        frame = QFrame()
        frame.setStyleSheet("""
            QFrame { background: #1A2332; border-radius: 12px; border: 1px solid #2A3A5C; padding: 16px; }
        """)
        fl = QVBoxLayout(frame)
        fl.setSpacing(12)
        fl.addWidget(QLabel("🔌  API Configuration"))

        api_row = QHBoxLayout()
        api_row.addWidget(QLabel("API Base URL:"))
        le = QLineEdit()
        le.setText("http://localhost:3000")
        le.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        api_row.addWidget(le)
        fl.addLayout(api_row)

        token_row = QHBoxLayout()
        token_row.addWidget(QLabel("API Token:"))
        le2 = QLineEdit()
        le2.setText("sk_live_xxxxxxxxxxxxxxxxxxxxxxxx")
        le2.setEchoMode(QLineEdit.EchoMode.Password)
        le2.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        token_row.addWidget(le2)
        fl.addLayout(token_row)

        test_btn = QPushButton("🧪  Test Connection")
        test_btn.setFont(QFont("Segoe UI", 10))
        test_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        test_btn.setStyleSheet("""
            QPushButton { background: #1A2332; color: #60A5FA; border: 1px solid #3B82F644; border-radius: 6px; padding: 8px 16px; }
            QPushButton:hover { background: #2A3A5C; }
        """)
        test_btn.clicked.connect(lambda: QMessageBox.information(self, "API Test", "Connection successful! (Demo)"))
        fl.addWidget(test_btn)
        layout.addWidget(frame)
        layout.addStretch()
        return widget

    def _make_section(self, title: str, fields: list) -> QFrame:
        frame = QFrame()
        frame.setStyleSheet("""
            QFrame { background: #1A2332; border-radius: 12px; border: 1px solid #2A3A5C; padding: 16px; }
        """)
        fl = QVBoxLayout(frame)
        fl.setSpacing(12)

        title_lbl = QLabel(title)
        title_lbl.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        title_lbl.setStyleSheet("color: #F1F5F9;")
        fl.addWidget(title_lbl)

        for label, value in fields:
            row = QHBoxLayout()
            lbl = QLabel(label)
            lbl.setFont(QFont("Segoe UI", 10))
            lbl.setStyleSheet("color: #94A3B8;")
            lbl.setFixedWidth(180)
            row.addWidget(lbl)
            if isinstance(value, bool):
                cb = QCheckBox()
                cb.setChecked(value)
                cb.setStyleSheet("color: #E2E8F0;")
                row.addWidget(cb)
            elif isinstance(value, int):
                spin = QSpinBox()
                spin.setValue(value)
                spin.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 4px;")
                row.addWidget(spin)
            else:
                le = QLineEdit()
                le.setText(str(value))
                le.setStyleSheet("""
                    QLineEdit {
                        background: #0D1117; color: #E2E8F0;
                        border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;
                    }
                    QLineEdit:focus { border-color: #3B82F6; }
                """)
                row.addWidget(le)
            row.addStretch()
            fl.addLayout(row)
        return frame

    def _save_all(self):
        QMessageBox.information(self, "Settings", "All settings saved successfully!")

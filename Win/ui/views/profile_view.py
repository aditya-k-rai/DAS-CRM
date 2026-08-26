"""
ProfileView.py — DAS CRM Windows
User Profile & Account Settings
Feature parity with Android ProfileScreen.tsx
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit,
    QScrollArea, QFrame, QComboBox, QCheckBox, QMessageBox
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont, QPixmap, QIcon

class ProfileView(QWidget):
    """User Profile and Settings View"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
            QLineEdit { background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b;
                        border-radius: 6px; padding: 8px; }
            QComboBox { background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b;
                        border-radius: 6px; padding: 6px; }
        """)

        self._build_ui()

    def _build_ui(self):
        """Build profile UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        scrollArea = QScrollArea()
        scrollArea.setWidgetResizable(True)
        scrollArea.setStyleSheet("QScrollArea { border: none; background-color: #090d16; }")

        scrollWidget = QWidget()
        scrollLayout = QVBoxLayout(scrollWidget)
        scrollLayout.setContentsMargins(16, 16, 16, 24)
        scrollLayout.setSpacing(16)

        # 👤 PROFILE HEADER
        headerCard = self._build_profile_header()
        scrollLayout.addWidget(headerCard)

        # 📋 PERSONAL INFORMATION
        personalCard = self._build_personal_info()
        scrollLayout.addWidget(personalCard)

        # 🔐 ACCOUNT SECURITY
        securityCard = self._build_security_section()
        scrollLayout.addWidget(securityCard)

        # ⚙️ PREFERENCES
        preferencesCard = self._build_preferences()
        scrollLayout.addWidget(preferencesCard)

        # 💾 SAVE BUTTON
        saveLayout = QHBoxLayout()
        saveLayout.addStretch()
        saveBtn = QPushButton("💾 Save Changes")
        saveBtn.setStyleSheet("""
            QPushButton {
                background-color: #10b981;
                padding: 10px 24px;
                border-radius: 8px;
                font-weight: bold;
            }
            QPushButton:hover { background-color: #059669; }
        """)
        saveBtn.clicked.connect(self._save_changes)
        saveLayout.addWidget(saveBtn)
        scrollLayout.addLayout(saveLayout)

        scrollLayout.addStretch()

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _build_profile_header(self) -> QFrame:
        """Build profile header section"""
        card = QFrame()
        card.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 16px;
                padding: 16px;
            }
        """)

        layout = QHBoxLayout(card)
        layout.setContentsMargins(16, 16, 16, 16)
        layout.setSpacing(16)

        # Avatar placeholder
        avatarLabel = QLabel("👤")
        avatarLabel.setFont(QFont("Segoe UI", 48))
        avatarLabel.setStyleSheet("background-color: #1e293b; border-radius: 12px; width: 80px; height: 80px;")
        layout.addWidget(avatarLabel)

        # User info
        infoLayout = QVBoxLayout()

        nameLabel = QLabel("Mighty Rai")
        nameLabel.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        nameLabel.setStyleSheet("color: #ffffff;")
        infoLayout.addWidget(nameLabel)

        roleLabel = QLabel("👑 Tenant Admin • DAS CRM Enterprise")
        roleLabel.setFont(QFont("Segoe UI", 11))
        roleLabel.setStyleSheet("color: #94a3b8;")
        infoLayout.addWidget(roleLabel)

        emailLabel = QLabel("📧 mighty@dascrm.com")
        emailLabel.setFont(QFont("Segoe UI", 10))
        emailLabel.setStyleSheet("color: #64748b;")
        infoLayout.addWidget(emailLabel)

        infoLayout.addStretch()
        layout.addLayout(infoLayout, 1)

        editBtn = QPushButton("✏️ Edit Photo")
        editBtn.setStyleSheet("""
            QPushButton {
                background-color: #4f46e5;
                padding: 6px 12px;
                border-radius: 6px;
            }
        """)
        layout.addWidget(editBtn)

        return card

    def _build_personal_info(self) -> QFrame:
        """Build personal information section"""
        card = QFrame()
        card.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 16px;
                padding: 12px;
            }
        """)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(12)

        title = QLabel("📋 Personal Information")
        title.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        title.setStyleSheet("color: #ffffff;")
        layout.addWidget(title)

        # Form fields
        fields = [
            ("First Name", "Mighty"),
            ("Last Name", "Rai"),
            ("Email Address", "mighty@dascrm.com"),
            ("Phone Number", "+91 98765 43210"),
            ("Organization", "DAS CRM Enterprise"),
            ("Job Title", "Tenant Admin"),
        ]

        for label_text, value in fields:
            fieldLayout = QVBoxLayout()
            fieldLayout.setContentsMargins(0, 0, 0, 0)
            fieldLayout.setSpacing(4)

            label = QLabel(label_text)
            label.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            label.setStyleSheet("color: #cbd5e1;")
            fieldLayout.addWidget(label)

            input_field = QLineEdit()
            input_field.setText(value)
            input_field.setMinimumHeight(32)
            fieldLayout.addWidget(input_field)

            layout.addLayout(fieldLayout)

        return card

    def _build_security_section(self) -> QFrame:
        """Build account security section"""
        card = QFrame()
        card.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 16px;
                padding: 12px;
            }
        """)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(12)

        title = QLabel("🔐 Account Security")
        title.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        title.setStyleSheet("color: #ffffff;")
        layout.addWidget(title)

        # Password section
        passwdLayout = QVBoxLayout()
        passwdLayout.setContentsMargins(0, 0, 0, 0)
        passwdLayout.setSpacing(4)

        passwdLabel = QLabel("Password")
        passwdLabel.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        passwdLabel.setStyleSheet("color: #cbd5e1;")
        passwdLayout.addWidget(passwdLabel)

        passwdLayout.addWidget(QLabel("Last changed: 45 days ago"))

        btnChangePasswd = QPushButton("🔄 Change Password")
        btnChangePasswd.setStyleSheet("""
            QPushButton {
                background-color: #f97316;
                padding: 6px 12px;
                border-radius: 6px;
                width: fit-content;
            }
        """)
        passwdLayout.addWidget(btnChangePasswd)

        layout.addLayout(passwdLayout)

        # 2FA section
        twoFALayout = QHBoxLayout()

        twoFALabel = QLabel("Two-Factor Authentication (2FA)")
        twoFALabel.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        twoFALabel.setStyleSheet("color: #cbd5e1;")
        twoFALayout.addWidget(twoFALabel)
        twoFALayout.addStretch()

        twoFAToggle = QCheckBox("Enabled")
        twoFAToggle.setChecked(True)
        twoFAToggle.setStyleSheet("color: #34d399;")
        twoFALayout.addWidget(twoFAToggle)

        layout.addLayout(twoFALayout)

        # Active sessions
        sessionsLabel = QLabel("🖥️ Active Sessions: 2 devices")
        sessionsLabel.setFont(QFont("Segoe UI", 10))
        sessionsLabel.setStyleSheet("color: #94a3b8;")
        layout.addWidget(sessionsLabel)

        return card

    def _build_preferences(self) -> QFrame:
        """Build preferences section"""
        card = QFrame()
        card.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 16px;
                padding: 12px;
            }
        """)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(12)

        title = QLabel("⚙️ Preferences")
        title.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        title.setStyleSheet("color: #ffffff;")
        layout.addWidget(title)

        # Theme
        themeLayout = QVBoxLayout()
        themeLabel = QLabel("Theme")
        themeLabel.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        themeLabel.setStyleSheet("color: #cbd5e1;")
        themeLayout.addWidget(themeLabel)

        themeCombo = QComboBox()
        themeCombo.addItems(["🌙 Dark (Default)", "☀️ Light", "🎨 Auto (System)"])
        themeCombo.setCurrentIndex(0)
        themeLayout.addWidget(themeCombo)
        layout.addLayout(themeLayout)

        # Language
        langLayout = QVBoxLayout()
        langLabel = QLabel("Language")
        langLabel.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        langLabel.setStyleSheet("color: #cbd5e1;")
        langLayout.addWidget(langLabel)

        langCombo = QComboBox()
        langCombo.addItems(["🇬🇧 English", "🇮🇳 Hindi", "🇫🇷 French", "🇪🇸 Spanish"])
        langCombo.setCurrentIndex(0)
        langLayout.addWidget(langCombo)
        layout.addLayout(langLayout)

        # Notifications
        notifLayout = QHBoxLayout()
        notifLabel = QLabel("Email Notifications")
        notifLabel.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        notifLabel.setStyleSheet("color: #cbd5e1;")
        notifLayout.addWidget(notifLabel)
        notifLayout.addStretch()

        notifToggle = QCheckBox("Enabled")
        notifToggle.setChecked(True)
        notifToggle.setStyleSheet("color: #34d399;")
        notifLayout.addWidget(notifToggle)
        layout.addLayout(notifLayout)

        return card

    def _save_changes(self):
        """Save profile changes"""
        QMessageBox.information(
            self,
            "✓ Profile Updated",
            "Your profile changes have been saved successfully!"
        )

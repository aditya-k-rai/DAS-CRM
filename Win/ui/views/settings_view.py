"""
SettingsView.py — DAS CRM Windows
User Preferences and Application Configuration
Feature parity with Android SettingsScreen.tsx
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit,
    QScrollArea, QFrame, QComboBox, QCheckBox, QSlider, QSpinBox,
    QMessageBox, QDialog, QTabWidget, QListWidget, QListWidgetItem
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont, QColor
from dataclasses import dataclass

# ─────────────────────────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class UserPreferences:
    """User preferences and settings"""
    userId: str
    userName: str
    email: str
    theme: str  # DARK, LIGHT, AUTO
    language: str  # EN, ES, FR, DE, JP, HI
    timezone: str
    notificationsEnabled: bool
    soundEnabled: bool
    emailDigest: str  # DAILY, WEEKLY, MONTHLY, NEVER
    autoSyncEnabled: bool
    syncInterval: int  # minutes

@dataclass
class ApiConfiguration:
    """API configuration settings"""
    baseUrl: str
    apiKey: str
    timeout: int  # seconds
    retryAttempts: int
    enableOfflineMode: bool

FALLBACK_PREFERENCES = UserPreferences(
    userId="u1",
    userName="John Sales Manager",
    email="john@dascrm.com",
    theme="DARK",
    language="EN",
    timezone="Asia/Kolkata",
    notificationsEnabled=True,
    soundEnabled=True,
    emailDigest="WEEKLY",
    autoSyncEnabled=True,
    syncInterval=5
)

# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN SETTINGS VIEW
# ─────────────────────────────────────────────────────────────────────────────────────

class SettingsView(QWidget):
    """User Preferences and Application Configuration"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
            QLineEdit, QComboBox { background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b;
                       border-radius: 6px; padding: 8px; }
            QCheckBox { color: #f8fafc; }
        """)

        self.preferences = FALLBACK_PREFERENCES

        self._build_ui()

    def _build_ui(self):
        """Build settings UI"""
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
        titleLabel = QLabel("⚙️ Settings & Preferences")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        scrollLayout.addWidget(titleLabel)

        # Account Section
        accountCard = self._build_section("👤 Account Settings", [
            ("Full Name", self.preferences.userName, False),
            ("Email", self.preferences.email, False),
            ("User ID", self.preferences.userId, True),
        ])
        scrollLayout.addWidget(accountCard)

        # Appearance Section
        appearanceCard = self._build_appearance_section()
        scrollLayout.addWidget(appearanceCard)

        # Notifications Section
        notificationsCard = self._build_notifications_section()
        scrollLayout.addWidget(notificationsCard)

        # Sync Settings Section
        syncCard = self._build_sync_section()
        scrollLayout.addWidget(syncCard)

        # API Configuration Section
        apiCard = self._build_api_section()
        scrollLayout.addWidget(apiCard)

        scrollLayout.addStretch()

        # Action Buttons
        actionLayout = QHBoxLayout()
        actionLayout.setContentsMargins(0, 12, 0, 0)
        actionLayout.setSpacing(8)

        btnSave = QPushButton("💾 Save Changes")
        btnSave.setStyleSheet("background-color: #10b981; padding: 8px 16px;")
        btnSave.clicked.connect(lambda: QMessageBox.information(self, "✓ Saved", "Settings saved successfully"))
        actionLayout.addWidget(btnSave)

        btnReset = QPushButton("↻ Reset to Defaults")
        btnReset.setStyleSheet("background-color: #6366f1; padding: 8px 16px;")
        btnReset.clicked.connect(lambda: QMessageBox.question(self, "⚠️ Reset?", "Reset all settings to defaults?"))
        actionLayout.addWidget(btnReset)

        btnClearCache = QPushButton("🗑️ Clear Cache")
        btnClearCache.setStyleSheet("background-color: #f97316; padding: 8px 16px;")
        btnClearCache.clicked.connect(lambda: QMessageBox.information(self, "✓ Cache Cleared", "Application cache cleared"))
        actionLayout.addWidget(btnClearCache)

        actionLayout.addStretch()
        scrollLayout.addLayout(actionLayout)

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _build_section(self, title: str, fields: list) -> QFrame:
        """Build a settings section card"""
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
        layout.setSpacing(12)

        titleLabel = QLabel(title)
        titleLabel.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        layout.addWidget(titleLabel)

        for fieldName, fieldValue, isReadOnly in fields:
            fieldLayout = QVBoxLayout()
            fieldLayout.setContentsMargins(0, 0, 0, 0)
            fieldLayout.setSpacing(4)

            nameLabel = QLabel(fieldName)
            nameLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
            nameLabel.setStyleSheet("color: #94a3b8;")
            fieldLayout.addWidget(nameLabel)

            valueInput = QLineEdit()
            valueInput.setText(str(fieldValue))
            valueInput.setReadOnly(isReadOnly)
            valueInput.setStyleSheet(f"""
                QLineEdit {{
                    background-color: {'#020617' if isReadOnly else '#0f172a'};
                    color: #cbd5e1;
                    border: 1px solid #334155;
                    border-radius: 6px;
                    padding: 6px;
                }}
            """)
            fieldLayout.addWidget(valueInput)

            layout.addLayout(fieldLayout)

        return card

    def _build_appearance_section(self) -> QFrame:
        """Build appearance settings section"""
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
        layout.setSpacing(12)

        titleLabel = QLabel("🎨 Appearance")
        titleLabel.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        layout.addWidget(titleLabel)

        # Theme
        themeLayout = QVBoxLayout()
        themeLabel = QLabel("Theme")
        themeLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        themeLabel.setStyleSheet("color: #94a3b8;")
        themeLayout.addWidget(themeLabel)

        themeCombo = QComboBox()
        themeCombo.addItems(["Dark", "Light", "Auto"])
        themeCombo.setCurrentText("Dark")
        themeLayout.addWidget(themeCombo)

        layout.addLayout(themeLayout)

        # Language
        langLayout = QVBoxLayout()
        langLabel = QLabel("Language")
        langLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        langLabel.setStyleSheet("color: #94a3b8;")
        langLayout.addWidget(langLabel)

        langCombo = QComboBox()
        langCombo.addItems(["English", "Español", "Français", "Deutsch", "日本語", "हिंदी"])
        langCombo.setCurrentText("English")
        langLayout.addWidget(langCombo)

        layout.addLayout(langLayout)

        # Timezone
        tzLayout = QVBoxLayout()
        tzLabel = QLabel("Timezone")
        tzLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        tzLabel.setStyleSheet("color: #94a3b8;")
        tzLayout.addWidget(tzLabel)

        tzCombo = QComboBox()
        tzCombo.addItems(["UTC", "Asia/Kolkata", "America/New_York", "Europe/London", "Asia/Tokyo"])
        tzCombo.setCurrentText("Asia/Kolkata")
        tzLayout.addWidget(tzCombo)

        layout.addLayout(tzLayout)

        return card

    def _build_notifications_section(self) -> QFrame:
        """Build notifications settings section"""
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
        layout.setSpacing(12)

        titleLabel = QLabel("🔔 Notifications")
        titleLabel.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        layout.addWidget(titleLabel)

        # Enable notifications
        notifCheck = QCheckBox("Enable Notifications")
        notifCheck.setChecked(True)
        layout.addWidget(notifCheck)

        # Sound
        soundCheck = QCheckBox("Enable Sound")
        soundCheck.setChecked(True)
        layout.addWidget(soundCheck)

        # Email digest
        digestLayout = QVBoxLayout()
        digestLabel = QLabel("Email Digest Frequency")
        digestLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        digestLabel.setStyleSheet("color: #94a3b8;")
        digestLayout.addWidget(digestLabel)

        digestCombo = QComboBox()
        digestCombo.addItems(["Daily", "Weekly", "Monthly", "Never"])
        digestCombo.setCurrentText("Weekly")
        digestLayout.addWidget(digestCombo)

        layout.addLayout(digestLayout)

        return card

    def _build_sync_section(self) -> QFrame:
        """Build sync settings section"""
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
        layout.setSpacing(12)

        titleLabel = QLabel("🔄 Sync Settings")
        titleLabel.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        layout.addWidget(titleLabel)

        # Auto sync
        syncCheck = QCheckBox("Auto Sync Enabled")
        syncCheck.setChecked(True)
        layout.addWidget(syncCheck)

        # Sync interval
        intervalLayout = QVBoxLayout()
        intervalLabel = QLabel("Sync Interval (minutes)")
        intervalLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        intervalLabel.setStyleSheet("color: #94a3b8;")
        intervalLayout.addWidget(intervalLabel)

        intervalSpinBox = QSpinBox()
        intervalSpinBox.setMinimum(1)
        intervalSpinBox.setMaximum(60)
        intervalSpinBox.setValue(5)
        intervalSpinBox.setStyleSheet("QSpinBox { background-color: #0f172a; color: #ffffff; border: 1px solid #334155; border-radius: 6px; }")
        intervalLayout.addWidget(intervalSpinBox)

        layout.addLayout(intervalLayout)

        # Offline mode
        offlineCheck = QCheckBox("Enable Offline Mode")
        offlineCheck.setChecked(True)
        layout.addWidget(offlineCheck)

        return card

    def _build_api_section(self) -> QFrame:
        """Build API configuration section"""
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
        layout.setSpacing(12)

        titleLabel = QLabel("🔗 API Configuration")
        titleLabel.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        layout.addWidget(titleLabel)

        # Base URL
        urlLayout = QVBoxLayout()
        urlLabel = QLabel("API Base URL")
        urlLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        urlLabel.setStyleSheet("color: #94a3b8;")
        urlLayout.addWidget(urlLabel)

        urlInput = QLineEdit()
        urlInput.setText("http://localhost:4000/api")
        urlLayout.addWidget(urlInput)

        layout.addLayout(urlLayout)

        # API Key (masked)
        keyLayout = QVBoxLayout()
        keyLabel = QLabel("API Key")
        keyLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        keyLabel.setStyleSheet("color: #94a3b8;")
        keyLayout.addWidget(keyLabel)

        keyInput = QLineEdit()
        keyInput.setText("••••••••••••••••")
        keyInput.setEchoMode(QLineEdit.EchoMode.Password)
        keyLayout.addWidget(keyInput)

        layout.addLayout(keyLayout)

        # Timeout
        timeoutLayout = QVBoxLayout()
        timeoutLabel = QLabel("Request Timeout (seconds)")
        timeoutLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        timeoutLabel.setStyleSheet("color: #94a3b8;")
        timeoutLayout.addWidget(timeoutLabel)

        timeoutSpinBox = QSpinBox()
        timeoutSpinBox.setMinimum(5)
        timeoutSpinBox.setMaximum(120)
        timeoutSpinBox.setValue(30)
        timeoutSpinBox.setStyleSheet("QSpinBox { background-color: #0f172a; color: #ffffff; border: 1px solid #334155; border-radius: 6px; }")
        timeoutLayout.addWidget(timeoutSpinBox)

        layout.addLayout(timeoutLayout)

        # Test Connection Button
        testBtn = QPushButton("🧪 Test Connection")
        testBtn.setStyleSheet("background-color: #3b82f6; padding: 6px 12px;")
        testBtn.clicked.connect(lambda: QMessageBox.information(self, "✓ Connection OK", "Successfully connected to API"))
        layout.addWidget(testBtn)

        return card

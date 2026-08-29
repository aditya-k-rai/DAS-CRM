"""
views_integrations.py — DAS CRM Integrations View
Connect WhatsApp, Google Workspace, call providers, analytics.
"""
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QFrame, QPushButton, QScrollArea, QLineEdit,
                              QCheckBox, QMessageBox, QDialog, QDialogButtonBox,
                              QComboBox)


class IntegrationsView(QFrame):
    """Third-party integrations management."""
    refreshed = pyqtSignal()

    INTEGRATIONS = [
        {
            "name": "WhatsApp Cloud API",
            "icon": "📱",
            "description": "Send and receive WhatsApp messages, manage templates, track conversations.",
            "status": "Connected",
            "status_color": "#22C55E",
            "fields": [("Phone Number", "+91 98765 43210"), ("Business Account", "DAS CRM Official")],
        },
        {
            "name": "Google Workspace",
            "icon": "🔍",
            "description": "Sync leads from Google Sheets, Gmail integration, Calendar events.",
            "status": "Connected",
            "status_color": "#22C55E",
            "fields": [("Email", "admin@dascrm.com"), ("Sheets Linked", "3 sheets")],
        },
        {
            "name": "Twilio (Call Center)",
            "icon": "📞",
            "description": "Inbound/outbound calling, call recording, IVR flows, call analytics.",
            "status": "Not Connected",
            "status_color": "#EF4444",
            "fields": [("Account SID", "—"), ("Phone Numbers", "0")],
        },
        {
            "name": "Slack Notifications",
            "icon": "💬",
            "description": "Push deal alerts, lead notifications, and team updates to Slack channels.",
            "status": "Connected",
            "status_color": "#22C55E",
            "fields": [("Workspace", "DAS CRM Team"), ("Channel", "#sales-alerts")],
        },
        {
            "name": "HubSpot CRM",
            "icon": "🔴",
            "description": "Bi-directional sync with HubSpot contacts, deals, and activities.",
            "status": "Not Connected",
            "status_color": "#EF4444",
            "fields": [("Portal ID", "—"), ("Last Sync", "Never")],
        },
        {
            "name": "Zapier Automation",
            "icon": "⚡",
            "description": "Connect DAS CRM with 5000+ apps via Zapier triggers and actions.",
            "status": "Connected",
            "status_color": "#22C55E",
            "fields": [("Zapier Account", "dascrm@company.com"), ("Active Zaps", "5")],
        },
    ]

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

        title = QLabel("🔗  Integrations")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        hl.addWidget(title)
        hl.addStretch()

        connected = len([i for i in self.INTEGRATIONS if i["status"] == "Connected"])
        hl.addWidget(QLabel(f"<span style='color:#22C55E'>{connected}/{len(self.INTEGRATIONS)}</span> connected"))
        hl.addSpacing(8)

        add_btn = QPushButton("➕  Add Integration")
        add_btn.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        add_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        add_btn.setStyleSheet("""
            QPushButton { background: #3B82F6; color: white; border: none; border-radius: 6px; padding: 6px 16px; }
            QPushButton:hover { background: #2563EB; }
        """)
        add_btn.clicked.connect(self._add_integration)
        hl.addWidget(add_btn)
        layout.addWidget(header)

        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("background: #0D1117; border: none;")
        scroll.setFrameShape(QFrame.Shape.NoFrame)

        content = QWidget()
        content.setStyleSheet("background: #0D1117;")
        cl = QVBoxLayout(content)
        cl.setContentsMargins(24, 20, 24, 20)
        cl.setSpacing(16)

        for integ in self.INTEGRATIONS:
            card = self._make_integration_card(integ)
            cl.addWidget(card)

        cl.addStretch()
        scroll.setWidget(content)
        layout.addWidget(scroll, stretch=1)

    def _make_integration_card(self, integ: dict) -> QFrame:
        frame = QFrame()
        frame.setStyleSheet("""
            QFrame {
                background: #1A2332; border-radius: 12px;
                border: 1px solid #2A3A5C; padding: 16px;
            }
        """)
        layout = QHBoxLayout(frame)
        layout.setContentsMargins(16, 16, 16, 16)

        # Icon
        icon_lbl = QLabel(f"<span style='font-size:28px'>{integ['icon']}</span>")
        icon_lbl.setFixedWidth(56)
        layout.addWidget(icon_lbl)

        # Info
        info = QVBoxLayout()
        info.setSpacing(4)
        name = QLabel(integ["name"])
        name.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        name.setStyleSheet("color: #F1F5F9; background: transparent;")
        info.addWidget(name)

        desc = QLabel(integ["description"])
        desc.setFont(QFont("Segoe UI", 9))
        desc.setStyleSheet("color: #94A3B8; background: transparent;")
        desc.setWordWrap(True)
        info.addWidget(desc)

        fields = QHBoxLayout()
        fields.setSpacing(16)
        for k, v in integ["fields"]:
            fields.addWidget(QLabel(f"<span style='color:#64748B;font-size:10px'>{k}: </span>"
                                    f"<span style='color:#94A3B8;font-size:10px'>{v}</span>"))
        info.addLayout(fields)
        layout.addLayout(info, stretch=1)

        # Status + button
        right = QVBoxLayout()
        right.setSpacing(8)
        status = QLabel(f"<span style='color:{integ['status_color']};font-size:11px'>● {integ['status']}</span>")
        status.setFont(QFont("Segoe UI", 10))
        right.addWidget(status)

        action_text = "Configure" if integ["status"] == "Connected" else "Connect"
        btn = QPushButton(action_text)
        btn.setFont(QFont("Segoe UI", 10))
        btn.setCursor(Qt.CursorShape.PointingHandCursor)
        color = "#22C55E" if integ["status"] == "Connected" else "#3B82F6"
        btn.setStyleSheet(f"""
            QPushButton {{
                background: {color}22; color: {color};
                border: 1px solid {color}44; border-radius: 6px;
                padding: 6px 16px;
            }}
            QPushButton:hover {{ background: {color}44; }}
        """)
        btn.clicked.connect(lambda _, i=integ: self._configure_integration(i))
        right.addWidget(btn)
        right.addStretch()
        layout.addLayout(right)
        return frame

    def _configure_integration(self, integ: dict):
        QMessageBox.information(self, integ["name"],
                               f"Configure {integ['name']}\n\n"
                               f"Status: {integ['status']}\n"
                               "Configuration panel coming soon.")

    def _add_integration(self):
        dlg = QDialog(self)
        dlg.setWindowTitle("Add Integration")
        dlg.setStyleSheet("background: #1A2332; color: #E2E8F0;")
        dlg.setMinimumSize(400, 300)
        layout = QVBoxLayout(dlg)
        layout.addWidget(QLabel("🔗  Add Integration"))
        layout.addSpacing(8)
        layout.addWidget(QLabel("Select an integration to connect:"))
        layout.addSpacing(8)
        for name in ["WhatsApp Cloud API", "Google Workspace", "Twilio",
                     "Slack", "HubSpot CRM", "Zapier"]:
            btn = QPushButton(f"➕  {name}")
            btn.setFont(QFont("Segoe UI", 10))
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.setStyleSheet("""
                QPushButton {
                    background: #0D1117; color: #E2E8F0;
                    border: 1px solid #2A3A5C; border-radius: 6px;
                    padding: 10px 16px; text-align: left;
                }
                QPushButton:hover { background: #2A3A5C; }
            """)
            btn.clicked.connect(lambda: dlg.accept())
            layout.addWidget(btn)
        layout.addStretch()
        cancel = QDialogButtonBox(QDialogButtonBox.StandardButton.Cancel)
        cancel.rejected.connect(dlg.reject)
        layout.addWidget(cancel)
        dlg.exec()

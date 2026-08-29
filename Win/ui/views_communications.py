"""
views_communications.py — DAS CRM Communications Hub
WhatsApp, Email, SMS, call logs.
"""
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QColor
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QFrame, QPushButton, QScrollArea, QTextEdit,
                              QLineEdit, QComboBox, QListWidget, QListWidgetItem,
                              QMessageBox, QDialog, QDialogButtonBox, QTabWidget)


class CommunicationsView(QFrame):
    """Communications hub: WhatsApp, Email, SMS."""
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

        title = QLabel("💬  Communications Hub")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        hl.addWidget(title)
        hl.addStretch()

        # Quick send buttons
        for icon, label, color in [
            ("📱", "WhatsApp", "#22C55E"),
            ("📧", "Email", "#3B82F6"),
            ("💬", "SMS", "#F59E0B"),
        ]:
            btn = QPushButton(f"{icon}  Send {label}")
            btn.setFont(QFont("Segoe UI", 10))
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.setStyleSheet(f"""
                QPushButton {{
                    background: {color}22; color: {color};
                    border: 1px solid {color}44; border-radius: 6px;
                    padding: 6px 14px;
                }}
                QPushButton:hover {{ background: {color}44; }}
            """)
            btn.clicked.connect(lambda _, c=color: self._quick_send(c))
            hl.addWidget(btn)

        layout.addWidget(header)

        # Tab interface
        tabs = QTabWidget()
        tabs.setStyleSheet("""
            QTabWidget::pane { background: #0D1117; border: none; }
            QTabBar::tab {
                background: #1A2332; color: #94A3B8;
                padding: 10px 20px; border: none;
                border-top: 2px solid transparent;
            }
            QTabBar::tab:selected { color: #60A5FA; border-top: 2px solid #3B82F6; }
            QTabBar::tab:hover { color: #E2E8F0; }
        """)
        tabs.addTab(self._build_whatsapp_tab(), "📱 WhatsApp")
        tabs.addTab(self._build_email_tab(), "📧 Email")
        tabs.addTab(self._build_sms_tab(), "💬 SMS")
        tabs.addTab(self._build_call_log_tab(), "📞 Call Logs")
        layout.addWidget(tabs)

    def _build_whatsapp_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        # Compose area
        compose = QFrame()
        compose.setStyleSheet("""
            QFrame { background: #1A2332; border-radius: 12px; border: 1px solid #2A3A5C; }
        """)
        cl = QVBoxLayout(compose)
        cl.setContentsMargins(16, 16, 16, 16)
        cl.addWidget(QLabel("📱  WhatsApp Message"))
        cl.addSpacing(4)

        to_row = QHBoxLayout()
        to_row.addWidget(QLabel("To:"))
        to_input = QLineEdit()
        to_input.setPlaceholderText("+91 98765 43210 or select contact...")
        to_input.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        to_row.addWidget(to_input)
        cl.addLayout(to_row)

        msg = QTextEdit()
        msg.setPlaceholderText("Type your message here...")
        msg.setFont(QFont("Segoe UI", 11))
        msg.setStyleSheet("""
            QTextEdit { background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 8px; padding: 10px; }
        """)
        msg.setFixedHeight(120)
        cl.addWidget(msg)

        send_btn = QPushButton("📱  Send via WhatsApp")
        send_btn.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        send_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        send_btn.setStyleSheet("""
            QPushButton { background: #22C55E; color: white; border: none; border-radius: 6px; padding: 10px 20px; }
            QPushButton:hover { background: #16A34A; }
        """)
        send_btn.clicked.connect(lambda: self._send_whatsapp(to_input.text(), msg.toPlainText()))
        cl.addWidget(send_btn)
        layout.addWidget(compose)

        # Templates
        tpl_frame = QFrame()
        tpl_frame.setStyleSheet("background: #1A2332; border-radius: 12px; border: 1px solid #2A3A5C;")
        tl = QVBoxLayout(tpl_frame)
        tl.setContentsMargins(16, 16, 16, 16)
        tl.addWidget(QLabel("📋  Quick Templates"))
        for tpl in ["Hi {{name}}, following up on our conversation...",
                    "Your quotation ({{quotation_id}}) is ready for review.",
                    "Thank you for choosing DAS CRM! Here is your...",
                    "Reminder: Meeting scheduled for tomorrow at {{time}}."]:
            tpl_btn = QPushButton(f"💬  {tpl[:50]}...")
            tpl_btn.setFont(QFont("Segoe UI", 9))
            tpl_btn.setCursor(Qt.CursorShape.PointingHandCursor)
            tpl_btn.setStyleSheet("""
                QPushButton {
                    background: #0D1117; color: #94A3B8; border: 1px solid #2A3A5C;
                    border-radius: 6px; padding: 8px 12px; text-align: left;
                }
                QPushButton:hover { background: #2A3A5C; color: #E2E8F0; }
            """)
            tpl_btn.clicked.connect(lambda _, t=tpl: msg.setText(t))
            tl.addWidget(tpl_btn)
        layout.addWidget(tpl_frame)
        layout.addStretch()
        return widget

    def _build_email_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        compose = QFrame()
        compose.setStyleSheet("""
            QFrame { background: #1A2332; border-radius: 12px; border: 1px solid #2A3A5C; }
        """)
        cl = QVBoxLayout(compose)
        cl.setContentsMargins(16, 16, 16, 16)
        cl.addWidget(QLabel("📧  Compose Email"))

        for lbl, placeholder in [("To:", "recipient@company.com"),
                                  ("Subject:", "Email subject...")]:
            row = QHBoxLayout()
            row.addWidget(QLabel(lbl))
            le = QLineEdit()
            le.setPlaceholderText(placeholder)
            le.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
            row.addWidget(le)
            cl.addLayout(row)

        body = QTextEdit()
        body.setPlaceholderText("Email body...")
        body.setStyleSheet("""
            QTextEdit { background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 8px; padding: 10px; }
        """)
        body.setFixedHeight(150)
        cl.addWidget(body)

        send_btn = QPushButton("📧  Send Email")
        send_btn.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        send_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        send_btn.setStyleSheet("""
            QPushButton { background: #3B82F6; color: white; border: none; border-radius: 6px; padding: 10px 20px; }
            QPushButton:hover { background: #2563EB; }
        """)
        send_btn.clicked.connect(lambda: QMessageBox.information(self, "Email", "Email sent! (Demo)"))
        cl.addWidget(send_btn)
        layout.addWidget(compose)
        layout.addStretch()
        return widget

    def _build_sms_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        compose = QFrame()
        compose.setStyleSheet("""
            QFrame { background: #1A2332; border-radius: 12px; border: 1px solid #2A3A5C; }
        """)
        cl = QVBoxLayout(compose)
        cl.setContentsMargins(16, 16, 16, 16)
        cl.addWidget(QLabel("💬  SMS"))
        row = QHBoxLayout()
        row.addWidget(QLabel("To:"))
        le = QLineEdit()
        le.setPlaceholderText("+91 98765 43210")
        le.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        row.addWidget(le)
        cl.addLayout(row)
        msg = QTextEdit()
        msg.setPlaceholderText("SMS message (max 160 chars)...")
        msg.setStyleSheet("""
            QTextEdit { background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 8px; padding: 10px; }
        """)
        msg.setFixedHeight(80)
        cl.addWidget(msg)
        send_btn = QPushButton("💬  Send SMS")
        send_btn.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        send_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        send_btn.setStyleSheet("""
            QPushButton { background: #F59E0B; color: white; border: none; border-radius: 6px; padding: 10px 20px; }
            QPushButton:hover { background: #D97706; }
        """)
        send_btn.clicked.connect(lambda: QMessageBox.information(self, "SMS", "SMS sent! (Demo)"))
        cl.addWidget(send_btn)
        layout.addWidget(compose)
        layout.addStretch()
        return widget

    def _build_call_log_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        info = QLabel("📞  Recent Call Logs")
        info.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        info.setStyleSheet("color: #E2E8F0;")
        layout.addWidget(info)

        logs = [
            ("Aditya Sharma", "+91 98765 43210", "Outgoing", "4m 18s", "Today 2:45 PM"),
            ("Priya Patel", "+91 98123 76543", "Incoming", "2m 05s", "Today 11:30 AM"),
            ("Vikram Malhotra", "+91 99887 11223", "Outgoing", "0m 00s", "Today 10:15 AM"),
            ("Ananya Roy", "+91 97654 32109", "Outgoing", "8m 32s", "Yesterday 4:20 PM"),
            ("Rahul Singh", "+91 98345 67890", "Missed", "—", "Yesterday 3:45 PM"),
        ]
        for name, phone, direction, duration, time in logs:
            row = QFrame()
            row.setStyleSheet("background: #1A2332; border-radius: 8px; padding: 8px;")
            rl = QHBoxLayout(row)
            rl.setContentsMargins(12, 8, 12, 8)
            icon = "📲" if direction == "Outgoing" else "📲" if direction == "Incoming" else "❌"
            rl.addWidget(QLabel(f"<span style='font-size:16px'>{icon}</span>"))
            rl.addWidget(QLabel(f"<span style='color:#E2E8F0;font-weight:bold'>{name}</span>"))
            rl.addWidget(QLabel(f"<span style='color:#94A3B8'>{phone}</span>"))
            rl.addWidget(QLabel(f"<span style='color:#64748B;font-size:10px'>{direction}</span>"))
            rl.addWidget(QLabel(f"<span style='color:#22C55E'>{duration}</span>"))
            rl.addStretch()
            rl.addWidget(QLabel(f"<span style='color:#64748B;font-size:10px'>{time}</span>"))
            layout.addWidget(row)
        layout.addStretch()
        return widget

    def _quick_send(self, channel: str):
        colors = {"#22C55E": "WhatsApp", "#3B82F6": "Email", "#F59E0B": "SMS"}
        QMessageBox.information(self, "Send Message",
                                f"Open {colors.get(channel, 'channel')} composer?\n(Demo mode)")

    def _send_whatsapp(self, to: str, message: str):
        if not to or not message:
            QMessageBox.warning(self, "Error", "Please enter recipient and message.")
            return
        import webbrowser
        clean = to.replace(" ", "").replace("-", "")
        webbrowser.open(f"https://wa.me/{clean}?text={message.replace(' ', '%20')}")
        QMessageBox.information(self, "WhatsApp", f"Opening WhatsApp for: {to}")

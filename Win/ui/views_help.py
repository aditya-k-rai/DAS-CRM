"""
views_help.py — DAS CRM Help & Support View
Documentation, keyboard shortcuts, feedback, changelog.
"""
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QColor
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QFrame, QPushButton, QScrollArea, QTextEdit,
                              QLineEdit, QComboBox, QMessageBox, QTabWidget)


class HelpView(QFrame):
    """Help center and support."""
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

        title = QLabel("❓  Help & Support")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        hl.addWidget(title)
        hl.addStretch()

        version_lbl = QLabel("v2.0.0  ·  Windows Desktop")
        version_lbl.setFont(QFont("Segoe UI", 10))
        version_lbl.setStyleSheet("color: #64748B; background: transparent;")
        hl.addWidget(version_lbl)

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
        tabs.addTab(self._build_docs_tab(), "📖  Documentation")
        tabs.addTab(self._build_shortcuts_tab(), "⌨️  Keyboard Shortcuts")
        tabs.addTab(self._build_feedback_tab(), "💬  Feedback")
        tabs.addTab(self._build_changelog_tab(), "📋  Changelog")
        layout.addWidget(tabs)

    def _build_docs_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        # Search
        search = QLineEdit()
        search.setPlaceholderText("🔍  Search documentation...")
        search.setStyleSheet("""
            QLineEdit {
                background: #1A2332; color: #E2E8F0;
                border: 1px solid #2A3A5C; border-radius: 8px; padding: 10px 14px;
            }
            QLineEdit:focus { border-color: #3B82F6; }
        """)
        layout.addWidget(search)

        topics = [
            ("🚀  Getting Started", "Quick start guide for new users. Install, login, and configure your workspace."),
            ("👥  Managing Leads", "Create, edit, import, and track leads through the sales pipeline."),
            ("📋  Quotations & Invoices", "Build professional quotations, apply GST, and generate PDF documents."),
            ("🤝  Deals & Pipeline", "Track deals through stages, manage your sales pipeline visually."),
            ("📊  Reports & Analytics", "Generate custom reports, export data, and track team performance."),
            ("🔧  Automation Rules", "Set up triggers, conditions, and actions to automate repetitive tasks."),
            ("📱  WhatsApp Integration", "Connect WhatsApp Cloud API and send templated messages."),
            ("🔗  Integrations", "Connect third-party services: Google Sheets, Slack, Twilio, Zapier."),
            ("🔒  Admin & Security", "Manage users, roles, custom fields, and security settings."),
            ("🛠️  Troubleshooting", "Common issues and how to resolve them."),
        ]
        for topic_title, desc in topics:
            card = QFrame()
            card.setStyleSheet("""
                QFrame {
                    background: #1A2332; border-radius: 10px;
                    border: 1px solid #2A3A5C; padding: 14px;
                }
                QFrame:hover { border-color: #3B82F6; background: #1E2A3C; }
            """)
            cl = QVBoxLayout(card)
            cl.setSpacing(4)
            title_lbl = QLabel(topic_title)
            title_lbl.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
            title_lbl.setStyleSheet("color: #60A5FA; background: transparent;")
            title_lbl.setCursor(Qt.CursorShape.PointingHandCursor)
            cl.addWidget(title_lbl)
            desc_lbl = QLabel(desc)
            desc_lbl.setFont(QFont("Segoe UI", 9))
            desc_lbl.setStyleSheet("color: #94A3B8; background: transparent;")
            cl.addWidget(desc_lbl)
            layout.addWidget(card)
        layout.addStretch()
        return widget

    def _build_shortcuts_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(12)

        info = QLabel("⌨️  Keyboard Shortcuts")
        info.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        info.setStyleSheet("color: #E2E8F0;")
        layout.addWidget(info)

        categories = [
            ("Global", [
                ("Ctrl+N", "New lead / quotation"),
                ("Ctrl+S", "Save current item"),
                ("Ctrl+F", "Search / filter"),
                ("Ctrl+E", "Export data"),
                ("Ctrl+,", "Open settings"),
                ("F5", "Refresh current view"),
            ]),
            ("Leads View", [
                ("Enter", "Edit selected lead"),
                ("Delete", "Delete selected"),
                ("Ctrl+I", "Import CSV/Excel"),
                ("Ctrl+Shift+E", "Export CSV"),
            ]),
            ("Navigation", [
                ("Ctrl+1", "Dashboard"),
                ("Ctrl+2", "Leads"),
                ("Ctrl+3", "Deals"),
                ("Ctrl+4", "Quotations"),
                ("Ctrl+5", "Products"),
                ("Ctrl+0", "Settings"),
            ]),
        ]
        for cat_title, shortcuts in categories:
            frame = QFrame()
            frame.setStyleSheet("""
                QFrame { background: #1A2332; border-radius: 10px; border: 1px solid #2A3A5C; padding: 12px; }
            """)
            fl = QVBoxLayout(frame)
            fl.setSpacing(8)
            cat_lbl = QLabel(cat_title)
            cat_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            cat_lbl.setStyleSheet("color: #60A5FA;")
            fl.addWidget(cat_lbl)
            for key, action in shortcuts:
                row = QHBoxLayout()
                key_lbl = QLabel(f"<span style='background:#2A3A5C;color:#E2E8F0;padding:2px 8px;border-radius:4px;font-family:monospace'>{key}</span>")
                row.addWidget(key_lbl)
                row.addWidget(QLabel(f"<span style='color:#94A3B8;font-size:10px'>{action}</span>"))
                row.addStretch()
                fl.addLayout(row)
            layout.addWidget(frame)
        layout.addStretch()
        return widget

    def _build_feedback_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        info = QLabel("💬  Send Feedback")
        info.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        info.setStyleSheet("color: #E2E8F0;")
        layout.addWidget(info)

        desc = QLabel("We value your feedback! Help us improve DAS CRM for everyone.")
        desc.setFont(QFont("Segoe UI", 10))
        desc.setStyleSheet("color: #94A3B8;")
        layout.addWidget(desc)

        form_frame = QFrame()
        form_frame.setStyleSheet("""
            QFrame { background: #1A2332; border-radius: 12px; border: 1px solid #2A3A5C; padding: 16px; }
        """)
        fl = QVBoxLayout(form_frame)
        fl.setSpacing(12)

        type_row = QHBoxLayout()
        type_row.addWidget(QLabel("Type:"))
        type_combo = QComboBox()
        type_combo.addItems(["Bug Report", "Feature Request", "Improvement", "General Feedback"])
        type_combo.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        type_row.addWidget(type_combo)
        fl.addLayout(type_row)

        subject = QLineEdit()
        subject.setPlaceholderText("Subject...")
        subject.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        fl.addWidget(subject)

        body = QTextEdit()
        body.setPlaceholderText("Describe your feedback in detail...")
        body.setStyleSheet("""
            QTextEdit { background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 8px; padding: 10px; }
        """)
        body.setFixedHeight(120)
        fl.addWidget(body)

        send_btn = QPushButton("📤  Submit Feedback")
        send_btn.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        send_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        send_btn.setStyleSheet("""
            QPushButton { background: #3B82F6; color: white; border: none; border-radius: 6px; padding: 10px 20px; }
            QPushButton:hover { background: #2563EB; }
        """)
        send_btn.clicked.connect(lambda: QMessageBox.information(self, "Feedback", "Thank you for your feedback!"))
        fl.addWidget(send_btn)
        layout.addWidget(form_frame)
        layout.addStretch()
        return widget

    def _build_changelog_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(12)

        info = QLabel("📋  Changelog")
        info.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        info.setStyleSheet("color: #E2E8F0;")
        layout.addWidget(info)

        versions = [
            ("v2.0.0", "30 Aug 2026", [
                "✨ New: Windows desktop application with full feature parity",
                "✨ New: WhatsApp Cloud API integration",
                "✨ New: Advanced automation rules engine",
                "✨ New: Custom field manager for leads and contacts",
                "🐛 Fix: CSV import performance improvements",
                "🐛 Fix: PDF generation for quotations",
            ]),
            ("v1.5.2", "15 Aug 2026", [
                "🐛 Fix: Multi-select in leads table",
                "🐛 Fix: GST calculation edge cases",
                "📦 Update: Backend dependencies updated",
            ]),
            ("v1.5.0", "1 Aug 2026", [
                "✨ New: Google Sheets live sync",
                "✨ New: Excel file import with multi-sheet support",
                "✨ New: Quotation history with load/save",
                "✨ New: Enhanced PDF preview with A4 rendering",
            ]),
        ]
        for version, date, changes in versions:
            frame = QFrame()
            frame.setStyleSheet("""
                QFrame { background: #1A2332; border-radius: 10px; border: 1px solid #2A3A5C; padding: 12px; }
            """)
            fl = QVBoxLayout(frame)
            fl.setSpacing(8)
            header_row = QHBoxLayout()
            ver_lbl = QLabel(f"<span style='color:#60A5FA;font-weight:bold'>{version}</span>")
            ver_lbl.setFont(QFont("Segoe UI", 12))
            header_row.addWidget(ver_lbl)
            date_lbl = QLabel(f"<span style='color:#64748B;font-size:10px'>{date}</span>")
            header_row.addWidget(date_lbl)
            header_row.addStretch()
            fl.addLayout(header_row)
            for change in changes:
                icon = "✨" if change.startswith("✨") else "🐛" if change.startswith("🐛") else "📦"
                fl.addWidget(QLabel(f"<span style='color:#94A3B8;font-size:10px'>{icon}  {change[2:]}</span>"))
            layout.addWidget(frame)
        layout.addStretch()
        return widget

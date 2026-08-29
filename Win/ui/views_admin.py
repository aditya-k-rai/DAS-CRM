"""
views_admin.py — DAS CRM Admin Panel
Tenant settings, user management, role configuration, audit logs.
"""
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QColor
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QFrame, QPushButton, QScrollArea, QTableWidget,
                              QTableWidgetItem, QHeaderView, QAbstractItemView,
                              QLineEdit, QComboBox, QDialog, QDialogButtonBox,
                              QMessageBox, QTabWidget, QCheckBox, QSpinBox)


class AdminView(QFrame):
    """Admin panel for tenant management."""
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

        title = QLabel("🛠️  Admin Panel")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        hl.addWidget(title)
        hl.addStretch()

        tenant_lbl = QLabel("<span style='color:#94A3B8'>Tenant:</span> <span style='color:#60A5FA'>DAS CRM Demo</span>")
        tenant_lbl.setFont(QFont("Segoe UI", 10))
        hl.addWidget(tenant_lbl)

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
        tabs.addTab(self._build_users_tab(), "👥  Users & Roles")
        tabs.addTab(self._build_tenant_tab(), "🏢  Tenant Settings")
        tabs.addTab(self._build_audit_tab(), "📋  Audit Log")
        tabs.addTab(self._build_fields_tab(), "📊  Custom Fields")
        layout.addWidget(tabs)

    def _build_users_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        toolbar = QHBoxLayout()
        toolbar.addWidget(QLabel("👥  Team Members"))
        toolbar.addStretch()
        add_btn = QPushButton("➕  Add User")
        add_btn.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        add_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        add_btn.setStyleSheet("""
            QPushButton { background: #3B82F6; color: white; border: none; border-radius: 6px; padding: 6px 16px; }
            QPushButton:hover { background: #2563EB; }
        """)
        add_btn.clicked.connect(self._add_user)
        toolbar.addWidget(add_btn)
        layout.addLayout(toolbar)

        table = QTableWidget()
        table.setColumnCount(6)
        table.setHorizontalHeaderLabels(["Name", "Email", "Role", "Status", "Last Active", "Actions"])
        table.horizontalHeader().setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        table.horizontalHeader().setStyleSheet("""
            QHeaderView::section {
                background: #1A2332; color: #94A3B8; padding: 8px 12px; border: none;
                border-bottom: 2px solid #2A3A5C;
            }
        """)
        table.verticalHeader().setVisible(False)
        table.setAlternatingRowColors(True)
        table.setShowGrid(False)
        table.setFont(QFont("Segoe UI", 10))
        table.setStyleSheet("""
            QTableWidget {
                background: #0D1117; alternate-background-color: #111827; color: #E2E8F0;
                border: none; gridline-color: #1E2A3C; selection-background-color: #1E3A5C;
            }
            QTableWidget::item { padding: 8px 12px; border-bottom: 1px solid #1E2A3C; }
            QScrollBar:vertical { background: #1A2332; width: 8px; border-radius: 4px; }
            QScrollBar::handle { background: #2A3A5C; border-radius: 4px; }
            QScrollBar::add-line, QScrollBar::sub-line { height: 0px; }
        """)

        users = [
            ("Rajesh Kumar", "rajesh@dascrm.com", "Sales Rep", "Active", "Today 6:15 PM"),
            ("Priya Sharma", "priya@dascrm.com", "Sales Rep", "Active", "Today 6:30 PM"),
            ("Amit Shah (TL)", "amit@dascrm.com", "Team Lead", "Active", "Today 6:00 PM"),
            ("Sunita Verma (HR)", "sunita@dascrm.com", "HR Manager", "Active", "Today 5:00 PM"),
            ("Vikram Joshi", "vikram@dascrm.com", "Sales Rep", "Active", "Today 5:45 PM"),
            ("Neha Kapoor", "neha@dascrm.com", "Sales Rep", "On Leave", "Yesterday"),
            ("Admin User", "admin@dascrm.com", "Admin", "Active", "Today 9:00 AM"),
        ]
        table.setRowCount(len(users))
        for row, user in enumerate(users):
            for col, val in enumerate(user):
                item = QTableWidgetItem(val)
                item.setFont(QFont("Segoe UI", 10))
                if col == 0:
                    item.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
                    item.setForeground(QColor("#60A5FA"))
                if col == 3:
                    color = "#22C55E" if val == "Active" else "#F59E0B"
                    item.setForeground(QColor(color))
                table.setItem(row, col, item)
            # Actions
            edit_btn = QPushButton("✏️")
            edit_btn.setFixedSize(28, 28)
            edit_btn.setFont(QFont("Segoe UI", 9))
            edit_btn.setCursor(Qt.CursorShape.PointingHandCursor)
            edit_btn.setStyleSheet("""
                QPushButton { background: transparent; color: #60A5FA; border: 1px solid #2A3A5C; border-radius: 4px; }
                QPushButton:hover { background: #2A3A5C; }
            """)
            table.setCellWidget(row, 5, edit_btn)
        layout.addWidget(table)
        layout.addStretch()
        return widget

    def _build_tenant_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        info = QLabel("🏢  Tenant Configuration")
        info.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        info.setStyleSheet("color: #E2E8F0;")
        layout.addWidget(info)

        form_frame = QFrame()
        form_frame.setStyleSheet("""
            QFrame { background: #1A2332; border-radius: 12px; border: 1px solid #2A3A5C; padding: 16px; }
        """)
        fl = QVBoxLayout(form_frame)
        fl.setSpacing(12)

        fields = [
            ("Company Name", "DAS CRM Demo"),
            ("Domain", "dascrm.com"),
            ("Admin Email", "admin@dascrm.com"),
            ("Max Users", "50"),
            ("Storage (GB)", "100"),
        ]
        for label, value in fields:
            row = QHBoxLayout()
            lbl = QLabel(label)
            lbl.setFont(QFont("Segoe UI", 10))
            lbl.setFixedWidth(160)
            lbl.setStyleSheet("color: #94A3B8;")
            row.addWidget(lbl)
            le = QLineEdit()
            le.setText(value)
            le.setFont(QFont("Segoe UI", 10))
            le.setStyleSheet("""
                QLineEdit {
                    background: #0D1117; color: #E2E8F0;
                    border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;
                }
                QLineEdit:focus { border-color: #3B82F6; }
            """)
            row.addWidget(le)
            fl.addLayout(row)

        save_btn = QPushButton("💾  Save Changes")
        save_btn.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        save_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        save_btn.setStyleSheet("""
            QPushButton { background: #3B82F6; color: white; border: none; border-radius: 6px; padding: 10px 20px; }
            QPushButton:hover { background: #2563EB; }
        """)
        save_btn.clicked.connect(lambda: QMessageBox.information(self, "Saved", "Tenant settings saved!"))
        fl.addWidget(save_btn)
        layout.addWidget(form_frame)
        layout.addStretch()
        return widget

    def _build_audit_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        info = QLabel("📋  Recent Audit Log")
        info.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        info.setStyleSheet("color: #E2E8F0;")
        layout.addWidget(info)

        table = QTableWidget()
        table.setColumnCount(4)
        table.setHorizontalHeaderLabels(["Timestamp", "User", "Action", "Details"])
        table.horizontalHeader().setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        table.horizontalHeader().setStyleSheet("""
            QHeaderView::section {
                background: #1A2332; color: #94A3B8; padding: 8px 12px; border: none;
                border-bottom: 2px solid #2A3A5C;
            }
        """)
        table.verticalHeader().setVisible(False)
        table.setAlternatingRowColors(True)
        table.setShowGrid(False)
        table.setFont(QFont("Segoe UI", 10))
        table.setStyleSheet("""
            QTableWidget {
                background: #0D1117; alternate-background-color: #111827; color: #E2E8F0;
                border: none; gridline-color: #1E2A3C; selection-background-color: #1E3A5C;
            }
            QTableWidget::item { padding: 8px 12px; border-bottom: 1px solid #1E2A3C; }
            QScrollBar:vertical { background: #1A2332; width: 8px; border-radius: 4px; }
            QScrollBar::handle { background: #2A3A5C; border-radius: 4px; }
            QScrollBar::add-line, QScrollBar::sub-line { height: 0px; }
        """)
        table.horizontalHeader().setSectionResizeMode(3, QHeaderView.ResizeMode.Stretch)

        logs = [
            ("30 Aug 14:32", "Rajesh Kumar", "CREATE", "New lead: Aditya Sharma"),
            ("30 Aug 14:18", "Priya Sharma", "UPDATE", "Lead status → Proposal"),
            ("30 Aug 13:55", "Amit Shah (TL)", "DELETE", "Lead: stale_lead_2026.csv"),
            ("30 Aug 12:40", "Admin User", "LOGIN", "Session started"),
            ("30 Aug 11:20", "Vikram Joshi", "CREATE", "New quotation: Q-2026-047"),
        ]
        table.setRowCount(len(logs))
        for row, log in enumerate(logs):
            for col, val in enumerate(log):
                item = QTableWidgetItem(val)
                item.setFont(QFont("Segoe UI", 10))
                if col == 2:
                    colors = {"CREATE": "#22C55E", "UPDATE": "#3B82F6",
                              "DELETE": "#EF4444", "LOGIN": "#94A3B8"}
                    item.setForeground(QColor(colors.get(val, "#94A3B8")))
                table.setItem(row, col, item)
        layout.addWidget(table)
        layout.addStretch()
        return widget

    def _build_fields_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        info = QLabel("📊  Custom Field Manager")
        info.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        info.setStyleSheet("color: #E2E8F0;")
        layout.addWidget(info)

        desc = QLabel("Define custom columns for your leads, contacts, and deals.")
        desc.setFont(QFont("Segoe UI", 10))
        desc.setStyleSheet("color: #94A3B8;")
        layout.addWidget(desc)

        fields = [
            ("GSTIN", "Text", "Leads"),
            ("PAN Number", "Text", "Leads"),
            ("Budget Range", "Dropdown", "Leads"),
            ("Industry", "Dropdown", "Companies"),
            ("Employee Count", "Number", "Companies"),
        ]
        for name, ftype, entity in fields:
            row = QFrame()
            row.setStyleSheet("background: #1A2332; border-radius: 6px; padding: 10px;")
            rl = QHBoxLayout(row)
            rl.addWidget(QLabel(f"<span style='color:#E2E8F0;font-weight:bold'>{name}</span>"))
            rl.addWidget(QLabel(f"<span style='color:#64748B;font-size:10px'>{ftype}</span>"))
            rl.addWidget(QLabel(f"<span style='color:#64748B;font-size:10px'>{entity}</span>"))
            rl.addStretch()
            toggle = QCheckBox()
            toggle.setChecked(True)
            rl.addWidget(toggle)
            layout.addWidget(row)
        layout.addStretch()
        return widget

    def _add_user(self):
        dlg = QDialog(self)
        dlg.setWindowTitle("Add User")
        dlg.setStyleSheet("background: #1A2332; color: #E2E8F0;")
        dlg.setMinimumSize(400, 360)
        layout = QVBoxLayout(dlg)
        layout.addWidget(QLabel("👥  Add New User"))
        layout.setSpacing(12)
        fields = [("Full Name", "name"), ("Email", "email")]
        for label, key in fields:
            row = QHBoxLayout()
            row.addWidget(QLabel(label))
            le = QLineEdit()
            le.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
            row.addWidget(le)
            layout.addLayout(row)
        role_row = QHBoxLayout()
        role_row.addWidget(QLabel("Role:"))
        role_combo = QComboBox()
        role_combo.addItems(["Sales Rep", "Team Lead", "Manager", "Admin", "HR Manager"])
        role_combo.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        role_row.addWidget(role_combo)
        layout.addLayout(role_row)
        layout.addStretch()
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(lambda: QMessageBox.information(self, "User Added", "User created successfully!"))
        buttons.rejected.connect(dlg.reject)
        layout.addWidget(buttons)
        dlg.exec()

"""
views_automation.py — DAS CRM Automation Rules View
Workflow automation builder, triggers, actions.
"""
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QColor
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QFrame, QPushButton, QScrollArea, QTableWidget,
                              QTableWidgetItem, QHeaderView, QAbstractItemView,
                              QLineEdit, QComboBox, QCheckBox, QMessageBox,
                              QDialog, QDialogButtonBox, QTextEdit)


class AutomationView(QFrame):
    """Automation rules and workflow builder."""
    refreshed = pyqtSignal()

    SAMPLE_RULES = [
        {"id": "1", "name": "New Lead Welcome Email", "trigger": "New Lead Created",
         "action": "Send Welcome Email", "status": "Active", "runs": 142},
        {"id": "2", "name": "Follow-up Reminder", "trigger": "Lead Status = Follow Up",
         "action": "Create Task + Notify Rep", "status": "Active", "runs": 89},
        {"id": "3", "name": "Hot Lead Alert", "trigger": "Lead Priority = High",
         "action": "Slack Notification", "status": "Active", "runs": 67},
        {"id": "4", "name": "Stale Lead Reassignment", "trigger": "No Activity 14 days",
         "action": "Reassign to Team Lead", "status": "Paused", "runs": 23},
        {"id": "5", "name": "Deal Won Celebration", "trigger": "Deal Stage = Closed Won",
         "action": "Email Team + Update Dashboard", "status": "Active", "runs": 18},
    ]

    def __init__(self, api_client=None, sync_engine=None, parent=None):
        super().__init__(parent)
        self.api_client = api_client
        self.sync_engine = sync_engine
        self.rules = list(self.SAMPLE_RULES)
        self._setup_ui()
        self._populate_table()

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

        title = QLabel("🔧  Automation Rules")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        hl.addWidget(title)

        hl.addStretch()

        active_count = len([r for r in self.rules if r["status"] == "Active"])
        count_lbl = QLabel(f"<span style='color:#22C55E'>{active_count} active</span> rules")
        count_lbl.setFont(QFont("Segoe UI", 10))
        hl.addWidget(count_lbl)

        add_btn = QPushButton("➕  Create Rule")
        add_btn.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        add_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        add_btn.setStyleSheet("""
            QPushButton { background: #3B82F6; color: white; border: none; border-radius: 6px; padding: 6px 16px; }
            QPushButton:hover { background: #2563EB; }
        """)
        add_btn.clicked.connect(self._create_rule)
        hl.addWidget(add_btn)
        layout.addWidget(header)

        # Info banner
        banner = QFrame()
        banner.setFixedHeight(40)
        banner.setStyleSheet("background: rgba(59,130,246,0.1); border-bottom: 1px solid rgba(59,130,246,0.2);")
        bl = QHBoxLayout(banner)
        bl.setContentsMargins(24, 0, 24, 0)
        bl.addWidget(QLabel("⚡ Automate repetitive tasks — triggers, conditions, and actions to streamline your sales workflow."))
        bl.addStretch()
        bl.children()
        layout.addWidget(banner)

        self.table = QTableWidget()
        self.table.setColumnCount(5)
        self.table.setHorizontalHeaderLabels(["Rule Name", "Trigger", "Action", "Status", "Runs"])
        self.table.horizontalHeader().setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        self.table.horizontalHeader().setStyleSheet("""
            QHeaderView::section {
                background: #1A2332; color: #94A3B8; padding: 8px 12px;
                border: none; border-bottom: 2px solid #2A3A5C;
            }
        """)
        self.table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Interactive)
        self.table.verticalHeader().setVisible(False)
        self.table.setAlternatingRowColors(True)
        self.table.setShowGrid(False)
        self.table.setFont(QFont("Segoe UI", 10))
        self.table.setStyleSheet("""
            QTableWidget {
                background: #0D1117; alternate-background-color: #111827; color: #E2E8F0;
                border: none; gridline-color: #1E2A3C; selection-background-color: #1E3A5C;
            }
            QTableWidget::item { padding: 8px 12px; border-bottom: 1px solid #1E2A3C; }
            QScrollBar:vertical { background: #1A2332; width: 8px; border-radius: 4px; }
            QScrollBar::handle { background: #2A3A5C; border-radius: 4px; }
            QScrollBar::add-line, QScrollBar::sub-line { height: 0px; }
        """)
        layout.addWidget(self.table)

    def _populate_table(self):
        self.table.setRowCount(len(self.rules))
        for row, rule in enumerate(self.rules):
            data = [rule["name"], rule["trigger"], rule["action"],
                    rule["status"], str(rule["runs"])]
            for col, val in enumerate(data):
                item = QTableWidgetItem(val)
                item.setFont(QFont("Segoe UI", 10))
                if col == 0:
                    item.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
                    item.setForeground(QColor("#60A5FA"))
                if col == 3:
                    color = "#22C55E" if val == "Active" else "#F59E0B"
                    item.setForeground(QColor(color))
                self.table.setItem(row, col, item)

    def _create_rule(self):
        dlg = QDialog(self)
        dlg.setWindowTitle("Create Automation Rule")
        dlg.setStyleSheet("background: #1A2332; color: #E2E8F0;")
        dlg.setMinimumSize(480, 360)
        layout = QVBoxLayout(dlg)
        layout.addWidget(QLabel("🔧  Create Automation Rule"))
        layout.addSpacing(8)
        name = QLineEdit()
        name.setPlaceholderText("Rule name...")
        name.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        layout.addWidget(QLabel("Rule Name:"))
        layout.addWidget(name)
        layout.addWidget(QLabel("Trigger:"))
        trigger = QComboBox()
        trigger.addItems(["New Lead Created", "Lead Status Changed", "Lead Priority Changed",
                          "Deal Stage Changed", "Quotation Sent", "No Activity for N Days"])
        trigger.setStyleSheet("background: #0D1117; color: #E2E8F0; border: 1px solid #2A3A5C; border-radius: 6px; padding: 8px;")
        layout.addWidget(trigger)
        layout.addWidget(QLabel("Action:"))
        action = QComboBox()
        action.addItems(["Send Email", "Create Task", "Send Slack Notification",
                         "Reassign Lead", "Update Status", "Send WhatsApp"])
        action.setStyleSheet(trigger.styleSheet())
        layout.addWidget(action)
        layout.addStretch()
        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok | QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(dlg.accept)
        buttons.rejected.connect(dlg.reject)
        layout.addWidget(buttons)
        dlg.exec()

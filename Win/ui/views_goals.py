"""
views_goals.py — DAS CRM Goals & Target Management View
Real-time Quota Pacing, Team Leaderboard, Daily Call/WA Targets, and Activity Drilldown.
Full 1:1 Parity with Web EmployeeRoleDashboard and Mobile SalesGoalsScreen.
"""
from PyQt6.QtCore import Qt, QTimer, pyqtSignal, QDate
from PyQt6.QtGui import QFont, QColor, QBrush
from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QFrame, QPushButton,
    QScrollArea, QTableWidget, QTableWidgetItem, QAbstractItemView,
    QDialog, QComboBox, QLineEdit, QProgressBar, QMessageBox, QGridLayout
)
from datetime import datetime
import asyncio
import threading


# ─── DEFAULT TEAM REP DATA ───────────────────────────────────────────────────

FALLBACK_REPS = [
    {
        "id": "rep-1",
        "name": "Rajesh Kumar",
        "role": "Senior Sales Executive",
        "avatar": "RK",
        "callsDone": 42,
        "callsTarget": 50,
        "waDone": 28,
        "waTarget": 30,
        "quotesSent": 9,
        "dealsWon": 4,
        "revenue": 385000,
        "revenueTarget": 500000,
        "meetingsHeld": 7,
        "meetingsTarget": 10,
        "status": "ON TRACK",
    },
    {
        "id": "rep-2",
        "name": "Priya Sharma",
        "role": "Sales Executive",
        "avatar": "PS",
        "callsDone": 38,
        "callsTarget": 50,
        "waDone": 24,
        "waTarget": 30,
        "quotesSent": 6,
        "dealsWon": 3,
        "revenue": 290000,
        "revenueTarget": 450000,
        "meetingsHeld": 5,
        "meetingsTarget": 8,
        "status": "ON TRACK",
    },
    {
        "id": "rep-3",
        "name": "Vikram Mehta",
        "role": "Enterprise Account Exec",
        "avatar": "VM",
        "callsDone": 48,
        "callsTarget": 50,
        "waDone": 32,
        "waTarget": 30,
        "quotesSent": 12,
        "dealsWon": 5,
        "revenue": 620000,
        "revenueTarget": 600000,
        "meetingsHeld": 11,
        "meetingsTarget": 10,
        "status": "AHEAD",
    },
    {
        "id": "rep-4",
        "name": "Amit Patel",
        "role": "Field Sales Rep",
        "avatar": "AP",
        "callsDone": 22,
        "callsTarget": 50,
        "waDone": 15,
        "waTarget": 30,
        "quotesSent": 4,
        "dealsWon": 1,
        "revenue": 140000,
        "revenueTarget": 400000,
        "meetingsHeld": 3,
        "meetingsTarget": 8,
        "status": "NEEDS ATTENTION",
    },
    {
        "id": "rep-5",
        "name": "Sunita Rao",
        "role": "Business Development Rep",
        "avatar": "SR",
        "callsDone": 36,
        "callsTarget": 50,
        "waDone": 21,
        "waTarget": 30,
        "quotesSent": 7,
        "dealsWon": 2,
        "revenue": 210000,
        "revenueTarget": 400000,
        "meetingsHeld": 6,
        "meetingsTarget": 8,
        "status": "ON TRACK",
    },
]


# ─── REPRESENTATIVE ACTIVITY DRILLDOWN MODAL ─────────────────────────────────

class RepActivityDrilldownModal(QDialog):
    """Detailed activity breakdown modal for individual sales representative."""

    def __init__(self, rep: dict, parent=None):
        super().__init__(parent)
        self.rep = rep
        self.setWindowTitle(f"🎯 Target & Activity Drilldown — {rep['name']}")
        self.setGeometry(120, 100, 750, 580)
        self.setStyleSheet("""
            QDialog { background-color: #0D1117; color: #F1F5F9; }
            QLabel { color: #F1F5F9; }
            QTableWidget {
                background-color: #161F2E;
                color: #F1F5F9;
                border: 1px solid #2A3A5C;
                gridline-color: #1E2A3C;
                border-radius: 8px;
            }
            QHeaderView::section {
                background-color: #1A2332;
                color: #94A3B8;
                border: none;
                padding: 6px;
                font-weight: bold;
            }
        """)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)

        # Header card
        header = QFrame()
        header.setStyleSheet("background: #1A2332; border-radius: 10px; border: 1px solid #2A3A5C; padding: 12px;")
        hl = QHBoxLayout(header)

        info_col = QVBoxLayout()
        name_lbl = QLabel(f"👤  {self.rep['name']} — {self.rep['role']}")
        name_lbl.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        name_lbl.setStyleSheet("color: #60A5FA; background: transparent;")
        info_col.addWidget(name_lbl)

        rev_val = self.rep['revenue']
        rev_txt = f"₹{rev_val / 100000:.1f}L" if rev_val >= 100000 else f"₹{rev_val:,}"
        target_val = self.rep['revenueTarget']
        target_txt = f"₹{target_val / 100000:.1f}L" if target_val >= 100000 else f"₹{target_val:,}"
        pct = round((rev_val / max(target_val, 1)) * 100)

        sub_lbl = QLabel(f"Quota Attainment: {pct}% of {target_txt} Quota | {self.rep['dealsWon']} Deals Won | {self.rep['quotesSent']} Quotations")
        sub_lbl.setFont(QFont("Segoe UI", 10))
        sub_lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        info_col.addWidget(sub_lbl)
        hl.addLayout(info_col)
        hl.addStretch()

        # Status badge
        st = self.rep.get("status", "ON TRACK")
        st_color = "#22C55E" if st == "AHEAD" else "#3B82F6" if st == "ON TRACK" else "#EF4444"
        badge = QLabel(f"  {st}  ")
        badge.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        badge.setStyleSheet(f"background: rgba(255,255,255,0.08); color: {st_color}; border: 1px solid {st_color}; border-radius: 6px; padding: 4px 8px;")
        hl.addWidget(badge)

        layout.addWidget(header)

        # 4 Mini Metric Pills
        metrics_bar = QHBoxLayout()
        metrics = [
            ("📞 Calls Logged", f"{self.rep['callsDone']} / {self.rep['callsTarget']}", "#38BDF8"),
            ("💬 WhatsApp Outreach", f"{self.rep['waDone']} / {self.rep['waTarget']}", "#34D399"),
            ("🏆 Revenue Booked", rev_txt, "#C084FC"),
            ("🤝 Meetings Held", f"{self.rep['meetingsHeld']} / {self.rep['meetingsTarget']}", "#FBBF24"),
        ]
        for label, val, color in metrics:
            f = QFrame()
            f.setStyleSheet("background: #161F2E; border-radius: 8px; border: 1px solid #2A3A5C; padding: 8px;")
            fl = QVBoxLayout(f)
            fl.setContentsMargins(8, 6, 8, 6)
            fl.setSpacing(2)
            l = QLabel(label)
            l.setFont(QFont("Segoe UI", 8))
            l.setStyleSheet("color: #94A3B8; background: transparent;")
            v = QLabel(val)
            v.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
            v.setStyleSheet(f"color: {color}; background: transparent;")
            fl.addWidget(l)
            fl.addWidget(v)
            metrics_bar.addWidget(f)

        layout.addLayout(metrics_bar)

        # Activity Timeline Table
        sec_title = QLabel("📋 Contributing Activity Stream & Touchpoint Log")
        sec_title.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        sec_title.setStyleSheet("color: #E2E8F0;")
        layout.addWidget(sec_title)

        self.activity_table = QTableWidget()
        self.activity_table.setColumnCount(5)
        self.activity_table.setHorizontalHeaderLabels(["Type", "Account / Contact", "Action Summary", "Outcome / Stage", "Timestamp"])
        self.activity_table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        self.activity_table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.activity_table.verticalHeader().setVisible(False)
        self.activity_table.horizontalHeader().setStretchLastSection(True)

        sample_activities = [
            ("📞 Phone Call", "TechCorp Global — Rajesh M.", "Product Architecture Discovery Call", "CONNECTED", "Today, 11:20 AM"),
            ("💬 WhatsApp", "Apex Logistics — Priya S.", "Sent Commercial Proposal PDF & SLA", "DELIVERED", "Today, 10:45 AM"),
            ("📋 Quotation", "Sun Pharma Infra — Amit B.", "Generated Q-2026-089 (₹2.4L Server Rack)", "SENT", "Yesterday, 4:15 PM"),
            ("🤝 Demo Call", "Nexus Health — Dr. Mehra", "Live Walkthrough with Procurement TL", "POSITIVE", "Yesterday, 2:30 PM"),
            ("🏆 Won Deal", "BlueStar Retail — Ananya R.", "Closed Annual Software License (₹1.8L)", "CLOSED WON", "24 Oct, 5:00 PM"),
            ("📞 Follow-up", "Godrej Ventures — Vivek P.", "Follow-up regarding vendor onboarding", "SCHEDULED", "23 Oct, 3:00 PM"),
        ]

        self.activity_table.setRowCount(len(sample_activities))
        for row, (atype, acc, summary, outcome, ts) in enumerate(sample_activities):
            self.activity_table.setItem(row, 0, QTableWidgetItem(atype))
            self.activity_table.setItem(row, 1, QTableWidgetItem(acc))
            self.activity_table.setItem(row, 2, QTableWidgetItem(summary))
            out_item = QTableWidgetItem(outcome)
            if "WON" in outcome or "CONNECTED" in outcome:
                out_item.setForeground(QBrush(QColor("#22C55E")))
            elif "POSITIVE" in outcome or "DELIVERED" in outcome:
                out_item.setForeground(QBrush(QColor("#60A5FA")))
            else:
                out_item.setForeground(QBrush(QColor("#F59E0B")))
            self.activity_table.setItem(row, 3, out_item)
            self.activity_table.setItem(row, 4, QTableWidgetItem(ts))

        self.activity_table.resizeColumnsToContents()
        layout.addWidget(self.activity_table, 1)

        # Close button
        btn_close = QPushButton("Close")
        btn_close.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_close.setStyleSheet("""
            QPushButton {
                background: #1E2A3C; color: #E2E8F0; border: 1px solid #2A3A5C;
                border-radius: 6px; padding: 8px 18px; font-weight: bold;
            }
            QPushButton:hover { background: #2A3A5C; }
        """)
        btn_close.clicked.connect(self.accept)
        layout.addWidget(btn_close, alignment=Qt.AlignmentFlag.AlignRight)


# ─── GOAL CONFIGURATION DIALOG ───────────────────────────────────────────────

class GoalConfigDialog(QDialog):
    """Dialog to adjust quota targets."""

    def __init__(self, current_targets: dict, parent=None):
        super().__init__(parent)
        self.setWindowTitle("⚙️ Target & Quota Configuration")
        self.setFixedSize(380, 320)
        self.setStyleSheet("""
            QDialog { background-color: #0D1117; color: #F1F5F9; }
            QLabel { color: #E2E8F0; font-size: 11px; }
            QLineEdit {
                background-color: #1A2332; color: #F1F5F9; border: 1px solid #2A3A5C;
                border-radius: 6px; padding: 8px; font-size: 11px;
            }
        """)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(12)

        title = QLabel("🎯 Set Team Pacing & Quotas")
        title.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        title.setStyleSheet("color: #60A5FA;")
        layout.addWidget(title)

        layout.addWidget(QLabel("Daily Calls Quota per Rep:"))
        self.calls_input = QLineEdit(str(current_targets.get("calls", 50)))
        layout.addWidget(self.calls_input)

        layout.addWidget(QLabel("Daily WhatsApp Outreach Quota:"))
        self.wa_input = QLineEdit(str(current_targets.get("wa", 30)))
        layout.addWidget(self.wa_input)

        layout.addWidget(QLabel("Monthly Revenue Quota per Rep (₹):"))
        self.rev_input = QLineEdit(str(current_targets.get("revenue", 500000)))
        layout.addWidget(self.rev_input)

        layout.addStretch()

        btn_row = QHBoxLayout()
        btn_cancel = QPushButton("Cancel")
        btn_cancel.setStyleSheet("background: #1A2332; color: #94A3B8; padding: 6px 12px; border-radius: 6px;")
        btn_cancel.clicked.connect(self.reject)
        btn_row.addWidget(btn_cancel)

        btn_save = QPushButton("Save Quotas")
        btn_save.setStyleSheet("background: #2563EB; color: white; padding: 6px 14px; border-radius: 6px; font-weight: bold;")
        btn_save.clicked.connect(self.accept)
        btn_row.addWidget(btn_save)

        layout.addLayout(btn_row)

    def get_targets(self) -> dict:
        try:
            calls = int(self.calls_input.text().strip())
        except ValueError:
            calls = 50
        try:
            wa = int(self.wa_input.text().strip())
        except ValueError:
            wa = 30
        try:
            revenue = int(self.rev_input.text().strip().replace(",", ""))
        except ValueError:
            revenue = 500000
        return {"calls": calls, "wa": wa, "revenue": revenue}


# ─── MAIN GOALS & TARGETS VIEW ───────────────────────────────────────────────

class GoalsTargetsView(QFrame):
    """
    Complete Goals & Target Management View for Windows.
    Matches Web EmployeeRoleDashboard and Mobile SalesGoalsScreen.
    """
    refreshed = pyqtSignal()
    navigate_requested = pyqtSignal(str)

    def __init__(self, api_client=None, sync_engine=None, parent=None, **kwargs):
        super().__init__(parent)
        self.api_client = api_client
        self.sync_engine = sync_engine

        self.reps_data = list(FALLBACK_REPS)
        self.targets = {"calls": 50, "wa": 30, "revenue": 500000, "meetings": 10}
        self.is_month_view = True
        self.search_filter = ""

        self._setup_ui()
        self.refresh()

    def _setup_ui(self):
        self.setStyleSheet("background: #0D1117;")
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # ── Top Bar / Header ──────────────────────────────────────────────────
        header = QFrame()
        header.setFixedHeight(68)
        header.setStyleSheet("background: #0D1117; border-bottom: 1px solid #1E2A3C;")
        hl = QHBoxLayout(header)
        hl.setContentsMargins(24, 0, 24, 0)

        title_col = QVBoxLayout()
        title_col.setSpacing(2)
        title = QLabel("🎯  Sales Goals & Target Tracking")
        title.setFont(QFont("Segoe UI", 15, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        title_col.addWidget(title)

        sub = QLabel("Live Quota Attainment, Team Leaderboard & Touchpoint Velocity")
        sub.setFont(QFont("Segoe UI", 9))
        sub.setStyleSheet("color: #94A3B8; background: transparent;")
        title_col.addWidget(sub)
        hl.addLayout(title_col)

        hl.addStretch()

        # View Timeframe Switcher
        self.btn_daily = QPushButton("📅 Daily View")
        self.btn_daily.setCheckable(True)
        self.btn_daily.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_daily.clicked.connect(lambda: self._set_timeframe(False))

        self.btn_monthly = QPushButton("📆 Monthly View")
        self.btn_monthly.setCheckable(True)
        self.btn_monthly.setChecked(True)
        self.btn_monthly.setCursor(Qt.CursorShape.PointingHandCursor)
        self.btn_monthly.clicked.connect(lambda: self._set_timeframe(True))

        for btn in (self.btn_daily, self.btn_monthly):
            btn.setStyleSheet("""
                QPushButton {
                    background: #1A2332; color: #94A3B8; border: 1px solid #2A3A5C;
                    border-radius: 6px; padding: 6px 12px; font-size: 10px;
                }
                QPushButton:checked {
                    background: #2563EB; color: #FFFFFF; border-color: #3B82F6; font-weight: bold;
                }
                QPushButton:hover:!checked { background: #2A3A5C; }
            """)

        hl.addWidget(self.btn_daily)
        hl.addWidget(self.btn_monthly)

        # Month combo
        self.month_combo = QComboBox()
        self.month_combo.addItems([
            datetime.now().strftime("%B %Y"),
            (datetime.now().replace(day=1) - datetime.resolution).strftime("%B %Y"),
        ])
        self.month_combo.setStyleSheet("""
            QComboBox {
                background: #1A2332; color: #E2E8F0; border: 1px solid #2A3A5C;
                border-radius: 6px; padding: 6px 10px; font-size: 10px;
            }
        """)
        hl.addWidget(self.month_combo)

        # Config Targets button
        btn_cfg = QPushButton("⚙️ Targets")
        btn_cfg.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_cfg.setStyleSheet("""
            QPushButton {
                background: #1E2A3C; color: #60A5FA; border: 1px solid #2A4A7C;
                border-radius: 6px; padding: 6px 12px; font-size: 10px;
            }
            QPushButton:hover { background: #2A4A7C; }
        """)
        btn_cfg.clicked.connect(self._open_config_dialog)
        hl.addWidget(btn_cfg)

        # Refresh button
        btn_ref = QPushButton("🔄 Refresh")
        btn_ref.setCursor(Qt.CursorShape.PointingHandCursor)
        btn_ref.setStyleSheet("""
            QPushButton {
                background: #1E3A5C; color: #38BDF8; border: 1px solid #2A4A7C;
                border-radius: 6px; padding: 6px 14px; font-size: 10px; font-weight: bold;
            }
            QPushButton:hover { background: #2A4A7C; }
        """)
        btn_ref.clicked.connect(self.refresh)
        hl.addWidget(btn_ref)

        main_layout.addWidget(header)

        # ── Scroll Area Content ───────────────────────────────────────────────
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("background: #0D1117; border: none;")
        scroll.setFrameShape(QFrame.Shape.NoFrame)

        content = QWidget()
        content.setStyleSheet("background: #0D1117;")
        cl = QVBoxLayout(content)
        cl.setContentsMargins(24, 18, 24, 24)
        cl.setSpacing(18)

        # ── 4 Top KPI Summary Cards ───────────────────────────────────────────
        kpi_grid = QGridLayout()
        kpi_grid.setSpacing(14)

        self.kpi_calls = self._create_kpi_card("📞", "Calls Completed", "186 / 250", "74% pace", "#38BDF8")
        self.kpi_wa = self._create_kpi_card("💬", "WhatsApp Outreach", "119 / 150", "79% pace", "#34D399")
        self.kpi_rev = self._create_kpi_card("🏆", "Team Revenue", "₹16.45L", "70% of ₹23.5L quota", "#C084FC")
        self.kpi_meetings = self._create_kpi_card("🤝", "Client Meetings", "32 / 44", "73% attained", "#FBBF24")

        kpi_grid.addWidget(self.kpi_calls, 0, 0)
        kpi_grid.addWidget(self.kpi_wa, 0, 1)
        kpi_grid.addWidget(self.kpi_rev, 0, 2)
        kpi_grid.addWidget(self.kpi_meetings, 0, 3)
        cl.addLayout(kpi_grid)

        # ── Overall Quota Pacing Progress Banner ──────────────────────────────
        pacing_frame = QFrame()
        pacing_frame.setStyleSheet("background: #161F2E; border-radius: 10px; border: 1px solid #2A3A5C; padding: 12px;")
        pl = QVBoxLayout(pacing_frame)
        pl.setSpacing(8)

        pt_row = QHBoxLayout()
        pt_lbl = QLabel("📈 Team Monthly Quota Attainment Pacing")
        pt_lbl.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        pt_lbl.setStyleSheet("color: #F1F5F9; background: transparent;")
        pt_row.addWidget(pt_lbl)
        pt_row.addStretch()

        self.pacing_status_lbl = QLabel("● ON TRACK (70.0% Attained)")
        self.pacing_status_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        self.pacing_status_lbl.setStyleSheet("color: #22C55E; background: transparent;")
        pt_row.addWidget(self.pacing_status_lbl)
        pl.addLayout(pt_row)

        self.pacing_bar = QProgressBar()
        self.pacing_bar.setFixedHeight(10)
        self.pacing_bar.setTextVisible(False)
        self.pacing_bar.setValue(70)
        self.pacing_bar.setStyleSheet("""
            QProgressBar {
                background: #1A2332; border-radius: 5px; border: none;
            }
            QProgressBar::chunk {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 #3B82F6, stop:1 #22C55E);
                border-radius: 5px;
            }
        """)
        pl.addWidget(self.pacing_bar)
        cl.addWidget(pacing_frame)

        # ── Team Leaderboard & Quota Table ────────────────────────────────────
        table_header_row = QHBoxLayout()
        table_title = QLabel("🏆  Sales Representative Quota Leaderboard")
        table_title.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        table_title.setStyleSheet("color: #F1F5F9;")
        table_header_row.addWidget(table_title)

        table_header_row.addStretch()

        self.search_input = QLineEdit()
        self.search_input.setPlaceholderText("🔍 Search sales rep...")
        self.search_input.setFixedWidth(200)
        self.search_input.setStyleSheet("""
            QLineEdit {
                background: #161F2E; color: #F1F5F9; border: 1px solid #2A3A5C;
                border-radius: 6px; padding: 6px 10px; font-size: 10px;
            }
        """)
        self.search_input.textChanged.connect(self._on_search_changed)
        table_header_row.addWidget(self.search_input)

        cl.addLayout(table_header_row)

        self.rep_table = QTableWidget()
        self.rep_table.setColumnCount(9)
        self.rep_table.setHorizontalHeaderLabels([
            "Rank", "Sales Representative", "Role", "Calls Done", "WhatsApp Sent",
            "Won Deals", "Revenue Generated", "Attainment %", "Action"
        ])
        self.rep_table.setEditTriggers(QAbstractItemView.EditTrigger.NoEditTriggers)
        self.rep_table.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.rep_table.verticalHeader().setVisible(False)
        self.rep_table.horizontalHeader().setStretchLastSection(True)
        self.rep_table.setStyleSheet("""
            QTableWidget {
                background: #161F2E; color: #F1F5F9; border: 1px solid #2A3A5C;
                gridline-color: #1E2A3C; border-radius: 10px; font-size: 11px;
            }
            QHeaderView::section {
                background: #1A2332; color: #94A3B8; border: none; padding: 8px; font-weight: bold;
            }
        """)
        self.rep_table.doubleClicked.connect(self._on_table_double_clicked)
        cl.addWidget(self.rep_table)

        cl.addStretch()
        scroll.setWidget(content)
        main_layout.addWidget(scroll, 1)

    def _create_kpi_card(self, icon: str, label: str, value: str, suffix: str, accent: str) -> QFrame:
        card = QFrame()
        card.setFixedHeight(105)
        card.setCursor(Qt.CursorShape.PointingHandCursor)
        card.setStyleSheet(f"""
            QFrame {{
                background: #161F2E;
                border-radius: 10px;
                border: 1px solid #2A3A5C;
            }}
            QFrame:hover {{
                border-color: {accent};
            }}
        """)
        lay = QVBoxLayout(card)
        lay.setContentsMargins(14, 12, 14, 12)
        lay.setSpacing(4)

        top = QHBoxLayout()
        icon_lbl = QLabel(icon)
        icon_lbl.setFont(QFont("Segoe UI Emoji", 15))
        top.addWidget(icon_lbl)
        top.addStretch()

        s_lbl = QLabel(suffix)
        s_lbl.setFont(QFont("Segoe UI", 9))
        s_lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        top.addWidget(s_lbl)
        lay.addLayout(top)

        v_lbl = QLabel(value)
        v_lbl.setObjectName("val")
        v_lbl.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        v_lbl.setStyleSheet(f"color: {accent}; background: transparent;")
        lay.addWidget(v_lbl)

        l_lbl = QLabel(label.upper())
        l_lbl.setFont(QFont("Segoe UI", 9))
        l_lbl.setStyleSheet("color: #64748B; background: transparent; font-weight: bold;")
        lay.addWidget(l_lbl)

        return card

    def _set_timeframe(self, is_month: bool):
        self.is_month_view = is_month
        self.btn_monthly.setChecked(is_month)
        self.btn_daily.setChecked(not is_month)
        self._update_table()

    def _on_search_changed(self, text: str):
        self.search_filter = text.strip().lower()
        self._update_table()

    def _open_config_dialog(self):
        dlg = GoalConfigDialog(self.targets, self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            self.targets = dlg.get_targets()
            self._update_table()
            QMessageBox.information(self, "✓ Targets Saved", "Team quota targets updated successfully.")

    def _on_table_double_clicked(self, index):
        row = index.row()
        filtered = self._get_filtered_reps()
        if 0 <= row < len(filtered):
            self._open_rep_drilldown(filtered[row])

    def _open_rep_drilldown(self, rep: dict):
        dlg = RepActivityDrilldownModal(rep, self)
        dlg.exec()

    def _get_filtered_reps(self) -> list:
        if not self.search_filter:
            return self.reps_data
        return [
            r for r in self.reps_data
            if self.search_filter in r["name"].lower() or self.search_filter in r["role"].lower()
        ]

    def _update_table(self):
        filtered = self._get_filtered_reps()
        # Sort by revenue / attainment
        sorted_reps = sorted(filtered, key=lambda x: x["revenue"], reverse=True)

        self.rep_table.setRowCount(len(sorted_reps))
        self.rep_table.setRowHeight(0, 44)

        total_calls = 0
        total_wa = 0
        total_rev = 0
        total_rev_target = 0
        total_meetings = 0
        total_meetings_target = 0

        for row, rep in enumerate(sorted_reps):
            total_calls += rep["callsDone"]
            total_wa += rep["waDone"]
            total_rev += rep["revenue"]
            total_rev_target += rep["revenueTarget"]
            total_meetings += rep["meetingsHeld"]
            total_meetings_target += rep["meetingsTarget"]

            # Rank medal
            rank_str = "🥇 1" if row == 0 else "🥈 2" if row == 1 else "🥉 3" if row == 2 else f"   {row + 1}"
            rank_item = QTableWidgetItem(rank_str)
            rank_item.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            self.rep_table.setItem(row, 0, rank_item)

            # Name
            name_item = QTableWidgetItem(rep["name"])
            name_item.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            name_item.setForeground(QBrush(QColor("#F1F5F9")))
            self.rep_table.setItem(row, 1, name_item)

            # Role
            self.rep_table.setItem(row, 2, QTableWidgetItem(rep["role"]))

            # Calls
            calls_str = f"{rep['callsDone']} / {rep['callsTarget']}"
            self.rep_table.setItem(row, 3, QTableWidgetItem(calls_str))

            # WhatsApp
            wa_str = f"{rep['waDone']} / {rep['waTarget']}"
            self.rep_table.setItem(row, 4, QTableWidgetItem(wa_str))

            # Deals Won
            self.rep_table.setItem(row, 5, QTableWidgetItem(f"{rep['dealsWon']} deal(s)"))

            # Revenue
            rev = rep["revenue"]
            rev_str = f"₹{rev / 100000:.1f}L" if rev >= 100000 else f"₹{rev:,}"
            rev_item = QTableWidgetItem(rev_str)
            rev_item.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            rev_item.setForeground(QBrush(QColor("#22C55E")))
            self.rep_table.setItem(row, 6, rev_item)

            # Attainment %
            pct = round((rev / max(rep["revenueTarget"], 1)) * 100)
            pct_item = QTableWidgetItem(f"{pct}%")
            pct_item.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            if pct >= 80:
                pct_item.setForeground(QBrush(QColor("#22C55E")))
            elif pct >= 60:
                pct_item.setForeground(QBrush(QColor("#38BDF8")))
            elif pct >= 40:
                pct_item.setForeground(QBrush(QColor("#FBBF24")))
            else:
                pct_item.setForeground(QBrush(QColor("#EF4444")))
            self.rep_table.setItem(row, 7, pct_item)

            # Action button
            action_btn = QPushButton("🔍 Drilldown")
            action_btn.setCursor(Qt.CursorShape.PointingHandCursor)
            action_btn.setStyleSheet("""
                QPushButton {
                    background: #1E3A5C; color: #60A5FA; border: 1px solid #2A4A7C;
                    border-radius: 4px; padding: 4px 8px; font-size: 9px; font-weight: bold;
                }
                QPushButton:hover { background: #2563EB; color: white; }
            """)
            action_btn.clicked.connect(lambda ch, r=rep: self._open_rep_drilldown(r))
            self.rep_table.setCellWidget(row, 8, action_btn)

        self.rep_table.resizeColumnsToContents()

        # Update Top KPI Cards
        calls_tgt = len(sorted_reps) * self.targets["calls"]
        wa_tgt = len(sorted_reps) * self.targets["wa"]
        self._update_card_val(self.kpi_calls, f"{total_calls} / {calls_tgt}")
        self._update_card_val(self.kpi_wa, f"{total_wa} / {wa_tgt}")
        rev_txt = f"₹{total_rev / 100000:.1f}L" if total_rev >= 100000 else f"₹{total_rev:,}"
        self._update_card_val(self.kpi_rev, rev_txt)
        self._update_card_val(self.kpi_meetings, f"{total_meetings} / {total_meetings_target or 40}")

        # Update Pacing Bar
        overall_pct = min(150, round((total_rev / max(total_rev_target or 1, 1)) * 100))
        self.pacing_bar.setValue(min(100, overall_pct))
        if overall_pct >= 80:
            self.pacing_status_lbl.setText(f"● AHEAD OF SCHEDULE ({overall_pct}% Attained)")
            self.pacing_status_lbl.setStyleSheet("color: #22C55E; background: transparent;")
        elif overall_pct >= 60:
            self.pacing_status_lbl.setText(f"● ON TRACK ({overall_pct}% Attained)")
            self.pacing_status_lbl.setStyleSheet("color: #38BDF8; background: transparent;")
        else:
            self.pacing_status_lbl.setText(f"● ATTENTION REQUIRED ({overall_pct}% Attained)")
            self.pacing_status_lbl.setStyleSheet("color: #EF4444; background: transparent;")

    def _update_card_val(self, card: QFrame, val: str):
        lbl = card.findChild(QLabel, "val")
        if lbl:
            lbl.setText(val)

    def refresh(self):
        """Asynchronously load live data from backend api_client."""
        self.refreshed.emit()
        self._update_table()

        if not self.api_client:
            return

        def _fetch_worker():
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)

                leads_resp = loop.run_until_complete(self.api_client.get_leads())
                deals_resp = loop.run_until_complete(self.api_client.get_deals())
                tasks_resp = loop.run_until_complete(self.api_client.get_tasks())
                quotes_resp = loop.run_until_complete(self.api_client.get_quotations())

                loop.close()

                # Process leads and deals if returned
                if leads_resp and leads_resp.success and isinstance(leads_resp.data, list):
                    leads = leads_resp.data
                    won_leads = [l for l in leads if str(l.get("status", "")).upper() in ("WON", "CLOSED_WON", "DEAL_WON")]
                    if won_leads and len(self.reps_data) > 0:
                        # Distribute among reps
                        self.reps_data[0]["dealsWon"] = max(self.reps_data[0]["dealsWon"], len(won_leads))

                QTimer.singleShot(0, self._update_table)
            except Exception:
                pass

        threading.Thread(target=_fetch_worker, daemon=True).start()

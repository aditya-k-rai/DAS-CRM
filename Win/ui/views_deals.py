"""
views_deals.py — DAS CRM Deals & Pipeline View
Kanban board, deal cards, deal details, stage management.
"""
from PyQt6.QtCore import Qt, QTimer, pyqtSignal
from PyQt6.QtGui import QFont, QColor, QPainter
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QFrame, QPushButton, QScrollArea, QSizePolicy,
                              QDialog, QDialogButtonBox, QLineEdit, QComboBox,
                              QSpinBox, QTextEdit, QMessageBox, QMenu,
                              QInputDialog, QGraphicsDropShadowEffect)
from datetime import datetime, timedelta
import random


class DealCard(QFrame):
    """Draggable deal card for the pipeline."""
    clicked = pyqtSignal(str)  # deal_id

    STAGE_COLORS = {
        "New": "#3B82F6",
        "Qualified": "#8B5CF6",
        "Proposal": "#F59E0B",
        "Negotiation": "#EC4899",
        "Closed Won": "#22C55E",
        "Closed Lost": "#EF4444",
    }

    def __init__(self, deal: dict, parent=None):
        super().__init__(parent)
        self.deal = deal
        self._dragging = False
        self._setup_ui()

    def _setup_ui(self):
        self.setFixedHeight(110)
        self.setFrameShape(QFrame.Shape.NoFrame)
        self.setStyleSheet("""
            QFrame {
                background: #1A2332;
                border-radius: 10px;
                border: 1px solid #2A3A5C;
            }
        """)
        self.setCursor(Qt.CursorShape.PointingHandCursor)

        layout = QVBoxLayout(self)
        layout.setContentsMargins(12, 10, 12, 10)
        layout.setSpacing(4)

        # Header row
        header = QHBoxLayout()
        name = QLabel(self.deal.get("name", "Unnamed Deal"))
        name.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        name.setStyleSheet("color: #F1F5F9; background: transparent;")
        name.setWordWrap(False)
        header.addWidget(name)
        header.addStretch()

        priority = QLabel(self.deal.get("priority", "⚡"))
        priority.setFont(QFont("Segoe UI", 12))
        header.addWidget(priority)
        layout.addLayout(header)

        # Company
        company = QLabel(self.deal.get("company", "—"))
        company.setFont(QFont("Segoe UI", 9))
        company.setStyleSheet("color: #94A3B8; background: transparent;")
        layout.addWidget(company)

        layout.addStretch()

        # Bottom row
        bottom = QHBoxLayout()
        value = QLabel(f"<span style='color:#22C55E;font-weight:bold'>{self.deal.get('value', '—')}</span>")
        value.setFont(QFont("Segoe UI", 10))
        bottom.addWidget(value)
        bottom.addStretch()
        days = QLabel(self.deal.get("days", "0d"))
        days.setFont(QFont("Segoe UI", 9))
        days.setStyleSheet("color: #64748B; background: transparent;")
        bottom.addWidget(days)
        layout.addLayout(bottom)

    def mousePressEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self._dragging = True
            self._start_pos = event.pos()
        super().mousePressEvent(event)

    def mouseReleaseEvent(self, event):
        if event.button() == Qt.MouseButton.LeftButton:
            self._dragging = False
        super().mouseReleaseEvent(event)


class StageColumn(QFrame):
    """Single pipeline stage column with deal cards."""
    deal_moved = pyqtSignal(str, str)  # deal_id, new_stage

    def __init__(self, stage: str, deals: list, parent=None):
        super().__init__(parent)
        self.stage = stage
        self.deals = list(deals)
        self._setup_ui()

    def _setup_ui(self):
        color = DealCard.STAGE_COLORS.get(self.stage, "#64748B")
        self.setFixedWidth(240)
        self.setFrameShape(QFrame.Shape.NoFrame)
        self.setStyleSheet("background: #0D1117;")

        layout = QVBoxLayout(self)
        layout.setContentsMargins(8, 0, 8, 0)
        layout.setSpacing(0)

        # Column header
        header = QFrame()
        header.setFixedHeight(40)
        header.setStyleSheet(f"background: {color}22; border-radius: 8px 8px 0 0;")
        hl = QHBoxLayout(header)
        hl.setContentsMargins(12, 0, 12, 0)
        title = QLabel(f"{DealCard.STAGE_COLORS.get(self.stage, '⚪')}  {self.stage}")
        title.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        title.setStyleSheet(f"color: {color}; background: transparent;")
        hl.addWidget(title)
        count = QLabel(str(len(self.deals)))
        count.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        count.setStyleSheet(f"color: {color}; background: transparent;")
        count.setFixedWidth(24)
        count.setAlignment(Qt.AlignmentFlag.AlignCenter)
        count.setStyleSheet(f"background: {color}33; color: {color}; border-radius: 10px;")
        hl.addWidget(count)
        layout.addWidget(header)

        # Cards scroll area
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        scroll.setStyleSheet("""
            QScrollArea { background: transparent; border: none; }
            QScrollBar:vertical { background: transparent; width: 0px; }
        """)

        cards_widget = QWidget()
        cards_widget.setStyleSheet("background: transparent;")
        cards_layout = QVBoxLayout(cards_widget)
        cards_layout.setContentsMargins(4, 8, 4, 8)
        cards_layout.setSpacing(8)
        cards_layout.addStretch()

        for deal in self.deals:
            card = DealCard(deal)
            card.clicked.connect(lambda _, d=deal: self._on_card_click(d))
            cards_layout.insertWidget(cards_layout.count() - 1, card)

        scroll.setWidget(cards_widget)
        layout.addWidget(scroll, stretch=1)


class DealsView(QFrame):
    """Pipeline kanban board with stages."""
    refreshed = pyqtSignal()

    SAMPLE_DEALS = [
        {"id": "1", "name": "TechCorp CRM License", "company": "TechCorp India",
         "value": "₹4,50,000", "priority": "🔥", "stage": "Negotiation",
         "days": "14d", "rep": "Rajesh Kumar"},
        {"id": "2", "name": "Innovate Bot Package", "company": "Innovate Solutions",
         "value": "₹12,00,000", "priority": "🔥", "stage": "Proposal",
         "days": "7d", "rep": "Priya Sharma"},
        {"id": "3", "name": "Apex Multi-Tenant SLA", "company": "Apex Global",
         "value": "₹8,50,000", "priority": "⚡", "stage": "Qualified",
         "days": "21d", "rep": "Amit Shah (TL)"},
        {"id": "4", "name": "Sun Realty Payroll", "company": "Sun Realty",
         "value": "₹2,10,000", "priority": "🔥", "stage": "Closed Won",
         "days": "3d", "rep": "Sunita Verma (HR)"},
        {"id": "5", "name": "NexGen Analytics Suite", "company": "NexGen Finance",
         "value": "₹3,20,000", "priority": "⚡", "stage": "New",
         "days": "1d", "rep": "Vikram Joshi"},
        {"id": "6", "name": "Quantum Retail POS", "company": "Quantum Retail",
         "value": "₹75,000", "priority": "⚡", "stage": "Qualified",
         "days": "10d", "rep": "Neha Kapoor"},
        {"id": "7", "name": "Zenith Fleet Tracker", "company": "Zenith Logistics",
         "value": "₹55,000", "priority": "⚡", "stage": "Proposal",
         "days": "5d", "rep": "Rajesh Kumar"},
        {"id": "8", "name": "Omega Health Portal", "company": "Omega Health",
         "value": "₹28,000", "priority": "⚡", "stage": "New",
         "days": "2d", "rep": "Priya Sharma"},
    ]

    STAGES = ["New", "Qualified", "Proposal", "Negotiation", "Closed Won", "Closed Lost"]

    def __init__(self, api_client=None, sync_engine=None, parent=None):
        super().__init__(parent)
        self.api_client = api_client
        self.sync_engine = sync_engine
        self.deals = list(self.SAMPLE_DEALS)
        self._setup_ui()

    def _setup_ui(self):
        self.setStyleSheet("background: #0D1117;")
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # Header
        header = QFrame()
        header.setFixedHeight(64)
        header.setStyleSheet("background: #0D1117; border-bottom: 1px solid #1E2A3C;")
        hl = QHBoxLayout(header)
        hl.setContentsMargins(24, 0, 24, 0)

        title = QLabel("🤝  Deals & Pipeline")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        hl.addWidget(title)

        hl.addStretch()

        # Stats
        total_value = sum(
            int(d.get("value", "0").replace("₹", "").replace(",", "").replace("L", "00000").replace(" ", ""))
            for d in self.deals if d.get("stage") != "Closed Lost"
        )
        open_deals = len([d for d in self.deals if d.get("stage") not in ("Closed Won", "Closed Lost")])

        stat_lbl = QLabel(f"<span style='color:#94A3B8'>Open Deals:</span> "
                          f"<span style='color:#60A5FA;font-weight:bold'>{open_deals}</span>  "
                          f"<span style='color:#94A3B8'>Pipeline:</span> "
                          f"<span style='color:#22C55E;font-weight:bold'>₹{total_value // 100000:.1f}L</span>")
        stat_lbl.setFont(QFont("Segoe UI", 10))
        hl.addWidget(stat_lbl)

        add_btn = QPushButton("➕  Add Deal")
        add_btn.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        add_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        add_btn.setStyleSheet("""
            QPushButton {
                background: #3B82F6;
                color: white;
                border: none;
                border-radius: 6px;
                padding: 6px 16px;
            }
            QPushButton:hover { background: #2563EB; }
        """)
        add_btn.clicked.connect(self._add_deal)
        hl.addWidget(add_btn)

        layout.addWidget(header)

        # Kanban board
        board = QScrollArea()
        board.setWidgetResizable(False)
        board.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOn)
        board.setStyleSheet("""
            QScrollArea { background: #0D1117; border: none; }
            QScrollBar:horizontal { background: #1A2332; height: 8px; border-radius: 4px; }
            QScrollBar::handle { background: #2A3A5C; border-radius: 4px; }
        """)
        board.setFrameShape(QFrame.Shape.NoFrame)

        board_widget = QWidget()
        board_layout = QHBoxLayout(board_widget)
        board_layout.setContentsMargins(16, 16, 16, 16)
        board_layout.setSpacing(16)

        self.stage_widgets = {}
        for stage in self.STAGES:
            stage_deals = [d for d in self.deals if d.get("stage") == stage]
            col = StageColumn(stage, stage_deals)
            self.stage_widgets[stage] = col
            board_layout.addWidget(col)

        board_layout.addStretch()
        board.setWidget(board_widget)
        layout.addWidget(board, stretch=1)

    def _add_deal(self):
        dlg = _AddDealDialog(self)
        if dlg.exec() == QDialog.DialogCode.Accepted:
            deal = dlg.get_data()
            deal["id"] = str(len(self.deals) + 1)
            self.deals.append(deal)
            self._refresh_board()

    def _refresh_board(self):
        for stage, col in self.stage_widgets.items():
            col.setParent(None)
        for stage in self.STAGES:
            stage_deals = [d for d in self.deals if d.get("stage") == stage]
            col = StageColumn(stage, stage_deals)
            self.stage_widgets[stage] = col


class _AddDealDialog(QDialog):
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Add New Deal")
        self.setStyleSheet("background: #1A2332; color: #E2E8F0;")
        self.setMinimumSize(450, 400)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setSpacing(12)

        fields = [
            ("Deal Name *", "name"),
            ("Company", "company"),
            ("Contact Person", "person"),
            ("Phone", "phone"),
            ("Expected Value (₹)", "value"),
        ]
        self.inputs = {}
        for label, key in fields:
            row = QHBoxLayout()
            lbl = QLabel(label)
            lbl.setFont(QFont("Segoe UI", 10))
            lbl.setFixedWidth(140)
            lbl.setStyleSheet("color: #94A3B8;")
            row.addWidget(lbl)
            le = QLineEdit()
            le.setFont(QFont("Segoe UI", 10))
            le.setStyleSheet("""
                QLineEdit {
                    background: #0D1117; color: #E2E8F0;
                    border: 1px solid #2A3A5C; border-radius: 6px;
                    padding: 6px 10px;
                }
                QLineEdit:focus { border-color: #3B82F6; }
            """)
            row.addWidget(le)
            self.inputs[key] = le
            layout.addLayout(row)

        stage_row = QHBoxLayout()
        sl = QLabel("Stage")
        sl.setFont(QFont("Segoe UI", 10))
        sl.setFixedWidth(140)
        sl.setStyleSheet("color: #94A3B8;")
        stage_row.addWidget(sl)
        self.stage_combo = QComboBox()
        self.stage_combo.addItems(DealsView.STAGES)
        self.stage_combo.setFont(QFont("Segoe UI", 10))
        self.stage_combo.setStyleSheet(self.inputs["name"].styleSheet())
        stage_row.addWidget(self.stage_combo)
        layout.addLayout(stage_row)

        layout.addStretch()

        buttons = QDialogButtonBox(QDialogButtonBox.StandardButton.Ok |
                                    QDialogButtonBox.StandardButton.Cancel)
        buttons.accepted.connect(self.accept)
        buttons.rejected.connect(self.reject)
        layout.addWidget(buttons)

    def get_data(self) -> dict:
        return {
            "name": self.inputs["name"].text(),
            "company": self.inputs["company"].text(),
            "person": self.inputs["person"].text(),
            "phone": self.inputs["phone"].text(),
            "value": self.inputs["value"].text(),
            "stage": self.stage_combo.currentText(),
            "priority": "⚡",
            "days": "0d",
            "rep": "Rajesh Kumar",
        }

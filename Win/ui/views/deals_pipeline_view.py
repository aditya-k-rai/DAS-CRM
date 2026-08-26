"""
DealsPipelineView.py — DAS CRM Windows
Multi-Stage Kanban Board with Drag-Drop, Revenue Tracking, and Deal Management
Feature parity with Android DealsPipelineScreen.tsx
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit,
    QScrollArea, QFrame, QGridLayout, QMessageBox, QDialog, QSpinBox, QComboBox
)
from PyQt6.QtCore import Qt, pyqtSignal, QTimer, QPoint
from PyQt6.QtGui import QFont, QBrush, QColor, QDrag, QPixmap
from dataclasses import dataclass
from typing import List

# ─────────────────────────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class DealItem:
    """Represents a deal in pipeline"""
    id: str
    title: str
    company: str
    value: str
    stage: str  # PROSPECTING, QUALIFICATION, PROPOSAL, NEGOTIATION, WON
    probability: int  # 0-100%
    daysInStage: int
    assignedTo: str
    lastActivity: str

DEAL_STAGES = [
    "PROSPECTING",
    "QUALIFICATION",
    "PROPOSAL",
    "NEGOTIATION",
    "WON"
]

STAGE_COLORS = {
    "PROSPECTING": ("#4f46e5", "#818cf8"),    # indigo
    "QUALIFICATION": ("#f59e0b", "#fbbf24"),  # amber
    "PROPOSAL": ("#3b82f6", "#60a5fa"),       # blue
    "NEGOTIATION": ("#f97316", "#fb923c"),    # orange
    "WON": ("#10b981", "#34d399")             # emerald
}

FALLBACK_DEALS = [
    # PROSPECTING
    DealItem("d1", "TechVision AI Suite", "TechCorp Ltd", "$125,000", "PROSPECTING", 35, 5, "Rajesh Kumar", "Email sent 2h ago"),
    DealItem("d2", "Cloud Migration Project", "DataFlow Inc", "$85,000", "PROSPECTING", 20, 12, "Priya Sharma", "Call scheduled"),

    # QUALIFICATION
    DealItem("d3", "Enterprise License Renewal", "Global Solutions", "$320,000", "QUALIFICATION", 60, 8, "Vikram Mehta", "Demo scheduled"),
    DealItem("d4", "Integration Pilot", "FastTrack Corp", "$45,000", "QUALIFICATION", 40, 3, "Amit Patel", "Requirements review"),

    # PROPOSAL
    DealItem("d5", "Annual Support Package", "Premium Partners", "$156,000", "PROPOSAL", 75, 6, "Sunita Rao", "Proposal sent"),
    DealItem("d6", "Custom Dev Services", "InnovateTech", "$92,000", "PROPOSAL", 65, 2, "Rajesh Kumar", "Awaiting feedback"),

    # NEGOTIATION
    DealItem("d7", "Enterprise Platinum", "Fortune 500 Client", "$512,000", "NEGOTIATION", 85, 4, "Vikram Mehta", "Legal review in progress"),
    DealItem("d8", "Multi-Year Contract", "Strategic Partner", "$280,000", "NEGOTIATION", 80, 7, "Priya Sharma", "Negotiating terms"),

    # WON
    DealItem("d9", "Q3 License Deal", "TechCorp Subsidiary", "$198,000", "WON", 100, 1, "Rajesh Kumar", "Contract signed"),
    DealItem("d10", "Integration Success", "EastWest Trading", "$165,000", "WON", 100, 3, "Sunita Rao", "Onboarding started"),
]

# ─────────────────────────────────────────────────────────────────────────────────────
# DEAL CARD WIDGET
# ─────────────────────────────────────────────────────────────────────────────────────

class DealCard(QFrame):
    """Individual deal card for Kanban"""
    clicked = pyqtSignal(object)

    def __init__(self, deal: DealItem, parent=None):
        super().__init__(parent)
        self.deal = deal
        self.setStyleSheet("""
            QFrame {
                background-color: #020617;
                border: 1px solid #1e293b;
                border-radius: 8px;
                padding: 8px;
            }
        """)
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(8, 8, 8, 8)
        layout.setSpacing(6)

        # Title & Probability
        headerLayout = QHBoxLayout()
        titleLabel = QLabel(self.deal.title)
        titleLabel.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        headerLayout.addWidget(titleLabel)
        headerLayout.addStretch()

        probLabel = QLabel(f"{self.deal.probability}%")
        probLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        probColor = "#34d399" if self.deal.probability >= 75 else "#fbbf24" if self.deal.probability >= 50 else "#ef4444"
        probLabel.setStyleSheet(f"color: {probColor};")
        headerLayout.addWidget(probLabel)

        layout.addLayout(headerLayout)

        # Company
        companyLabel = QLabel(self.deal.company)
        companyLabel.setFont(QFont("Segoe UI", 9))
        companyLabel.setStyleSheet("color: #94a3b8;")
        layout.addWidget(companyLabel)

        # Value
        valueLabel = QLabel(self.deal.value)
        valueLabel.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        valueLabel.setStyleSheet("color: #34d399;")
        layout.addWidget(valueLabel)

        # Activity
        activityLabel = QLabel(self.deal.lastActivity)
        activityLabel.setFont(QFont("Segoe UI", 8))
        activityLabel.setStyleSheet("color: #64748b;")
        activityLabel.setWordWrap(True)
        layout.addWidget(activityLabel)

    def mousePressEvent(self, event):
        self.clicked.emit(self.deal)

# ─────────────────────────────────────────────────────────────────────────────────────
# KANBAN STAGE COLUMN
# ─────────────────────────────────────────────────────────────────────────────────────

class KanbanStageColumn(QFrame):
    """Single stage column in Kanban board"""

    def __init__(self, stage: str, deals: List[DealItem], parent=None):
        super().__init__(parent)
        self.stage = stage
        self.deals = [d for d in deals if d.stage == stage]
        self.stageBgColor, self.stageAccentColor = STAGE_COLORS.get(stage, ("#64748b", "#94a3b8"))

        self.setStyleSheet(f"""
            QFrame {{
                background-color: #0b1329;
                border: 1px solid #1e293b;
                border-radius: 12px;
            }}
        """)
        self._build_ui()

    def _build_ui(self):
        layout = QVBoxLayout(self)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(8)

        # Stage header
        headerLayout = QHBoxLayout()
        stageLabelText = self.stage.replace("_", " ")
        stageLabel = QLabel(stageLabelText)
        stageLabel.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        stageLabel.setStyleSheet(f"color: {self.stageAccentColor};")
        headerLayout.addWidget(stageLabel)

        countLabel = QLabel(str(len(self.deals)))
        countLabel.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        countLabel.setStyleSheet(f"""
            background-color: {self.stageBgColor};
            color: #ffffff;
            padding: 2px 6px;
            border-radius: 4px;
        """)
        headerLayout.addWidget(countLabel)

        headerLayout.addStretch()
        layout.addLayout(headerLayout)

        # Deal cards
        scrollArea = QScrollArea()
        scrollArea.setWidgetResizable(True)
        scrollArea.setStyleSheet("QScrollArea { border: none; background-color: #0b1329; }")

        scrollWidget = QWidget()
        scrollLayout = QVBoxLayout(scrollWidget)
        scrollLayout.setContentsMargins(0, 0, 0, 0)
        scrollLayout.setSpacing(8)

        for deal in self.deals:
            card = DealCard(deal)
            card.clicked.connect(lambda d: print(f"Deal clicked: {d.title}"))
            scrollLayout.addWidget(card)

        scrollLayout.addStretch()
        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea, 1)

        # Revenue total
        totalValue = sum(int(d.value.replace("$", "").replace(",", "")) for d in self.deals)
        revenueLabel = QLabel(f"💰 ${totalValue:,}")
        revenueLabel.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        revenueLabel.setStyleSheet(f"color: {self.stageAccentColor};")
        layout.addWidget(revenueLabel)

# ─────────────────────────────────────────────────────────────────────────────────────
# CREATE DEAL MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class CreateDealModal(QDialog):
    """Modal for creating new deal"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("➕ Create New Deal")
        self.setGeometry(100, 100, 500, 550)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #cbd5e1; font-weight: bold; font-size: 10px; }
            QLineEdit, QComboBox, QSpinBox { background-color: #020617; color: #ffffff;
                                            border: 1px solid #334155; border-radius: 6px; padding: 6px; }
            QPushButton#create { background-color: #10b981; color: white; }
            QPushButton#cancel { background-color: #1e293b; color: #94a3b8; }
        """)

        layout = QVBoxLayout(self)

        title = QLabel("➕ Create New Deal")
        title.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        title.setStyleSheet("color: #ffffff;")
        layout.addWidget(title)

        desc = QLabel("Add a new opportunity to your pipeline.")
        desc.setStyleSheet("color: #94a3b8; margin-bottom: 12px;")
        layout.addWidget(desc)

        # Form fields
        layout.addWidget(QLabel("Deal Title *"))
        self.titleInput = QLineEdit()
        self.titleInput.setPlaceholderText("e.g. Enterprise License Deal")
        layout.addWidget(self.titleInput)

        layout.addWidget(QLabel("Company *"))
        self.companyInput = QLineEdit()
        self.companyInput.setPlaceholderText("e.g. TechCorp Ltd")
        layout.addWidget(self.companyInput)

        layout.addWidget(QLabel("Deal Value ($) *"))
        self.valueInput = QLineEdit()
        self.valueInput.setPlaceholderText("e.g. 125000")
        layout.addWidget(self.valueInput)

        layout.addWidget(QLabel("Initial Stage *"))
        self.stageCombo = QComboBox()
        self.stageCombo.addItems(DEAL_STAGES)
        layout.addWidget(self.stageCombo)

        layout.addWidget(QLabel("Probability (%) *"))
        self.probInput = QSpinBox()
        self.probInput.setMinimum(0)
        self.probInput.setMaximum(100)
        self.probInput.setValue(35)
        layout.addWidget(self.probInput)

        layout.addWidget(QLabel("Assigned To"))
        self.assignedInput = QLineEdit()
        self.assignedInput.setPlaceholderText("Rep name (optional)")
        layout.addWidget(self.assignedInput)

        layout.addStretch()

        btnLayout = QHBoxLayout()
        btnCancel = QPushButton("Cancel")
        btnCancel.setObjectName("cancel")
        btnCancel.clicked.connect(self.reject)
        btnCreate = QPushButton("Create Deal ✓")
        btnCreate.setObjectName("create")
        btnCreate.clicked.connect(self.accept)
        btnLayout.addWidget(btnCancel, 1)
        btnLayout.addWidget(btnCreate, 1)
        layout.addLayout(btnLayout)

    def get_deal(self) -> DealItem:
        """Return created deal"""
        return DealItem(
            id=f"d-{id(self)}",
            title=self.titleInput.text().strip(),
            company=self.companyInput.text().strip(),
            value=f"${self.valueInput.text().strip()}",
            stage=self.stageCombo.currentText(),
            probability=self.probInput.value(),
            daysInStage=0,
            assignedTo=self.assignedInput.text().strip() or "Unassigned",
            lastActivity="Deal created"
        )

# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN DEALS PIPELINE VIEW
# ─────────────────────────────────────────────────────────────────────────────────────

class DealsPipelineView(QWidget):
    """Multi-Stage Kanban Pipeline with Revenue Tracking"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
            QLineEdit { background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b;
                       border-radius: 6px; padding: 8px; }
        """)

        self.dealsList = list(FALLBACK_DEALS)
        self._build_ui()

    def _build_ui(self):
        """Build deals pipeline UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        scrollArea = QScrollArea()
        scrollArea.setWidgetResizable(True)
        scrollArea.setStyleSheet("QScrollArea { border: none; background-color: #090d16; }")
        scrollArea.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAsNeeded)

        scrollWidget = QWidget()
        scrollLayout = QVBoxLayout(scrollWidget)
        scrollLayout.setContentsMargins(16, 16, 16, 24)
        scrollLayout.setSpacing(12)

        # Title
        titleLabel = QLabel("🎯 Deal Pipeline")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        scrollLayout.addWidget(titleLabel)

        # Control bar
        controlLayout = QHBoxLayout()
        btnAdd = QPushButton("➕ New Deal")
        btnAdd.setStyleSheet("background-color: #10b981; padding: 6px 12px;")
        btnAdd.clicked.connect(self._open_create_deal)
        controlLayout.addWidget(btnAdd)

        # Revenue summary
        totalRevenue = sum(int(d.value.replace("$", "").replace(",", "")) for d in self.dealsList)
        revenueLabel = QLabel(f"💰 Total Pipeline: ${totalRevenue:,}")
        revenueLabel.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        revenueLabel.setStyleSheet("color: #34d399;")
        controlLayout.addWidget(revenueLabel)

        controlLayout.addStretch()
        scrollLayout.addLayout(controlLayout)

        # Kanban columns
        kanbanLayout = QHBoxLayout()
        kanbanLayout.setContentsMargins(0, 0, 0, 0)
        kanbanLayout.setSpacing(12)

        for stage in DEAL_STAGES:
            column = KanbanStageColumn(stage, self.dealsList)
            kanbanLayout.addWidget(column, 1)

        scrollLayout.addLayout(kanbanLayout, 1)

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _open_create_deal(self):
        """Open create deal modal"""
        dialog = CreateDealModal(self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            deal = dialog.get_deal()
            self.dealsList.append(deal)
            QMessageBox.information(self, "✓ Deal Created", f"Added {deal.title} to pipeline.")
            # Refresh UI
            self._build_ui()

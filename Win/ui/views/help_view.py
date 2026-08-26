"""
HelpView.py — DAS CRM Windows
Help Center and Support Resources
Feature parity with Android HelpScreen.tsx
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit,
    QScrollArea, QFrame, QTableWidget, QTableWidgetItem, QAbstractItemView,
    QMessageBox, QDialog, QTextEdit, QComboBox
)
from PyQt6.QtCore import Qt
from PyQt6.QtGui import QFont, QBrush, QColor
from dataclasses import dataclass

# ─────────────────────────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class HelpArticle:
    """Help center article"""
    id: str
    title: str
    category: str  # GETTING_STARTED, FEATURES, TROUBLESHOOTING, FAQ, ACCOUNT
    content: str
    views: int
    helpful: int
    rating: float

@dataclass
class SupportTicket:
    """Support ticket"""
    id: str
    subject: str
    category: str  # BUG, FEATURE_REQUEST, ACCOUNT, BILLING, OTHER
    status: str  # OPEN, IN_PROGRESS, RESOLVED, CLOSED
    priority: str  # LOW, MEDIUM, HIGH, URGENT
    createdAt: str
    updatedAt: str

HELP_CATEGORIES = [
    "GETTING_STARTED",
    "FEATURES",
    "TROUBLESHOOTING",
    "FAQ",
    "ACCOUNT"
]

FALLBACK_HELP_ARTICLES = [
    HelpArticle("h1", "Getting Started with DAS CRM", "GETTING_STARTED",
               "Learn how to set up your DAS CRM account and complete initial configuration.", 1240, 1100, 4.8),
    HelpArticle("h2", "Managing Your Sales Pipeline", "FEATURES",
               "Understand how to use the Kanban board to track deals through stages.", 980, 850, 4.7),
    HelpArticle("h3", "Creating and Managing Quotations", "FEATURES",
               "Step-by-step guide to creating professional quotations and tracking their status.", 760, 650, 4.6),
    HelpArticle("h4", "Troubleshooting Sync Issues", "TROUBLESHOOTING",
               "Common sync problems and how to resolve them quickly.", 420, 380, 4.5),
    HelpArticle("h5", "API Integration Guide", "FEATURES",
               "Connect external services and automate workflows with DAS CRM API.", 310, 270, 4.9),
]

FALLBACK_SUPPORT_TICKETS = [
    SupportTicket("s1", "Dashboard charts not loading", "BUG", "OPEN", "HIGH", "2026-08-24 10:30", "2026-08-26 09:15"),
    SupportTicket("s2", "Request: Mobile app for iOS", "FEATURE_REQUEST", "IN_PROGRESS", "MEDIUM", "2026-08-22 14:20", "2026-08-26 08:00"),
    SupportTicket("s3", "Can't export quotations to PDF", "BUG", "RESOLVED", "MEDIUM", "2026-08-20 16:45", "2026-08-25 11:30"),
    SupportTicket("s4", "Billing cycle question", "BILLING", "CLOSED", "LOW", "2026-08-18 09:10", "2026-08-21 13:45"),
    SupportTicket("s5", "Two-factor authentication setup", "ACCOUNT", "IN_PROGRESS", "MEDIUM", "2026-08-26 07:00", "2026-08-26 09:30"),
]

# ─────────────────────────────────────────────────────────────────────────────────────
# HELP ARTICLE DETAILS MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class HelpArticleModal(QDialog):
    """Modal showing detailed help article"""
    def __init__(self, article: HelpArticle, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"📖 Help - {article.title}")
        self.setGeometry(100, 100, 650, 600)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #f8fafc; }
            QPushButton { padding: 8px 12px; border-radius: 6px; font-weight: bold; }
            QPushButton#helpful { background-color: #10b981; color: white; }
            QPushButton#unhelpful { background-color: #ef4444; color: white; }
            QPushButton#close { background-color: #1e293b; color: #94a3b8; }
        """)

        layout = QVBoxLayout(self)

        # Header
        headerLayout = QHBoxLayout()
        headerLayout.setContentsMargins(16, 16, 16, 12)

        titleLabel = QLabel(f"📖 {article.title}")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        headerLayout.addWidget(titleLabel)
        headerLayout.addStretch()

        categoryLabel = QLabel(article.category.replace("_", " "))
        categoryLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        categoryLabel.setStyleSheet("""
            background-color: rgba(100, 100, 100, 0.15);
            color: #818cf8;
            padding: 4px 8px;
            border: 1px solid #4f46e5;
            border-radius: 6px;
        """)
        headerLayout.addWidget(categoryLabel)

        layout.addLayout(headerLayout)

        # Content
        contentLayout = QVBoxLayout()
        contentLayout.setContentsMargins(16, 0, 16, 12)
        contentLayout.setSpacing(12)

        # Article Info
        infoCard = self._build_info_section(
            "📊 Article Statistics",
            [
                ("Views", str(article.views)),
                ("Helpful Votes", str(article.helpful)),
                ("Rating", f"{article.rating} ⭐"),
            ]
        )
        contentLayout.addWidget(infoCard)

        # Article Content
        contentCard = QFrame()
        contentCard.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 12px;
                padding: 12px;
            }
        """)

        contentCardLayout = QVBoxLayout(contentCard)
        contentCardLayout.setContentsMargins(12, 12, 12, 12)
        contentCardLayout.setSpacing(8)

        contentTitle = QLabel("📝 Article Content")
        contentTitle.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        contentTitle.setStyleSheet("color: #ffffff;")
        contentCardLayout.addWidget(contentTitle)

        contentText = QLabel(article.content)
        contentText.setFont(QFont("Segoe UI", 10))
        contentText.setStyleSheet("color: #cbd5e1;")
        contentText.setWordWrap(True)
        contentCardLayout.addWidget(contentText)

        contentLayout.addWidget(contentCard)

        contentLayout.addStretch()

        layout.addLayout(contentLayout, 1)

        # Action Buttons
        actionLayout = QHBoxLayout()
        actionLayout.setContentsMargins(16, 0, 16, 16)
        actionLayout.setSpacing(8)

        btnHelpful = QPushButton("👍 Helpful")
        btnHelpful.setObjectName("helpful")
        btnHelpful.clicked.connect(lambda: QMessageBox.information(self, "Thank you", "Thanks for the feedback!"))
        actionLayout.addWidget(btnHelpful)

        btnUnhelpful = QPushButton("👎 Not Helpful")
        btnUnhelpful.setObjectName("unhelpful")
        btnUnhelpful.clicked.connect(lambda: QMessageBox.information(self, "Feedback", "We'll improve this article"))
        actionLayout.addWidget(btnUnhelpful)

        actionLayout.addStretch()

        btnClose = QPushButton("Close")
        btnClose.setObjectName("close")
        btnClose.clicked.connect(self.accept)
        actionLayout.addWidget(btnClose)

        layout.addLayout(actionLayout)

    def _build_info_section(self, title: str, fields: list) -> QFrame:
        """Build an info section card"""
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
        layout.setSpacing(8)

        titleLabel = QLabel(title)
        titleLabel.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        layout.addWidget(titleLabel)

        for fieldName, fieldValue in fields:
            fieldLayout = QHBoxLayout()

            nameLabel = QLabel(f"{fieldName}:")
            nameLabel.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            nameLabel.setStyleSheet("color: #94a3b8;")
            nameLabel.setMaximumWidth(120)

            valueLabel = QLabel(fieldValue)
            valueLabel.setFont(QFont("Segoe UI", 10))
            valueLabel.setStyleSheet("color: #cbd5e1;")

            fieldLayout.addWidget(nameLabel)
            fieldLayout.addWidget(valueLabel, 1)
            layout.addLayout(fieldLayout)

        return card

# ─────────────────────────────────────────────────────────────────────────────────────
# CREATE SUPPORT TICKET MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class CreateTicketModal(QDialog):
    """Modal for creating new support ticket"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("🎫 Create Support Ticket")
        self.setGeometry(100, 100, 550, 500)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #cbd5e1; font-weight: bold; font-size: 10px; }
            QLineEdit, QTextEdit, QComboBox { background-color: #020617; color: #ffffff;
                                  border: 1px solid #334155; border-radius: 6px; padding: 6px; }
            QPushButton#create { background-color: #10b981; color: white; }
            QPushButton#cancel { background-color: #1e293b; color: #94a3b8; }
        """)

        layout = QVBoxLayout(self)

        title = QLabel("🎫 Create Support Ticket")
        title.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        title.setStyleSheet("color: #ffffff;")
        layout.addWidget(title)

        desc = QLabel("We're here to help! Submit your issue and our team will respond soon.")
        desc.setStyleSheet("color: #94a3b8; margin-bottom: 12px;")
        layout.addWidget(desc)

        # Form fields
        layout.addWidget(QLabel("Subject *"))
        self.subjectInput = QLineEdit()
        self.subjectInput.setPlaceholderText("Brief description of your issue")
        layout.addWidget(self.subjectInput)

        layout.addWidget(QLabel("Category *"))
        self.categoryCombo = QComboBox()
        self.categoryCombo.addItems(["Bug Report", "Feature Request", "Account Issue", "Billing", "Other"])
        layout.addWidget(self.categoryCombo)

        layout.addWidget(QLabel("Priority *"))
        self.priorityCombo = QComboBox()
        self.priorityCombo.addItems(["Low", "Medium", "High", "Urgent"])
        layout.addWidget(self.priorityCombo)

        layout.addWidget(QLabel("Description *"))
        self.descriptionInput = QTextEdit()
        self.descriptionInput.setPlaceholderText("Detailed description of the issue...")
        self.descriptionInput.setMinimumHeight(120)
        layout.addWidget(self.descriptionInput)

        layout.addStretch()

        btnLayout = QHBoxLayout()
        btnCancel = QPushButton("Cancel")
        btnCancel.setObjectName("cancel")
        btnCancel.clicked.connect(self.reject)
        btnCreate = QPushButton("🎫 Create Ticket ✓")
        btnCreate.setObjectName("create")
        btnCreate.clicked.connect(self.accept)
        btnLayout.addWidget(btnCancel, 1)
        btnLayout.addWidget(btnCreate, 1)
        layout.addLayout(btnLayout)

# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN HELP VIEW
# ─────────────────────────────────────────────────────────────────────────────────────

class HelpView(QWidget):
    """Help Center and Support Resources"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
            QLineEdit { background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b;
                       border-radius: 6px; padding: 8px; }
        """)

        self.helpArticles = list(FALLBACK_HELP_ARTICLES)
        self.supportTickets = list(FALLBACK_SUPPORT_TICKETS)
        self.search = ""
        self.selectedTab = "ARTICLES"

        self._build_ui()

    def _build_ui(self):
        """Build help UI"""
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
        titleLabel = QLabel("❓ Help & Support")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        scrollLayout.addWidget(titleLabel)

        # Tab Buttons
        tabLayout = QHBoxLayout()
        tabLayout.setContentsMargins(0, 0, 0, 0)
        tabLayout.setSpacing(8)

        for tab in ["ARTICLES", "SUPPORT_TICKETS"]:
            btn = QPushButton(tab.replace("_", " "))
            btn.setCheckable(True)
            btn.setChecked(tab == "ARTICLES")
            btn.setMaximumWidth(150)
            btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: #020617;
                    border: 1px solid #1e293b;
                    color: #94a3b8;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-weight: 800;
                }}
                QPushButton:checked {{
                    background-color: #4f46e5;
                    color: #ffffff;
                    border-color: #4f46e5;
                }}
            """)
            btn.toggled.connect(lambda checked, t=tab: self._switch_tab(t) if checked else None)
            tabLayout.addWidget(btn)

        tabLayout.addStretch()
        scrollLayout.addLayout(tabLayout)

        # Search input
        self.searchInput = QLineEdit()
        self.searchInput.setPlaceholderText("🔍 Search articles, tickets...")
        self.searchInput.setMinimumHeight(32)
        self.searchInput.textChanged.connect(self._on_search_changed)
        scrollLayout.addWidget(self.searchInput)

        # Action buttons
        actionLayout = QHBoxLayout()
        btnNewTicket = QPushButton("🎫 New Ticket")
        btnNewTicket.setStyleSheet("background-color: #10b981; padding: 6px 12px;")
        btnNewTicket.clicked.connect(self._open_create_ticket)
        actionLayout.addWidget(btnNewTicket)

        btnContactUs = QPushButton("📧 Contact Us")
        btnContactUs.setStyleSheet("background-color: #3b82f6; padding: 6px 12px;")
        btnContactUs.clicked.connect(lambda: QMessageBox.information(self, "Contact", "support@dascrm.com"))
        actionLayout.addWidget(btnContactUs)

        actionLayout.addStretch()
        scrollLayout.addLayout(actionLayout)

        # Help Articles Table
        self.articlesTable = QTableWidget()
        self.articlesTable.setColumnCount(5)
        self.articlesTable.setHorizontalHeaderLabels([
            "Title", "Category", "Views", "Rating", "Action"
        ])
        self.articlesTable.horizontalHeader().setStretchLastSection(False)
        self.articlesTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.articlesTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.articlesTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.articlesTable.setColumnWidth(0, 250)
        self.articlesTable.setColumnWidth(1, 120)
        self.articlesTable.setColumnWidth(2, 80)
        self.articlesTable.setColumnWidth(3, 80)
        self.articlesTable.setColumnWidth(4, 80)

        self.articlesTable.doubleClicked.connect(self._open_article)
        self._refresh_articles_table()

        # Support Tickets Table
        self.ticketsTable = QTableWidget()
        self.ticketsTable.setColumnCount(6)
        self.ticketsTable.setHorizontalHeaderLabels([
            "Subject", "Category", "Status", "Priority", "Created", "Action"
        ])
        self.ticketsTable.horizontalHeader().setStretchLastSection(False)
        self.ticketsTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.ticketsTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.ticketsTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.ticketsTable.setColumnWidth(0, 200)
        self.ticketsTable.setColumnWidth(1, 100)
        self.ticketsTable.setColumnWidth(2, 100)
        self.ticketsTable.setColumnWidth(3, 80)
        self.ticketsTable.setColumnWidth(4, 120)
        self.ticketsTable.setColumnWidth(5, 80)

        self._refresh_tickets_table()

        # Add tables
        self.stackLayout = QVBoxLayout()
        self.stackLayout.addWidget(self.articlesTable)
        self.stackLayout.addWidget(self.ticketsTable)

        self.ticketsTable.hide()

        scrollLayout.addLayout(self.stackLayout, 1)

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _refresh_articles_table(self):
        """Refresh articles table"""
        self.articlesTable.setRowCount(len(self.helpArticles))

        for rowIdx, article in enumerate(self.helpArticles):
            self.articlesTable.setItem(rowIdx, 0, QTableWidgetItem(article.title))
            self.articlesTable.setItem(rowIdx, 1, QTableWidgetItem(article.category.replace("_", " ")))
            self.articlesTable.setItem(rowIdx, 2, QTableWidgetItem(str(article.views)))

            ratingItem = QTableWidgetItem(f"{article.rating} ⭐")
            ratingItem.setForeground(QBrush(QColor("#fbbf24")))
            self.articlesTable.setItem(rowIdx, 3, ratingItem)

            detailsBtn = QPushButton("👁️ Read")
            detailsBtn.setStyleSheet("background-color: #4f46e5; padding: 4px 8px; font-size: 9px;")
            self.articlesTable.setCellWidget(rowIdx, 4, detailsBtn)

    def _refresh_tickets_table(self):
        """Refresh tickets table"""
        self.ticketsTable.setRowCount(len(self.supportTickets))

        for rowIdx, ticket in enumerate(self.supportTickets):
            self.ticketsTable.setItem(rowIdx, 0, QTableWidgetItem(ticket.subject))
            self.ticketsTable.setItem(rowIdx, 1, QTableWidgetItem(ticket.category.replace("_", " ")))

            statusItem = QTableWidgetItem(ticket.status)
            statusColor = "#34d399" if ticket.status == "RESOLVED" else "#60a5fa" if ticket.status == "IN_PROGRESS" else "#fbbf24"
            statusItem.setForeground(QBrush(QColor(statusColor)))
            self.ticketsTable.setItem(rowIdx, 2, statusItem)

            priorityItem = QTableWidgetItem(ticket.priority)
            priorityColor = "#ef4444" if ticket.priority == "URGENT" else "#f97316" if ticket.priority == "HIGH" else "#fbbf24"
            priorityItem.setForeground(QBrush(QColor(priorityColor)))
            self.ticketsTable.setItem(rowIdx, 3, priorityItem)

            self.ticketsTable.setItem(rowIdx, 4, QTableWidgetItem(ticket.createdAt))

            detailsBtn = QPushButton("👁️ View")
            detailsBtn.setStyleSheet("background-color: #4f46e5; padding: 4px 8px; font-size: 9px;")
            self.ticketsTable.setCellWidget(rowIdx, 5, detailsBtn)

    def _switch_tab(self, tab: str):
        """Switch between tabs"""
        self.selectedTab = tab
        self.articlesTable.hide()
        self.ticketsTable.hide()

        if tab == "ARTICLES":
            self.articlesTable.show()
        elif tab == "SUPPORT_TICKETS":
            self.ticketsTable.show()

    def _on_search_changed(self):
        """Handle search input changed"""
        self.search = self.searchInput.text()

    def _open_article(self, index):
        """Open help article"""
        row = index.row()
        if row < len(self.helpArticles):
            article = self.helpArticles[row]
            dialog = HelpArticleModal(article, self)
            dialog.exec()

    def _open_create_ticket(self):
        """Open create ticket modal"""
        dialog = CreateTicketModal(self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            subject = dialog.subjectInput.text()
            QMessageBox.information(self, "✓ Ticket Created", f"Support ticket created: {subject}")

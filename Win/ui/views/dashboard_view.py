"""
DAS CRM Windows Application - Dashboard View
Executive KPI metrics and summary tables.
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QGridLayout, QLabel,
    QTableWidget, QTableWidgetItem, QFrame, QScrollArea
)
from PyQt6.QtCore import Qt, QSize
from PyQt6.QtGui import QFont, QColor


class DashboardView(QWidget):
    """Dashboard view with KPI cards and recent data."""
    
    def __init__(self):
        super().__init__()
        self.setup_ui()
    
    def setup_ui(self):
        """Setup dashboard layout."""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(12)
        
        # Title
        title = QLabel("Executive Dashboard")
        title.setFont(QFont("Segoe UI", 18, QFont.Weight.Bold))
        title.setStyleSheet("color: #0D9488;")
        layout.addWidget(title)
        
        # KPI Cards Grid
        kpi_layout = QGridLayout()
        kpi_layout.setSpacing(12)
        
        kpi_cards = [
            ("Total Revenue", "$248.5K", "↑ 18.4%", "#0D9488"),
            ("Active Deals", "86", "↑ 12%", "#3B82F6"),
            ("Total Leads", "1,420", "↑ 24%", "#8B5CF6"),
            ("Conversion Rate", "24.2%", "↑ 3.2%", "#EC4899"),
        ]
        
        for idx, (label, value, change, color) in enumerate(kpi_cards):
            card = self._create_kpi_card(label, value, change, color)
            kpi_layout.addWidget(card, idx // 2, idx % 2)
        
        layout.addLayout(kpi_layout)
        
        # Recent Leads Table
        layout.addWidget(QLabel("Recent Leads"))
        leads_table = self._create_leads_table()
        layout.addWidget(leads_table)
        
        # Recent Deals Table
        layout.addWidget(QLabel("Top Deals"))
        deals_table = self._create_deals_table()
        layout.addWidget(deals_table)
        
        layout.addStretch()
    
    def _create_kpi_card(self, label: str, value: str, change: str, color: str) -> QFrame:
        """Create KPI metric card."""
        card = QFrame()
        card.setStyleSheet(f"""
            QFrame {{
                background-color: rgba(13, 148, 136, 0.1);
                border: 2px solid {color};
                border-radius: 8px;
            }}
        """)
        card.setMinimumHeight(100)
        
        layout = QVBoxLayout(card)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(4)
        
        label_widget = QLabel(label)
        label_widget.setStyleSheet("color: #888; font-size: 11px;")
        layout.addWidget(label_widget)
        
        value_widget = QLabel(value)
        value_widget.setFont(QFont("Segoe UI", 20, QFont.Weight.Bold))
        value_widget.setStyleSheet(f"color: {color};")
        layout.addWidget(value_widget)
        
        change_widget = QLabel(change)
        change_widget.setStyleSheet("color: #22c55e; font-size: 10px;")
        layout.addWidget(change_widget)
        
        return card
    
    def _create_leads_table(self) -> QTableWidget:
        """Create leads summary table."""
        table = QTableWidget()
        table.setColumnCount(5)
        table.setHorizontalHeaderLabels(["Company", "Contact", "Value", "Status", "Source"])
        table.setMaximumHeight(200)
        table.setStyleSheet("""
            QTableWidget {
                background-color: #2d2d2d;
                alternate-background-color: #1e1e1e;
                gridline-color: #404040;
                color: #ffffff;
            }
            QHeaderView::section {
                background-color: #0D9488;
                padding: 5px;
                color: white;
                font-weight: bold;
            }
        """)
        table.setAlternatingRowColors(True)
        
        # Sample data
        data = [
            ("Apex Tech", "Sarah Jenkins", "$45,000", "Proposal", "Website"),
            ("Nexus Labs", "Michael Chang", "$28,500", "Qualified", "LinkedIn"),
            ("Global Inc", "Elena Rostova", "$120,000", "New", "Partner"),
        ]
        
        table.setRowCount(len(data))
        for row, (company, contact, value, status, source) in enumerate(data):
            table.setItem(row, 0, QTableWidgetItem(company))
            table.setItem(row, 1, QTableWidgetItem(contact))
            table.setItem(row, 2, QTableWidgetItem(value))
            table.setItem(row, 3, QTableWidgetItem(status))
            table.setItem(row, 4, QTableWidgetItem(source))
        
        table.resizeColumnsToContents()
        return table
    
    def _create_deals_table(self) -> QTableWidget:
        """Create deals summary table."""
        table = QTableWidget()
        table.setColumnCount(5)
        table.setHorizontalHeaderLabels(["Deal Title", "Company", "Amount", "Stage", "Probability"])
        table.setMaximumHeight(200)
        table.setStyleSheet("""
            QTableWidget {
                background-color: #2d2d2d;
                alternate-background-color: #1e1e1e;
                gridline-color: #404040;
                color: #ffffff;
            }
            QHeaderView::section {
                background-color: #0D9488;
                padding: 5px;
                color: white;
                font-weight: bold;
            }
        """)
        table.setAlternatingRowColors(True)
        
        # Sample data
        data = [
            ("Cloud License", "Apex Tech", "$45,000", "Negotiation", "80%"),
            ("AI Platform", "Nexus Labs", "$28,500", "Demo", "60%"),
            ("Enterprise Contract", "Global Inc", "$120,000", "Contract Sent", "90%"),
        ]
        
        table.setRowCount(len(data))
        for row, (title, company, amount, stage, prob) in enumerate(data):
            table.setItem(row, 0, QTableWidgetItem(title))
            table.setItem(row, 1, QTableWidgetItem(company))
            table.setItem(row, 2, QTableWidgetItem(amount))
            table.setItem(row, 3, QTableWidgetItem(stage))
            table.setItem(row, 4, QTableWidgetItem(prob))
        
        table.resizeColumnsToContents()
        return table

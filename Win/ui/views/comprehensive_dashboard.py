"""
DAS CRM Windows Application - Comprehensive Dashboard Implementation
Full-featured executive dashboard with deep analytics, charts, and real-time metrics.
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QGridLayout, QLabel, QTableWidget,
    QTableWidgetItem, QFrame, QScrollArea, QTabWidget, QComboBox, QPushButton,
    QDateEdit, QSpinBox
)
from PyQt6.QtCore import Qt, QDate, QTimer, pyqtSignal
from PyQt6.QtGui import QFont, QColor, QBrush
from PyQt6.QtChart import QChart, QChartView, QBarSeries, QBarSet, QBarCategoryAxis, QValueAxis
from PyQt6.QtCore import QSize


class ComprehensiveDashboardView(QWidget):
    """Advanced executive dashboard with analytics, forecasting, and real-time data."""
    
    data_refresh = pyqtSignal()
    
    def __init__(self):
        super().__init__()
        self.setup_ui()
        self.setup_refresh_timer()
    
    def setup_ui(self):
        """Setup comprehensive dashboard layout."""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(20, 20, 20, 20)
        layout.setSpacing(16)
        
        # Dashboard Header with filters
        header_layout = QHBoxLayout()
        
        title = QLabel("Executive Dashboard")
        title.setFont(QFont("Segoe UI", 20, QFont.Weight.Bold))
        title.setStyleSheet("color: #0D9488;")
        header_layout.addWidget(title)
        
        header_layout.addSpacing(20)
        
        # Date range filter
        header_layout.addWidget(QLabel("From:"))
        from_date = QDateEdit()
        from_date.setDate(QDate.currentDate().addMonths(-1))
        header_layout.addWidget(from_date)
        
        header_layout.addWidget(QLabel("To:"))
        to_date = QDateEdit()
        to_date.setDate(QDate.currentDate())
        header_layout.addWidget(to_date)
        
        # Refresh button
        refresh_btn = QPushButton("Refresh")
        refresh_btn.setMaximumWidth(100)
        refresh_btn.clicked.connect(self.on_refresh_clicked)
        header_layout.addWidget(refresh_btn)
        
        header_layout.addStretch()
        
        layout.addLayout(header_layout)
        
        # Main tabs
        tabs = QTabWidget()
        tabs.setStyleSheet("""
            QTabWidget::pane { border: 1px solid #404040; }
            QTabBar::tab {
                background-color: #2d2d2d;
                color: white;
                padding: 8px 20px;
                border: 1px solid #404040;
            }
            QTabBar::tab:selected {
                background-color: #0D9488;
                color: white;
            }
        """)
        
        # Tab 1: Key Metrics
        tabs.addTab(self.create_metrics_tab(), "Key Metrics")
        
        # Tab 2: Sales Pipeline
        tabs.addTab(self.create_pipeline_tab(), "Sales Pipeline")
        
        # Tab 3: Lead Analysis
        tabs.addTab(self.create_leads_tab(), "Lead Analysis")
        
        # Tab 4: Revenue Forecast
        tabs.addTab(self.create_forecast_tab(), "Revenue Forecast")
        
        # Tab 5: Team Performance
        tabs.addTab(self.create_team_tab(), "Team Performance")
        
        layout.addWidget(tabs)
    
    def create_metrics_tab(self) -> QWidget:
        """Create key metrics tab with KPI cards and summaries."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # Top row: 6 KPI cards
        kpi_grid = QGridLayout()
        kpi_grid.setSpacing(12)
        
        kpi_data = [
            ("Total Revenue", "$248,500", "+18.4%", "#0D9488"),
            ("Pipeline Value", "$850,000", "+12.3%", "#3B82F6"),
            ("Closed This Month", "$45,200", "+5.2%", "#10B981"),
            ("Monthly Recurring", "$125,000", "+8.1%", "#8B5CF6"),
            ("Conversion Rate", "24.2%", "+3.2%", "#F59E0B"),
            ("Avg Deal Size", "$42,500", "+2.8%", "#EC4899"),
        ]
        
        for idx, (label, value, change, color) in enumerate(kpi_data):
            card = self.create_metric_card(label, value, change, color)
            kpi_grid.addWidget(card, idx // 3, idx % 3)
        
        layout.addLayout(kpi_grid)
        
        # Tables: Recent activity
        layout.addWidget(QLabel("Recent Transactions"))
        transactions_table = self.create_transactions_table()
        layout.addWidget(transactions_table)
        
        return widget
    
    def create_pipeline_tab(self) -> QWidget:
        """Create sales pipeline analysis tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # Pipeline chart
        layout.addWidget(QLabel("Deal Pipeline by Stage"))
        
        chart = QChart()
        chart.setTitle("Sales Pipeline Analysis")
        chart.setAnimationOptions(QChart.AnimationOption.SeriesAnimations)
        
        # Create bar set for pipeline
        pipeline_set = QBarSet("Pipeline Value")
        pipeline_set.setColor(QColor("#0D9488"))
        pipeline_set.append(150000)  # Prospecting
        pipeline_set.append(280000)  # Demo Scheduled
        pipeline_set.append(250000)  # Negotiation
        pipeline_set.append(170000)  # Contract Sent
        
        series = QBarSeries()
        series.append(pipeline_set)
        
        chart.addSeries(series)
        
        # Axis setup
        categories = ["Prospecting", "Demo", "Negotiation", "Contract"]
        axis_x = QBarCategoryAxis()
        axis_x.append(categories)
        chart.addAxis(axis_x, Qt.AlignmentFlag.AlignBottom)
        series.attachAxis(axis_x)
        
        axis_y = QValueAxis()
        axis_y.setRange(0, 300000)
        chart.addAxis(axis_y, Qt.AlignmentFlag.AlignLeft)
        series.attachAxis(axis_y)
        
        chart_view = QChartView(chart)
        chart_view.setRenderHint(chart_view.RenderHint.Antialiasing)
        layout.addWidget(chart_view)
        
        # Pipeline details table
        layout.addWidget(QLabel("Pipeline Details"))
        pipeline_table = self.create_pipeline_table()
        layout.addWidget(pipeline_table)
        
        return widget
    
    def create_leads_tab(self) -> QWidget:
        """Create lead analysis tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        # Lead source analysis
        layout.addWidget(QLabel("Lead Source Distribution"))
        sources_layout = QHBoxLayout()
        
        sources = [
            ("Website", "320", "22.5%", "#0D9488"),
            ("LinkedIn", "450", "31.7%", "#3B82F6"),
            ("Referral", "380", "26.8%", "#10B981"),
            ("Phone", "270", "19.0%", "#F59E0B"),
        ]
        
        for source, count, percent, color in sources:
            source_card = QFrame()
            source_card.setStyleSheet(f"""
                QFrame {{
                    background-color: rgba(13, 148, 136, 0.1);
                    border: 2px solid {color};
                    border-radius: 8px;
                }}
            """)
            
            source_layout = QVBoxLayout(source_card)
            source_layout.setContentsMargins(12, 12, 12, 12)
            
            source_label = QLabel(source)
            source_label.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
            source_layout.addWidget(source_label)
            
            count_label = QLabel(f"{count} leads")
            count_label.setStyleSheet(f"color: {color}; font-weight: bold;")
            source_layout.addWidget(count_label)
            
            percent_label = QLabel(percent)
            percent_label.setStyleSheet("color: #888; font-size: 10px;")
            source_layout.addWidget(percent_label)
            
            sources_layout.addWidget(source_card)
        
        layout.addLayout(sources_layout)
        
        # Lead status distribution
        layout.addWidget(QLabel("Lead Status Distribution"))
        status_table = self.create_lead_status_table()
        layout.addWidget(status_table)
        
        return widget
    
    def create_forecast_tab(self) -> QWidget:
        """Create revenue forecast tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        layout.addWidget(QLabel("3-Month Revenue Forecast"))
        
        # Forecast chart
        forecast_data = [
            ("Month 1", 180000, 165000),
            ("Month 2", 210000, 195000),
            ("Month 3", 245000, 220000),
        ]
        
        forecast_table = QTableWidget()
        forecast_table.setColumnCount(4)
        forecast_table.setHorizontalHeaderLabels(["Period", "Forecast", "Best Case", "Worst Case"])
        forecast_table.setRowCount(len(forecast_data))
        
        forecast_table.setStyleSheet("""
            QTableWidget {
                background-color: #2d2d2d;
                color: white;
            }
            QHeaderView::section {
                background-color: #0D9488;
                padding: 5px;
                color: white;
                font-weight: bold;
            }
        """)
        
        for row, (period, forecast, best_case) in enumerate(forecast_data):
            worst_case = best_case - 15000
            forecast_table.setItem(row, 0, QTableWidgetItem(period))
            forecast_table.setItem(row, 1, QTableWidgetItem(f"${forecast:,}"))
            forecast_table.setItem(row, 2, QTableWidgetItem(f"${best_case:,}"))
            forecast_table.setItem(row, 3, QTableWidgetItem(f"${worst_case:,}"))
        
        layout.addWidget(forecast_table)
        
        # Quarterly targets
        layout.addWidget(QLabel("Quarterly Targets vs Actual"))
        quarterly_table = self.create_quarterly_table()
        layout.addWidget(quarterly_table)
        
        return widget
    
    def create_team_tab(self) -> QWidget:
        """Create team performance tab."""
        widget = QWidget()
        layout = QVBoxLayout(widget)
        
        layout.addWidget(QLabel("Team Sales Performance"))
        
        team_table = QTableWidget()
        team_table.setColumnCount(7)
        team_table.setHorizontalHeaderLabels([
            "Team Member", "Deals Won", "Revenue", "Conversion", "Avg Deal Size", "Pipeline", "Target %"
        ])
        
        team_data = [
            ("Aditya Singh", "12", "$285,000", "28%", "$23,750", "$450,000", "95%"),
            ("Sarah Chen", "8", "$198,000", "22%", "$24,750", "$280,000", "82%"),
            ("Michael Johnson", "10", "$245,000", "25%", "$24,500", "$320,000", "88%"),
            ("Elena Rodriguez", "6", "$142,500", "20%", "$23,750", "$180,000", "71%"),
        ]
        
        team_table.setRowCount(len(team_data))
        
        team_table.setStyleSheet("""
            QTableWidget {
                background-color: #2d2d2d;
                color: white;
                alternate-background-color: #1e1e1e;
            }
            QHeaderView::section {
                background-color: #0D9488;
                padding: 5px;
                color: white;
                font-weight: bold;
            }
        """)
        
        team_table.setAlternatingRowColors(True)
        
        for row, (member, deals, revenue, conversion, avg_deal, pipeline, target) in enumerate(team_data):
            team_table.setItem(row, 0, QTableWidgetItem(member))
            team_table.setItem(row, 1, QTableWidgetItem(deals))
            team_table.setItem(row, 2, QTableWidgetItem(revenue))
            team_table.setItem(row, 3, QTableWidgetItem(conversion))
            team_table.setItem(row, 4, QTableWidgetItem(avg_deal))
            team_table.setItem(row, 5, QTableWidgetItem(pipeline))
            team_table.setItem(row, 6, QTableWidgetItem(target))
        
        team_table.resizeColumnsToContents()
        layout.addWidget(team_table)
        
        return widget
    
    def create_metric_card(self, label: str, value: str, change: str, color: str) -> QFrame:
        """Create a metric KPI card."""
        card = QFrame()
        card.setStyleSheet(f"""
            QFrame {{
                background-color: rgba(13, 148, 136, 0.05);
                border: 2px solid {color};
                border-radius: 8px;
            }}
        """)
        card.setMinimumHeight(120)
        
        layout = QVBoxLayout(card)
        layout.setContentsMargins(16, 12, 16, 12)
        layout.setSpacing(4)
        
        label_widget = QLabel(label)
        label_widget.setStyleSheet("color: #888; font-size: 11px; font-weight: bold;")
        layout.addWidget(label_widget)
        
        value_widget = QLabel(value)
        value_widget.setFont(QFont("Segoe UI", 22, QFont.Weight.Bold))
        value_widget.setStyleSheet(f"color: {color};")
        layout.addWidget(value_widget)
        
        change_widget = QLabel(change)
        change_widget.setStyleSheet("color: #22c55e; font-size: 11px; font-weight: bold;")
        layout.addWidget(change_widget)
        
        return card
    
    def create_transactions_table(self) -> QTableWidget:
        """Create recent transactions table."""
        table = QTableWidget()
        table.setColumnCount(6)
        table.setHorizontalHeaderLabels(["Date", "Lead/Deal", "Type", "Amount", "Status", "Owner"])
        table.setMaximumHeight(250)
        
        data = [
            ("2026-08-26", "Apex Tech Cloud", "Deal", "$45,000", "Won", "Aditya"),
            ("2026-08-25", "Nexus Labs AI", "Lead", "$28,500", "Qualified", "Sarah"),
            ("2026-08-24", "Global Inc", "Deal", "$120,000", "Contract Sent", "Michael"),
            ("2026-08-23", "TechStart Inc", "Lead", "$15,000", "New", "Elena"),
        ]
        
        table.setRowCount(len(data))
        for row, (date, name, ttype, amount, status, owner) in enumerate(data):
            table.setItem(row, 0, QTableWidgetItem(date))
            table.setItem(row, 1, QTableWidgetItem(name))
            table.setItem(row, 2, QTableWidgetItem(ttype))
            table.setItem(row, 3, QTableWidgetItem(amount))
            table.setItem(row, 4, QTableWidgetItem(status))
            table.setItem(row, 5, QTableWidgetItem(owner))
        
        table.setStyleSheet("""
            QTableWidget {
                background-color: #2d2d2d;
                color: white;
                alternate-background-color: #1e1e1e;
            }
            QHeaderView::section {
                background-color: #0D9488;
                color: white;
                font-weight: bold;
                padding: 5px;
            }
        """)
        table.setAlternatingRowColors(True)
        table.resizeColumnsToContents()
        
        return table
    
    def create_pipeline_table(self) -> QTableWidget:
        """Create pipeline details table."""
        table = QTableWidget()
        table.setColumnCount(6)
        table.setHorizontalHeaderLabels(["Deal", "Company", "Amount", "Stage", "Probability", "Close Date"])
        
        data = [
            ("Cloud License", "Apex Tech", "$45,000", "Negotiation", "80%", "2026-09-15"),
            ("AI Platform", "Nexus Labs", "$28,500", "Demo", "60%", "2026-09-30"),
            ("Enterprise", "Global Inc", "$120,000", "Contract Sent", "90%", "2026-09-05"),
            ("Workspace", "TechStart", "$18,000", "Prospecting", "30%", "2026-10-15"),
        ]
        
        table.setRowCount(len(data))
        for row, (deal, company, amount, stage, prob, close) in enumerate(data):
            table.setItem(row, 0, QTableWidgetItem(deal))
            table.setItem(row, 1, QTableWidgetItem(company))
            table.setItem(row, 2, QTableWidgetItem(amount))
            table.setItem(row, 3, QTableWidgetItem(stage))
            table.setItem(row, 4, QTableWidgetItem(prob))
            table.setItem(row, 5, QTableWidgetItem(close))
        
        table.setStyleSheet("""
            QTableWidget {
                background-color: #2d2d2d;
                color: white;
            }
            QHeaderView::section {
                background-color: #0D9488;
                color: white;
                font-weight: bold;
                padding: 5px;
            }
        """)
        table.resizeColumnsToContents()
        
        return table
    
    def create_lead_status_table(self) -> QTableWidget:
        """Create lead status distribution table."""
        table = QTableWidget()
        table.setColumnCount(5)
        table.setHorizontalHeaderLabels(["Status", "Count", "Percentage", "Avg Value", "Conversion Rate"])
        
        data = [
            ("New", "450", "31.7%", "$8,500", "-"),
            ("Contacted", "380", "26.8%", "$12,000", "15%"),
            ("Qualified", "320", "22.5%", "$18,000", "28%"),
            ("Proposal", "180", "12.7%", "$25,000", "55%"),
            ("Won", "90", "6.3%", "$45,000", "100%"),
        ]
        
        table.setRowCount(len(data))
        for row, (status, count, percent, avg, conv) in enumerate(data):
            table.setItem(row, 0, QTableWidgetItem(status))
            table.setItem(row, 1, QTableWidgetItem(count))
            table.setItem(row, 2, QTableWidgetItem(percent))
            table.setItem(row, 3, QTableWidgetItem(avg))
            table.setItem(row, 4, QTableWidgetItem(conv))
        
        table.setStyleSheet("""
            QTableWidget {
                background-color: #2d2d2d;
                color: white;
            }
            QHeaderView::section {
                background-color: #0D9488;
                color: white;
                font-weight: bold;
                padding: 5px;
            }
        """)
        table.resizeColumnsToContents()
        
        return table
    
    def create_quarterly_table(self) -> QTableWidget:
        """Create quarterly targets vs actual table."""
        table = QTableWidget()
        table.setColumnCount(5)
        table.setHorizontalHeaderLabels(["Quarter", "Target", "Actual", "Variance", "Status"])
        
        data = [
            ("Q1 2026", "$600,000", "$580,000", "-$20,000", "97%"),
            ("Q2 2026", "$700,000", "$745,000", "+$45,000", "106%"),
            ("Q3 2026", "$800,000", "$720,000", "-$80,000", "90%"),
            ("Q4 2026", "$850,000", "Projected", "-", "85%"),
        ]
        
        table.setRowCount(len(data))
        for row, (quarter, target, actual, variance, status) in enumerate(data):
            table.setItem(row, 0, QTableWidgetItem(quarter))
            table.setItem(row, 1, QTableWidgetItem(target))
            table.setItem(row, 2, QTableWidgetItem(actual))
            table.setItem(row, 3, QTableWidgetItem(variance))
            table.setItem(row, 4, QTableWidgetItem(status))
        
        table.setStyleSheet("""
            QTableWidget {
                background-color: #2d2d2d;
                color: white;
            }
            QHeaderView::section {
                background-color: #0D9488;
                color: white;
                font-weight: bold;
                padding: 5px;
            }
        """)
        table.resizeColumnsToContents()
        
        return table
    
    def setup_refresh_timer(self):
        """Setup auto-refresh timer."""
        self.timer = QTimer()
        self.timer.timeout.connect(self.data_refresh.emit)
        self.timer.start(300000)  # Refresh every 5 minutes
    
    def on_refresh_clicked(self):
        """Handle manual refresh."""
        self.data_refresh.emit()

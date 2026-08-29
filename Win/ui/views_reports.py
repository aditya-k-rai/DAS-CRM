"""
views_reports.py — DAS CRM Reports & Analytics View
Charts, KPI breakdown, exportable reports.
"""
from PyQt6.QtCore import Qt, QTimer, pyqtSignal
from PyQt6.QtGui import QFont, QColor, QPainter
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QFrame, QPushButton, QScrollArea, QGridLayout,
                              QComboBox, QDateEdit, QTableWidget, QTableWidgetItem,
                              QHeaderView, QAbstractItemView, QFileDialog,
                              QMessageBox)
from PyQt6.QtCharts import QChartView, QLineSeries, QBarSeries, QBarSet,
                             QPieSeries, QChart, QValueAxis, QCategoryAxis
from datetime import datetime, timedelta


class ReportsView(QFrame):
    """Reports and analytics dashboard."""
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

        # Header
        header = QFrame()
        header.setFixedHeight(64)
        header.setStyleSheet("background: #0D1117; border-bottom: 1px solid #1E2A3C;")
        hl = QHBoxLayout(header)
        hl.setContentsMargins(24, 0, 24, 0)

        title = QLabel("📈  Reports & Analytics")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        hl.addWidget(title)

        hl.addStretch()

        # Date range
        hl.addWidget(QLabel("Period:"))
        self.period_combo = QComboBox()
        self.period_combo.addItems(["This Month", "Last Month", "This Quarter",
                                      "Last Quarter", "This Year", "Custom"])
        self.period_combo.setFont(QFont("Segoe UI", 10))
        self.period_combo.setFixedWidth(150)
        self.period_combo.setStyleSheet("""
            QComboBox {
                background: #1A2332; color: #E2E8F0;
                border: 1px solid #2A3A5C; border-radius: 6px;
                padding: 6px 10px;
            }
            QComboBox::drop-down { border: none; }
            QComboBox QAbstractItemView {
                background: #1A2332; color: #E2E8F0;
                border: 1px solid #2A3A5C;
                selection-background-color: #2A3A5C;
            }
        """)
        hl.addWidget(self.period_combo)

        export_btn = QPushButton("📤  Export Report")
        export_btn.setFont(QFont("Segoe UI", 10))
        export_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        export_btn.setStyleSheet("""
            QPushButton {
                background: rgba(59,130,246,0.15); color: #60A5FA;
                border: 1px solid rgba(59,130,246,0.3); border-radius: 6px;
                padding: 6px 14px;
            }
            QPushButton:hover { background: rgba(59,130,246,0.25); }
        """)
        export_btn.clicked.connect(self._export_report)
        hl.addWidget(export_btn)

        layout.addWidget(header)

        # Content
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("background: #0D1117; border: none;")
        scroll.setFrameShape(QFrame.Shape.NoFrame)

        content = QWidget()
        content.setStyleSheet("background: #0D1117;")
        cl = QVBoxLayout(content)
        cl.setContentsMargins(24, 20, 24, 20)
        cl.setSpacing(20)

        # KPI row
        kpi_grid = QGridLayout()
        kpi_grid.setSpacing(16)
        kpis = [
            ("👥", "1,247", "Total Leads", "#3B82F6"),
            ("✅", "₹48.3L", "Pipeline Value", "#22C55E"),
            ("🏆", "₹12.7L", "Revenue MTD", "#A855F7"),
            ("📋", "89", "Quotations Sent", "#F59E0B"),
            ("⚡", "23.5%", "Win Rate", "#06B6D4"),
            ("⏱️", "4.2 days", "Avg. Deal Cycle", "#EC4899"),
        ]
        for i, (icon, value, label, color) in enumerate(kpis):
            card = self._make_kpi_card(icon, value, label, color)
            kpi_grid.addWidget(card, i // 3, i % 3)
        cl.addLayout(kpi_grid)

        # Charts row
        charts_row = QHBoxLayout()
        charts_row.setSpacing(16)

        line_chart = self._build_trend_chart()
        charts_row.addWidget(line_chart, 1)

        bar_chart = self._build_stage_chart()
        charts_row.addWidget(bar_chart, 1)

        cl.addLayout(charts_row)

        # Rep performance table
        rep_frame = self._build_rep_table()
        cl.addWidget(rep_frame)

        cl.addStretch()
        scroll.setWidget(content)
        layout.addWidget(scroll, stretch=1)

    def _make_kpi_card(self, icon, value, label, color: str) -> QFrame:
        frame = QFrame()
        frame.setStyleSheet(f"""
            QFrame {{
                background: #1A2332;
                border-radius: 12px;
                border: 1px solid #2A3A5C;
                padding: 16px;
            }}
        """)
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(6)
        top = QHBoxLayout()
        top.addWidget(QLabel(f"<span style='font-size:20px'>{icon}</span>"))
        top.addStretch()
        layout.addLayout(top)
        val = QLabel(value)
        val.setFont(QFont("Segoe UI", 20, QFont.Weight.Bold))
        val.setStyleSheet(f"color: {color}; background: transparent;")
        layout.addWidget(val)
        lbl = QLabel(label)
        lbl.setFont(QFont("Segoe UI", 10))
        lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        layout.addWidget(lbl)
        layout.addStretch()
        return frame

    def _build_trend_chart(self) -> QFrame:
        frame = QFrame()
        frame.setStyleSheet("""
            QFrame {
                background: #1A2332; border-radius: 12px;
                border: 1px solid #2A3A5C; padding: 12px;
            }
        """)
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(8, 8, 8, 8)
        title = QLabel("Revenue Trend (₹ Lakhs)")
        title.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        title.setStyleSheet("color: #E2E8F0; background: transparent;")
        layout.addWidget(title)
        layout.addSpacing(4)

        series = QLineSeries()
        series.setName("Revenue")
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        values = [4.2, 5.8, 4.9, 6.3, 7.1, 8.4]
        for i, v in enumerate(values):
            series.append(i, v)
        series.setColor(QColor("#3B82F6"))
        series.setWidth(2)

        chart = QChart()
        chart.addSeries(series)
        chart.setBackgroundBrush(QColor("transparent"))
        chart.legend().hide()
        chart.setAnimationOptions(QChart.AnimationOption.SeriesAnimations)

        view = QChartView(chart)
        view.setRenderHint(QPainter.RenderHint.Antialiasing)
        view.setStyleSheet("background: transparent; border: none;")
        layout.addWidget(view)
        return frame

    def _build_stage_chart(self) -> QFrame:
        frame = QFrame()
        frame.setStyleSheet("""
            QFrame {
                background: #1A2332; border-radius: 12px;
                border: 1px solid #2A3A5C; padding: 12px;
            }
        """)
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(8, 8, 8, 8)
        title = QLabel("Deals by Stage")
        title.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        title.setStyleSheet("color: #E2E8F0; background: transparent;")
        layout.addWidget(title)
        layout.addSpacing(4)

        bar_set = QBarSet("Deals")
        stages = ["New", "Qualified", "Proposal", "Negotiation"]
        counts = [5, 8, 6, 4]
        for c in counts:
            bar_set << c
        bar_set.setColor(QColor("#22C55E"))

        series = QBarSeries()
        series.append(bar_set)
        series.setColor(QColor("#22C55E"))

        chart = QChart()
        chart.addSeries(series)
        chart.setBackgroundBrush(QColor("transparent"))
        chart.legend().hide()

        view = QChartView(chart)
        view.setRenderHint(QPainter.RenderHint.Antialiasing)
        view.setStyleSheet("background: transparent; border: none;")
        layout.addWidget(view)
        return frame

    def _build_rep_table(self) -> QFrame:
        frame = QFrame()
        frame.setStyleSheet("""
            QFrame {
                background: #1A2332; border-radius: 12px;
                border: 1px solid #2A3A5C; padding: 12px;
            }
        """)
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(12, 12, 12, 12)
        title = QLabel("👔  Rep Performance")
        title.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        title.setStyleSheet("color: #E2E8F0; background: transparent;")
        layout.addWidget(title)
        layout.addSpacing(8)

        table = QTableWidget()
        table.setColumnCount(5)
        table.setHorizontalHeaderLabels(["Rep", "Leads", "Deals Won", "Revenue", "Win Rate"])
        table.horizontalHeader().setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        table.horizontalHeader().setStyleSheet("""
            QHeaderView::section {
                background: #0D1117; color: #94A3B8;
                padding: 6px 12px; border: none;
                border-bottom: 1px solid #2A3A5C;
            }
        """)
        table.verticalHeader().setVisible(False)
        table.setRowCount(5)
        table.setFont(QFont("Segoe UI", 10))
        table.setStyleSheet("""
            QTableWidget {
                background: transparent; color: #E2E8F0;
                border: none; gridline-color: #1E2A3C;
            }
            QTableWidget::item { padding: 6px 12px; }
            QTableWidget::item:selected { background: #1E3A5C; }
        """)
        table.setShowGrid(False)
        table.horizontalHeader().setStretchLastSection(True)

        reps = [
            ("Rajesh Kumar", "342", "18", "₹24.5L", "28.5%"),
            ("Priya Sharma", "298", "22", "₹31.2L", "32.1%"),
            ("Amit Shah (TL)", "156", "12", "₹18.7L", "25.0%"),
            ("Sunita Verma (HR)", "201", "15", "₹19.8L", "26.8%"),
            ("Vikram Joshi", "250", "14", "₹16.1L", "21.5%"),
        ]
        for row, rep_data in enumerate(reps):
            for col, val in enumerate(rep_data):
                item = QTableWidgetItem(val)
                item.setFont(QFont("Segoe UI", 10))
                if col == 0:
                    item.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
                self._set_item_color(item, col)
                table.setItem(row, col, item)

        layout.addWidget(table)
        return frame

    def _set_item_color(self, item: QTableWidgetItem, col: int):
        colors = ["#60A5FA", "#94A3B8", "#22C55E", "#22C55E", "#A855F7"]
        item.setForeground(QColor(colors[col]))

    def _export_report(self):
        path, _ = QFileDialog.getSaveFileName(self, "Export Report",
                                               "report.csv", "CSV Files (*.csv)")
        if path:
            import csv
            with open(path, "w", newline="", encoding="utf-8") as f:
                writer = csv.writer(f)
                writer.writerow(["Rep", "Leads", "Deals Won", "Revenue", "Win Rate"])
                writer.writerows([
                    ("Rajesh Kumar", "342", "18", "₹24.5L", "28.5%"),
                    ("Priya Sharma", "298", "22", "₹31.2L", "32.1%"),
                    ("Amit Shah (TL)", "156", "12", "₹18.7L", "25.0%"),
                    ("Sunita Verma (HR)", "201", "15", "₹19.8L", "26.8%"),
                    ("Vikram Joshi", "250", "14", "₹16.1L", "21.5%"),
                ])
            QMessageBox.information(self, "Export Complete", f"Report exported to:\n{path}")

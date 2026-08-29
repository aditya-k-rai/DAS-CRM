"""
views_dashboard.py — DAS CRM Dashboard View
Executive KPI cards, charts, recent activity, quick actions.
"""
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QGridLayout,
                              QLabel, QFrame, QPushButton, QScrollArea,
                              QSizePolicy, QSpacerItem)
from PyQt6.QtCore import Qt, QTimer, pyqtSignal
from PyQt6.QtGui import QFont, QPainter, QColor, QLinearGradient, QBrush
from PyQt6.QtCharts import QChartView, QLineSeries, QBarSeries, QBarSet, QPieSeries, QChart
from datetime import datetime, timedelta
import random


class KPICard(QFrame):
    """Single KPI metric card with icon, value, label, trend."""
    def __init__(self, icon: str, value: str, label: str, trend: str, trend_up: bool = True,
                 accent: str = "#3B82F6", parent=None):
        super().__init__(parent)
        self.accent = QColor(accent)
        self.trend_up = trend_up
        self._value = value
        self._setup_ui(icon, value, label, trend)

    def _setup_ui(self, icon, value, label, trend):
        self.setFixedHeight(120)
        self.setFrameShape(QFrame.Shape.NoFrame)
        self.setStyleSheet("""
            QFrame {
                background: #1A2332;
                border-radius: 12px;
                border: 1px solid #2A3A5C;
            }
        """)
        layout = QVBoxLayout(self)
        layout.setContentsMargins(16, 14, 16, 14)
        layout.setSpacing(6)

        top = QHBoxLayout()
        top.addWidget(QLabel(f"<span style='font-size:18px'>{icon}</span>"))
        top.addStretch()
        trend_color = "#22C55E" if self.trend_up else "#EF4444"
        trend_label = QLabel(f"<span style='color:{trend_color};font-size:11px'>▲ {trend}</span>")
        top.addWidget(trend_label)
        layout.addLayout(top)

        val = QLabel(value)
        val.setFont(QFont("Segoe UI", 18, QFont.Weight.Bold))
        val.setStyleSheet("color: #F1F5F9; background: transparent;")
        layout.addWidget(val)

        lbl = QLabel(label)
        lbl.setFont(QFont("Segoe UI", 10))
        lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        layout.addWidget(lbl)
        layout.addStretch()

    def set_value(self, value: str, trend: str, trend_up: bool):
        self._value = value
        self.trend_up = trend_up
        self.update()


class StatMiniChart(QFrame):
    """Mini sparkline chart in a card."""
    def __init__(self, data: list, color: str = "#3B82F6", parent=None):
        super().__init__(parent)
        self.data = data
        self.line_color = QColor(color)
        self.setFixedHeight(50)
        self.setStyleSheet("background: transparent;")

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)
        if not self.data:
            return
        w, h = self.width(), self.height()
        min_v, max_v = min(self.data), max(self.data)
        rng = max_v - min_v if max_v != min_v else 1
        pts = []
        for i, v in enumerate(self.data):
            x = int(i * (w - 4) / max(len(self.data) - 1, 1)) + 2
            y = int(h - 4 - (v - min_v) / rng * (h - 8))
            pts.append((x, y))
        pen = QPen(self.line_color, 1.5)
        painter.setPen(pen)
        for i in range(len(pts) - 1):
            painter.drawLine(pts[i][0], pts[i][1], pts[i+1][0], pts[i+1][1])


class DashboardView(QFrame):
    """Main dashboard with KPI cards, charts, and recent activity."""
    refreshed = pyqtSignal()

    def __init__(self, api_client=None, sync_engine=None, parent=None):
        super().__init__(parent)
        self.api_client = api_client
        self.sync_engine = sync_engine
        self._setup_ui()
        self._start_refresh_timer()

    def _setup_ui(self):
        self.setStyleSheet("background: #0D1117;")
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(0)

        # ── Header ───────────────────────────────────────────────────────
        header = QFrame()
        header.setFixedHeight(64)
        header.setStyleSheet("background: #0D1117; border-bottom: 1px solid #1E2A3C;")
        hl = QHBoxLayout(header)
        hl.setContentsMargins(24, 0, 24, 0)

        title = QLabel("📊  Executive Dashboard")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        hl.addWidget(title)
        hl.addStretch()

        self.clock_label = QLabel("")
        self.clock_label.setFont(QFont("Segoe UI", 11))
        self.clock_label.setStyleSheet("color: #94A3B8; background: transparent;")
        hl.addWidget(self.clock_label)

        self.sync_indicator = QLabel("● Online")
        self.sync_indicator.setFont(QFont("Segoe UI", 10))
        self.sync_indicator.setStyleSheet("color: #22C55E; background: transparent;")
        hl.addWidget(self.sync_indicator)

        refresh_btn = QPushButton("🔄  Refresh")
        refresh_btn.setFont(QFont("Segoe UI", 10))
        refresh_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        refresh_btn.setStyleSheet("""
            QPushButton {
                background: #1E3A5C;
                color: #60A5FA;
                border: 1px solid #2A4A7C;
                border-radius: 6px;
                padding: 6px 14px;
            }
            QPushButton:hover { background: #2A4A7C; }
        """)
        refresh_btn.clicked.connect(self.refresh)
        hl.addWidget(refresh_btn)

        layout.addWidget(header)

        # ── Content Scroll ───────────────────────────────────────────────
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setStyleSheet("background: #0D1117; border: none;")
        scroll.setFrameShape(QFrame.Shape.NoFrame)

        content = QWidget()
        content.setStyleSheet("background: #0D1117;")
        cl = QVBoxLayout(content)
        cl.setContentsMargins(24, 20, 24, 20)
        cl.setSpacing(20)

        # ── KPI Cards ────────────────────────────────────────────────────
        kpi_layout = QGridLayout()
        kpi_layout.setSpacing(16)
        self.kpi_cards = [
            KPICard("👥", "1,247", "Total Leads", "+12.5%", True, "#3B82F6"),
            KPICard("✅", "₹48.3L", "Pipeline Value", "+8.3%", True, "#22C55E"),
            KPICard("📋", "89", "Open Quotations", "-3.1%", False, "#F59E0B"),
            KPICard("🏆", "₹12.7L", "Closed Won MTD", "+22.1%", True, "#A855F7"),
        ]
        for i, card in enumerate(self.kpi_cards):
            kpi_layout.addWidget(card, 0, i)

        # Mini sparkline row
        spark_layout = QHBoxLayout()
        spark_layout.setSpacing(16)
        spark_data_sets = [
            ([5, 8, 6, 9, 7, 11, 10, 13, 12, 15], "#3B82F6"),
            ([10, 12, 11, 14, 13, 16, 15, 18, 17, 20], "#22C55E"),
            ([8, 7, 9, 6, 8, 7, 5, 6, 4, 5], "#F59E0B"),
            ([3, 5, 4, 7, 6, 9, 8, 11, 10, 13], "#A855F7"),
        ]
        self.spark_charts = []
        for data, color in spark_data_sets:
            spark = StatMiniChart(data, color)
            spark.setFixedHeight(50)
            self.spark_charts.append(spark)
            spark_layout.addWidget(spark)

        kpi_layout.addLayout(spark_layout, 1, 0, 1, 4)
        cl.addLayout(kpi_layout)

        # ── Charts Row ───────────────────────────────────────────────────
        charts_layout = QHBoxLayout()
        charts_layout.setSpacing(16)

        # Line chart - Lead trend
        line_chart = self._build_line_chart()
        charts_layout.addWidget(line_chart, 1)

        # Bar chart - Monthly revenue
        bar_chart = self._build_bar_chart()
        charts_layout.addWidget(bar_chart, 1)

        # Pie chart - Lead source
        pie_chart = self._build_pie_chart()
        charts_layout.addWidget(pie_chart, 1)

        cl.addLayout(charts_layout)

        # ── Bottom Row ───────────────────────────────────────────────────
        bottom_layout = QHBoxLayout()
        bottom_layout.setSpacing(16)

        # Recent leads
        recent_frame = self._build_recent_leads()
        bottom_layout.addWidget(recent_frame, 2)

        # Upcoming tasks
        tasks_frame = self._build_upcoming_tasks()
        bottom_layout.addWidget(tasks_frame, 1)

        # Quick actions
        actions_frame = self._build_quick_actions()
        bottom_layout.addWidget(actions_frame, 1)

        cl.addLayout(bottom_layout)
        cl.addStretch()

        scroll.setWidget(content)
        layout.addWidget(scroll, stretch=1)

    def _build_line_chart(self) -> QFrame:
        frame = QFrame()
        frame.setStyleSheet("""
            QFrame {
                background: #1A2332;
                border-radius: 12px;
                border: 1px solid #2A3A5C;
                padding: 12px;
            }
        """)
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(8, 8, 8, 8)
        title = QLabel("Lead Acquisition Trend")
        title.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        title.setStyleSheet("color: #E2E8F0; background: transparent;")
        layout.addWidget(title)
        layout.addSpacing(4)

        series = QLineSeries()
        series.setName("Leads")
        months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun"]
        values = [45, 62, 58, 78, 95, 112]
        for i, v in enumerate(values):
            series.append(i, v)
        series.setColor(QColor("#3B82F6"))

        chart = QChart()
        chart.addSeries(series)
        chart.setBackgroundBrush(QColor("transparent"))
        chart.setPlotAreaBackgroundBrush(QColor("transparent"))
        chart.legend().hide()
        chart.setFont(QFont("Segoe UI", 9))

        view = QChartView(chart)
        view.setRenderHint(QPainter.RenderHint.Antialiasing)
        view.setStyleSheet("background: transparent; border: none;")
        layout.addWidget(view)
        return frame

    def _build_bar_chart(self) -> QFrame:
        frame = QFrame()
        frame.setStyleSheet("""
            QFrame {
                background: #1A2332;
                border-radius: 12px;
                border: 1px solid #2A3A5C;
                padding: 12px;
            }
        """)
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(8, 8, 8, 8)
        title = QLabel("Monthly Revenue (₹ Lakhs)")
        title.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        title.setStyleSheet("color: #E2E8F0; background: transparent;")
        layout.addWidget(title)
        layout.addSpacing(4)

        bar_set = QBarSet("Revenue")
        for v in [4.2, 5.8, 4.9, 6.3, 7.1, 8.4]:
            bar_set << v
        bar_set.setColor(QColor("#22C55E"))

        series = QBarSeries()
        series.append(bar_set)
        series.setColor(QColor("#22C55E"))

        chart = QChart()
        chart.addSeries(series)
        chart.setBackgroundBrush(QColor("transparent"))
        chart.legend().hide()
        chart.setFont(QFont("Segoe UI", 9))

        view = QChartView(chart)
        view.setRenderHint(QPainter.RenderHint.Antialiasing)
        view.setStyleSheet("background: transparent; border: none;")
        layout.addWidget(view)
        return frame

    def _build_pie_chart(self) -> QFrame:
        frame = QFrame()
        frame.setStyleSheet("""
            QFrame {
                background: #1A2332;
                border-radius: 12px;
                border: 1px solid #2A3A5C;
                padding: 12px;
            }
        """)
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(8, 8, 8, 8)
        title = QLabel("Lead Sources")
        title.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        title.setStyleSheet("color: #E2E8F0; background: transparent;")
        layout.addWidget(title)
        layout.addSpacing(4)

        series = QPieSeries()
        series.append("Facebook Ads", 35)
        series.append("Google Ads", 28)
        series.append("Website", 18)
        series.append("Referral", 12)
        series.append("Other", 7)
        series.setHoleSize(0.45)

        chart = QChart()
        chart.addSeries(series)
        chart.setBackgroundBrush(QColor("transparent"))
        chart.legend().hide()

        view = QChartView(chart)
        view.setRenderHint(QPainter.RenderHint.Antialiasing)
        view.setStyleSheet("background: transparent; border: none;")
        layout.addWidget(view)
        return frame

    def _build_recent_leads(self) -> QFrame:
        frame = QFrame()
        frame.setStyleSheet("""
            QFrame {
                background: #1A2332;
                border-radius: 12px;
                border: 1px solid #2A3A5C;
                padding: 12px;
            }
        """)
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(12, 12, 12, 12)
        title = QLabel("📋  Recent Leads")
        title.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        title.setStyleSheet("color: #E2E8F0; background: transparent;")
        layout.addWidget(title)
        layout.addSpacing(8)

        leads = [
            ("Aditya Sharma", "TechCorp India", "₹4,50,000", "🔥 High"),
            ("Priya Patel", "Innovate Solutions", "₹12,00,000", "🔥 High"),
            ("Vikram Malhotra", "Apex Global", "₹8,50,000", "⚡ Medium"),
            ("Ananya Roy", "Sun Realty", "₹21,00,000", "🔥 High"),
            ("Rahul Singh", "NexGen Finance", "₹3,20,000", "⚡ Medium"),
        ]
        for name, company, value, priority in leads:
            row = QFrame()
            row.setStyleSheet("background: rgba(255,255,255,0.03); border-radius: 6px; padding: 6px;")
            rl = QHBoxLayout(row)
            rl.setContentsMargins(8, 4, 8, 4)
            rl.addWidget(QLabel(f"<span style='color:#94A3B8;font-size:12px'>{name}</span>"))
            rl.addWidget(QLabel(f"<span style='color:#64748B;font-size:11px'>{company}</span>"))
            rl.addWidget(QLabel(f"<span style='color:#22C55E;font-size:11px;font-weight:bold'>{value}</span>"))
            rl.addWidget(QLabel(f"<span style='font-size:11px'>{priority}</span>"))
            layout.addWidget(row)

        return frame

    def _build_upcoming_tasks(self) -> QFrame:
        frame = QFrame()
        frame.setStyleSheet("""
            QFrame {
                background: #1A2332;
                border-radius: 12px;
                border: 1px solid #2A3A5C;
                padding: 12px;
            }
        """)
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(12, 12, 12, 12)
        title = QLabel("⚡  Upcoming Tasks")
        title.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        title.setStyleSheet("color: #E2E8F0; background: transparent;")
        layout.addWidget(title)
        layout.addSpacing(8)

        tasks = [
            ("Follow up with Aditya Sharma", "Today, 3:00 PM"),
            ("Send proposal to Priya Patel", "Tomorrow, 10:00 AM"),
            ("Review Vikram Malhotra quote", "Tomorrow, 2:00 PM"),
            ("Team standup call", "Mon, 9:00 AM"),
        ]
        for task, due in tasks:
            row = QFrame()
            row.setStyleSheet("background: rgba(255,255,255,0.03); border-radius: 6px; padding: 6px;")
            rl = QVBoxLayout(row)
            rl.setContentsMargins(8, 4, 8, 4)
            rl.addWidget(QLabel(f"<span style='color:#E2E8F0;font-size:11px'>{task}</span>"))
            rl.addWidget(QLabel(f"<span style='color:#64748B;font-size:10px'>{due}</span>"))
            layout.addWidget(row)

        return frame

    def _build_quick_actions(self) -> QFrame:
        frame = QFrame()
        frame.setStyleSheet("""
            QFrame {
                background: #1A2332;
                border-radius: 12px;
                border: 1px solid #2A3A5C;
                padding: 12px;
            }
        """)
        layout = QVBoxLayout(frame)
        layout.setContentsMargins(12, 12, 12, 12)
        title = QLabel("⚡  Quick Actions")
        title.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        title.setStyleSheet("color: #E2E8F0; background: transparent;")
        layout.addWidget(title)
        layout.addSpacing(12)

        actions = [
            ("➕", "New Lead"),
            ("📋", "New Quotation"),
            ("📞", "Log Call"),
            ("📊", "Generate Report"),
        ]
        for icon, label in actions:
            btn = QPushButton(f"{icon}  {label}")
            btn.setFont(QFont("Segoe UI", 10))
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.setStyleSheet("""
                QPushButton {
                    background: rgba(59,130,246,0.15);
                    color: #60A5FA;
                    border: 1px solid rgba(59,130,246,0.3);
                    border-radius: 6px;
                    padding: 8px;
                    text-align: left;
                }
                QPushButton:hover { background: rgba(59,130,246,0.25); }
            """)
            layout.addWidget(btn)

        return frame

    def _start_refresh_timer(self):
        self.timer = QTimer(self)
        self.timer.timeout.connect(self._update_clock)
        self.timer.start(1000)
        self._update_clock()

    def _update_clock(self):
        now = datetime.now()
        self.clock_label.setText(now.strftime("%d %b %Y  %H:%M:%S"))

    def refresh(self):
        self.refreshed.emit()
        # Simulate data refresh
        self.sync_indicator.setText("⟳ Syncing...")
        self.sync_indicator.setStyleSheet("color: #F59E0B; background: transparent;")
        QTimer.singleShot(1500, lambda: self.sync_indicator.setText("● Online"))
        QTimer.singleShot(1500, lambda: self.sync_indicator.setStyleSheet("color: #22C55E; background: transparent;"))

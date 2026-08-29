"""
views_hr.py — DAS CRM HR & Attendance View
Team management, attendance tracking, leave calendar.
"""
from PyQt6.QtCore import Qt, QTimer, pyqtSignal
from PyQt6.QtGui import QFont, QColor
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QFrame, QPushButton, QScrollArea, QTableWidget,
                              QTableWidgetItem, QHeaderView, QAbstractItemView,
                              QComboBox, QMessageBox, QDialog, QDialogButtonBox,
                              QCheckBox, QCalendarWidget, QTabWidget)


class HRView(QFrame):
    """HR and attendance management."""
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

        title = QLabel("👔  HR & Attendance")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        hl.addWidget(title)
        hl.addStretch()

        # Clock in/out
        self.clock_label = QLabel("")
        self.clock_label.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        self.clock_label.setStyleSheet("color: #60A5FA; background: transparent;")
        hl.addWidget(self.clock_label)

        self.punch_btn = QPushButton("🕐  Punch In")
        self.punch_btn.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        self.punch_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.punch_btn.setStyleSheet("""
            QPushButton { background: #22C55E; color: white; border: none; border-radius: 6px; padding: 8px 16px; }
            QPushButton:hover { background: #16A34A; }
        """)
        self.punch_btn.clicked.connect(self._toggle_punch)
        hl.addWidget(self.punch_btn)

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
        tabs.addTab(self._build_attendance_tab(), "📅  Attendance")
        tabs.addTab(self._build_team_tab(), "👥  Team")
        tabs.addTab(self._build_leave_tab(), "🏖️  Leave Calendar")
        layout.addWidget(tabs)

        # Clock update
        self._timer = QTimer(self)
        self._timer.timeout.connect(self._update_clock)
        self._timer.start(1000)
        self._update_clock()
        self._punched_in = False

    def _update_clock(self):
        from datetime import datetime
        now = datetime.now()
        self.clock_label.setText(now.strftime("%H:%M:%S"))

    def _toggle_punch(self):
        self._punched_in = not self._punched_in
        if self._punched_in:
            self.punch_btn.setText("🕐  Punch Out")
            self.punch_btn.setStyleSheet("""
                QPushButton { background: #EF4444; color: white; border: none; border-radius: 6px; padding: 8px 16px; }
                QPushButton:hover { background: #DC2626; }
            """)
            QMessageBox.information(self, "Punch In", "✅ Punched in at " + self.clock_label.text())
        else:
            self.punch_btn.setText("🕐  Punch In")
            self.punch_btn.setStyleSheet("""
                QPushButton { background: #22C55E; color: white; border: none; border-radius: 6px; padding: 8px 16px; }
                QPushButton:hover { background: #16A34A; }
            """)
            QMessageBox.information(self, "Punch Out", "👋 Punched out at " + self.clock_label.text())

    def _build_attendance_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        # Today's summary
        summary = QFrame()
        summary.setStyleSheet("""
            QFrame { background: #1A2332; border-radius: 12px; border: 1px solid #2A3A5C; padding: 16px; }
        """)
        sl = QHBoxLayout(summary)
        sl.addWidget(self._stat_card("👥", "12", "Present Today"))
        sl.addWidget(self._stat_card("❌", "3", "Absent"))
        sl.addWidget(self._stat_card("⏰", "8", "On Time"))
        sl.addWidget(self._stat_card("⚠️", "2", "Late Arrivals"))
        layout.addWidget(summary)

        # Attendance table
        info = QLabel("📅  Recent Attendance")
        info.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        info.setStyleSheet("color: #E2E8F0;")
        layout.addWidget(info)

        table = QTableWidget()
        table.setColumnCount(5)
        table.setHorizontalHeaderLabels(["Employee", "Date", "Check In", "Check Out", "Status"])
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

        rows = [
            ("Rajesh Kumar", "30 Aug 2026", "09:02 AM", "06:15 PM", "Present"),
            ("Priya Sharma", "30 Aug 2026", "09:15 AM", "06:30 PM", "Late"),
            ("Amit Shah (TL)", "30 Aug 2026", "09:00 AM", "06:00 PM", "Present"),
            ("Sunita Verma (HR)", "30 Aug 2026", "—", "—", "Absent"),
            ("Vikram Joshi", "30 Aug 2026", "09:05 AM", "06:10 PM", "Present"),
        ]
        table.setRowCount(len(rows))
        for row, data in enumerate(rows):
            for col, val in enumerate(data):
                item = QTableWidgetItem(val)
                item.setFont(QFont("Segoe UI", 10))
                if col == 0:
                    item.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
                    item.setForeground(QColor("#60A5FA"))
                if col == 4:
                    color = "#22C55E" if val == "Present" else "#F59E0B" if val == "Late" else "#EF4444"
                    item.setForeground(QColor(color))
                table.setItem(row, col, item)
        layout.addWidget(table)
        layout.addStretch()
        return widget

    def _build_team_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        info = QLabel("👥  Sales Team")
        info.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        info.setStyleSheet("color: #E2E8F0;")
        layout.addWidget(info)

        members = [
            ("Rajesh Kumar", "Sales Rep", "342 leads", "12.7L"),
            ("Priya Sharma", "Sales Rep", "298 leads", "15.2L"),
            ("Amit Shah (TL)", "Team Lead", "156 leads", "18.7L"),
            ("Sunita Verma (HR)", "HR Manager", "—", "—"),
            ("Vikram Joshi", "Sales Rep", "250 leads", "8.1L"),
            ("Neha Kapoor", "Sales Rep", "180 leads", "9.4L"),
        ]
        for name, role, leads, revenue in members:
            row = QFrame()
            row.setStyleSheet("background: #1A2332; border-radius: 8px; padding: 12px;")
            rl = QHBoxLayout(row)
            rl.setContentsMargins(16, 10, 16, 10)
            avatar = QLabel("👤")
            avatar.setFont(QFont("Segoe UI Emoji", 20))
            avatar.setFixedSize(40, 40)
            avatar.setAlignment(Qt.AlignmentFlag.AlignCenter)
            avatar.setStyleSheet("""
                background: qlineargradient(x1:0,y1:0,x2:1,y2:1, stop:0 #3B82F6, stop:1 #6366F1);
                border-radius: 20px;
            """)
            rl.addWidget(avatar)
            rl.addWidget(QLabel(f"<span style='color:#E2E8F0;font-weight:bold'>{name}</span>"))
            rl.addWidget(QLabel(f"<span style='color:#94A3B8'>{role}</span>"))
            rl.addWidget(QLabel(f"<span style='color:#64748B;font-size:10px'>{leads}</span>"))
            rl.addWidget(QLabel(f"<span style='color:#22C55E;font-weight:bold'>{revenue}</span>"))
            rl.addStretch()
            layout.addWidget(row)
        layout.addStretch()
        return widget

    def _build_leave_tab(self) -> QWidget:
        widget = QWidget()
        layout = QVBoxLayout(widget)
        layout.setContentsMargins(24, 20, 24, 20)
        layout.setSpacing(16)

        info = QLabel("🏖️  Leave Calendar")
        info.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        info.setStyleSheet("color: #E2E8F0;")
        layout.addWidget(info)

        cal = QCalendarWidget()
        cal.setStyleSheet("""
            QCalendarWidget {
                background: #1A2332; border-radius: 12px; border: 1px solid #2A3A5C;
            }
            QCalendarWidget QToolButton {
                background: transparent; color: #E2E8F0;
            }
            QCalendarWidget QMenu { background: #1A2332; color: #E2E8F0; }
            QCalendarWidget QSpinBox { background: #1A2332; color: #E2E8F0; }
            QCalendarWidget QAbstractItemView {
                background: #1A2332; color: #E2E8F0;
                selection-background-color: #3B82F6;
            }
        """)
        layout.addWidget(cal)

        # Upcoming leaves
        leaves_frame = QFrame()
        leaves_frame.setStyleSheet("background: #1A2332; border-radius: 12px; border: 1px solid #2A3A5C; padding: 12px;")
        ll = QVBoxLayout(leaves_frame)
        ll.addWidget(QLabel("📅  Upcoming Leaves"))
        for name, leave_type, dates in [
            ("Sunita Verma (HR)", "Annual Leave", "3-5 Sep 2026"),
            ("Vikram Joshi", "Sick Leave", "2 Sep 2026"),
            ("Neha Kapoor", "Casual Leave", "10 Sep 2026"),
        ]:
            row = QFrame()
            row.setStyleSheet("background: #0D1117; border-radius: 6px; padding: 8px;")
            rl = QHBoxLayout(row)
            rl.addWidget(QLabel(f"<span style='color:#E2E8F0'>{name}</span>"))
            rl.addWidget(QLabel(f"<span style='color:#64748B;font-size:10px'>{leave_type}</span>"))
            rl.addWidget(QLabel(f"<span style='color:#F59E0B;font-size:10px'>{dates}</span>"))
            ll.addWidget(row)
        layout.addWidget(leaves_frame)
        layout.addStretch()
        return widget

    def _stat_card(self, icon, value, label) -> QFrame:
        frame = QFrame()
        frame.setStyleSheet("background: transparent;")
        layout = QVBoxLayout(frame)
        layout.setSpacing(4)
        top = QLabel(f"<span style='font-size:24px'>{icon}</span>")
        top.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(top)
        val = QLabel(value)
        val.setFont(QFont("Segoe UI", 18, QFont.Weight.Bold))
        val.setAlignment(Qt.AlignmentFlag.AlignCenter)
        val.setStyleSheet("color: #F1F5F9; background: transparent;")
        layout.addWidget(val)
        lbl = QLabel(label)
        lbl.setFont(QFont("Segoe UI", 9))
        lbl.setAlignment(Qt.AlignmentFlag.AlignCenter)
        lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        layout.addWidget(lbl)
        return frame

"""
sidebar.py — DAS CRM Windows Sidebar Navigation
Implements collapsible sidebar with icons, labels, tooltips, and user profile.
"""
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QPushButton, QToolButton, QFrame, QSizePolicy,
                              QScrollArea)
from PyQt6.QtCore import Qt, QSize, pyqtSignal, QPropertyAnimation, QEasingCurve
from PyQt6.QtGui import QPainter, QColor, QIcon, QPixmap, QFont


class SidebarButton(QPushButton):
    """Individual sidebar navigation button with icon + label."""

    def __init__(self, icon: str, label: str, view_id: str, parent=None):
        super().__init__(parent)
        self.view_id = view_id
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setFixedHeight(44)
        self.setCheckable(True)
        self._is_collapsed = False

        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 0, 12, 0)
        layout.setSpacing(12)

        # Icon label (emoji or text)
        self.icon_label = QLabel(icon, self)
        self.icon_label.setFont(QFont("Segoe UI Emoji", 14))
        self.icon_label.setFixedWidth(28)
        self.icon_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.icon_label)

        # Label
        self.label = QLabel(label, self)
        self.label.setFont(QFont("Segoe UI", 10))
        self.label.setStyleSheet("color: #B0B8C8; background: transparent; border: none;")
        layout.addWidget(self.label)

        self._label_text = label
        self.toggled.connect(self._on_toggle)

    def set_collapsed(self, collapsed: bool):
        self._is_collapsed = collapsed
        if collapsed:
            self.label.hide()
            self.setFixedWidth(60)
            self.setToolTip(self._label_text)
        else:
            self.label.show()
            self.setFixedWidth(200)

    def _on_toggle(self, checked: bool):
        if checked:
            self.setStyleSheet("""
                QPushButton {
                    background: qlineargradient(x1:0,y1:0,x2:1,y2:0, stop:0 #2A3A5C, stop:1 #1A2A4C);
                    border: none;
                    border-radius: 8px;
                    padding-left: 4px;
                }
            """)
            self.icon_label.setStyleSheet("color: #60A5FA; background: transparent;")
        else:
            self.setStyleSheet("""
                QPushButton {
                    background: transparent;
                    border: none;
                    border-radius: 8px;
                }
                QPushButton:hover {
                    background: rgba(255,255,255,0.06);
                }
            """)
            self.icon_label.setStyleSheet("color: #B0B8C8; background: transparent;")


class Sidebar(QFrame):
    """Collapsible sidebar with navigation, collapse toggle, and user profile."""

    view_requested = pyqtSignal(str)  # view_id

    NAV_ITEMS = [
        ("📊", "Dashboard", "dashboard"),
        ("👥", "Leads", "leads"),
        ("🤝", "Deals & Pipeline", "deals"),
        ("📋", "Quotations", "quotations"),
        ("📦", "Products", "products"),
        ("📞", "Contacts", "contacts"),
        ("📈", "Reports", "reports"),
        ("🔧", "Automation", "automation"),
        ("💬", "Communications", "communications"),
        ("👔", "HR & Attendance", "hr"),
        ("🔗", "Integrations", "integrations"),
        ("🛠️", "Admin", "admin"),
    ]

    BOTTOM_ITEMS = [
        ("⚙️", "Settings", "settings"),
        ("❓", "Help", "help"),
    ]

    def __init__(self, parent=None):
        super().__init__(parent)
        self._collapsed = False
        self._active_view = "dashboard"
        self._buttons: dict[str, SidebarButton] = {}
        self._setup_ui()

    def _setup_ui(self):
        self.setFixedWidth(200)
        self.setFrameShape(QFrame.Shape.NoFrame)
        self.setStyleSheet("background: #0F1623; border-right: 1px solid #1E2A3C;")

        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # ── Header ────────────────────────────────────────────────────────
        header = QFrame()
        header.setFixedHeight(64)
        header_layout = QHBoxLayout(header)
        header_layout.setContentsMargins(16, 0, 8, 0)

        self.logo_label = QLabel("🏢", self)
        self.logo_label.setFont(QFont("Segoe UI Emoji", 20))
        self.logo_label.setFixedWidth(40)
        header_layout.addWidget(self.logo_label)

        self.brand_layout = QVBoxLayout()
        self.brand_layout.setSpacing(0)
        self.company_label = QLabel("DAS CRM", self)
        self.company_label.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        self.company_label.setStyleSheet("color: #E2E8F0; background: transparent;")
        self.tenant_label = QLabel("Sales Team", self)
        self.tenant_label.setFont(QFont("Segoe UI", 8))
        self.tenant_label.setStyleSheet("color: #64748B; background: transparent;")
        self.brand_layout.addWidget(self.company_label)
        self.brand_layout.addWidget(self.tenant_label)
        header_layout.addLayout(self.brand_layout)

        header_layout.addStretch()

        self.collapse_btn = QPushButton("◀", self)
        self.collapse_btn.setFixedSize(24, 24)
        self.collapse_btn.setFont(QFont("Segoe UI", 8))
        self.collapse_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.collapse_btn.setStyleSheet("""
            QPushButton {
                background: rgba(255,255,255,0.06);
                border: none;
                border-radius: 4px;
                color: #64748B;
            }
            QPushButton:hover { background: rgba(255,255,255,0.12); color: #E2E8F0; }
        """)
        self.collapse_btn.clicked.connect(self.toggle_collapse)
        header_layout.addWidget(self.collapse_btn)

        main_layout.addWidget(header)

        # ── Separator ────────────────────────────────────────────────────
        sep = QFrame()
        sep.setFrameShape(QFrame.Shape.HLine)
        sep.setStyleSheet("background: #1E2A3C; max-height: 1px;")
        main_layout.addWidget(sep)

        # ── Navigation Scroll Area ──────────────────────────────────────────
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        scroll.setStyleSheet("background: transparent; border: none;")
        scroll.setFrameShape(QFrame.Shape.NoFrame)

        nav_widget = QWidget()
        nav_layout = QVBoxLayout(nav_widget)
        nav_layout.setContentsMargins(8, 12, 8, 12)
        nav_layout.setSpacing(4)
        nav_layout.addStretch()

        for icon, label, vid in self.NAV_ITEMS:
            btn = SidebarButton(icon, label, vid)
            btn.clicked.connect(lambda checked, v=vid: self._on_nav_click(v))
            nav_layout.insertWidget(nav_layout.count() - 1, btn)
            self._buttons[vid] = btn

        nav_layout.addStretch()

        scroll.setWidget(nav_widget)
        main_layout.addWidget(scroll, stretch=1)

        # ── Bottom Items ───────────────────────────────────────────────────
        sep2 = QFrame()
        sep2.setFrameShape(QFrame.Shape.HLine)
        sep2.setStyleSheet("background: #1E2A3C; max-height: 1px;")
        main_layout.addWidget(sep2)

        bottom = QWidget()
        bottom.setFixedHeight(90)
        bottom_layout = QVBoxLayout(bottom)
        bottom_layout.setContentsMargins(8, 8, 8, 8)
        bottom_layout.setSpacing(4)

        for icon, label, vid in self.BOTTOM_ITEMS:
            btn = SidebarButton(icon, label, vid)
            btn.clicked.connect(lambda checked, v=vid: self._on_nav_click(v))
            bottom_layout.addWidget(btn)
            self._buttons[vid] = btn

        main_layout.addWidget(bottom)

        # ── User Profile ──────────────────────────────────────────────────
        user_frame = QFrame()
        user_frame.setFixedHeight(60)
        user_frame.setStyleSheet("background: #0A1020; border-top: 1px solid #1E2A3C;")
        user_layout = QHBoxLayout(user_frame)
        user_layout.setContentsMargins(12, 0, 8, 0)

        self.avatar_label = QLabel("👤", self)
        self.avatar_label.setFont(QFont("Segoe UI Emoji", 16))
        self.avatar_label.setFixedSize(36, 36)
        self.avatar_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        self.avatar_label.setStyleSheet("""
            background: qlineargradient(x1:0,y1:0,x2:1,y2:1, stop:0 #3B82F6, stop:1 #6366F1);
            border-radius: 18px;
        """)
        user_layout.addWidget(self.avatar_label)

        self.user_info_layout = QVBoxLayout()
        self.user_info_layout.setSpacing(0)
        self.user_name_label = QLabel("Rajesh Kumar", self)
        self.user_name_label.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        self.user_name_label.setStyleSheet("color: #E2E8F0; background: transparent;")
        self.user_role_label = QLabel("Sales Rep", self)
        self.user_role_label.setFont(QFont("Segoe UI", 8))
        self.user_role_label.setStyleSheet("color: #64748B; background: transparent;")
        self.user_info_layout.addWidget(self.user_name_label)
        self.user_info_layout.addWidget(self.user_role_label)
        user_layout.addLayout(self.user_info_layout)
        user_layout.addStretch()

        self.logout_btn = QPushButton("🚪", self)
        self.logout_btn.setFixedSize(28, 28)
        self.logout_btn.setFont(QFont("Segoe UI Emoji", 10))
        self.logout_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self.logout_btn.setToolTip("Logout")
        self.logout_btn.setStyleSheet("""
            QPushButton {
                background: transparent;
                border: none;
                border-radius: 4px;
                color: #64748B;
            }
            QPushButton:hover { background: rgba(239,68,68,0.2); color: #EF4444; }
        """)
        user_layout.addWidget(self.logout_btn)

        main_layout.addWidget(user_frame)

        # Set initial active
        self._buttons.get(self._active_view, None).setChecked(True)

    def _on_nav_click(self, view_id: str):
        self._active_view = view_id
        for vid, btn in self._buttons.items():
            btn.blockSignals(True)
            btn.setChecked(vid == view_id)
            btn.blockSignals(False)
        self.view_requested.emit(view_id)

    def set_active(self, view_id: str):
        self._active_view = view_id
        for vid, btn in self._buttons.items():
            btn.blockSignals(True)
            btn.setChecked(vid == view_id)
            btn.blockSignals(False)

    def toggle_collapse(self):
        self._collapsed = not self._collapsed
        if self._collapsed:
            self.setFixedWidth(60)
            self.collapse_btn.setText("▶")
            self.brand_layout.hide()
            self.company_label.hide()
            self.tenant_label.hide()
            self.user_info_layout.hide()
            self.user_name_label.hide()
            self.user_role_label.hide()
            self.avatar_label.setFixedSize(36, 36)
        else:
            self.setFixedWidth(200)
            self.collapse_btn.setText("◀")
            self.brand_layout.show()
            self.company_label.show()
            self.tenant_label.show()
            self.user_info_layout.show()
            self.user_name_label.show()
            self.user_role_label.show()

        for btn in self._buttons.values():
            btn.set_collapsed(self._collapsed)

    def update_user(self, name: str, role: str, tenant: str):
        self.user_name_label.setText(name)
        self.user_role_label.setText(role)
        self.tenant_label.setText(tenant)

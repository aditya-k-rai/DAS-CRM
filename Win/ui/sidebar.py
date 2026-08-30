"""
sidebar.py — DAS CRM Windows Sidebar Navigation
Role-based menu items that change based on logged-in user role.
"""
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QPushButton, QFrame, QScrollArea)
from PyQt6.QtCore import Qt, pyqtSignal, QPropertyAnimation, QEasingCurve
from PyQt6.QtGui import QPainter, QColor, QFont

from core.permissions import (
    NAV_MENU, BOTTOM_MENU, get_visible_nav_items,
    get_visible_bottom_items, get_role_badge_color,
    normalize_role, UserRole
)


class SidebarButton(QPushButton):
    """Individual sidebar navigation button with icon + label."""

    def __init__(self, icon: str, label: str, view_id: str, parent=None):
        super().__init__(parent)
        self.view_id = view_id
        self.setCursor(Qt.CursorShape.PointingHandCursor)
        self.setFixedHeight(44)
        self.setCheckable(True)
        self._is_collapsed = False
        self._icon = icon

        layout = QHBoxLayout(self)
        layout.setContentsMargins(12, 0, 12, 0)
        layout.setSpacing(12)

        self.icon_label = QLabel(icon, self)
        self.icon_label.setFont(QFont("Segoe UI Emoji", 14))
        self.icon_label.setFixedWidth(28)
        self.icon_label.setAlignment(Qt.AlignmentFlag.AlignCenter)
        layout.addWidget(self.icon_label)

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
    """Collapsible sidebar with role-based navigation, collapse toggle, and user profile."""

    view_requested = pyqtSignal(str)  # view_id

    def __init__(self, parent=None):
        super().__init__(parent)
        self._collapsed = False
        self._active_view = "dashboard"
        self._buttons: dict[str, SidebarButton] = {}
        self._user_role = UserRole.ADMIN
        self._nav_items = []
        self._bottom_items = []
        self._setup_ui()

    def _build_nav_widget(self):
        """Rebuild nav buttons from current role's visible items."""
        self._nav_items = get_visible_nav_items(self._user_role)
        self._bottom_items = get_visible_bottom_items(self._user_role)

    def _setup_ui(self):
        self.setFixedWidth(200)
        self.setFrameShape(QFrame.Shape.NoFrame)
        self.setStyleSheet("background: #0F1623; border-right: 1px solid #1E2A3C;")

        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # ── Header ─────────────────────────────────────────────────────────
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

        # Separator
        sep = QFrame()
        sep.setFrameShape(QFrame.Shape.HLine)
        sep.setStyleSheet("background: #1E2A3C; max-height: 1px;")
        main_layout.addWidget(sep)

        # ── Navigation Scroll Area ─────────────────────────────────────────
        self.nav_scroll = QScrollArea()
        self.nav_scroll.setWidgetResizable(True)
        self.nav_scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        self.nav_scroll.setStyleSheet("background: transparent; border: none;")
        self.nav_scroll.setFrameShape(QFrame.Shape.NoFrame)

        self.nav_widget = QWidget()
        self.nav_layout = QVBoxLayout(self.nav_widget)
        self.nav_layout.setContentsMargins(8, 12, 8, 12)
        self.nav_layout.setSpacing(4)

        self._build_nav_widget()
        self._rebuild_nav_buttons()

        self.nav_layout.addStretch()
        self.nav_scroll.setWidget(self.nav_widget)
        main_layout.addWidget(self.nav_scroll, stretch=1)

        # ── Bottom Items ──────────────────────────────────────────────────
        sep2 = QFrame()
        sep2.setFrameShape(QFrame.Shape.HLine)
        sep2.setStyleSheet("background: #1E2A3C; max-height: 1px;")
        main_layout.addWidget(sep2)

        self.bottom_widget = QWidget()
        self.bottom_layout = QVBoxLayout(self.bottom_widget)
        self.bottom_layout.setContentsMargins(8, 8, 8, 8)
        self.bottom_layout.setSpacing(4)

        for item in self._bottom_items:
            btn = SidebarButton(item.icon, item.label, item.view_id)
            btn.clicked.connect(lambda checked, v=item.view_id: self._on_nav_click(v))
            self.bottom_layout.addWidget(btn)
            self._buttons[item.view_id] = btn

        main_layout.addWidget(self.bottom_widget)

        # ── User Profile ─────────────────────────────────────────────────
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

    def _rebuild_nav_buttons(self):
        """Clear and rebuild nav buttons based on current role's visible items."""
        # Remove existing nav buttons
        while self.nav_layout.count():
            item = self.nav_layout.takeAt(0)
            if item.widget() and item.widget() not in (self.nav_widget,):
                item.widget().deleteLater()

        self._buttons.clear()
        for item in self._nav_items:
            btn = SidebarButton(item.icon, item.label, item.view_id)
            btn.clicked.connect(lambda checked, v=item.view_id: self._on_nav_click(v))
            self.nav_layout.insertWidget(self.nav_layout.count() - 1, btn)
            self._buttons[item.view_id] = btn

        # Set active if current view still visible, else first
        if self._active_view not in self._buttons:
            self._active_view = self._nav_items[0].view_id if self._nav_items else "dashboard"

        self.set_active(self._active_view)

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

    def update_user(self, name: str, role: str, tenant: str, role_key: str = "ADMIN"):
        """Update user info and rebuild menus based on role."""
        self._user_role = normalize_role(role_key)

        # Rebuild nav if role changed
        old_nav = [i.view_id for i in self._nav_items]
        self._build_nav_widget()
        new_nav = [i.view_id for i in self._nav_items]

        if old_nav != new_nav:
            self._rebuild_nav_buttons()

        self.user_name_label.setText(name)
        self.user_role_label.setText(role)
        self.tenant_label.setText(tenant)

        # Avatar gradient based on role
        color = get_role_badge_color(role_key)
        self.avatar_label.setStyleSheet(f"""
            background: qlineargradient(x1:0,y1:0,x2:1,y2:1, stop:0 {color}, stop:1 #6366F1);
            border-radius: 18px;
        """)

        # Route to correct default view for role
        from core.permissions import get_default_route
        default = get_default_route(role_key)
        if default in self._buttons:
            self._on_nav_click(default)
        else:
            self._on_nav_click(self._active_view)

    def get_user_role(self) -> str:
        return self._user_role

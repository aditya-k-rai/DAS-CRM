"""
DAS CRM Windows Application - Main Entry Point
Full feature parity with Android and Web frontend.
Role-based authentication, sidebar menus, and routing.
"""
import sys
from pathlib import Path
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QHBoxLayout,
    QStackedWidget, QMessageBox, QLabel, QVBoxLayout
)
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import QStyleFactory

from core.api_client import get_api_client, DASCRMApiClient
from core.sync_engine import get_sync_engine, DASCRMSyncEngine
from core.permissions import (
    normalize_role, get_default_route, can_access_view,
    UserRole, get_demo_profile
)
from ui.sidebar import Sidebar
from ui.login_window import LoginWindow
from ui import views


def _access_denied_widget(reason: str = "You don't have permission to access this section."):
    """Return a simple access-denied placeholder widget."""
    w = QWidget()
    lay = QVBoxLayout(w)
    lay.setAlignment(Qt.AlignmentFlag.AlignCenter)
    icon = QLabel("🔒")
    icon.setFont(QFont("Segoe UI Emoji", 48))
    icon.setAlignment(Qt.AlignmentFlag.AlignCenter)
    title = QLabel("Access Restricted")
    title.setFont(QFont("Segoe UI", 20, QFont.Weight.Bold))
    title.setStyleSheet("color: #EF4444; background: transparent;")
    msg = QLabel(reason)
    msg.setFont(QFont("Segoe UI", 12))
    msg.setStyleSheet("color: #64748B; background: transparent;")
    msg.setAlignment(Qt.AlignmentFlag.AlignCenter)
    msg.setWordWrap(True)
    lay.addWidget(icon)
    lay.addSpacing(12)
    lay.addWidget(title)
    lay.addSpacing(8)
    lay.addWidget(msg)
    return w


class MainWindow(QMainWindow):
    """Main application window with role-based sidebar and full view stack."""

    def __init__(self, user_info: dict):
        super().__init__()

        # Core user data
        self._user = user_info
        self._role_key = user_info.get("role_key", "ADMIN")
        self._norm_role = normalize_role(self._role_key)

        self.setWindowTitle(f"DAS CRM — {user_info.get('name', 'Dashboard')}")
        self.setGeometry(80, 50, 1440, 900)
        self.setMinimumSize(1100, 700)
        self.setStyleSheet("background: #0D1117;")

        # Core services
        self.api_client: DASCRMApiClient = get_api_client()
        self.sync_engine: DASCRMSyncEngine = get_sync_engine()

        # Views
        self._views: dict[str, QWidget] = {}
        self._access_denied_views: dict[str, QWidget] = {}

        # Setup
        self._setup_ui()
        self._setup_dark_theme()

        # Route to default view for this role
        default_view = get_default_route(self._role_key)
        self._navigate_to(default_view)

        self.show()

    # ── View Registry ──────────────────────────────────────────────────────────

    VIEW_MAP = {
        "dashboard":     "DashboardView",
        "leads":         "LeadsView",
        "deals":         "DealsView",
        "quotations":    "QuotationsView",
        "products":      "ProductsView",
        "contacts":      "ContactsView",
        "reports":       "ReportsView",
        "automation":    "AutomationView",
        "communications":"CommunicationsView",
        "hr":            "HRView",
        "integrations":  "IntegrationsView",
        "admin":         "AdminView",
        "settings":      "SettingsView",
        "help":          "HelpView",
    }

    def _view_class(self, view_name: str):
        return getattr(views, view_name, None)

    def _create_view_instance(self, view_key: str):
        """Create a view instance, or an access-denied widget if role not permitted."""
        view_name = self.VIEW_MAP.get(view_key)
        if not view_name:
            return None

        if not can_access_view(self._role_key, view_key):
            return _access_denied_widget(
                f"You need {self._norm_role} or higher role to access this section."
            )

        view_cls = self._view_class(view_name)
        if view_cls is None:
            # Fallback placeholder
            w = QWidget()
            lay = QVBoxLayout(w)
            lay.setAlignment(Qt.AlignmentFlag.AlignCenter)
            lbl = QLabel(f"📋 {view_key.replace('_', ' ').title()}")
            lbl.setFont(QFont("Segoe UI", 18, QFont.Weight.Bold))
            lbl.setStyleSheet("color: #E2E8F0; background: transparent;")
            lay.addWidget(lbl)
            return w

        return view_cls(api_client=self.api_client, sync_engine=self.sync_engine)

    # ── UI Setup ───────────────────────────────────────────────────────────────

    def _setup_dark_theme(self):
        stylesheet = """
            QMainWindow {
                background-color: #0D1117;
                border: none;
            }
            QLabel {
                color: #E2E8F0;
                background: transparent;
            }
            QScrollBar:vertical {
                background: #1A2332;
                width: 8px;
                border-radius: 4px;
            }
            QScrollBar::handle {
                background: #2A3A5C;
                border-radius: 4px;
                min-height: 40px;
            }
            QScrollBar::add-line, QScrollBar::sub-line {
                height: 0px;
            }
            QScrollBar:horizontal {
                background: #1A2332;
                height: 8px;
                border-radius: 4px;
            }
            QScrollBar::handle:horizontal {
                background: #2A3A5C;
                border-radius: 4px;
                min-width: 40px;
            }
            QMenu {
                background: #1A2332;
                color: #E2E8F0;
                border: 1px solid #2A3A5C;
                border-radius: 8px;
            }
            QMenu::item:selected {
                background: #2A3A5C;
            }
            QToolTip {
                background: #1A2332;
                color: #E2E8F0;
                border: 1px solid #2A3A5C;
                border-radius: 4px;
                padding: 4px 8px;
            }
        """
        QApplication.instance().setStyle(QStyleFactory.create('Fusion'))
        QApplication.instance().setStyleSheet(stylesheet)

    def _setup_ui(self):
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QHBoxLayout(central)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # Sidebar
        self.sidebar = Sidebar(self)
        self.sidebar.view_requested.connect(self._on_sidebar_view_requested)
        self.sidebar.logout_btn.clicked.connect(self._logout)
        self.sidebar.update_user(
            name=self._user.get("name", "User"),
            role=self._user.get("role", "Staff"),
            tenant=self._user.get("company_name", "DAS CRM"),
            role_key=self._role_key,
        )
        self.sidebar.setFixedWidth(200)
        main_layout.addWidget(self.sidebar)

        # Content stack
        self.content_stack = QStackedWidget()
        main_layout.addWidget(self.content_stack, 1)

        # Pre-register all views (access-denied for restricted roles)
        for view_key in self.VIEW_MAP.keys():
            view = self._create_view_instance(view_key)
            if view is not None:
                self._views[view_key] = view
                idx = self.content_stack.addWidget(view)
                if can_access_view(self._role_key, view_key):
                    view_instance = view
                else:
                    self._access_denied_views[view_key] = view

    # ── Navigation ────────────────────────────────────────────────────────────

    def _on_sidebar_view_requested(self, view_key: str):
        self._navigate_to(view_key)

    def _navigate_to(self, view_key: str):
        """Switch to the requested view with role-based access check."""
        # Check if user can access this view
        if not can_access_view(self._role_key, view_key):
            view = self._access_denied_views.get(view_key)
            if view is None:
                view = _access_denied_widget(
                    f"Your role ({self._norm_role.replace('_', ' ')}) "
                    f"does not have permission to access this section."
                )
                self._access_denied_views[view_key] = view
                idx = self.content_stack.addWidget(view)

            idx = self.content_stack.indexOf(view)
            self.content_stack.setCurrentIndex(idx)
            return

        view = self._views.get(view_key)
        if view is not None:
            idx = self.content_stack.indexOf(view)
            if idx >= 0:
                self.content_stack.setCurrentIndex(idx)

        if view and hasattr(view, 'refresh'):
            view.refresh()

        self.sidebar.set_active(view_key)

    # ── Logout ───────────────────────────────────────────────────────────────

    def _logout(self):
        reply = QMessageBox.question(
            self, "Logout",
            "Are you sure you want to logout?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if reply == QMessageBox.StandardButton.Yes:
            LoginWindow.LOGGED_IN = None
            self.close()

    def closeEvent(self, event):
        event.accept()


def main():
    """Application entry point."""
    app = QApplication(sys.argv)
    app.setFont(QFont("Segoe UI", 10))
    app.setApplicationName("DAS CRM")
    app.setOrganizationName("DAS CRM")

    # Show login screen first
    login = LoginWindow()
    if login.exec() != LoginWindow.Accepted:
        sys.exit(0)

    user_info = LoginWindow.LOGGED_IN
    if not user_info:
        sys.exit(0)

    # Validate role
    role_key = user_info.get("role_key", "ADMIN")
    norm_role = normalize_role(role_key)
    demo = get_demo_profile(role_key)

    # Merge demo profile defaults (ensures consistent user data)
    final_info = {
        **demo,
        **user_info,  # login info overrides demo defaults
        "role_key": norm_role,
    }

    window = MainWindow(final_info)
    sys.exit(app.exec())


if __name__ == "__main__":
    main()

"""
DAS CRM Windows Application - Main Entry Point
Full feature parity with Android and Web frontend.
"""
import sys
from pathlib import Path
from PyQt6.QtWidgets import (
    QApplication, QMainWindow, QWidget, QHBoxLayout,
    QStackedWidget, QMessageBox
)
from PyQt6.QtCore import Qt, QTimer
from PyQt6.QtGui import QFont
from PyQt6.QtWidgets import QStyleFactory

# Core services
from core.api_client import get_api_client, DASCRMApiClient
from core.sync_engine import get_sync_engine, DASCRMSyncEngine

# UI components
from ui.sidebar import Sidebar
from ui import views


class MainWindow(QMainWindow):
    """Main application window with collapsible sidebar and full view stack."""

    VIEW_MAP = {
        "dashboard": "DashboardView",
        "leads": "LeadsView",
        "deals": "DealsView",
        "quotations": "QuotationsView",
        "products": "ProductsView",
        "contacts": "ContactsView",
        "reports": "ReportsView",
        "automation": "AutomationView",
        "communications": "CommunicationsView",
        "hr": "HRView",
        "integrations": "IntegrationsView",
        "admin": "AdminView",
        "settings": "SettingsView",
        "help": "HelpView",
    }

    def __init__(self):
        super().__init__()
        self.setWindowTitle("DAS CRM — Desktop Application")
        self.setGeometry(100, 100, 1400, 900)

        # Core services
        self.api_client: DASCRMApiClient = get_api_client()
        self.sync_engine: DASCRMSyncEngine = get_sync_engine()

        # Setup dark theme
        self._setup_dark_theme()

        # Build UI
        self._setup_ui()

        # Show dashboard by default
        self._show_view("dashboard")

        # Display pacing — FPS counter update
        self._fps_timer = QTimer(self)
        self._fps_timer.timeout.connect(self._update_status_bar)
        self._fps_timer.start(5000)

        self.show()

    def _setup_dark_theme(self):
        """Apply global dark theme."""
        stylesheet = """
            QMainWindow { background-color: #0D1117; }
            QLabel { color: #E2E8F0; background: transparent; }
            QScrollBar:vertical {
                background: #1A2332; width: 8px; border-radius: 4px;
            }
            QScrollBar::handle {
                background: #2A3A5C; border-radius: 4px; min-height: 40px;
            }
            QScrollBar::add-line, QScrollBar::sub-line { height: 0px; }
            QScrollBar:horizontal {
                background: #1A2332; height: 8px; border-radius: 4px;
            }
            QScrollBar::handle:horizontal {
                background: #2A3A5C; border-radius: 4px; min-width: 40px;
            }
            QMenu {
                background: #1A2332; color: #E2E8F0;
                border: 1px solid #2A3A5C; border-radius: 8px;
            }
            QMenu::item:selected { background: #2A3A5C; }
            QToolTip {
                background: #1A2332; color: #E2E8F0;
                border: 1px solid #2A3A5C; border-radius: 4px;
                padding: 4px 8px;
            }
        """
        QApplication.instance().setStyle(QStyleFactory.create('Fusion'))
        QApplication.instance().setStyleSheet(stylesheet)

    def _setup_ui(self):
        """Build the sidebar + stacked view layout."""
        central = QWidget()
        self.setCentralWidget(central)
        main_layout = QHBoxLayout(central)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # Sidebar
        self.sidebar = Sidebar(self)
        self.sidebar.view_requested.connect(self._on_sidebar_view_requested)
        self.sidebar.setMinimumWidth(60)
        self.sidebar.setMaximumWidth(240)
        main_layout.addWidget(self.sidebar)

        # Content stack
        self.content_stack = QStackedWidget()
        main_layout.addWidget(self.content_stack, 1)

        # Instantiate all views and add them to the stack
        self._views = {}
        for view_key, view_name in self.VIEW_MAP.items():
            view_cls = getattr(views, view_name, None)
            if view_cls is None:
                continue
            view_instance = view_cls(
                api_client=self.api_client,
                sync_engine=self.sync_engine
            )
            self._views[view_key] = view_instance
            self.content_stack.addWidget(view_instance)

    def _on_sidebar_view_requested(self, view_key: str):
        """Handle sidebar navigation signal."""
        self._show_view(view_key)

    def _show_view(self, view_key: str):
        """Switch to the requested view."""
        view = self._views.get(view_key)
        if view is not None:
            idx = self.content_stack.indexOf(view)
            if idx >= 0:
                self.content_stack.setCurrentIndex(idx)
        # Refresh the view if it has a refresh method
        if view and hasattr(view, 'refresh'):
            view.refresh()

    def _update_status_bar(self):
        """Update status bar / periodic tasks."""
        pass

    def closeEvent(self, event):
        """Graceful shutdown."""
        reply = QMessageBox.question(
            self, "Exit",
            "Are you sure you want to exit DAS CRM?",
            QMessageBox.StandardButton.Yes | QMessageBox.StandardButton.No
        )
        if reply == QMessageBox.StandardButton.Yes:
            # Sync pending data before exit
            if hasattr(self, 'sync_engine'):
                pass  # sync_engine will auto-flush on shutdown
            event.accept()
        else:
            event.ignore()


def main():
    """Application entry point."""
    app = QApplication(sys.argv)
    app.setFont(QFont("Segoe UI", 10))
    app.setApplicationName("DAS CRM")
    app.setOrganizationName("DAS CRM")

    window = MainWindow()
    sys.exit(app.exec())


if __name__ == "__main__":
    main()

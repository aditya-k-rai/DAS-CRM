"""
DAS CRM Windows Application - Placeholder UI Views
Leads, Deals, Contacts, Products, Quotations, Reports, Bulk Ingestion, Admin, and Additional views.
"""

from PyQt6.QtWidgets import QWidget, QVBoxLayout, QLabel
from PyQt6.QtGui import QFont


class LeadsView(QWidget):
    """Leads management view."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        title = QLabel("Leads Engine")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)
        layout.addStretch()


class DealsView(QWidget):
    """Deals pipeline Kanban view."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        title = QLabel("Deals & Pipeline")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)
        layout.addStretch()


class ContactsView(QWidget):
    """Contacts directory view."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        title = QLabel("Contacts Directory")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)
        layout.addStretch()


class ProductsView(QWidget):
    """Products catalog view."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        title = QLabel("Products Catalog")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)
        layout.addStretch()


class QuotationsView(QWidget):
    """Quotations and invoices view."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        title = QLabel("Quotations & Invoices")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)
        layout.addStretch()


class ReportsView(QWidget):
    """Analytics and reports view."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        title = QLabel("Analytics & Reports")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)
        layout.addStretch()


class BulkIngestionView(QWidget):
    """Bulk CSV import view."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        title = QLabel("Bulk Ingestion")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)
        layout.addStretch()


class AdminView(QWidget):
    """Admin and RBAC governance view."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        title = QLabel("Admin & RBAC")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)
        layout.addStretch()


class TasksView(QWidget):
    """Tasks and follow-ups view."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        title = QLabel("Tasks & Follow-ups")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)
        layout.addStretch()


class HRView(QWidget):
    """HR and attendance view."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        title = QLabel("HR & Attendance")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)
        layout.addStretch()


class AutomationsView(QWidget):
    """Automations engine view."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        title = QLabel("Automations")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)
        layout.addStretch()


class CommsView(QWidget):
    """WhatsApp and communications view."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        title = QLabel("WhatsApp & Comms")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)
        layout.addStretch()


class SettingsView(QWidget):
    """Application settings view."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        title = QLabel("Settings")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)
        layout.addStretch()

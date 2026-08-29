"""
views.py — DAS CRM Windows Views Package
Imports all view classes from submodules for clean import in main.py.
"""
from .views_dashboard import DashboardView
from .views_leads import LeadsView
from .views_deals import DealsView
from .views_quotations import QuotationsView
from .views_products import ProductsView
from .views_contacts import ContactsView
from .views_reports import ReportsView
from .views_automation import AutomationView
from .views_communications import CommunicationsView
from .views_hr import HRView
from .views_integrations import IntegrationsView
from .views_admin import AdminView
from .views_settings import SettingsView
from .views_help import HelpView
from .views_add_company import AddCompanyDialog
from .views_add_party import AddPartyDialog
from .views_create_quotation import CreateQuotationDialog

__all__ = [
    'DashboardView',
    'LeadsView',
    'DealsView',
    'QuotationsView',
    'ProductsView',
    'ContactsView',
    'ReportsView',
    'AutomationView',
    'CommunicationsView',
    'HRView',
    'IntegrationsView',
    'AdminView',
    'SettingsView',
    'HelpView',
    'AddCompanyDialog',
    'AddPartyDialog',
    'CreateQuotationDialog',
]

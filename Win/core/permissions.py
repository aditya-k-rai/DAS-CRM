"""
core/permissions.py — DAS CRM Windows Role-Based Access Control
Mirrors android/src/store/authStore.ts permissions logic.
"""
from dataclasses import dataclass
from typing import Optional


# ─── Role Definitions ───────────────────────────────────────────────────────────

class UserRole:
    ADMIN = "ADMIN"
    HR = "HR"
    MANAGER = "MANAGER"
    TEAM_LEADER = "TEAM_LEADER"
    SALES_EXEC = "SALES_EXEC"

    ALL = [ADMIN, HR, MANAGER, TEAM_LEADER, SALES_EXEC]


# ─── Demo User Profiles ────────────────────────────────────────────────────────

DEMO_PROFILES = {
    UserRole.ADMIN: {
        "id": "usr_admin",
        "name": "Vikram Singh",
        "role": "Tenant Admin",
        "role_key": UserRole.ADMIN,
        "email": "vikram.admin@acme.com",
        "company_name": "Acme Sales Solutions",
        "company_id": "comp_acme",
        "avatar_initials": "VS",
    },
    UserRole.HR: {
        "id": "usr_hr",
        "name": "Sunita Verma",
        "role": "HR Manager",
        "role_key": UserRole.HR,
        "email": "sunita.hr@acme.com",
        "company_name": "Acme Sales Solutions",
        "company_id": "comp_acme",
        "avatar_initials": "SV",
    },
    UserRole.MANAGER: {
        "id": "usr_mgr",
        "name": "Rajesh Mehta",
        "role": "Department Manager",
        "role_key": UserRole.MANAGER,
        "email": "rajesh.mgr@acme.com",
        "company_name": "Acme Sales Solutions",
        "company_id": "comp_acme",
        "avatar_initials": "RM",
    },
    UserRole.TEAM_LEADER: {
        "id": "usr_tl",
        "name": "Amit Shah",
        "role": "Team Leader",
        "role_key": UserRole.TEAM_LEADER,
        "email": "amit.tl@acme.com",
        "company_name": "Acme Sales Solutions",
        "company_id": "comp_acme",
        "avatar_initials": "AS",
    },
    UserRole.SALES_EXEC: {
        "id": "usr_rep",
        "name": "Rajesh Kumar",
        "role": "Sales Executive",
        "role_key": UserRole.SALES_EXEC,
        "email": "rajesh.rep@acme.com",
        "company_name": "Acme Sales Solutions",
        "company_id": "comp_acme",
        "avatar_initials": "RK",
    },
}

# ─── Role → Default Dashboard Route ────────────────────────────────────────────

ROLE_DASHBOARD_ROUTE = {
    UserRole.ADMIN:      "dashboard",
    UserRole.HR:         "hr",
    UserRole.MANAGER:    "dashboard",
    UserRole.TEAM_LEADER:"dashboard",
    UserRole.SALES_EXEC: "dashboard",
}


def normalize_role(role_str: Optional[str]) -> str:
    """Normalize a role string to a canonical UserRole value."""
    if not role_str:
        return UserRole.ADMIN
    r = str(role_str).strip().upper()
    if r in ("ADMIN", "TENANT_ADMIN", "OWNER", "COMPANY_ADMIN"):
        return UserRole.ADMIN
    if r in ("HR", "HR_MANAGER", "HUMAN_RESOURCES", "HR_ADMIN", "HR_EXEC"):
        return UserRole.HR
    if r in ("MANAGER", "DEPT_MANAGER", "SALES_MANAGER"):
        return UserRole.MANAGER
    if r in ("TEAM_LEADER", "TL", "LEAD"):
        return UserRole.TEAM_LEADER
    if r in ("SALES_EXEC", "EMPLOYEE", "STAFF", "REP", "EXECUTIVE",
             "SALES_REP", "SALES", "USER", "VIEWER"):
        return UserRole.SALES_EXEC
    return UserRole.ADMIN


def infer_role_from_email(email: str) -> Optional[str]:
    """Infer role from email address pattern."""
    if not email:
        return None
    e = email.lower().strip()
    if ".hr" in e or "hr.manager" in e or "@hr." in e or e.startswith("hr."):
        return UserRole.HR
    if ".mgr" in e or ".manager" in e or "-mgr" in e or "@mgr." in e:
        return UserRole.MANAGER
    if ".tl" in e or ".team" in e or "-tl" in e or "@tl." in e or "lead@" in e:
        return UserRole.TEAM_LEADER
    if ".rep" in e or ".exec" in e or "-rep" in e or ".sales" in e or "sales@" in e:
        return UserRole.SALES_EXEC
    if ".admin" in e or "admin@" in e or "owner@" in e or "superadmin" in e:
        return UserRole.ADMIN
    return None


def get_demo_profile(role_key: str) -> dict:
    """Get the demo profile for a normalized role."""
    norm = normalize_role(role_key)
    return DEMO_PROFILES.get(norm, DEMO_PROFILES[UserRole.ADMIN])


def get_default_route(role_key: str) -> str:
    """Get the default dashboard route for a normalized role."""
    norm = normalize_role(role_key)
    return ROLE_DASHBOARD_ROUTE.get(norm, "dashboard")


# ─── Feature Flags (Company Subscription) ──────────────────────────────────────

@dataclass
class CompanyFeatures:
    whats_app: bool = False
    email_automation: bool = False
    ai_lead_scoring: bool = True
    custom_salary_builder: bool = True
    export_csv: bool = True


@dataclass
class CompanySubscription:
    plan_type: str = "FREE_TRIAL"
    trial_days_left: int = 14
    is_expired: bool = False
    user_seats_allocated: int = 6
    user_seats_used: int = 4
    has_team_leaders: bool = True
    features: CompanyFeatures = None

    def __post_init__(self):
        if self.features is None:
            self.features = CompanyFeatures()


DEFAULT_SUBSCRIPTION = CompanySubscription()


# ─── Role → Allowed Menu Items ─────────────────────────────────────────────────

@dataclass
class MenuItem:
    icon: str
    label: str
    view_id: str
    min_role: str  # minimum role to see this item (higher = more restricted)

    @property
    def min_role_level(self) -> int:
        """Role hierarchy level: higher = more privileged."""
        levels = {
            UserRole.SALES_EXEC:  1,
            UserRole.TEAM_LEADER: 2,
            UserRole.MANAGER:     3,
            UserRole.HR:          3,
            UserRole.ADMIN:       4,
        }
        return levels.get(self.min_role, 1)

    def is_visible_to(self, user_role: str) -> bool:
        """Is this menu item visible to a user with user_role?"""
        user_level = levels_map().get(normalize_role(user_role), 1)
        return user_level >= self.min_role_level


def levels_map() -> dict:
    return {
        UserRole.SALES_EXEC:  1,
        UserRole.TEAM_LEADER: 2,
        UserRole.MANAGER:     3,
        UserRole.HR:          3,
        UserRole.ADMIN:       4,
    }


# All navigation items with their minimum role
NAV_MENU = [
    MenuItem("📊", "Dashboard",       "dashboard",        UserRole.SALES_EXEC),
    MenuItem("👥", "Leads",           "leads",            UserRole.SALES_EXEC),
    MenuItem("🤝", "Deals & Pipeline","deals",            UserRole.SALES_EXEC),
    MenuItem("📋", "Quotations",      "quotations",      UserRole.SALES_EXEC),
    MenuItem("📦", "Products",        "products",         UserRole.SALES_EXEC),
    MenuItem("📞", "Contacts",        "contacts",         UserRole.SALES_EXEC),
    MenuItem("📈", "Reports",        "reports",          UserRole.MANAGER),
    MenuItem("🔧", "Automation",      "automation",      UserRole.ADMIN),
    MenuItem("💬", "Communications",  "communications",   UserRole.ADMIN),
    MenuItem("👔", "HR & Attendance","hr",               UserRole.HR),
    MenuItem("🔗", "Integrations",    "integrations",     UserRole.ADMIN),
    MenuItem("🛠️", "Admin",          "admin",            UserRole.ADMIN),
]

BOTTOM_MENU = [
    MenuItem("⚙️", "Settings",        "settings",         UserRole.SALES_EXEC),
    MenuItem("❓", "Help",           "help",             UserRole.SALES_EXEC),
]


def get_visible_nav_items(user_role: str) -> list[MenuItem]:
    """Return nav items visible to the given role."""
    return [item for item in NAV_MENU if item.is_visible_to(user_role)]


def get_visible_bottom_items(user_role: str) -> list[MenuItem]:
    """Return bottom items visible to the given role."""
    return [item for item in BOTTOM_MENU if item.is_visible_to(user_role)]


# ─── Admin-only view IDs ───────────────────────────────────────────────────────

ADMIN_ONLY_VIEWS = {"admin", "integrations", "automation", "communications"}
HR_ONLY_VIEWS = {"hr"}
REPORTS_VIEWS = {"reports"}

REPORTS_MIN_ROLE_LEVEL = 3   # MANAGER, HR, ADMIN, SUPER_ADMIN


def can_access_view(user_role: str, view_id: str) -> bool:
    """Check if user role can access a specific view."""
    norm = normalize_role(user_role)
    level = levels_map().get(norm, 1)

    if view_id in ADMIN_ONLY_VIEWS:
        return level >= 4   # ADMIN only
    if view_id in HR_ONLY_VIEWS:
        return level >= 3   # MANAGER, HR, ADMIN
    if view_id in REPORTS_VIEWS:
        return level >= 3   # MANAGER, HR, ADMIN
    # All other views are accessible to all logged-in users
    return True


def can_edit(user_role: str) -> bool:
    """Can the user edit records?"""
    norm = normalize_role(user_role)
    # All roles except SALES_EXEC can edit
    return norm != UserRole.SALES_EXEC


def get_role_badge_color(role_key: str) -> str:
    """Return a color for the role badge."""
    colors = {
        UserRole.ADMIN:      "#3B82F6",  # blue
        UserRole.HR:         "#10B981",  # green
        UserRole.MANAGER:    "#F59E0B",  # amber
        UserRole.TEAM_LEADER:"#6366F1",  # indigo
        UserRole.SALES_EXEC: "#64748B",  # slate
    }
    return colors.get(normalize_role(role_key), "#64748B")

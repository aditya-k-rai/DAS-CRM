"""
login_window.py — DAS CRM Windows Login
Mirrors frontend-web/components/auth/LoginGateway.tsx and android/src/screens/LoginScreen.tsx
Supports: Workspace Entry (role + company key + email/pass) and Staff Invite Key registration.
"""
import re
import os
from PyQt6.QtWidgets import (
    QDialog, QVBoxLayout, QHBoxLayout, QLabel, QLineEdit,
    QPushButton, QCheckBox, QFrame, QWidget, QScrollArea,
    QComboBox, QMessageBox
)
from PyQt6.QtCore import Qt, QTimer, QRectF
from PyQt6.QtGui import QFont, QPainter, QLinearGradient, QRadialGradient, QColor, QPainterPath, QPen, QBrush


# ─── Constants ──────────────────────────────────────────────────────────────────

DEMO_USERS = {
    "ADMIN":        {"name": "Vikram Patel",   "role": "Admin",        "email": "vikram.admin@acme.com"},
    "HR":           {"name": "Sunita Devi",     "role": "HR",           "email": "sunita.hr@acme.com"},
    "MANAGER":      {"name": "Rajesh Kumar",   "role": "Manager",      "email": "rajesh.mgr@acme.com"},
    "TEAM_LEADER":  {"name": "Amit Shah",     "role": "Team Leader",  "email": "amit.tl@acme.com"},
    "SALES_EXEC":   {"name": "Rakesh Verma",   "role": "Sales Exec",   "email": "rajesh.rep@acme.com"},
    "SUPER_ADMIN":  {"name": "Aditya Singh",  "role": "Super Admin",  "email": "adtyamighty@gmail.com"},
}

ROLE_EMAILS = {
    "ADMIN":        "vikram.admin@acme.com",
    "HR":           "sunita.hr@acme.com",
    "MANAGER":      "rajesh.mgr@acme.com",
    "TEAM_LEADER":  "amit.tl@acme.com",
    "SALES_EXEC":   "rajesh.rep@acme.com",
}

ALL_ROLES = list(ROLE_EMAILS.keys())

PUBLIC_COMPANIES = [
    {"id": "comp_1", "name": "Acme Sales Solutions"},
    {"id": "comp_2", "name": "Sunita Real Estate Ltd"},
    {"id": "comp_3", "name": "Lakshmi Auto Dealerships"},
    {"id": "comp_4", "name": "TechCorp Enterprise"},
]


def infer_role_from_email(email: str):
    """Infer role from email pattern (mirrors authStore inferRoleFromEmail)."""
    e = email.lower()
    if ".admin" in e or ".super" in e or e.startswith("admin") or "superadmin" in e:
        return "ADMIN"
    if ".hr" in e or ".hr@" in e or e.startswith("hr") or "-hr" in e:
        return "HR"
    if ".mgr" in e or ".manager" in e or "-mgr" in e or "manager" in e:
        return "MANAGER"
    if ".tl" in e or ".team" in e or "-tl" in e or "lead" in e:
        return "TEAM_LEADER"
    if ".rep" in e or ".exec" in e or "-rep" in e or ".sales" in e:
        return "SALES_EXEC"
    return "ADMIN"


def format_company_key(raw: str) -> str:
    """Format company key as ACME-KX-7421."""
    clean = re.sub(r'[^a-zA-Z0-9]', '', raw).upper()
    part1 = ''
    part2 = ''
    part3 = ''
    for ch in clean:
        if len(part1) < 4 and ch.isalpha():
            part1 += ch
        elif len(part1) == 4 and len(part2) < 2 and ch.isalpha():
            part2 += ch
        elif ch.isdigit():
            if len(part3) < 4:
                part3 += ch
    result = part1
    if len(part1) == 4:
        result += '-'
        if part2:
            result += part2
            if len(part2) == 2:
                result += '-'
                if part3:
                    result += part3
    return result


def validate_email_role_match(email: str, selected_role: str):
    """Check if email matches selected role (mirrors authStore validateEmailRoleMatch)."""
    inferred = infer_role_from_email(email)
    if inferred == selected_role:
        return {"valid": True}
    return {"valid": False, "expectedRole": inferred}


# ─── Styles ────────────────────────────────────────────────────────────────────

BASE_CSS = """
QWidget {
    background: transparent;
    font-family: 'Segoe UI', sans-serif;
}
"""

PANEL_CSS = """
QFrame#gatewayPanel {
    background: #0B1120;
    border: 1px solid #1E293B;
    border-radius: 20px;
}
"""

FORM_CARD_CSS = """
QFrame#formCard {
    background: #0B1120;
    border: 1px solid #1E293B;
    border-radius: 20px;
    padding: 0px;
}
QFrame#formCard:active {
    border-color: #4F46E5;
}
"""

ROLE_BTN_CSS = """
QPushButton#roleBtn {
    background: #020617;
    border: 1px solid #1E293B;
    border-radius: 10px;
    padding: 6px 10px;
    color: #94A3B8;
    font-size: 11px;
    font-weight: bold;
}
QPushButton#roleBtn:hover {
    background: #0F172A;
    color: #E2E8F0;
}
QPushButton#roleBtn:checked {
    background: rgba(99, 102, 241, 0.25);
    border: 1px solid #6366F1;
    color: #818CF8;
}
"""

GATEWAY_BTN_CSS = """
QPushButton#gatewayBtn {
    background: #020617;
    border: 1px solid #1E293B;
    border-radius: 14px;
    padding: 12px 14px;
    color: #94A3B8;
    text-align: left;
}
QPushButton#gatewayBtn:hover {
    background: #0F172A;
    color: #E2E8F0;
}
QPushButton#gatewayBtn:checked {
    background: rgba(99, 102, 241, 0.20);
    border: 1px solid #6366F1;
    color: #A5B4FC;
}
"""

INPUT_CSS = """
QLineEdit {
    background: #020617;
    border: 1px solid #1E293B;
    border-radius: 12px;
    padding: 10px 14px;
    color: #F8FAFC;
    font-size: 13px;
}
QLineEdit:focus {
    border: 1px solid #6366F1;
    background: #0A0F1E;
}
QLineEdit::placeholder {
    color: #475569;
}
"""

MONO_INPUT_CSS = """
QLineEdit#monoInput {
    background: #020617;
    border: 1px solid #1E293B;
    border-radius: 12px;
    padding: 10px 14px;
    color: #C084FC;
    font-family: 'Consolas', 'Courier New', monospace;
    font-size: 13px;
    font-weight: bold;
    letter-spacing: 1.5px;
}
QLineEdit#monoInput:focus {
    border: 1px solid #6366F1;
    background: #0A0F1E;
}
QLineEdit#monoInput::placeholder {
    color: #475569;
    font-weight: normal;
    letter-spacing: normal;
}
"""

COMBO_CSS = """
QComboBox {
    background: #020617;
    border: 1px solid #1E293B;
    border-radius: 12px;
    padding: 10px 14px;
    color: #F8FAFC;
    font-size: 13px;
}
QComboBox:focus {
    border: 1px solid #6366F1;
}
QComboBox::dropDown {
    border: none;
    width: 30px;
}
QComboBox::downArrow {
    image: none;
    border-left: 5px solid transparent;
    border-right: 5px solid transparent;
    border-top: 5px solid #64748B;
    margin-right: 10px;
}
QComboBox QAbstractItemView {
    background: #0B1120;
    border: 1px solid #1E293B;
    border-radius: 10px;
    color: #F8FAFC;
    selection-background-color: #1E293B;
    padding: 6px;
}
"""

BTN_PRIMARY_CSS = """
QPushButton#btnPrimary {
    background: qlineargradient(x1:0,y1:0,x2:1,y2:0, stop:0 #4F46E5, stop:1 #8B5CF6);
    border: none;
    border-radius: 12px;
    padding: 13px;
    color: white;
    font-size: 13px;
    font-weight: bold;
}
QPushButton#btnPrimary:hover {
    background: qlineargradient(x1:0,y1:0,x2:1,y2:0, stop:0 #4338CA, stop:1 #7C3AED);
}
QPushButton#btnPrimary:disabled {
    opacity: 0.5;
}
"""

BTN_GOOGLE_CSS = """
QPushButton#btnGoogle {
    background: #020617;
    border: 1px solid #1E293B;
    border-radius: 12px;
    padding: 11px;
    color: #F8FAFC;
    font-size: 12px;
    font-weight: 600;
}
QPushButton#btnGoogle:hover {
    background: #0F172A;
    border-color: #334155;
}
"""

BTN_VALIDATE_CSS = """
QPushButton#btnValidate {
    background: rgba(16, 185, 129, 0.20);
    border: 1px solid rgba(16, 185, 129, 0.30);
    border-radius: 12px;
    padding: 0px 14px;
    color: #6EE7B7;
    font-size: 12px;
    font-weight: bold;
}
QPushButton#btnValidate:hover {
    background: rgba(16, 185, 129, 0.30);
}
"""

FORGOT_CSS = """
QPushButton#btnForgot {
    background: transparent;
    border: none;
    color: #818CF8;
    font-size: 11px;
    font-weight: 600;
    text-decoration: underline;
}
QPushButton#btnForgot:hover {
    color: #A5B4FC;
}
"""

ENTRY_TAG_CSS = """
QLabel#entryTag {
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.30);
    border-radius: 999px;
    padding: 3px 10px;
    font-size: 9px;
    font-weight: 800;
    color: #A5B4FC;
}
QLabel#entryTagGreen {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.30);
    border-radius: 999px;
    padding: 3px 10px;
    font-size: 9px;
    font-weight: 800;
    color: #6EE7B7;
}
"""

BANNER_CSS = """
QFrame#errorBanner {
    background: rgba(239, 68, 68, 0.15);
    border: 1px solid rgba(239, 68, 68, 0.40);
    border-radius: 10px;
    padding: 10px;
}
QLabel#errorText {
    color: #FCA5A5;
    font-size: 12px;
    font-weight: 600;
}
QFrame#successBanner {
    background: rgba(16, 185, 129, 0.15);
    border: 1px solid rgba(16, 185, 129, 0.40);
    border-radius: 10px;
    padding: 10px;
}
QLabel#successText {
    color: #6EE7B7;
    font-size: 12px;
    font-weight: 600;
}
"""

REGISTER_BTN_CSS = """
QPushButton#registerBtn {
    background: rgba(99, 102, 241, 0.15);
    border: 1px solid rgba(99, 102, 241, 0.30);
    border-radius: 12px;
    padding: 10px 16px;
    color: #A5B4FC;
    font-size: 12px;
    font-weight: 700;
}
QPushButton#registerBtn:hover {
    background: rgba(99, 102, 241, 0.25);
}
"""


# ─── Helpers ────────────────────────────────────────────────────────────────────

def _input(placeholder="", mono=False):
    le = QLineEdit()
    le.setPlaceholderText(placeholder)
    le.setFixedHeight(42)
    le.setFont(QFont("Segoe UI", 13))
    if mono:
        le.setObjectName("monoInput")
    le.setStyleSheet(MONO_INPUT_CSS if mono else INPUT_CSS)
    return le


def _label(text, color="#94A3B8", size=11, bold=True, css_class=""):
    lbl = QLabel(text)
    lbl.setFont(QFont("Segoe UI", size, QFont.Weight.Bold if bold else QFont.Weight.Normal))
    lbl.setStyleSheet(f"color: {color}; background: transparent;")
    return lbl


def _banner(msg, is_error=True):
    frame = QFrame()
    frame.setObjectName("errorBanner" if is_error else "successBanner")
    frame.setStyleSheet(BANNER_CSS)
    frame.setFixedHeight(38)
    lay = QHBoxLayout(frame)
    lay.setContentsMargins(10, 0, 10, 0)
    lbl = QLabel(f"⚠️  {msg}" if is_error else f"✓  {msg}")
    lbl.setObjectName("errorText" if is_error else "successText")
    lbl.setStyleSheet(BANNER_CSS)
    lbl.setWordWrap(True)
    lay.addWidget(lbl)
    return frame


# ─── Animated Gradient Banner (left panel) ──────────────────────────────────────

class GradientBanner(QWidget):
    """Animated gradient orb banner on the left panel."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setFixedWidth(360)
        self._phase = 0.0
        self._timer = QTimer(self)
        self._timer.timeout.connect(self._animate)
        self._timer.start(50)

    def _animate(self):
        self._phase = (self._phase + 0.004) % 1.0
        self.update()

    def paintEvent(self, event):
        painter = QPainter(self)
        painter.setRenderHint(QPainter.RenderHint.Antialiasing)

        grad = QLinearGradient(0, 0, self.width(), self.height())
        grad.setColorAt(0, QColor("#060810"))
        grad.setColorAt(0.4, QColor("#0B1120"))
        grad.setColorAt(0.7, QColor("#0A0F1E"))
        grad.setColorAt(1, QColor("#060810"))
        painter.fillRect(self.rect(), grad)

        # Moving orb
        cx = int(self.width() * (0.45 + 0.25 * (0.5 - abs(self._phase - 0.5))))
        cy = int(self.height() * 0.5)
        orb = QRadialGradient(cx, cy, 200)
        orb.setColorAt(0, QColor("#4338CA"))
        orb.setColorAt(0.4, QColor("#6366F1"))
        orb.setColorAt(1, QColor("#00000000"))
        painter.fillRect(self.rect(), orb)

        # Second accent orb
        cx2 = int(self.width() * 0.75)
        cy2 = int(self.height() * 0.35)
        orb2 = QRadialGradient(cx2, cy2, 120)
        orb2.setColorAt(0, QColor("#8B5CF6"))
        orb2.setColorAt(0.5, QColor("#7C3AED"))
        orb2.setColorAt(1, QColor("#00000000"))
        painter.fillRect(self.rect(), orb2)

        # DAS CRM text
        p = QPainter(self)
        p.setPen(QColor("#FFFFFF"))
        p.setFont(QFont("Segoe UI", 28, QFont.Weight.Bold))
        p.drawText(self.rect().adjusted(28, 0, -28, -24),
                   Qt.AlignmentFlag.AlignCenter, "🏢 DAS CRM")

        # Sub text
        p.setPen(QColor("#64748B"))
        p.setFont(QFont("Segoe UI", 11))
        p.drawText(self.rect().adjusted(28, 60, -28, -20),
                   Qt.AlignmentFlag.AlignCenter, "Enterprise Sales Solutions")


# ─── Main Login Window ─────────────────────────────────────────────────────────

class LoginWindow(QDialog):
    """Role-based login — mirrors Android LoginScreen and web LoginGateway."""

    LOGGED_IN = None  # Holds user dict after successful login

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("DAS CRM — Sign In")
        self.setStyleSheet(BASE_CSS)
        self.setFixedSize(960, 600)
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint)
        self._dragging = False
        self._drag_pos = None
        self._shake_offset = 0

        # State
        self._entry_point = "workspace"   # "workspace" | "staff_key"
        self._selected_role = "ADMIN"
        self._selected_company_idx = 0
        self._company_key = "ACME-KX-7421"
        self._email = "vikram.admin@acme.com"
        self._password = "password123"
        self._loading = False
        self._error_msg = None
        self._success_msg = None

        # Staff key state
        self._user_key = ""
        self._staff_name = ""
        self._staff_email = ""
        self._staff_password = ""
        self._key_valid = False
        self._key_validating = False

        # Forgot password state
        self._forgot_open = False
        self._forgot_email = ""
        self._forgot_otp = ""
        self._new_password = ""
        self._forgot_step = "email"

        self._build_ui()

    # ── UI Construction ──────────────────────────────────────────────────────

    def _build_ui(self):
        main_layout = QHBoxLayout(self)
        main_layout.setContentsMargins(0, 0, 0, 0)
        main_layout.setSpacing(0)

        # Left: Animated gradient panel
        self.banner = GradientBanner()
        main_layout.addWidget(self.banner)

        # Right: content
        right = QFrame()
        right.setStyleSheet("background: #0D1117;")
        right_layout = QVBoxLayout(right)
        right_layout.setContentsMargins(0, 0, 0, 0)
        right_layout.setSpacing(0)

        # Custom title bar
        title_bar = self._build_title_bar()
        right_layout.addWidget(title_bar)

        # Body (scrollable)
        scroll = QScrollArea()
        scroll.setWidgetResizable(True)
        scroll.setHorizontalScrollBarPolicy(Qt.ScrollBarPolicy.ScrollBarAlwaysOff)
        scroll.setStyleSheet("QScrollArea { background: #0D1117; border: none; }")
        scroll_container = QWidget()
        scroll_layout = QVBoxLayout(scroll_container)
        scroll_layout.setContentsMargins(32, 8, 32, 24)
        scroll_layout.setSpacing(0)

        # Gateway switcher + Form in a 2-column row
        content_row = QHBoxLayout()
        content_row.setSpacing(16)
        content_row.setContentsMargins(0, 0, 0, 0)

        # Left column: gateway panel
        gateway = self._build_gateway_panel()
        content_row.addWidget(gateway, 1)

        # Right column: form
        self._form_container = QWidget()
        self._form_layout = QVBoxLayout(self._form_container)
        self._form_layout.setContentsMargins(0, 0, 0, 0)
        self._form_layout.setSpacing(0)
        content_row.addWidget(self._form_container, 2)

        scroll_layout.addLayout(content_row)
        scroll_layout.addStretch()
        scroll.setWidget(scroll_container)
        right_layout.addWidget(scroll, 1)

        main_layout.addWidget(right, 1)

        # Initial form render
        self._render_form()

    def _build_title_bar(self):
        bar = QFrame()
        bar.setFixedHeight(36)
        bar.setStyleSheet("background: #0D1117;")
        lay = QHBoxLayout(bar)
        lay.setContentsMargins(8, 0, 8, 0)

        # Spacer to push controls right
        spacer = QWidget()
        spacer.setFixedWidth(8)
        lay.addWidget(spacer)

        lay.addStretch()

        # Window controls
        ctrl_lay = QHBoxLayout()
        ctrl_lay.setSpacing(6)
        for emoji, color in [("🗙", "#EF4444"), ("❐", "#F59E0B"), ("□", "#22C55E")]:
            btn = QPushButton(emoji)
            btn.setFixedSize(14, 14)
            btn.setFont(QFont("Segoe UI", 6))
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.setStyleSheet(f"background: {color}; border: none; border-radius: 7px;")
            ctrl_lay.addWidget(btn)
        ctrl_lay.addStretch()
        lay.addLayout(ctrl_lay)

        # Drag
        bar.mousePressEvent = self._titlebar_press
        bar.mouseMoveEvent = self._titlebar_move
        bar.mouseReleaseEvent = lambda _: setattr(self, "_dragging", False)
        return bar

    def _build_gateway_panel(self):
        panel = QFrame()
        panel.setObjectName("gatewayPanel")
        panel.setStyleSheet(PANEL_CSS)
        panel.setFixedWidth(260)
        lay = QVBoxLayout(panel)
        lay.setContentsMargins(14, 14, 14, 14)
        lay.setSpacing(10)

        # Title
        title = QLabel("🏢 DAS CRM Platform")
        title.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        title.setStyleSheet("color: #F1F5F9; background: transparent;")
        lay.addWidget(title)

        sub = QLabel("Select Gateway Option")
        sub.setFont(QFont("Segoe UI", 10))
        sub.setStyleSheet("color: #64748B; background: transparent;")
        lay.addWidget(sub)

        lay.addSpacing(6)

        # Workspace gateway button
        self._gw_workspace_btn = self._make_gateway_btn(
            "🏢", "Tenant Admin & Staff Login",
            "Company Key & Email Workspace Login", "workspace"
        )
        lay.addWidget(self._gw_workspace_btn)

        # Staff key gateway button
        self._gw_staff_btn = self._make_gateway_btn(
            "🔑", "Staff User Key Registration",
            "Redeem Staff Invite Key (e.g. ACME-RX-4312)", "staff_key"
        )
        lay.addWidget(self._gw_staff_btn)

        lay.addStretch()

        # Register CTA
        reg_div = QFrame()
        reg_div.setStyleSheet("border-top: 1px solid rgba(30,41,59,0.5); padding-top: 10px;")
        reg_lay = QVBoxLayout(reg_div)
        reg_lay.setContentsMargins(0, 10, 0, 0)
        reg_lay.setSpacing(6)
        reg_prompt = QLabel("New Company? Activate workspace with Registration Key:")
        reg_prompt.setFont(QFont("Segoe UI", 10))
        reg_prompt.setStyleSheet("color: #64748B; background: transparent;")
        reg_lay.addWidget(reg_prompt)
        reg_btn = QPushButton("🏢 Register Company Workspace →")
        reg_btn.setObjectName("registerBtn")
        reg_btn.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        reg_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        reg_btn.setStyleSheet(REGISTER_BTN_CSS)
        reg_lay.addWidget(reg_btn)
        lay.addWidget(reg_div)

        return panel

    def _make_gateway_btn(self, icon, label, sublabel, entry):
        btn = QPushButton()
        btn.setObjectName("gatewayBtn")
        btn.setCheckable(True)
        btn.setCursor(Qt.CursorShape.PointingHandCursor)
        btn.setStyleSheet(GATEWAY_BTN_CSS)
        btn.setFixedHeight(72)
        lay = QHBoxLayout(btn)
        lay.setContentsMargins(12, 8, 12, 8)
        lay.setSpacing(10)

        icon_lbl = QLabel(icon)
        icon_lbl.setFont(QFont("Segoe UI", 18))
        icon_lbl.setFixedWidth(36)
        lay.addWidget(icon_lbl)

        txt = QWidget()
        txt_lay = QVBoxLayout(txt)
        txt_lay.setContentsMargins(0, 0, 0, 0)
        txt_lay.setSpacing(2)
        lbl = QLabel(label)
        lbl.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        sub = QLabel(sublabel)
        sub.setFont(QFont("Segoe UI", 9))
        sub.setStyleSheet("color: #475569; background: transparent;")
        txt_lay.addWidget(lbl)
        txt_lay.addWidget(sub)
        lay.addWidget(txt, 1)

        btn.clicked.connect(lambda _, e=entry: self._switch_entry(e))
        return btn

    def _switch_entry(self, entry):
        self._entry_point = entry
        self._error_msg = None
        self._success_msg = None
        self._gw_workspace_btn.setChecked(entry == "workspace")
        self._gw_staff_btn.setChecked(entry == "staff_key")
        self._render_form()

    def _render_form(self):
        # Clear existing form
        while self._form_layout.count():
            child = self._form_layout.takeAt(0)
            if child.widget():
                child.widget().deleteLater()

        if self._entry_point == "workspace":
            self._render_workspace_form()
        else:
            self._render_staff_form()

    def _render_workspace_form(self):
        self._form_layout.setContentsMargins(0, 0, 0, 0)
        form = QFrame()
        form.setObjectName("formCard")
        form.setStyleSheet(FORM_CARD_CSS)
        fl = QVBoxLayout(form)
        fl.setContentsMargins(20, 20, 20, 20)
        fl.setSpacing(12)

        # Entry tag
        tag = QLabel("WORKSPACE ENTRY")
        tag.setObjectName("entryTag")
        tag.setFont(QFont("Segoe UI", 9, QFont.Weight.ExtraBold))
        tag.setStyleSheet(ENTRY_TAG_CSS)
        fl.addWidget(tag)

        # Title
        t = QLabel("Sign In to Your Company Workspace")
        t.setFont(QFont("Segoe UI", 18, QFont.Weight.Bold))
        t.setStyleSheet("color: #FFFFFF; background: transparent;")
        fl.addWidget(t)

        sub = QLabel("Select your company and provide your assigned key to authenticate.")
        sub.setFont(QFont("Segoe UI", 11))
        sub.setStyleSheet("color: #94A3B8; background: transparent; margin-bottom: 4px;")
        fl.addWidget(sub)

        # Error banner
        self._ws_error_banner = QWidget()
        fl.addWidget(self._ws_error_banner)

        # Role selector label
        role_lbl = QLabel("Select Login Role / Perspective *")
        role_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        role_lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        fl.addWidget(role_lbl)

        # Role buttons row
        role_row = QHBoxLayout()
        role_row.setSpacing(6)
        self._role_btns = {}
        for role in ALL_ROLES:
            rbtn = QPushButton(role.replace("_", " "))
            rbtn.setObjectName("roleBtn")
            rbtn.setCheckable(True)
            rbtn.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            rbtn.setCursor(Qt.CursorShape.PointingHandCursor)
            rbtn.setStyleSheet(ROLE_BTN_CSS)
            rbtn.setFixedHeight(34)
            rbtn.clicked.connect(lambda _, r=role: self._on_role_select(r))
            self._role_btns[role] = rbtn
            role_row.addWidget(rbtn)
        role_row.addStretch()
        fl.addLayout(role_row)

        # Company selector
        comp_lbl = QLabel("Select Company / Workspace *")
        comp_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        comp_lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        fl.addWidget(comp_lbl)

        self._ws_company_combo = QComboBox()
        self._ws_company_combo.addItems([c["name"] for c in PUBLIC_COMPANIES])
        self._ws_company_combo.setCurrentIndex(self._selected_company_idx)
        self._ws_company_combo.setStyleSheet(COMBO_CSS)
        self._ws_company_combo.setFixedHeight(42)
        self._ws_company_combo.currentIndexChanged.connect(
            lambda i: setattr(self, "_selected_company_idx", i)
        )
        fl.addWidget(self._ws_company_combo)

        # Company key
        key_lbl = QLabel("Company / User Key (Format: ACME-KX-7421) *")
        key_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        key_lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        fl.addWidget(key_lbl)

        self._ws_key_input = _input("ACME-KX-7421", mono=True)
        self._ws_key_input.setText(self._company_key)
        self._ws_key_input.textChanged.connect(self._on_key_changed)
        fl.addWidget(self._ws_key_input)

        # Email + Password row
        creds = QHBoxLayout()
        creds.setSpacing(10)
        email_w = QWidget()
        el = QVBoxLayout(email_w)
        el.setContentsMargins(0, 0, 0, 0)
        el.setSpacing(4)
        e_lbl = QLabel("Email *")
        e_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        e_lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        self._ws_email_input = _input("user@company.com")
        self._ws_email_input.setText(self._email)
        self._ws_email_input.textChanged.connect(self._on_email_changed)
        el.addWidget(e_lbl)
        el.addWidget(self._ws_email_input)
        creds.addWidget(email_w, 1)

        pass_w = QWidget()
        pl = QVBoxLayout(pass_w)
        pl.setContentsMargins(0, 0, 0, 0)
        pl.setSpacing(4)
        p_lbl = QLabel("Password *")
        p_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        p_lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        self._ws_pass_input = _input("••••••••")
        self._ws_pass_input.setEchoMode(QLineEdit.EchoMode.Password)
        self._ws_pass_input.setText(self._password)
        self._ws_pass_input.textChanged.connect(lambda t: setattr(self, "_password", t))
        pl.addWidget(p_lbl)
        pl.addWidget(self._ws_pass_input)
        creds.addWidget(pass_w, 1)
        fl.addLayout(creds)

        # Forgot password
        forgot_row = QHBoxLayout()
        forgot_row.addStretch()
        self._forgot_btn = QPushButton("Forgot Password?")
        self._forgot_btn.setObjectName("btnForgot")
        self._forgot_btn.setFont(QFont("Segoe UI", 10, QFont.Weight.Normal))
        self._forgot_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self._forgot_btn.setStyleSheet(FORGOT_CSS)
        self._forgot_btn.clicked.connect(self._open_forgot)
        forgot_row.addWidget(self._forgot_btn)
        fl.addLayout(forgot_row)

        fl.addSpacing(4)

        # Sign In button
        self._ws_signin_btn = QPushButton(f"Sign In as {self._selected_role.replace('_', ' ')} →")
        self._ws_signin_btn.setObjectName("btnPrimary")
        self._ws_signin_btn.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        self._ws_signin_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self._ws_signin_btn.setStyleSheet(BTN_PRIMARY_CSS)
        self._ws_signin_btn.setFixedHeight(46)
        self._ws_signin_btn.clicked.connect(self._do_workspace_login)
        fl.addWidget(self._ws_signin_btn)

        # Google button
        google_btn = QPushButton("🌐  Sign in with Google (Gmail Verified)")
        google_btn.setObjectName("btnGoogle")
        google_btn.setFont(QFont("Segoe UI", 11, QFont.Weight.SemiBold))
        google_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        google_btn.setStyleSheet(BTN_GOOGLE_CSS)
        google_btn.setFixedHeight(44)
        google_btn.clicked.connect(self._do_google_login)
        fl.addWidget(google_btn)

        # Set initial role button state
        self._update_role_buttons()
        self._render_workspace_errors()

        self._form_layout.addWidget(form)

    def _render_staff_form(self):
        self._form_layout.setContentsMargins(0, 0, 0, 0)
        form = QFrame()
        form.setObjectName("formCard")
        form.setStyleSheet(FORM_CARD_CSS)
        # Green tint for staff form
        form.setStyleSheet("""
            QFrame#formCard {
                background: #0B1120;
                border: 1px solid rgba(16, 185, 129, 0.30);
                border-radius: 20px;
                padding: 0px;
            }
        """)
        fl = QVBoxLayout(form)
        fl.setContentsMargins(20, 20, 20, 20)
        fl.setSpacing(12)

        # Entry tag (green)
        tag = QLabel("STAFF USER INVITE KEY")
        tag.setObjectName("entryTagGreen")
        tag.setFont(QFont("Segoe UI", 9, QFont.Weight.ExtraBold))
        tag.setStyleSheet(ENTRY_TAG_CSS)
        fl.addWidget(tag)

        # Title
        t = QLabel("Redeem Staff Invite Key")
        t.setFont(QFont("Segoe UI", 18, QFont.Weight.Bold))
        t.setStyleSheet("color: #FFFFFF; background: transparent;")
        fl.addWidget(t)

        sub = QLabel("Enter the user key generated by your Tenant Admin (e.g. ACME-RX-4312).")
        sub.setFont(QFont("Segoe UI", 11))
        sub.setStyleSheet("color: #94A3B8; background: transparent; margin-bottom: 4px;")
        fl.addWidget(sub)

        # Error banner
        self._staff_error_banner = QWidget()
        fl.addWidget(self._staff_error_banner)

        # User key + validate
        key_lbl = QLabel("User Invite Key (Format: ACME-RX-4312) *")
        key_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        key_lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        fl.addWidget(key_lbl)

        key_row = QHBoxLayout()
        key_row.setSpacing(8)
        self._staff_key_input = _input("ACME-RX-4312", mono=True)
        self._staff_key_input.textChanged.connect(self._on_staff_key_changed)
        key_row.addWidget(self._staff_key_input, 1)

        self._validate_btn = QPushButton("Validate Key")
        self._validate_btn.setObjectName("btnValidate")
        self._validate_btn.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        self._validate_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self._validate_btn.setStyleSheet(BTN_VALIDATE_CSS)
        self._validate_btn.setFixedHeight(42)
        self._validate_btn.clicked.connect(self._do_validate_key)
        key_row.addWidget(self._validate_btn)
        fl.addLayout(key_row)

        # Valid key indicator
        self._key_valid_lbl = QLabel("")
        self._key_valid_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        self._key_valid_lbl.setStyleSheet("color: #34D399; background: transparent;")
        fl.addWidget(self._key_valid_lbl)

        # Name
        name_lbl = QLabel("Your Full Name *")
        name_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        name_lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        fl.addWidget(name_lbl)
        self._staff_name_input = _input("Rahul Sharma")
        self._staff_name_input.textChanged.connect(lambda t: setattr(self, "_staff_name", t))
        fl.addWidget(self._staff_name_input)

        # Email
        email_lbl = QLabel("Official Email *")
        email_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        email_lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        fl.addWidget(email_lbl)
        self._staff_email_input = _input("rahul@company.com")
        self._staff_email_input.textChanged.connect(lambda t: setattr(self, "_staff_email", t))
        fl.addWidget(self._staff_email_input)

        # Password
        pass_lbl = QLabel("Create Password *")
        pass_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        pass_lbl.setStyleSheet("color: #94A3B8; background: transparent;")
        fl.addWidget(pass_lbl)
        self._staff_pass_input = _input("••••••••")
        self._staff_pass_input.setEchoMode(QLineEdit.EchoMode.Password)
        self._staff_pass_input.textChanged.connect(lambda t: setattr(self, "_staff_password", t))
        fl.addWidget(self._staff_pass_input)

        fl.addSpacing(4)

        # Redeem button
        self._staff_register_btn = QPushButton("Redeem Key & Register Account →")
        self._staff_register_btn.setObjectName("btnPrimary")
        self._staff_register_btn.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        self._staff_register_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        self._staff_register_btn.setStyleSheet("""
            QPushButton#btnPrimary {
                background: qlineargradient(x1:0,y1:0,x2:1,y2:0, stop:0 #10B981, stop:1 #059669);
                border: none;
                border-radius: 12px;
                padding: 13px;
                color: white;
                font-size: 13px;
                font-weight: bold;
            }
            QPushButton#btnPrimary:hover {
                background: qlineargradient(x1:0,y1:0,x2:1,y2:0, stop:0 #059669, stop:1 #047857);
            }
        """)
        self._staff_register_btn.setFixedHeight(46)
        self._staff_register_btn.clicked.connect(self._do_staff_register)
        fl.addWidget(self._staff_register_btn)

        self._render_staff_errors()

        self._form_layout.addWidget(form)

    # ── Error banners ──────────────────────────────────────────────────────────

    def _render_workspace_errors(self):
        # Replace error banner widget
        if hasattr(self, "_ws_error_banner"):
            idx = self._form_layout.indexOf(self._ws_error_banner)
            if idx >= 0:
                self._form_layout.takeAt(idx)
                self._ws_error_banner.deleteLater()

        self._ws_error_banner = QWidget()
        if self._error_msg:
            self._ws_error_banner = _banner(self._error_msg, is_error=True)
        self._form_layout.insertWidget(5, self._ws_error_banner)

    def _render_staff_errors(self):
        if hasattr(self, "_staff_error_banner"):
            idx = self._form_layout.indexOf(self._staff_error_banner)
            if idx >= 0:
                self._form_layout.takeAt(idx)
                self._staff_error_banner.deleteLater()

        self._staff_error_banner = QWidget()
        if self._error_msg:
            self._staff_error_banner = _banner(self._error_msg, is_error=True)
        self._form_layout.insertWidget(5, self._staff_error_banner)

    # ── Signal handlers ───────────────────────────────────────────────────────

    def _on_role_select(self, role):
        self._selected_role = role
        self._email = ROLE_EMAILS.get(role, self._email)
        self._update_role_buttons()
        if hasattr(self, "_ws_email_input"):
            self._ws_email_input.setText(self._email)
        if hasattr(self, "_ws_signin_btn"):
            self._ws_signin_btn.setText(f"Sign In as {role.replace('_', ' ')} →")

    def _update_role_buttons(self):
        for role, btn in self._role_btns.items():
            btn.setChecked(role == self._selected_role)

    def _on_key_changed(self, text):
        formatted = format_company_key(text)
        if formatted != text:
            cursor = self._ws_key_input.cursorPosition()
            self._ws_key_input.setText(formatted)
            self._ws_key_input.setCursorPosition(cursor)
        self._company_key = formatted

    def _on_staff_key_changed(self, text):
        formatted = format_company_key(text)
        if formatted != text:
            cursor = self._staff_key_input.cursorPosition()
            self._staff_key_input.setText(formatted)
            self._staff_key_input.setCursorPosition(cursor)
        self._user_key = formatted

    def _on_email_changed(self, text):
        self._email = text
        inferred = infer_role_from_email(text)
        if inferred != self._selected_role:
            self._selected_role = inferred
            self._update_role_buttons()
            if hasattr(self, "_ws_signin_btn"):
                self._ws_signin_btn.setText(f"Sign In as {inferred.replace('_', ' ')} →")

    def _open_forgot(self):
        self._forgot_email = self._email
        self._forgot_otp = ""
        self._new_password = ""
        self._forgot_step = "email"
        self._forgot_win = ForgotPasswordDialog(self)
        self._forgot_win.exec()

    def _do_validate_key(self):
        if not self._user_key.strip():
            self._error_msg = "Please enter a User Invite Key."
            self._render_staff_errors()
            return
        self._key_validating = True
        self._validate_btn.setEnabled(False)
        self._validate_btn.setText("Verifying...")
        # Simulate validation (demo mode)
        QTimer.singleShot(800, self._on_key_validated)

    def _on_key_validated(self):
        self._key_validating = False
        self._validate_btn.setEnabled(True)
        self._validate_btn.setText("Validate Key")
        self._key_valid = True
        assigned = "SALES_EXEC"
        self._key_valid_lbl.setText(f"✓  Valid Key! Grants Role: {assigned}")

    # ── Login actions ─────────────────────────────────────────────────────────

    def _do_workspace_login(self):
        # Validate
        if not self._company_key.strip() or len(self._company_key) < 12:
            self._error_msg = "Please enter a valid Company Key (format: ACME-KX-7421)."
            self._render_workspace_errors()
            self._shake()
            return
        if not self._email.strip() or not self._password:
            self._error_msg = "Please enter your email and password."
            self._render_workspace_errors()
            self._shake()
            return

        # Role mismatch check
        match = validate_email_role_match(self._email, self._selected_role)
        if not match["valid"]:
            self._error_msg = (
                f'Wrong credential or role mismatch: "{self._email}" is assigned to '
                f'role "{match["expectedRole"].replace("_", " ")}", not '
                f'"{self._selected_role.replace("_", " ")}". Check your email and selected role.'
            )
            self._render_workspace_errors()
            self._shake()
            return

        self._error_msg = None
        self._loading = True
        self._ws_signin_btn.setEnabled(False)
        self._ws_signin_btn.setText("Authenticating Key...")

        QTimer.singleShot(1000, self._on_workspace_logged_in)

    def _on_workspace_logged_in(self):
        self._loading = False
        self._ws_signin_btn.setEnabled(True)
        self._ws_signin_btn.setText(f"Sign In as {self._selected_role.replace('_', ' ')} →")

        # Resolve final role
        inferred = infer_role_from_email(self._email)
        final_role = inferred or self._selected_role
        demo = DEMO_USERS.get(final_role, DEMO_USERS["ADMIN"])

        LoginWindow.LOGGED_IN = {
            "id": f"user_{final_role.lower()}",
            "name": demo["name"],
            "role": demo["role"],
            "role_key": final_role,
            "email": self._email,
            "tenant_url": "https://nexcrm-backend.onrender.com",
            "company_id": PUBLIC_COMPANIES[self._selected_company_idx]["id"],
            "company_name": PUBLIC_COMPANIES[self._selected_company_idx]["name"],
        }
        self.accept()

    def _do_google_login(self):
        if not self._company_key.strip():
            self._error_msg = "Company workspace selection and Registration Key are required before signing in with Google."
            self._render_workspace_errors()
            self._shake()
            return
        self._loading = True
        self._error_msg = None
        QTimer.singleShot(1200, self._on_google_logged_in)

    def _on_google_logged_in(self):
        self._loading = False
        demo = DEMO_USERS.get(self._selected_role, DEMO_USERS["ADMIN"])
        LoginWindow.LOGGED_IN = {
            "id": f"user_{self._selected_role.lower()}",
            "name": demo["name"],
            "role": demo["role"],
            "role_key": self._selected_role,
            "email": f"user@gmail.com",
            "tenant_url": "https://nexcrm-backend.onrender.com",
            "company_id": PUBLIC_COMPANIES[self._selected_company_idx]["id"],
            "company_name": PUBLIC_COMPANIES[self._selected_company_idx]["name"],
        }
        self.accept()

    def _do_staff_register(self):
        if not self._user_key or not self._staff_name or not self._staff_email or not self._staff_password:
            self._error_msg = "Please fill all required fields including a valid User Key."
            self._render_staff_errors()
            self._shake()
            return

        self._loading = True
        self._staff_register_btn.setEnabled(False)
        self._staff_register_btn.setText("Creating Account...")

        QTimer.singleShot(1000, self._on_staff_registered)

    def _on_staff_registered(self):
        self._loading = False
        self._staff_register_btn.setEnabled(True)
        self._staff_register_btn.setText("Redeem Key & Register Account →")

        demo = DEMO_USERS["SALES_EXEC"]
        LoginWindow.LOGGED_IN = {
            "id": f"user_staff",
            "name": self._staff_name,
            "role": "Sales Exec",
            "role_key": "SALES_EXEC",
            "email": self._staff_email,
            "tenant_url": "https://nexcrm-backend.onrender.com",
            "company_id": "comp_acme",
            "company_name": "Acme Sales Solutions",
        }
        self.accept()

    # ── Window drag ──────────────────────────────────────────────────────────

    def _titlebar_press(self, event):
        self._dragging = True
        self._drag_pos = event.globalPosition().toPoint()

    def _titlebar_move(self, event):
        if self._dragging and self._drag_pos:
            delta = event.globalPosition().toPoint() - self._drag_pos
            self.move(self.pos() + delta)
            self._drag_pos = event.globalPosition().toPoint()

    def _shake(self):
        orig = self.pos()
        offsets = [8, -8, 6, -6, 4, -4, 2, 0]
        for i, d in enumerate(offsets):
            QTimer.singleShot(i * 35, lambda p=orig, dist=d: self.move(p.x() + dist, p.y()))
        QTimer.singleShot(len(offsets) * 35, lambda p=orig: self.move(p))


# ─── Forgot Password Dialog ─────────────────────────────────────────────────────

class ForgotPasswordDialog(QDialog):
    """Forgot password flow — step 1: email, step 2: OTP + new password."""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("Reset Account Password")
        self.setModal(True)
        self.setFixedSize(440, 400)
        self.setWindowFlags(Qt.WindowType.FramelessWindowHint)
        self._step = "email"
        self._email = ""
        self._otp = ""
        self._new_pass = ""
        self._loading = False
        self._msg = None
        self._error = None
        self._build_ui()

    def _build_ui(self):
        self.setStyleSheet(BASE_CSS)
        lay = QVBoxLayout(self)
        lay.setContentsMargins(24, 20, 24, 20)
        lay.setSpacing(12)

        # Close button
        top_row = QHBoxLayout()
        top_row.addStretch()
        close_btn = QPushButton("✕")
        close_btn.setFixedSize(28, 28)
        close_btn.setFont(QFont("Segoe UI", 12))
        close_btn.setStyleSheet("background: transparent; color: #64748B; border: none;")
        close_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        close_btn.clicked.connect(self.reject)
        top_row.addWidget(close_btn)
        lay.addLayout(top_row)

        # Title
        title = QLabel("🔑  Reset Account Password")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        title.setStyleSheet("color: #FFFFFF; background: transparent;")
        lay.addWidget(title)

        sub = QLabel("Enter your registered email to receive a 6-digit verification code.")
        sub.setFont(QFont("Segoe UI", 11))
        sub.setStyleSheet("color: #94A3B8; background: transparent;")
        sub.setWordWrap(True)
        lay.addWidget(sub)

        self._msg_lbl = QLabel("")
        self._msg_lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
        self._msg_lbl.setWordWrap(True)
        lay.addWidget(self._msg_lbl)

        self._err_lbl = QLabel("")
        self._err_lbl.setFont(QFont("Segoe UI", 10))
        self._err_lbl.setStyleSheet("color: #FCA5A5; background: transparent;")
        self._err_lbl.setWordWrap(True)
        lay.addWidget(self._err_lbl)

        self._form_area = QWidget()
        self._form_lay = QVBoxLayout(self._form_area)
        self._form_lay.setContentsMargins(0, 0, 0, 0)
        self._form_lay.setSpacing(10)
        lay.addWidget(self._form_area, 1)

        self._render_step()

        # Close link
        close_lnk = QPushButton("Cancel")
        close_lnk.setFont(QFont("Segoe UI", 10))
        close_lnk.setStyleSheet("background: transparent; color: #64748B; border: none;")
        close_lnk.setCursor(Qt.CursorShape.PointingHandCursor)
        close_lnk.clicked.connect(self.reject)
        lay.addWidget(close_lnk)

    def _render_step(self):
        while self._form_lay.count():
            w = self._form_lay.takeAt(0).widget()
            if w:
                w.deleteLater()

        if self._step == "email":
            lbl = QLabel("Registered Email Address *")
            lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            lbl.setStyleSheet("color: #94A3B8; background: transparent;")
            self._form_lay.addWidget(lbl)

            self._forgot_email_input = _input("user@company.com")
            self._forgot_email_input.setText(self._email)
            self._forgot_email_input.textChanged.connect(lambda t: setattr(self, "_email", t))
            self._form_lay.addWidget(self._forgot_email_input)

            self._send_btn = QPushButton("Send 6-Digit Reset Code →")
            self._send_btn.setObjectName("btnPrimary")
            self._send_btn.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
            self._send_btn.setStyleSheet(BTN_PRIMARY_CSS)
            self._send_btn.setFixedHeight(44)
            self._send_btn.setCursor(Qt.CursorShape.PointingHandCursor)
            self._send_btn.clicked.connect(self._send_otp)
            self._form_lay.addWidget(self._send_btn)

        else:
            lbl = QLabel("6-Digit Reset OTP Code *")
            lbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            lbl.setStyleSheet("color: #94A3B8; background: transparent;")
            self._form_lay.addWidget(lbl)

            self._otp_input = _input("123456", mono=True)
            self._otp_input.textChanged.connect(lambda t: setattr(self, "_otp", t))
            self._form_lay.addWidget(self._otp_input)

            plbl = QLabel("New Secure Password *")
            plbl.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            plbl.setStyleSheet("color: #94A3B8; background: transparent;")
            self._form_lay.addWidget(plbl)

            self._new_pass_input = _input("Enter new password")
            self._new_pass_input.setEchoMode(QLineEdit.EchoMode.Password)
            self._new_pass_input.textChanged.connect(lambda t: setattr(self, "_new_pass", t))
            self._form_lay.addWidget(self._new_pass_input)

            self._reset_btn = QPushButton("Verify OTP & Reset Password ✓")
            self._reset_btn.setObjectName("btnPrimary")
            self._reset_btn.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
            self._reset_btn.setStyleSheet("""
                QPushButton#btnPrimary {
                    background: qlineargradient(x1:0,y1:0,x2:1,y2:0, stop:0 #10B981, stop:1 #059669);
                    border: none;
                    border-radius: 12px;
                    padding: 13px;
                    color: white;
                    font-size: 13px;
                    font-weight: bold;
                }
                QPushButton#btnPrimary:hover {
                    background: qlineargradient(x1:0,y1:0,x2:1,y2:0, stop:0 #059669, stop:1 #047857);
                }
            """)
            self._reset_btn.setFixedHeight(44)
            self._reset_btn.setCursor(Qt.CursorShape.PointingHandCursor)
            self._reset_btn.clicked.connect(self._reset_password)
            self._form_lay.addWidget(self._reset_btn)

        self._update_messages()

    def _update_messages(self):
        self._msg_lbl.setStyleSheet("color: #6EE7B7; background: transparent;")
        self._msg_lbl.setText(self._msg or "")
        self._err_lbl.setStyleSheet("color: #FCA5A5; background: transparent;")
        self._err_lbl.setText(self._error or "")

    def _send_otp(self):
        if not self._email.strip():
            self._error = "Please enter your email address."
            self._update_messages()
            return
        self._loading = True
        self._send_btn.setEnabled(False)
        self._send_btn.setText("Sending...")
        QTimer.singleShot(900, self._on_otp_sent)

    def _on_otp_sent(self):
        self._loading = False
        self._send_btn.setEnabled(True)
        self._send_btn.setText("Send 6-Digit Reset Code →")
        self._step = "otp"
        self._msg = f"✓ Security OTP sent to {self._email} (Demo: enter 123456)"
        self._error = None
        self._render_step()

    def _reset_password(self):
        if len(self._otp) < 6 or not self._new_pass.strip():
            self._error = "Please enter a valid 6-digit OTP and new password."
            self._update_messages()
            return
        self._loading = True
        self._reset_btn.setEnabled(False)
        self._reset_btn.setText("Resetting...")
        QTimer.singleShot(800, self._on_password_reset)

    def _on_password_reset(self):
        self._loading = False
        self._reset_btn.setEnabled(True)
        self._reset_btn.setText("Verify OTP & Reset Password ✓")
        self._msg = "Password reset successfully! You can now log in."
        self._error = None
        self._update_messages()
        QTimer.singleShot(1500, self.accept)

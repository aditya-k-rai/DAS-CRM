"""
HRView.py — DAS CRM Windows
HR Management with Employee Records, Attendance, and Leave Tracking
Feature parity with Android HRScreen.tsx
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit,
    QScrollArea, QFrame, QTableWidget, QTableWidgetItem, QAbstractItemView,
    QMessageBox, QDialog, QComboBox, QDateEdit
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QFont, QBrush, QColor
from dataclasses import dataclass

# ─────────────────────────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class EmployeeRecord:
    """Employee information"""
    id: str
    name: str
    email: str
    role: str
    department: str
    joinDate: str
    status: str  # ACTIVE, ON_LEAVE, INACTIVE

@dataclass
class AttendanceRecord:
    """Daily attendance"""
    id: str
    employeeId: str
    employeeName: str
    date: str
    checkIn: str  # time or "---"
    checkOut: str  # time or "---"
    hoursWorked: str
    status: str  # PRESENT, ABSENT, LATE, HALF_DAY

@dataclass
class LeaveRecord:
    """Leave application"""
    id: str
    employeeName: str
    leaveType: str  # CASUAL, SICK, ANNUAL, UNPAID
    fromDate: str
    toDate: str
    days: int
    reason: str
    status: str  # PENDING, APPROVED, REJECTED

FALLBACK_EMPLOYEES = [
    EmployeeRecord("e1", "Rajesh Kumar", "rajesh@crm.com", "Sales Executive", "Sales", "2023-06-15", "ACTIVE"),
    EmployeeRecord("e2", "Priya Sharma", "priya@crm.com", "Sales Executive", "Sales", "2023-08-20", "ACTIVE"),
    EmployeeRecord("e3", "Vikram Mehta", "vikram@crm.com", "Senior Sales Rep", "Sales", "2022-03-10", "ACTIVE"),
    EmployeeRecord("e4", "Sunita Rao", "sunita@crm.com", "Sales Manager", "Sales", "2021-01-05", "ACTIVE"),
    EmployeeRecord("e5", "Amit Patel", "amit@crm.com", "Sales Executive", "Sales", "2024-02-01", "ON_LEAVE"),
]

FALLBACK_ATTENDANCE = [
    AttendanceRecord("a1", "e1", "Rajesh Kumar", "2026-08-26", "09:05", "18:32", "9.5 hrs", "PRESENT"),
    AttendanceRecord("a2", "e2", "Priya Sharma", "2026-08-26", "09:15", "18:45", "9.5 hrs", "PRESENT"),
    AttendanceRecord("a3", "e3", "Vikram Mehta", "2026-08-26", "08:55", "18:20", "9.4 hrs", "PRESENT"),
    AttendanceRecord("a4", "e4", "Sunita Rao", "2026-08-26", "10:30", "19:00", "8.5 hrs", "LATE"),
    AttendanceRecord("a5", "e5", "Amit Patel", "2026-08-26", "---", "---", "0 hrs", "ABSENT"),
]

FALLBACK_LEAVES = [
    LeaveRecord("l1", "Amit Patel", "SICK", "2026-08-24", "2026-08-26", 3, "Medical emergency", "APPROVED"),
    LeaveRecord("l2", "Priya Sharma", "CASUAL", "2026-09-01", "2026-09-02", 2, "Personal work", "PENDING"),
    LeaveRecord("l3", "Rajesh Kumar", "ANNUAL", "2026-09-10", "2026-09-17", 8, "Vacation", "PENDING"),
]

# ─────────────────────────────────────────────────────────────────────────────────────
# EMPLOYEE DETAILS MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class EmployeeDetailsModal(QDialog):
    """Modal showing detailed employee information"""
    def __init__(self, employee: EmployeeRecord, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"👤 Employee - {employee.name}")
        self.setGeometry(100, 100, 500, 450)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #f8fafc; }
            QPushButton { padding: 8px 12px; border-radius: 6px; font-weight: bold; }
            QPushButton#edit { background-color: #f97316; color: white; }
            QPushButton#contact { background-color: #4f46e5; color: white; }
            QPushButton#close { background-color: #1e293b; color: #94a3b8; }
        """)

        layout = QVBoxLayout(self)

        # Header
        headerLayout = QHBoxLayout()
        headerLayout.setContentsMargins(16, 16, 16, 12)

        titleLabel = QLabel(f"👤 {employee.name}")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        headerLayout.addWidget(titleLabel)
        headerLayout.addStretch()

        statusLabel = QLabel(employee.status)
        statusLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        statusColor = "#34d399" if employee.status == "ACTIVE" else "#fbbf24" if employee.status == "ON_LEAVE" else "#ef4444"
        statusLabel.setStyleSheet(f"""
            background-color: rgba(100, 100, 100, 0.15);
            color: {statusColor};
            padding: 4px 8px;
            border: 1px solid {statusColor};
            border-radius: 6px;
        """)
        headerLayout.addWidget(statusLabel)

        layout.addLayout(headerLayout)

        # Content
        contentLayout = QVBoxLayout()
        contentLayout.setContentsMargins(16, 0, 16, 12)
        contentLayout.setSpacing(12)

        # Employee Info
        infoCard = self._build_info_section(
            "📋 Employee Information",
            [
                ("Name", employee.name),
                ("Email", employee.email),
                ("Role", employee.role),
                ("Department", employee.department),
                ("Join Date", employee.joinDate),
            ]
        )
        contentLayout.addWidget(infoCard)

        contentLayout.addStretch()

        layout.addLayout(contentLayout, 1)

        # Action Buttons
        actionLayout = QHBoxLayout()
        actionLayout.setContentsMargins(16, 0, 16, 16)
        actionLayout.setSpacing(8)

        btnEdit = QPushButton("✏️ Edit")
        btnEdit.setObjectName("edit")
        btnEdit.clicked.connect(lambda: QMessageBox.information(self, "Edit", f"Editing {employee.name}..."))
        actionLayout.addWidget(btnEdit)

        btnContact = QPushButton("📧 Contact")
        btnContact.setObjectName("contact")
        btnContact.clicked.connect(lambda: QMessageBox.information(self, "Contact", f"Contacting {employee.email}..."))
        actionLayout.addWidget(btnContact)

        actionLayout.addStretch()

        btnClose = QPushButton("Close")
        btnClose.setObjectName("close")
        btnClose.clicked.connect(self.accept)
        actionLayout.addWidget(btnClose)

        layout.addLayout(actionLayout)

    def _build_info_section(self, title: str, fields: list) -> QFrame:
        """Build an info section card"""
        card = QFrame()
        card.setStyleSheet("""
            QFrame {
                background-color: #0f172a;
                border: 1px solid #1e293b;
                border-radius: 12px;
                padding: 12px;
            }
        """)

        layout = QVBoxLayout(card)
        layout.setContentsMargins(12, 12, 12, 12)
        layout.setSpacing(8)

        titleLabel = QLabel(title)
        titleLabel.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        layout.addWidget(titleLabel)

        for fieldName, fieldValue in fields:
            fieldLayout = QHBoxLayout()

            nameLabel = QLabel(f"{fieldName}:")
            nameLabel.setFont(QFont("Segoe UI", 10, QFont.Weight.Bold))
            nameLabel.setStyleSheet("color: #94a3b8;")
            nameLabel.setMaximumWidth(100)

            valueLabel = QLabel(fieldValue)
            valueLabel.setFont(QFont("Segoe UI", 10))
            valueLabel.setStyleSheet("color: #cbd5e1;")
            valueLabel.setWordWrap(True)

            fieldLayout.addWidget(nameLabel)
            fieldLayout.addWidget(valueLabel, 1)
            layout.addLayout(fieldLayout)

        return card

# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN HR VIEW
# ─────────────────────────────────────────────────────────────────────────────────────

class HRView(QWidget):
    """HR Management with Employees, Attendance, and Leaves"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
            QLineEdit { background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b;
                       border-radius: 6px; padding: 8px; }
        """)

        self.employees = list(FALLBACK_EMPLOYEES)
        self.attendance = list(FALLBACK_ATTENDANCE)
        self.leaves = list(FALLBACK_LEAVES)
        self.selectedTab = "EMPLOYEES"

        self._build_ui()

    def _build_ui(self):
        """Build HR UI"""
        layout = QVBoxLayout(self)
        layout.setContentsMargins(0, 0, 0, 0)

        scrollArea = QScrollArea()
        scrollArea.setWidgetResizable(True)
        scrollArea.setStyleSheet("QScrollArea { border: none; background-color: #090d16; }")

        scrollWidget = QWidget()
        scrollLayout = QVBoxLayout(scrollWidget)
        scrollLayout.setContentsMargins(16, 16, 16, 24)
        scrollLayout.setSpacing(12)

        # Title
        titleLabel = QLabel("👥 HR Management")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        scrollLayout.addWidget(titleLabel)

        # Tab Buttons
        tabLayout = QHBoxLayout()
        tabLayout.setContentsMargins(0, 0, 0, 0)
        tabLayout.setSpacing(8)

        for tab in ["EMPLOYEES", "ATTENDANCE", "LEAVES"]:
            btn = QPushButton(tab)
            btn.setCheckable(True)
            btn.setChecked(tab == "EMPLOYEES")
            btn.setMaximumWidth(120)
            btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: #020617;
                    border: 1px solid #1e293b;
                    color: #94a3b8;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-weight: 800;
                }}
                QPushButton:checked {{
                    background-color: #4f46e5;
                    color: #ffffff;
                    border-color: #4f46e5;
                }}
            """)
            btn.toggled.connect(lambda checked, t=tab: self._switch_tab(t) if checked else None)
            tabLayout.addWidget(btn)

        tabLayout.addStretch()
        scrollLayout.addLayout(tabLayout)

        # Employees Table
        self.employeesTable = QTableWidget()
        self.employeesTable.setColumnCount(6)
        self.employeesTable.setHorizontalHeaderLabels([
            "Name", "Email", "Role", "Department", "Join Date", "Status"
        ])
        self.employeesTable.horizontalHeader().setStretchLastSection(False)
        self.employeesTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.employeesTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.employeesTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.employeesTable.setColumnWidth(0, 130)
        self.employeesTable.setColumnWidth(1, 160)
        self.employeesTable.setColumnWidth(2, 140)
        self.employeesTable.setColumnWidth(3, 120)
        self.employeesTable.setColumnWidth(4, 100)
        self.employeesTable.setColumnWidth(5, 100)

        self.employeesTable.doubleClicked.connect(self._open_employee_details)
        self._refresh_employees_table()

        # Attendance Table
        self.attendanceTable = QTableWidget()
        self.attendanceTable.setColumnCount(7)
        self.attendanceTable.setHorizontalHeaderLabels([
            "Name", "Date", "Check-In", "Check-Out", "Hours Worked", "Status", "Action"
        ])
        self.attendanceTable.horizontalHeader().setStretchLastSection(False)
        self.attendanceTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.attendanceTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.attendanceTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.attendanceTable.setColumnWidth(0, 120)
        self.attendanceTable.setColumnWidth(1, 100)
        self.attendanceTable.setColumnWidth(2, 90)
        self.attendanceTable.setColumnWidth(3, 90)
        self.attendanceTable.setColumnWidth(4, 100)
        self.attendanceTable.setColumnWidth(5, 90)
        self.attendanceTable.setColumnWidth(6, 80)

        self._refresh_attendance_table()

        # Leaves Table
        self.leavesTable = QTableWidget()
        self.leavesTable.setColumnCount(7)
        self.leavesTable.setHorizontalHeaderLabels([
            "Employee", "Type", "From Date", "To Date", "Days", "Reason", "Status"
        ])
        self.leavesTable.horizontalHeader().setStretchLastSection(False)
        self.leavesTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.leavesTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.leavesTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.leavesTable.setColumnWidth(0, 120)
        self.leavesTable.setColumnWidth(1, 100)
        self.leavesTable.setColumnWidth(2, 100)
        self.leavesTable.setColumnWidth(3, 100)
        self.leavesTable.setColumnWidth(4, 70)
        self.leavesTable.setColumnWidth(5, 150)
        self.leavesTable.setColumnWidth(6, 100)

        self._refresh_leaves_table()

        # Add tables to stack and initially show employees
        self.stackLayout = QVBoxLayout()
        self.stackLayout.addWidget(self.employeesTable)
        self.stackLayout.addWidget(self.attendanceTable)
        self.stackLayout.addWidget(self.leavesTable)

        self.attendanceTable.hide()
        self.leavesTable.hide()

        scrollLayout.addLayout(self.stackLayout, 1)

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _refresh_employees_table(self):
        """Refresh employees table"""
        self.employeesTable.setRowCount(len(self.employees))

        for rowIdx, emp in enumerate(self.employees):
            self.employeesTable.setItem(rowIdx, 0, QTableWidgetItem(emp.name))
            self.employeesTable.setItem(rowIdx, 1, QTableWidgetItem(emp.email))
            self.employeesTable.setItem(rowIdx, 2, QTableWidgetItem(emp.role))
            self.employeesTable.setItem(rowIdx, 3, QTableWidgetItem(emp.department))
            self.employeesTable.setItem(rowIdx, 4, QTableWidgetItem(emp.joinDate))

            statusItem = QTableWidgetItem(emp.status)
            statusColor = "#34d399" if emp.status == "ACTIVE" else "#fbbf24" if emp.status == "ON_LEAVE" else "#ef4444"
            statusItem.setForeground(QBrush(QColor(statusColor)))
            self.employeesTable.setItem(rowIdx, 5, statusItem)

    def _refresh_attendance_table(self):
        """Refresh attendance table"""
        self.attendanceTable.setRowCount(len(self.attendance))

        for rowIdx, att in enumerate(self.attendance):
            self.attendanceTable.setItem(rowIdx, 0, QTableWidgetItem(att.employeeName))
            self.attendanceTable.setItem(rowIdx, 1, QTableWidgetItem(att.date))
            self.attendanceTable.setItem(rowIdx, 2, QTableWidgetItem(att.checkIn))
            self.attendanceTable.setItem(rowIdx, 3, QTableWidgetItem(att.checkOut))
            self.attendanceTable.setItem(rowIdx, 4, QTableWidgetItem(att.hoursWorked))

            statusItem = QTableWidgetItem(att.status)
            statusColor = "#34d399" if att.status == "PRESENT" else "#fbbf24" if att.status == "LATE" else "#ef4444"
            statusItem.setForeground(QBrush(QColor(statusColor)))
            self.attendanceTable.setItem(rowIdx, 5, statusItem)

            detailsBtn = QPushButton("Details")
            detailsBtn.setStyleSheet("background-color: #4f46e5; padding: 4px 8px; font-size: 9px;")
            self.attendanceTable.setCellWidget(rowIdx, 6, detailsBtn)

    def _refresh_leaves_table(self):
        """Refresh leaves table"""
        self.leavesTable.setRowCount(len(self.leaves))

        for rowIdx, leave in enumerate(self.leaves):
            self.leavesTable.setItem(rowIdx, 0, QTableWidgetItem(leave.employeeName))
            self.leavesTable.setItem(rowIdx, 1, QTableWidgetItem(leave.leaveType))
            self.leavesTable.setItem(rowIdx, 2, QTableWidgetItem(leave.fromDate))
            self.leavesTable.setItem(rowIdx, 3, QTableWidgetItem(leave.toDate))
            self.leavesTable.setItem(rowIdx, 4, QTableWidgetItem(str(leave.days)))
            self.leavesTable.setItem(rowIdx, 5, QTableWidgetItem(leave.reason))

            statusItem = QTableWidgetItem(leave.status)
            statusColor = "#34d399" if leave.status == "APPROVED" else "#fbbf24" if leave.status == "PENDING" else "#ef4444"
            statusItem.setForeground(QBrush(QColor(statusColor)))
            self.leavesTable.setItem(rowIdx, 6, statusItem)

    def _switch_tab(self, tab: str):
        """Switch between tabs"""
        self.selectedTab = tab
        self.employeesTable.hide()
        self.attendanceTable.hide()
        self.leavesTable.hide()

        if tab == "EMPLOYEES":
            self.employeesTable.show()
        elif tab == "ATTENDANCE":
            self.attendanceTable.show()
        elif tab == "LEAVES":
            self.leavesTable.show()

    def _open_employee_details(self, index):
        """Open employee details modal"""
        row = index.row()
        if row < len(self.employees):
            employee = self.employees[row]
            dialog = EmployeeDetailsModal(employee, self)
            dialog.exec()

"""
TasksView.py — DAS CRM Windows
Task Management with Priority, Assignment, and Due Date Tracking
Feature parity with Android TasksScreen.tsx
"""

from PyQt6.QtWidgets import (
    QWidget, QVBoxLayout, QHBoxLayout, QLabel, QPushButton, QLineEdit,
    QScrollArea, QFrame, QTableWidget, QTableWidgetItem, QAbstractItemView,
    QMessageBox, QDialog, QComboBox, QDateEdit, QCheckBox
)
from PyQt6.QtCore import Qt, QDate
from PyQt6.QtGui import QFont, QBrush, QColor
from dataclasses import dataclass

# ─────────────────────────────────────────────────────────────────────────────────────
# DATA MODELS
# ─────────────────────────────────────────────────────────────────────────────────────

@dataclass
class TaskItem:
    """Represents a task"""
    id: str
    title: str
    description: str
    assignedTo: str
    dueDate: str
    priority: str  # HIGH, MEDIUM, LOW
    status: str  # TODO, IN_PROGRESS, COMPLETED
    category: str  # FOLLOW_UP, PROPOSAL, MEETING, OTHER

PRIORITY_OPTIONS = ["HIGH", "MEDIUM", "LOW"]
STATUS_OPTIONS = ["TODO", "IN_PROGRESS", "COMPLETED"]
CATEGORY_OPTIONS = ["FOLLOW_UP", "PROPOSAL", "MEETING", "OTHER"]

FALLBACK_TASKS = [
    TaskItem("t1", "Follow up with TechCorp", "Call Rajesh regarding proposal feedback",
            "Priya Sharma", "2026-08-27", "HIGH", "TODO", "FOLLOW_UP"),
    TaskItem("t2", "Prepare Global Solutions proposal", "Complete pricing and scope document",
            "Vikram Mehta", "2026-08-29", "HIGH", "IN_PROGRESS", "PROPOSAL"),
    TaskItem("t3", "Schedule demo with FastTrack", "Confirm meeting time with client",
            "Amit Patel", "2026-08-28", "MEDIUM", "TODO", "MEETING"),
    TaskItem("t4", "Review contract terms", "Legal review of Premium Partners agreement",
            "Sunita Rao", "2026-08-30", "HIGH", "IN_PROGRESS", "OTHER"),
    TaskItem("t5", "Send invoice to Regional Corp", "Invoice for completed integration project",
            "Rajesh Kumar", "2026-08-26", "MEDIUM", "COMPLETED", "OTHER"),
    TaskItem("t6", "Update CRM with new leads", "Import leads from latest CSV upload",
            "Priya Sharma", "2026-08-27", "LOW", "TODO", "FOLLOW_UP"),
]

# ─────────────────────────────────────────────────────────────────────────────────────
# TASK DETAILS MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class TaskDetailsModal(QDialog):
    """Modal showing detailed task information"""
    def __init__(self, task: TaskItem, parent=None):
        super().__init__(parent)
        self.setWindowTitle(f"✓ Task Details - {task.title}")
        self.setGeometry(100, 100, 550, 500)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #f8fafc; }
            QPushButton { padding: 8px 12px; border-radius: 6px; font-weight: bold; }
            QPushButton#edit { background-color: #f97316; color: white; }
            QPushButton#complete { background-color: #10b981; color: white; }
            QPushButton#close { background-color: #1e293b; color: #94a3b8; }
        """)

        layout = QVBoxLayout(self)

        # Header
        headerLayout = QHBoxLayout()
        headerLayout.setContentsMargins(16, 16, 16, 12)

        titleLabel = QLabel(f"✓ {task.title}")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        headerLayout.addWidget(titleLabel)
        headerLayout.addStretch()

        statusLabel = QLabel(task.status)
        statusLabel.setFont(QFont("Segoe UI", 9, QFont.Weight.Bold))
        statusColor = "#34d399" if task.status == "COMPLETED" else "#38bdf8" if task.status == "IN_PROGRESS" else "#fbbf24"
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

        # Task Info
        infoCard = self._build_info_section(
            "📋 Task Information",
            [
                ("Title", task.title),
                ("Description", task.description),
                ("Category", task.category),
                ("Priority", task.priority),
            ]
        )
        contentLayout.addWidget(infoCard)

        # Assignment
        assignCard = self._build_info_section(
            "👤 Assignment",
            [
                ("Assigned To", task.assignedTo),
                ("Due Date", task.dueDate),
                ("Status", task.status),
            ]
        )
        contentLayout.addWidget(assignCard)

        contentLayout.addStretch()

        layout.addLayout(contentLayout, 1)

        # Action Buttons
        actionLayout = QHBoxLayout()
        actionLayout.setContentsMargins(16, 0, 16, 16)
        actionLayout.setSpacing(8)

        btnEdit = QPushButton("✏️ Edit")
        btnEdit.setObjectName("edit")
        btnEdit.clicked.connect(lambda: QMessageBox.information(self, "Edit", f"Editing {task.title}..."))
        actionLayout.addWidget(btnEdit)

        btnComplete = QPushButton("✅ Mark Complete")
        btnComplete.setObjectName("complete")
        btnComplete.clicked.connect(lambda: QMessageBox.information(self, "Complete", f"Marked {task.title} as complete."))
        actionLayout.addWidget(btnComplete)

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
# CREATE TASK MODAL
# ─────────────────────────────────────────────────────────────────────────────────────

class CreateTaskModal(QDialog):
    """Modal for creating new task"""
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setWindowTitle("➕ Create New Task")
        self.setGeometry(100, 100, 500, 550)
        self.setStyleSheet("""
            QDialog { background-color: #0f172a; }
            QLabel { color: #cbd5e1; font-weight: bold; font-size: 10px; }
            QLineEdit, QComboBox, QDateEdit { background-color: #020617; color: #ffffff;
                                             border: 1px solid #334155; border-radius: 6px; padding: 6px; }
            QPushButton#create { background-color: #10b981; color: white; }
            QPushButton#cancel { background-color: #1e293b; color: #94a3b8; }
        """)

        layout = QVBoxLayout(self)

        title = QLabel("➕ Create New Task")
        title.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        title.setStyleSheet("color: #ffffff;")
        layout.addWidget(title)

        desc = QLabel("Create a new task and assign it to a team member.")
        desc.setStyleSheet("color: #94a3b8; margin-bottom: 12px;")
        layout.addWidget(desc)

        # Form fields
        layout.addWidget(QLabel("Task Title *"))
        self.titleInput = QLineEdit()
        self.titleInput.setPlaceholderText("e.g. Follow up with client")
        layout.addWidget(self.titleInput)

        layout.addWidget(QLabel("Description"))
        self.descInput = QLineEdit()
        self.descInput.setPlaceholderText("Task details...")
        layout.addWidget(self.descInput)

        layout.addWidget(QLabel("Category *"))
        self.categoryCombo = QComboBox()
        self.categoryCombo.addItems(CATEGORY_OPTIONS)
        layout.addWidget(self.categoryCombo)

        layout.addWidget(QLabel("Priority *"))
        self.priorityCombo = QComboBox()
        self.priorityCombo.addItems(PRIORITY_OPTIONS)
        layout.addWidget(self.priorityCombo)

        layout.addWidget(QLabel("Assign To *"))
        self.assignedInput = QLineEdit()
        self.assignedInput.setPlaceholderText("e.g. Rajesh Kumar")
        layout.addWidget(self.assignedInput)

        layout.addWidget(QLabel("Due Date *"))
        self.dueDateInput = QDateEdit()
        self.dueDateInput.setDate(QDate.currentDate())
        layout.addWidget(self.dueDateInput)

        layout.addStretch()

        btnLayout = QHBoxLayout()
        btnCancel = QPushButton("Cancel")
        btnCancel.setObjectName("cancel")
        btnCancel.clicked.connect(self.reject)
        btnCreate = QPushButton("Create Task ✓")
        btnCreate.setObjectName("create")
        btnCreate.clicked.connect(self.accept)
        btnLayout.addWidget(btnCancel, 1)
        btnLayout.addWidget(btnCreate, 1)
        layout.addLayout(btnLayout)

    def get_task(self) -> TaskItem:
        """Return created task"""
        return TaskItem(
            id=f"t-{id(self)}",
            title=self.titleInput.text().strip(),
            description=self.descInput.text().strip(),
            assignedTo=self.assignedInput.text().strip(),
            dueDate=self.dueDateInput.date().toString("yyyy-MM-dd"),
            priority=self.priorityCombo.currentText(),
            status="TODO",
            category=self.categoryCombo.currentText()
        )

# ─────────────────────────────────────────────────────────────────────────────────────
# MAIN TASKS VIEW
# ─────────────────────────────────────────────────────────────────────────────────────

class TasksView(QWidget):
    """Task Management with Priority & Due Date Tracking"""

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("""
            QWidget { background-color: #090d16; }
            QLabel { color: #f8fafc; }
            QPushButton { color: white; font-weight: bold; border: none; border-radius: 6px; }
            QLineEdit { background-color: #0f172a; color: #ffffff; border: 1px solid #1e293b;
                       border-radius: 6px; padding: 8px; }
        """)

        self.tasksList = list(FALLBACK_TASKS)
        self.search = ""
        self.selectedStatus = "ALL"

        self._build_ui()

    def _build_ui(self):
        """Build tasks UI"""
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
        titleLabel = QLabel("✓ Tasks & Follow-ups")
        titleLabel.setFont(QFont("Segoe UI", 14, QFont.Weight.Bold))
        titleLabel.setStyleSheet("color: #ffffff;")
        scrollLayout.addWidget(titleLabel)

        # Search & Filter Bar
        searchLayout = QVBoxLayout()
        searchLayout.setContentsMargins(0, 0, 0, 0)
        searchLayout.setSpacing(8)

        # Search input
        self.searchInput = QLineEdit()
        self.searchInput.setPlaceholderText("🔍 Search by task title, assignee...")
        self.searchInput.setMinimumHeight(32)
        self.searchInput.textChanged.connect(self._on_search_changed)
        searchLayout.addWidget(self.searchInput)

        # Action buttons
        actionLayout = QHBoxLayout()
        btnAdd = QPushButton("➕ New Task")
        btnAdd.setStyleSheet("background-color: #10b981; padding: 6px 12px;")
        btnAdd.clicked.connect(self._open_create_task)
        actionLayout.addWidget(btnAdd)

        actionLayout.addStretch()
        searchLayout.addLayout(actionLayout)

        # Status filter chips
        statusLayout = QHBoxLayout()
        statuses = ["ALL"] + STATUS_OPTIONS
        for status in statuses:
            btn = QPushButton(status)
            btn.setCheckable(True)
            btn.setChecked(status == "ALL")
            btn.setMaximumHeight(24)
            btn.setStyleSheet(f"""
                QPushButton {{
                    background-color: #020617;
                    border: 1px solid #1e293b;
                    color: #94a3b8;
                    padding: 4px 8px;
                    border-radius: 6px;
                    font-size: 9px;
                    font-weight: 800;
                }}
                QPushButton:checked {{
                    background-color: #4f46e5;
                    color: #ffffff;
                    border-color: #4f46e5;
                }}
            """)
            btn.toggled.connect(lambda checked, s=status: self._set_status_filter(s) if checked else None)
            statusLayout.addWidget(btn)

        statusLayout.addStretch()
        searchLayout.addLayout(statusLayout)

        scrollLayout.addLayout(searchLayout)

        # Tasks Table
        self.tasksTable = QTableWidget()
        self.tasksTable.setColumnCount(7)
        self.tasksTable.setHorizontalHeaderLabels([
            "Task", "Category", "Priority", "Assigned To", "Due Date", "Status", "Action"
        ])
        self.tasksTable.horizontalHeader().setStretchLastSection(False)
        self.tasksTable.setSelectionBehavior(QAbstractItemView.SelectionBehavior.SelectRows)
        self.tasksTable.setSelectionMode(QAbstractItemView.SelectionMode.SingleSelection)
        self.tasksTable.setStyleSheet("""
            QTableWidget { background-color: #030712; gridline-color: #1e293b; }
            QHeaderView::section { background-color: #0b1329; color: #818cf8; padding: 6px;
                                   border: none; border-right: 1px solid #1e293b; }
        """)

        self.tasksTable.setColumnWidth(0, 150)
        self.tasksTable.setColumnWidth(1, 110)
        self.tasksTable.setColumnWidth(2, 90)
        self.tasksTable.setColumnWidth(3, 120)
        self.tasksTable.setColumnWidth(4, 100)
        self.tasksTable.setColumnWidth(5, 100)
        self.tasksTable.setColumnWidth(6, 80)

        self.tasksTable.doubleClicked.connect(self._open_task_details)

        self._refresh_tasks_table()

        scrollLayout.addWidget(self.tasksTable, 1)

        scrollArea.setWidget(scrollWidget)
        layout.addWidget(scrollArea)

    def _refresh_tasks_table(self):
        """Refresh tasks table"""
        filtered = self._get_filtered_tasks()

        self.tasksTable.setRowCount(len(filtered))

        for rowIdx, task in enumerate(filtered):
            self.tasksTable.setItem(rowIdx, 0, QTableWidgetItem(task.title))
            self.tasksTable.setItem(rowIdx, 1, QTableWidgetItem(task.category))

            priorityItem = QTableWidgetItem(task.priority)
            priorityColor = "#ef4444" if task.priority == "HIGH" else "#fbbf24" if task.priority == "MEDIUM" else "#34d399"
            priorityItem.setForeground(QBrush(QColor(priorityColor)))
            self.tasksTable.setItem(rowIdx, 2, priorityItem)

            self.tasksTable.setItem(rowIdx, 3, QTableWidgetItem(task.assignedTo))
            self.tasksTable.setItem(rowIdx, 4, QTableWidgetItem(task.dueDate))

            statusItem = QTableWidgetItem(task.status)
            statusColor = "#34d399" if task.status == "COMPLETED" else "#38bdf8" if task.status == "IN_PROGRESS" else "#fbbf24"
            statusItem.setForeground(QBrush(QColor(statusColor)))
            self.tasksTable.setItem(rowIdx, 5, statusItem)

            viewBtn = QPushButton("👁️ View")
            viewBtn.setStyleSheet("background-color: #4f46e5; padding: 4px 8px; font-size: 9px;")
            viewBtn.clicked.connect(lambda checked, t=task: self._open_task_details_for(t))
            self.tasksTable.setCellWidget(rowIdx, 6, viewBtn)

    def _get_filtered_tasks(self) -> list:
        """Get filtered tasks"""
        result = []

        for task in self.tasksList:
            # Status filter
            if self.selectedStatus != "ALL" and task.status != self.selectedStatus:
                continue

            # Search filter
            if self.search.strip():
                q = self.search.lower()
                matches = (
                    q in task.title.lower() or
                    q in task.assignedTo.lower() or
                    q in task.category.lower()
                )
                if not matches:
                    continue

            result.append(task)

        return result

    def _on_search_changed(self):
        """Handle search input changed"""
        self.search = self.searchInput.text()
        self._refresh_tasks_table()

    def _set_status_filter(self, status: str):
        """Set status filter"""
        self.selectedStatus = status
        self._refresh_tasks_table()

    def _open_create_task(self):
        """Open create task modal"""
        dialog = CreateTaskModal(self)
        if dialog.exec() == QDialog.DialogCode.Accepted:
            task = dialog.get_task()
            self.tasksList.insert(0, task)
            self._refresh_tasks_table()
            QMessageBox.information(self, "✓ Task Created", f"Created task: {task.title}")

    def _open_task_details(self, index):
        """Open task details modal"""
        row = index.row()
        filtered = self._get_filtered_tasks()

        if row < len(filtered):
            task = filtered[row]
            dialog = TaskDetailsModal(task, self)
            dialog.exec()

    def _open_task_details_for(self, task: TaskItem):
        """Open task details modal for specific task"""
        dialog = TaskDetailsModal(task, self)
        dialog.exec()

"""
TasksView.swift — DAS CRM macOS
Task Management with Priority, Assignment, and Due Date Tracking
Feature parity with Android TasksScreen.tsx
"""

import SwiftUI

struct TaskItem: Identifiable {
    let id: String
    let title: String
    let description: String
    let assignedTo: String
    let dueDate: String
    let priority: String
    let status: String
    let category: String
}

let taskStatuses = ["TODO", "IN_PROGRESS", "COMPLETED"]
let taskCategories = ["FOLLOW_UP", "PROPOSAL", "MEETING", "OTHER"]
let taskPriorities = ["HIGH", "MEDIUM", "LOW"]

let fallbackTasks = [
    TaskItem(id: "t1", title: "Follow up with TechCorp", description: "Call Rajesh regarding proposal feedback",
            assignedTo: "Priya Sharma", dueDate: "2026-08-27", priority: "HIGH", status: "TODO", category: "FOLLOW_UP"),
    TaskItem(id: "t2", title: "Prepare Global Solutions proposal", description: "Complete pricing and scope document",
            assignedTo: "Vikram Mehta", dueDate: "2026-08-29", priority: "HIGH", status: "IN_PROGRESS", category: "PROPOSAL"),
    TaskItem(id: "t3", title: "Schedule demo with FastTrack", description: "Confirm meeting time with client",
            assignedTo: "Amit Patel", dueDate: "2026-08-28", priority: "MEDIUM", status: "TODO", category: "MEETING"),
    TaskItem(id: "t4", title: "Review contract terms", description: "Legal review of Premium Partners agreement",
            assignedTo: "Sunita Rao", dueDate: "2026-08-30", priority: "HIGH", status: "IN_PROGRESS", category: "OTHER"),
    TaskItem(id: "t5", title: "Send invoice to Regional Corp", description: "Invoice for completed integration project",
            assignedTo: "Rajesh Kumar", dueDate: "2026-08-26", priority: "MEDIUM", status: "COMPLETED", category: "OTHER"),
    TaskItem(id: "t6", title: "Update CRM with new leads", description: "Import leads from latest CSV upload",
            assignedTo: "Priya Sharma", dueDate: "2026-08-27", priority: "LOW", status: "TODO", category: "FOLLOW_UP"),
]

@MainActor
class TasksViewModel: ObservableObject {
    @Published var tasks: [TaskItem] = fallbackTasks
    @Published var search: String = ""
    @Published var selectedStatus: String = "ALL"

    var filteredTasks: [TaskItem] {
        tasks.filter { task in
            let passesStatusFilter = selectedStatus == "ALL" || task.status == selectedStatus
            let passesSearch: Bool
            if search.isEmpty {
                passesSearch = true
            } else {
                let q = search.lowercased()
                passesSearch = task.title.lowercased().contains(q) ||
                              task.assignedTo.lowercased().contains(q) ||
                              task.category.lowercased().contains(q)
            }
            return passesStatusFilter && passesSearch
        }
    }
}

struct TasksView: View {
    @StateObject private var viewModel = TasksViewModel()
    @State private var selectedTask: TaskItem?
    @State private var showTaskDetails = false
    @State private var showCreateTask = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 12) {
                Text("✓ Tasks & Follow-ups")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)

                // Search input
                HStack(spacing: 8) {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(Color(red: 0.40, green: 0.45, blue: 0.52))
                    TextField("🔍 Search by task title, assignee...", text: $viewModel.search)
                        .textFieldStyle(.plain)
                        .foregroundColor(.white)

                    if !viewModel.search.isEmpty {
                        Button(action: { viewModel.search = "" }) {
                            Image(systemName: "xmark.circle.fill")
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                        }
                        .buttonStyle(.plain)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.vertical, 8)
                .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                .cornerRadius(8)

                // Action buttons
                HStack {
                    Button(action: { showCreateTask = true }) {
                        Text("➕ New Task")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 12)
                            .padding(.vertical, 6)
                            .background(Color(red: 0.06, green: 0.68, blue: 0.50))
                            .cornerRadius(6)
                    }
                    .buttonStyle(.plain)

                    Spacer()
                }

                // Status filter chips
                HStack(spacing: 6) {
                    ForEach(["ALL"] + taskStatuses, id: \.self) { status in
                        Button(action: { viewModel.selectedStatus = status }) {
                            Text(status)
                                .font(.system(size: 9, weight: .bold))
                                .foregroundColor(viewModel.selectedStatus == status ? .white : Color(red: 0.58, green: 0.64, blue: 0.68))
                        }
                        .buttonStyle(.plain)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 4)
                        .background(viewModel.selectedStatus == status ? Color(red: 0.31, green: 0.27, blue: 0.90) : Color(red: 0.02, green: 0.06, blue: 0.12))
                        .border(viewModel.selectedStatus == status ? Color(red: 0.31, green: 0.27, blue: 0.90) : Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                        .cornerRadius(6)
                    }
                    Spacer()
                }
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)

            // Tasks Table
            Table(viewModel.filteredTasks) {
                TableColumn("Task", value: \.title)
                TableColumn("Category", value: \.category)
                TableColumn("Priority") { task in
                    Text(task.priority)
                        .foregroundColor(
                            task.priority == "HIGH" ? Color(red: 0.98, green: 0.30, blue: 0.40) :
                            task.priority == "MEDIUM" ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                            Color(red: 0.2, green: 0.83, blue: 0.60)
                        )
                }
                TableColumn("Assigned To", value: \.assignedTo)
                TableColumn("Due Date", value: \.dueDate)
                TableColumn("Status") { task in
                    Text(task.status)
                        .foregroundColor(
                            task.status == "COMPLETED" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                            task.status == "IN_PROGRESS" ? Color(red: 0.38, green: 0.65, blue: 0.98) :
                            Color(red: 0.98, green: 0.75, blue: 0.14)
                        )
                }
                TableColumn("Action") { task in
                    Button(action: {
                        selectedTask = task
                        showTaskDetails = true
                    }) {
                        Text("👁️ View")
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                            .cornerRadius(4)
                    }
                    .buttonStyle(.plain)
                }
            }
            .background(Color(red: 0.03, green: 0.04, blue: 0.07))
            .onDoubleClickSelectAll(false)
        }
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        .navigationTitle("Tasks")
        .sheet(isPresented: $showTaskDetails) {
            if let task = selectedTask {
                TaskDetailsSheet(task: task, isPresented: $showTaskDetails)
            }
        }
        .sheet(isPresented: $showCreateTask) {
            CreateTaskSheet(tasks: $viewModel.tasks, isPresented: $showCreateTask)
        }
    }
}

struct TaskDetailsSheet: View {
    let task: TaskItem
    @Binding var isPresented: Bool
    @State private var showEditAlert = false
    @State private var showCompleteAlert = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("✓ \(task.title)")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                        }
                        Spacer()

                        Text(task.status)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(
                                task.status == "COMPLETED" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                                task.status == "IN_PROGRESS" ? Color(red: 0.38, green: 0.65, blue: 0.98) :
                                Color(red: 0.98, green: 0.75, blue: 0.14)
                            )
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                (task.status == "COMPLETED" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                                task.status == "IN_PROGRESS" ? Color(red: 0.38, green: 0.65, blue: 0.98) :
                                Color(red: 0.98, green: 0.75, blue: 0.14)).opacity(0.15)
                            )
                            .cornerRadius(4)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Task Info
                    VStack(alignment: .leading, spacing: 8) {
                        Text("📋 Task Information")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Title", value: task.title)
                        DetailRow(label: "Description", value: task.description)
                        DetailRow(label: "Category", value: task.category)
                        DetailRow(label: "Priority", value: task.priority)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Assignment
                    VStack(alignment: .leading, spacing: 8) {
                        Text("👤 Assignment")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Assigned To", value: task.assignedTo)
                        DetailRow(label: "Due Date", value: task.dueDate)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    Spacer()

                    // Action Buttons
                    HStack(spacing: 8) {
                        Button(action: { showEditAlert = true }) {
                            Text("✏️ Edit")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.98, green: 0.58, blue: 0.09))
                                .cornerRadius(6)
                        }
                        Button(action: { showCompleteAlert = true }) {
                            Text("✅ Complete")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.06, green: 0.68, blue: 0.50))
                                .cornerRadius(6)
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
            .navigationTitle("Task Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        isPresented = false
                    }
                }
            }
            .alert("✏️ Edit Task", isPresented: $showEditAlert) {
                Button("OK") { }
            } message: {
                Text("Editing \(task.title)...")
            }
            .alert("✅ Complete Task", isPresented: $showCompleteAlert) {
                Button("OK") { }
            } message: {
                Text("Marking \(task.title) as complete...")
            }
        }
    }
}

struct CreateTaskSheet: View {
    @Binding var tasks: [TaskItem]
    @Binding var isPresented: Bool

    @State private var title = ""
    @State private var description = ""
    @State private var category = "FOLLOW_UP"
    @State private var priority = "MEDIUM"
    @State private var assignedTo = ""
    @State private var dueDate = Date()

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    Text("➕ Create New Task")
                        .font(.system(size: 13, weight: .bold))
                        .foregroundColor(.white)

                    Text("Create a new task and assign it to a team member.")
                        .font(.system(size: 10))
                        .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))

                    VStack(alignment: .leading, spacing: 8) {
                        Text("Task Title *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("e.g. Follow up with client", text: $title)
                            .textFieldStyle(.roundedBorder)

                        Text("Description")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("Task details...", text: $description)
                            .textFieldStyle(.roundedBorder)

                        Text("Category *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Picker("Category", selection: $category) {
                            ForEach(taskCategories, id: \.self) { Text($0) }
                        }
                        .pickerStyle(.menu)

                        Text("Priority *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        Picker("Priority", selection: $priority) {
                            ForEach(taskPriorities, id: \.self) { Text($0) }
                        }
                        .pickerStyle(.menu)

                        Text("Assign To *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        TextField("e.g. Rajesh Kumar", text: $assignedTo)
                            .textFieldStyle(.roundedBorder)

                        Text("Due Date *")
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                        DatePicker("", selection: $dueDate, displayedComponents: .date)
                            .datePickerStyle(.compact)
                    }

                    Spacer()

                    HStack(spacing: 8) {
                        Button(action: { isPresented = false }) {
                            Text("Cancel")
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.12, green: 0.16, blue: 0.23))
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                                .cornerRadius(6)
                        }
                        Button(action: {
                            let newTask = TaskItem(
                                id: "t-\(UUID())",
                                title: title,
                                description: description,
                                assignedTo: assignedTo,
                                dueDate: dueDate.formatted(date: .numeric, time: .omitted),
                                priority: priority,
                                status: "TODO",
                                category: category
                            )
                            tasks.insert(newTask, at: 0)
                            isPresented = false
                        }) {
                            Text("Create Task ✓")
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.06, green: 0.68, blue: 0.50))
                                .foregroundColor(.white)
                                .cornerRadius(6)
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
            .navigationTitle("New Task")
            .navigationBarTitleDisplayMode(.inline)
        }
    }
}

struct DetailRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack {
            Text("\(label):")
                .font(.system(size: 10, weight: .bold))
                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                .frame(width: 100, alignment: .leading)
            Text(value)
                .font(.system(size: 10))
                .foregroundColor(Color(red: 0.79, green: 0.84, blue: 0.88))
                .lineLimit(2)
            Spacer()
        }
    }
}

#Preview {
    NavigationView {
        TasksView()
    }
}

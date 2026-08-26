"""
HRView.swift — DAS CRM macOS
HR Management with Employee Records, Attendance, and Leave Tracking
Feature parity with Android HRScreen.tsx
"""

import SwiftUI

struct EmployeeRecord: Identifiable {
    let id: String
    let name: String
    let email: String
    let role: String
    let department: String
    let joinDate: String
    let status: String
}

struct AttendanceRecord: Identifiable {
    let id: String
    let employeeId: String
    let employeeName: String
    let date: String
    let checkIn: String
    let checkOut: String
    let hoursWorked: String
    let status: String
}

struct LeaveRecord: Identifiable {
    let id: String
    let employeeName: String
    let leaveType: String
    let fromDate: String
    let toDate: String
    let days: Int
    let reason: String
    let status: String
}

let fallbackEmployees = [
    EmployeeRecord(id: "e1", name: "Rajesh Kumar", email: "rajesh@crm.com", role: "Sales Executive",
                  department: "Sales", joinDate: "2023-06-15", status: "ACTIVE"),
    EmployeeRecord(id: "e2", name: "Priya Sharma", email: "priya@crm.com", role: "Sales Executive",
                  department: "Sales", joinDate: "2023-08-20", status: "ACTIVE"),
    EmployeeRecord(id: "e3", name: "Vikram Mehta", email: "vikram@crm.com", role: "Senior Sales Rep",
                  department: "Sales", joinDate: "2022-03-10", status: "ACTIVE"),
    EmployeeRecord(id: "e4", name: "Sunita Rao", email: "sunita@crm.com", role: "Sales Manager",
                  department: "Sales", joinDate: "2021-01-05", status: "ACTIVE"),
    EmployeeRecord(id: "e5", name: "Amit Patel", email: "amit@crm.com", role: "Sales Executive",
                  department: "Sales", joinDate: "2024-02-01", status: "ON_LEAVE"),
]

let fallbackAttendance = [
    AttendanceRecord(id: "a1", employeeId: "e1", employeeName: "Rajesh Kumar", date: "2026-08-26",
                    checkIn: "09:05", checkOut: "18:32", hoursWorked: "9.5 hrs", status: "PRESENT"),
    AttendanceRecord(id: "a2", employeeId: "e2", employeeName: "Priya Sharma", date: "2026-08-26",
                    checkIn: "09:15", checkOut: "18:45", hoursWorked: "9.5 hrs", status: "PRESENT"),
    AttendanceRecord(id: "a3", employeeId: "e3", employeeName: "Vikram Mehta", date: "2026-08-26",
                    checkIn: "08:55", checkOut: "18:20", hoursWorked: "9.4 hrs", status: "PRESENT"),
    AttendanceRecord(id: "a4", employeeId: "e4", employeeName: "Sunita Rao", date: "2026-08-26",
                    checkIn: "10:30", checkOut: "19:00", hoursWorked: "8.5 hrs", status: "LATE"),
    AttendanceRecord(id: "a5", employeeId: "e5", employeeName: "Amit Patel", date: "2026-08-26",
                    checkIn: "---", checkOut: "---", hoursWorked: "0 hrs", status: "ABSENT"),
]

let fallbackLeaves = [
    LeaveRecord(id: "l1", employeeName: "Amit Patel", leaveType: "SICK", fromDate: "2026-08-24",
               toDate: "2026-08-26", days: 3, reason: "Medical emergency", status: "APPROVED"),
    LeaveRecord(id: "l2", employeeName: "Priya Sharma", leaveType: "CASUAL", fromDate: "2026-09-01",
               toDate: "2026-09-02", days: 2, reason: "Personal work", status: "PENDING"),
    LeaveRecord(id: "l3", employeeName: "Rajesh Kumar", leaveType: "ANNUAL", fromDate: "2026-09-10",
               toDate: "2026-09-17", days: 8, reason: "Vacation", status: "PENDING"),
]

@MainActor
class HRViewModel: ObservableObject {
    @Published var employees: [EmployeeRecord] = fallbackEmployees
    @Published var attendance: [AttendanceRecord] = fallbackAttendance
    @Published var leaves: [LeaveRecord] = fallbackLeaves
    @Published var selectedTab: String = "EMPLOYEES"
}

struct HRView: View {
    @StateObject private var viewModel = HRViewModel()
    @State private var selectedEmployee: EmployeeRecord?
    @State private var showEmployeeDetails = false

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Header
            VStack(alignment: .leading, spacing: 12) {
                Text("👥 HR Management")
                    .font(.system(size: 14, weight: .bold))
                    .foregroundColor(.white)
            }
            .padding(16)
            .background(Color(red: 0.06, green: 0.09, blue: 0.16))
            .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)

            // Tab Selection
            HStack(spacing: 8) {
                ForEach(["EMPLOYEES", "ATTENDANCE", "LEAVES"], id: \.self) { tab in
                    Button(action: { viewModel.selectedTab = tab }) {
                        Text(tab)
                            .font(.system(size: 10, weight: .bold))
                            .foregroundColor(viewModel.selectedTab == tab ? .white : Color(red: 0.58, green: 0.64, blue: 0.68))
                    }
                    .buttonStyle(.plain)
                    .padding(.horizontal, 12)
                    .padding(.vertical, 6)
                    .background(viewModel.selectedTab == tab ? Color(red: 0.31, green: 0.27, blue: 0.90) : Color(red: 0.02, green: 0.06, blue: 0.12))
                    .border(viewModel.selectedTab == tab ? Color(red: 0.31, green: 0.27, blue: 0.90) : Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(6)
                }
                Spacer()
            }
            .padding(12)
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))

            // Content
            Group {
                if viewModel.selectedTab == "EMPLOYEES" {
                    EmployeesTabView(employees: viewModel.employees, onEmployeeTapped: { emp in
                        selectedEmployee = emp
                        showEmployeeDetails = true
                    })
                } else if viewModel.selectedTab == "ATTENDANCE" {
                    AttendanceTabView(attendance: viewModel.attendance)
                } else {
                    LeavesTabView(leaves: viewModel.leaves)
                }
            }
        }
        .background(Color(red: 0.06, green: 0.08, blue: 0.14))
        .navigationTitle("HR")
        .sheet(isPresented: $showEmployeeDetails) {
            if let employee = selectedEmployee {
                EmployeeDetailsSheet(employee: employee, isPresented: $showEmployeeDetails)
            }
        }
    }
}

struct EmployeesTabView: View {
    let employees: [EmployeeRecord]
    let onEmployeeTapped: (EmployeeRecord) -> Void

    var body: some View {
        Table(employees) {
            TableColumn("Name", value: \.name)
            TableColumn("Email", value: \.email)
            TableColumn("Role", value: \.role)
            TableColumn("Department", value: \.department)
            TableColumn("Join Date", value: \.joinDate)
            TableColumn("Status") { employee in
                Text(employee.status)
                    .foregroundColor(
                        employee.status == "ACTIVE" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                        employee.status == "ON_LEAVE" ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                        Color(red: 0.98, green: 0.30, blue: 0.40)
                    )
            }
        }
        .background(Color(red: 0.03, green: 0.04, blue: 0.07))
        .onDoubleClickSelectAll(false)
        .onReceive([employee].publisher.dropFirst(), perform: { _ in
            if let first = employees.first {
                onEmployeeTapped(first)
            }
        })
    }
}

struct AttendanceTabView: View {
    let attendance: [AttendanceRecord]

    var body: some View {
        Table(attendance) {
            TableColumn("Name", value: \.employeeName)
            TableColumn("Date", value: \.date)
            TableColumn("Check-In", value: \.checkIn)
            TableColumn("Check-Out", value: \.checkOut)
            TableColumn("Hours Worked", value: \.hoursWorked)
            TableColumn("Status") { record in
                Text(record.status)
                    .foregroundColor(
                        record.status == "PRESENT" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                        record.status == "LATE" ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                        Color(red: 0.98, green: 0.30, blue: 0.40)
                    )
            }
        }
        .background(Color(red: 0.03, green: 0.04, blue: 0.07))
        .onDoubleClickSelectAll(false)
    }
}

struct LeavesTabView: View {
    let leaves: [LeaveRecord]

    var body: some View {
        Table(leaves) {
            TableColumn("Employee", value: \.employeeName)
            TableColumn("Type", value: \.leaveType)
            TableColumn("From Date", value: \.fromDate)
            TableColumn("To Date", value: \.toDate)
            TableColumn("Days") { leave in
                Text(String(leave.days))
            }
            TableColumn("Reason", value: \.reason)
            TableColumn("Status") { leave in
                Text(leave.status)
                    .foregroundColor(
                        leave.status == "APPROVED" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                        leave.status == "PENDING" ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                        Color(red: 0.98, green: 0.30, blue: 0.40)
                    )
            }
        }
        .background(Color(red: 0.03, green: 0.04, blue: 0.07))
        .onDoubleClickSelectAll(false)
    }
}

struct EmployeeDetailsSheet: View {
    let employee: EmployeeRecord
    @Binding var isPresented: Bool
    @State private var showEditAlert = false
    @State private var showContactAlert = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 12) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("👤 \(employee.name)")
                                .font(.system(size: 16, weight: .bold))
                                .foregroundColor(.white)
                            Text(employee.role)
                                .font(.system(size: 11))
                                .foregroundColor(Color(red: 0.58, green: 0.64, blue: 0.68))
                        }
                        Spacer()

                        Text(employee.status)
                            .font(.system(size: 9, weight: .bold))
                            .foregroundColor(
                                employee.status == "ACTIVE" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                                employee.status == "ON_LEAVE" ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                                Color(red: 0.98, green: 0.30, blue: 0.40)
                            )
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(
                                (employee.status == "ACTIVE" ? Color(red: 0.2, green: 0.83, blue: 0.60) :
                                employee.status == "ON_LEAVE" ? Color(red: 0.98, green: 0.75, blue: 0.14) :
                                Color(red: 0.98, green: 0.30, blue: 0.40)).opacity(0.15)
                            )
                            .cornerRadius(4)
                    }
                    .padding(12)
                    .background(Color(red: 0.06, green: 0.09, blue: 0.16))
                    .border(Color(red: 0.12, green: 0.16, blue: 0.23), width: 1)
                    .cornerRadius(12)

                    // Employee Info
                    VStack(alignment: .leading, spacing: 8) {
                        Text("📋 Employee Information")
                            .font(.system(size: 11, weight: .bold))
                            .foregroundColor(.white)

                        DetailRow(label: "Name", value: employee.name)
                        DetailRow(label: "Email", value: employee.email)
                        DetailRow(label: "Role", value: employee.role)
                        DetailRow(label: "Department", value: employee.department)
                        DetailRow(label: "Join Date", value: employee.joinDate)
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
                        Button(action: { showContactAlert = true }) {
                            Text("📧 Contact")
                                .font(.system(size: 10, weight: .bold))
                                .foregroundColor(.white)
                                .frame(maxWidth: .infinity)
                                .padding(8)
                                .background(Color(red: 0.31, green: 0.27, blue: 0.90))
                                .cornerRadius(6)
                        }
                    }
                }
                .padding(16)
            }
            .background(Color(red: 0.06, green: 0.08, blue: 0.14))
            .navigationTitle("Employee Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Close") {
                        isPresented = false
                    }
                }
            }
            .alert("✏️ Edit Employee", isPresented: $showEditAlert) {
                Button("OK") { }
            } message: {
                Text("Editing \(employee.name)...")
            }
            .alert("📧 Contact", isPresented: $showContactAlert) {
                Button("OK") { }
            } message: {
                Text("Contacting \(employee.email)...")
            }
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
        HRView()
    }
}

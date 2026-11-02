"""
views_interior_calculator.py — DAS CRM Windows Interior Cost Calculator & 2D/3D Studio
Full desktop implementation with persistent top navigation:
1. All Quotations
2. All 2D & 3D Diagrams
3. Lead History
4. Interior Calculator & 3D Studio Workflow
"""
from PyQt6.QtCore import Qt, pyqtSignal
from PyQt6.QtGui import QFont, QColor
from PyQt6.QtWidgets import (QWidget, QVBoxLayout, QHBoxLayout, QLabel,
                              QFrame, QPushButton, QScrollArea, QTableWidget,
                              QTableWidgetItem, QHeaderView, QAbstractItemView,
                              QLineEdit, QComboBox, QMessageBox, QTabWidget,
                              QTextEdit, QSpinBox, QDoubleSpinBox, QCheckBox,
                              QDialog, QFormLayout)
import webbrowser


class InteriorCalculatorView(QFrame):
    """Interior Cost Calculator & 2D/3D Design Studio View for Windows."""
    refreshed = pyqtSignal()

    SAMPLE_LEADS = [
        {"id": "lead-001", "name": "Rajesh Sharma", "phone": "+91 98201 44521", "property": "3BHK Apartment", "budget": "₹18,50,000", "status": "Qualified"},
        {"id": "lead-002", "name": "Pooja & Vikram Verma", "phone": "+91 99308 12760", "property": "4BHK Villa", "budget": "₹32,00,000", "status": "Site Done"},
        {"id": "lead-003", "name": "Ananya Deshmukh", "phone": "+91 98190 33412", "property": "Penthouse", "budget": "₹45,00,000", "status": "In Design"},
    ]

    def __init__(self, parent=None):
        super().__init__(parent)
        self.setStyleSheet("background: #0D1117; border: none;")
        self._selected_lead = self.SAMPLE_LEADS[0]
        self._active_room_idx = 0
        self._rooms = [
            {"name": "Living & Dining Lounge", "type": "Living Room", "shape": "Rectangle", "l": 18.0, "w": 14.0, "h": 10.0, "wall_width": 4.5, "area": 252.0, "peri": 64.0, "wall_area": 640.0},
            {"name": "Master Suite", "type": "Master Bedroom", "shape": "Rectangle", "l": 16.0, "w": 12.0, "h": 10.0, "wall_width": 4.5, "area": 192.0, "peri": 56.0, "wall_area": 560.0},
            {"name": "Modular Kitchen", "type": "Kitchen", "shape": "Rectangle", "l": 12.0, "w": 10.0, "h": 10.0, "wall_width": 4.5, "area": 120.0, "peri": 44.0, "wall_area": 440.0},
        ]
        self._setup_ui()

    def _setup_ui(self):
        main_layout = QVBoxLayout(self)
        main_layout.setContentsMargins(20, 20, 20, 20)
        main_layout.setSpacing(16)

        # ── Persistent Top Navigation Bar (Always at TOP) ────────────────
        top_bar = QFrame()
        top_bar.setStyleSheet("""
            QFrame {
                background: #161B22;
                border: 1px solid #30363D;
                border-radius: 12px;
                padding: 4px;
            }
        """)
        top_bar_layout = QHBoxLayout(top_bar)
        top_bar_layout.setContentsMargins(12, 8, 12, 8)

        # Header Title
        title_box = QVBoxLayout()
        title_lbl = QLabel("🛋️ Interior Cost Studio & 3D Designer")
        title_lbl.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
        title_lbl.setStyleSheet("color: #F0F6FC; border: none;")
        self.sub_lbl = QLabel(f"Active Lead: {self._selected_lead['name']} ({self._selected_lead['phone']})")
        self.sub_lbl.setFont(QFont("Segoe UI", 9))
        self.sub_lbl.setStyleSheet("color: #7EE787; border: none;")
        title_box.addWidget(title_lbl)
        title_box.addWidget(self.sub_lbl)
        top_bar_layout.addLayout(title_box)

        top_bar_layout.addStretch()

        # Top Navigation Tabs
        self.btn_tab_workflow = QPushButton("Design & Calculator")
        self.btn_tab_quotes = QPushButton("All Quotations")
        self.btn_tab_diagrams = QPushButton("All 2D & 3D Diagrams")
        self.btn_tab_history = QPushButton("Lead History")

        tab_buttons = [self.btn_tab_workflow, self.btn_tab_quotes, self.btn_tab_diagrams, self.btn_tab_history]
        for btn in tab_buttons:
            btn.setCheckable(True)
            btn.setCursor(Qt.CursorShape.PointingHandCursor)
            btn.setStyleSheet("""
                QPushButton {
                    background: transparent;
                    color: #8B949E;
                    border: 1px solid transparent;
                    border-radius: 8px;
                    padding: 8px 14px;
                    font-weight: bold;
                    font-size: 11px;
                }
                QPushButton:hover {
                    color: #F0F6FC;
                    background: #21262D;
                }
                QPushButton:checked {
                    background: #F43F5E;
                    color: #FFFFFF;
                }
            """)
            top_bar_layout.addWidget(btn)

        self.btn_tab_workflow.setChecked(True)
        self.btn_tab_workflow.clicked.connect(lambda: self._switch_main_tab(0))
        self.btn_tab_quotes.clicked.connect(lambda: self._switch_main_tab(1))
        self.btn_tab_diagrams.clicked.connect(lambda: self._switch_main_tab(2))
        self.btn_tab_history.clicked.connect(lambda: self._switch_main_tab(3))

        # Launch 3D Web Studio Button
        launch_btn = QPushButton("Launch 3D WebGL Studio ↗")
        launch_btn.setCursor(Qt.CursorShape.PointingHandCursor)
        launch_btn.setStyleSheet("""
            QPushButton {
                background: qlineargradient(x1:0, y1:0, x2:1, y2:0, stop:0 #6366F1, stop:1 #EC4899);
                color: #FFFFFF;
                border-radius: 8px;
                padding: 8px 14px;
                font-weight: bold;
                font-size: 11px;
            }
            QPushButton:hover {
                background: #4F46E5;
            }
        """)
        launch_btn.clicked.connect(self._launch_web_studio)
        top_bar_layout.addWidget(launch_btn)

        main_layout.addWidget(top_bar)

        # ── Main Content Area ─────────────────────────────────────────
        self.content_tabs = QTabWidget()
        self.content_tabs.tabBar().hide()
        self.content_tabs.setStyleSheet("background: transparent; border: none;")

        # Tab 0: 7-Step Calculator Workflow
        self.tab_workflow = self._create_workflow_tab()
        self.content_tabs.addTab(self.tab_workflow, "Workflow")

        # Tab 1: All Quotations
        self.tab_quotes = self._create_quotes_tab()
        self.content_tabs.addTab(self.tab_quotes, "Quotations")

        # Tab 2: All 2D & 3D Diagrams
        self.tab_diagrams = self._create_diagrams_tab()
        self.content_tabs.addTab(self.tab_diagrams, "Diagrams")

        # Tab 3: Lead History
        self.tab_history = self._create_history_tab()
        self.content_tabs.addTab(self.tab_history, "History")

        main_layout.addWidget(self.content_tabs, 1)

    def _switch_main_tab(self, idx: int):
        self.btn_tab_workflow.setChecked(idx == 0)
        self.btn_tab_quotes.setChecked(idx == 1)
        self.btn_tab_diagrams.setChecked(idx == 2)
        self.btn_tab_history.setChecked(idx == 3)
        self.content_tabs.setCurrentIndex(idx)

    def _launch_web_studio(self):
        webbrowser.open("http://localhost:3000/calculators/interior-designer")

    # ── Workflow Tab ──────────────────────────────────────────────────
    def _create_workflow_tab(self) -> QWidget:
        w = QWidget()
        layout = QVBoxLayout(w)
        layout.setContentsMargins(0, 0, 0, 0)
        layout.setSpacing(12)

        # Stepper Banner
        stepper_box = QFrame()
        stepper_box.setStyleSheet("background: #161B22; border: 1px solid #30363D; border-radius: 10px; padding: 6px;")
        step_layout = QHBoxLayout(stepper_box)

        steps = ["1. Select Lead", "2. Project Area", "3. Rooms & Dims", "4. Work Scope", "5. 3D Studio", "6. Live BOQ", "7. Quotation Output"]
        self.step_buttons = []
        for i, st in enumerate(steps):
            b = QPushButton(st)
            b.setCheckable(True)
            b.setStyleSheet("""
                QPushButton {
                    background: transparent;
                    color: #8B949E;
                    border: 1px solid #30363D;
                    border-radius: 6px;
                    padding: 6px 10px;
                    font-size: 10px;
                    font-weight: 600;
                }
                QPushButton:checked {
                    background: #238636;
                    color: #FFFFFF;
                    border-color: #2EA043;
                }
            """)
            b.clicked.connect(lambda _, step_idx=i: self.workflow_stack.setCurrentIndex(step_idx))
            step_layout.addWidget(b)
            self.step_buttons.append(b)

        if self.step_buttons:
            self.step_buttons[0].setChecked(True)

        layout.addWidget(stepper_box)

        # Workflow steps sub-stack
        self.workflow_stack = QTabWidget()
        self.workflow_stack.tabBar().hide()
        self.workflow_stack.setStyleSheet("background: transparent; border: none;")

        # Step 1: Lead Selector
        self.workflow_stack.addTab(self._build_step_lead(), "Step 1")
        # Step 2: Project
        self.workflow_stack.addTab(self._build_step_project(), "Step 2")
        # Step 3: Rooms & Dims
        self.workflow_stack.addTab(self._build_step_rooms(), "Step 3")
        # Step 4: Categories
        self.workflow_stack.addTab(self._build_step_categories(), "Step 4")
        # Step 5: Studio
        self.workflow_stack.addTab(self._build_step_studio(), "Step 5")
        # Step 6: BOQ
        self.workflow_stack.addTab(self._build_step_boq(), "Step 6")
        # Step 7: Quote
        self.workflow_stack.addTab(self._build_step_quote(), "Step 7")

        layout.addWidget(self.workflow_stack, 1)
        return w

    def _build_step_lead(self) -> QWidget:
        w = QFrame()
        w.setStyleSheet("background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px;")
        lay = QVBoxLayout(w)

        lbl = QLabel("Step 1: Select CRM Lead (Mandatory Gate)")
        lbl.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        lbl.setStyleSheet("color: #F0F6FC;")
        lay.addWidget(lbl)

        sub = QLabel("Select an active lead from your CRM pipeline to link project calculations and rate snapshots.")
        sub.setStyleSheet("color: #8B949E; font-size: 11px;")
        lay.addWidget(sub)

        # Table of Leads
        table = QTableWidget(len(self.SAMPLE_LEADS), 5)
        table.setHorizontalHeaderLabels(["Lead Name", "Phone", "Property Type", "Budget (INR)", "Action"])
        table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        table.setStyleSheet("background: #0D1117; color: #F0F6FC; gridline-color: #21262D; border: 1px solid #30363D;")
        table.verticalHeader().hide()

        for row, lead in enumerate(self.SAMPLE_LEADS):
            table.setItem(row, 0, QTableWidgetItem(lead["name"]))
            table.setItem(row, 1, QTableWidgetItem(lead["phone"]))
            table.setItem(row, 2, QTableWidgetItem(lead["property"]))
            table.setItem(row, 3, QTableWidgetItem(lead["budget"]))

            sel_btn = QPushButton("Select Lead →")
            sel_btn.setStyleSheet("background: #238636; color: #fff; font-weight: bold; border-radius: 4px; padding: 4px;")
            sel_btn.clicked.connect(lambda _, l=lead: self._on_select_lead(l))
            table.setCellWidget(row, 4, sel_btn)

        lay.addWidget(table)
        return w

    def _on_select_lead(self, lead: dict):
        self._selected_lead = lead
        self.sub_lbl.setText(f"Active Lead: {lead['name']} ({lead['phone']})")
        self.workflow_stack.setCurrentIndex(1)
        self.step_buttons[1].setChecked(True)
        QMessageBox.information(self, "Lead Selected", f"Successfully linked lead: {lead['name']}")

    def _build_step_project(self) -> QWidget:
        w = QFrame()
        w.setStyleSheet("background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px;")
        lay = QVBoxLayout(w)

        lbl = QLabel("Step 2: Project Metadata & Building Level")
        lbl.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        lbl.setStyleSheet("color: #F0F6FC;")
        lay.addWidget(lbl)

        lay.addWidget(QLabel("Project Title:", styleSheet="color: #8B949E; font-weight: 600;"))
        self.p_title_input = QLineEdit("Rajesh Sharma Villa Interior Project")
        self.p_title_input.setStyleSheet("background: #0D1117; color: #F0F6FC; border: 1px solid #30363D; border-radius: 6px; padding: 6px;")
        lay.addWidget(self.p_title_input)

        lay.addWidget(QLabel("Building Level:", styleSheet="color: #8B949E; font-weight: 600;"))
        self.level_combo = QComboBox()
        self.level_combo.addItems(["Basement", "Ground Floor", "First Floor", "Second Floor", "Terrace", "Penthouse"])
        self.level_combo.setStyleSheet("background: #0D1117; color: #F0F6FC; border: 1px solid #30363D; border-radius: 6px; padding: 6px;")
        lay.addWidget(self.level_combo)

        next_btn = QPushButton("Proceed to Room Measurements →")
        next_btn.setStyleSheet("background: #F43F5E; color: #fff; font-weight: bold; border-radius: 6px; padding: 10px;")
        next_btn.clicked.connect(lambda: self.workflow_stack.setCurrentIndex(2))
        lay.addWidget(next_btn)

        lay.addStretch()
        return w

    def _compute_metrics(self, l: float, w: float, h: float, shape: str):
        if shape == "Square":
            area = round(l * l, 1)
            peri = round(4 * l, 1)
        elif shape == "L-Shape":
            cut_l = l * 0.45
            cut_w = w * 0.45
            area = round(l * w - cut_l * cut_w, 1)
            peri = round(2 * (l + w), 1)
        else:
            area = round(l * w, 1)
            peri = round(2 * (l + w), 1)
        wall_area = round(peri * h, 1)
        return area, peri, wall_area

    def _open_edit_room_dialog(self, room_idx: int = -1):
        is_edit = room_idx >= 0
        target = self._rooms[room_idx] if is_edit else {
            "name": "New Room",
            "type": "Bedroom",
            "shape": "Rectangle",
            "l": 14.0,
            "w": 12.0,
            "h": 10.0,
            "wall_width": 4.5,
            "area": 168.0,
            "peri": 52.0,
            "wall_area": 520.0,
        }

        dlg = QDialog(self)
        dlg.setWindowTitle("Edit Room Architecture & Dimensions" if is_edit else "Add New Room")
        dlg.setMinimumWidth(440)
        dlg.setStyleSheet("""
            QDialog { background: #161B22; color: #F0F6FC; }
            QLabel { color: #8B949E; font-size: 11px; font-weight: bold; }
            QLineEdit, QComboBox, QDoubleSpinBox {
                background: #0D1117; color: #F0F6FC; border: 1px solid #30363D;
                border-radius: 6px; padding: 6px; font-size: 12px;
            }
            QPushButton {
                background: #F43F5E; color: #fff; font-weight: bold;
                border-radius: 6px; padding: 8px 16px;
            }
        """)
        d_lay = QVBoxLayout(dlg)
        form = QFormLayout()

        name_in = QLineEdit(target["name"])
        type_in = QComboBox()
        type_in.addItems(["Living Room", "Master Bedroom", "Bedroom", "Kitchen", "Bathroom", "Dining Room"])
        type_in.setCurrentText(target.get("type", "Living Room"))

        shape_in = QComboBox()
        shape_in.addItems(["Rectangle", "Square", "L-Shape", "T-Shape"])
        shape_in.setCurrentText(target.get("shape", "Rectangle"))

        l_in = QDoubleSpinBox()
        l_in.setRange(4.0, 100.0)
        l_in.setValue(target["l"])

        w_in = QDoubleSpinBox()
        w_in.setRange(4.0, 100.0)
        w_in.setValue(target["w"])

        h_in = QDoubleSpinBox()
        h_in.setRange(7.0, 30.0)
        h_in.setValue(target.get("h", 10.0))

        wall_in = QComboBox()
        wall_in.addItems(["4.5\" Partition", "6.0\" Shear Wall", "9.0\" Brick Wall", "12.0\" Heavy Masonry"])
        cur_w = f"{target.get('wall_width', 4.5)}\""
        for i in range(wall_in.count()):
            if cur_w in wall_in.itemText(i):
                wall_in.setCurrentIndex(i)

        calc_lbl = QLabel(f"Carpet Area: {target['area']} sq.ft | Wall Area: {target.get('wall_area', 0)} sq.ft | Perimeter: {target['peri']} ft")
        calc_lbl.setStyleSheet("color: #F43F5E; font-weight: bold; font-size: 12px; margin-top: 6px;")

        def update_preview():
            shp = shape_in.currentText()
            w_in.setEnabled(shp != "Square")
            if shp == "Square":
                w_in.setValue(l_in.value())
            a, p, wa = self._compute_metrics(l_in.value(), w_in.value(), h_in.value(), shp)
            calc_lbl.setText(f"Carpet Area: {a} sq.ft | Wall Area: {wa} sq.ft | Perimeter: {p} ft")

        shape_in.currentTextChanged.connect(update_preview)
        l_in.valueChanged.connect(update_preview)
        w_in.valueChanged.connect(update_preview)
        h_in.valueChanged.connect(update_preview)

        form.addRow("Room Name:", name_in)
        form.addRow("Room Type:", type_in)
        form.addRow("Boundary Shape:", shape_in)
        form.addRow("Length (ft):", l_in)
        form.addRow("Width (ft):", w_in)
        form.addRow("Height (ft):", h_in)
        form.addRow("Wall Thickness:", wall_in)
        form.addRow("Calculated Metrics:", calc_lbl)
        d_lay.addLayout(form)

        btn_row = QHBoxLayout()
        cancel_btn = QPushButton("Cancel")
        cancel_btn.setStyleSheet("background: #21262D; color: #C9D1D9;")
        cancel_btn.clicked.connect(dlg.reject)
        save_btn = QPushButton("Save Room & Recalculate")

        def on_save():
            shp = shape_in.currentText()
            l_val = l_in.value()
            w_val = l_val if shp == "Square" else w_in.value()
            h_val = h_in.value()
            a, p, wa = self._compute_metrics(l_val, w_val, h_val, shp)
            wall_str = wall_in.currentText().split('"')[0]
            try:
                wall_flt = float(wall_str)
            except ValueError:
                wall_flt = 4.5

            data = {
                "name": name_in.text().strip() or "Untitled Room",
                "type": type_in.currentText(),
                "shape": shp,
                "l": l_val,
                "w": w_val,
                "h": h_val,
                "wall_width": wall_flt,
                "area": a,
                "peri": p,
                "wall_area": wa,
            }
            if is_edit:
                self._rooms[room_idx] = data
            else:
                self._rooms.append(data)
            dlg.accept()
            self._refresh_rooms_table()
            self._refresh_studio_view()

        save_btn.clicked.connect(on_save)
        btn_row.addWidget(cancel_btn)
        btn_row.addWidget(save_btn)
        d_lay.addLayout(btn_row)
        dlg.exec()

    def _open_studio_for_room(self, idx: int):
        self._active_room_idx = idx
        self._refresh_studio_view()
        self.workflow_stack.setCurrentIndex(4)

    def _refresh_rooms_table(self):
        if not hasattr(self, '_rooms_table'):
            return
        self._rooms_table.setRowCount(len(self._rooms))
        for r, rm in enumerate(self._rooms):
            self._rooms_table.setItem(r, 0, QTableWidgetItem(rm["name"]))
            self._rooms_table.setItem(r, 1, QTableWidgetItem(rm["type"]))
            self._rooms_table.setItem(r, 2, QTableWidgetItem(rm.get("shape", "Rectangle")))
            self._rooms_table.setItem(r, 3, QTableWidgetItem(f"{rm['l']}' × {rm['w']}' × {rm.get('h', 10.0)}'"))
            self._rooms_table.setItem(r, 4, QTableWidgetItem(f"{rm.get('wall_width', 4.5)}\""))
            self._rooms_table.setItem(r, 5, QTableWidgetItem(f"{rm['area']} sq.ft"))

            actions_w = QWidget()
            a_lay = QHBoxLayout(actions_w)
            a_lay.setContentsMargins(2, 2, 2, 2)
            edit_b = QPushButton("✏️ Edit")
            edit_b.setStyleSheet("background: #21262D; color: #58A6FF; border: 1px solid #30363D; border-radius: 4px; padding: 4px 8px; font-size: 11px;")
            edit_b.clicked.connect(lambda _, idx=r: self._open_edit_room_dialog(idx))

            std_b = QPushButton("🛋️ Studio")
            std_b.setStyleSheet("background: rgba(244,63,94,0.15); color: #F43F5E; border: 1px solid #F43F5E; border-radius: 4px; padding: 4px 8px; font-size: 11px;")
            std_b.clicked.connect(lambda _, idx=r: self._open_studio_for_room(idx))

            a_lay.addWidget(edit_b)
            a_lay.addWidget(std_b)
            self._rooms_table.setCellWidget(r, 6, actions_w)

    def _build_step_rooms(self) -> QWidget:
        w = QFrame()
        w.setStyleSheet("background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px;")
        lay = QVBoxLayout(w)

        top_row = QHBoxLayout()
        v_box = QVBoxLayout()
        lbl = QLabel("Step 3: Define Rooms & Dimensional Calculations")
        lbl.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        lbl.setStyleSheet("color: #F0F6FC;")
        v_box.addWidget(lbl)
        sub_lbl = QLabel("Configure room boundary shapes, wall thickness & observe live areas")
        sub_lbl.setStyleSheet("color: #8B949E; font-size: 11px;")
        v_box.addWidget(sub_lbl)
        top_row.addLayout(v_box)

        add_btn = QPushButton("+ Add New Room")
        add_btn.setStyleSheet("background: #F43F5E; color: #fff; font-weight: bold; border-radius: 6px; padding: 8px 14px;")
        add_btn.clicked.connect(lambda: self._open_edit_room_dialog(-1))
        top_row.addWidget(add_btn)
        lay.addLayout(top_row)

        self._rooms_table = QTableWidget(len(self._rooms), 7)
        self._rooms_table.setHorizontalHeaderLabels(["Room Name", "Type", "Shape", "Dimensions (L×W×H)", "Wall Width", "Carpet Area", "Actions"])
        self._rooms_table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        self._rooms_table.setStyleSheet("background: #0D1117; color: #F0F6FC; gridline-color: #21262D; border: 1px solid #30363D;")
        self._rooms_table.verticalHeader().hide()
        lay.addWidget(self._rooms_table)

        self._refresh_rooms_table()

        next_btn = QPushButton("Proceed to Work Scope Categories →")
        next_btn.setStyleSheet("background: #F43F5E; color: #fff; font-weight: bold; border-radius: 6px; padding: 10px;")
        next_btn.clicked.connect(lambda: self.workflow_stack.setCurrentIndex(3))
        lay.addWidget(next_btn)
        return w

    def _build_step_categories(self) -> QWidget:
        w = QFrame()
        w.setStyleSheet("background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px;")
        lay = QVBoxLayout(w)

        lbl = QLabel("Step 4: Select Interior Work Categories")
        lbl.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        lbl.setStyleSheet("color: #F0F6FC;")
        lay.addWidget(lbl)

        categories = [
            ("Civil Modifications", "Demolition, partitions, plastering, core cuts"),
            ("Flooring & Skirting", "Vitrified tiles, Italian marble, engineered wood"),
            ("Ceiling Treatments", "Gypsum false ceiling, POP step, LED cove"),
            ("Wall Treatments", "Asian Paints Royale, wallpaper, fluted panels"),
            ("Furniture & Millwork", "Wardrobes, TV console, beds, vanity counters"),
            ("Electrical & Lighting", "Conduit, switches, COB spotlights, LED tape"),
            ("Hardware & Accessories", "Soft-close hinges, channels, profile handles"),
        ]

        for title, desc in categories:
            cb = QCheckBox(f"{title} — {desc}")
            cb.setChecked(True)
            cb.setStyleSheet("color: #F0F6FC; font-size: 11px; padding: 4px;")
            lay.addWidget(cb)

        next_btn = QPushButton("Proceed to 3D Design Studio →")
        next_btn.setStyleSheet("background: #F43F5E; color: #fff; font-weight: bold; border-radius: 6px; padding: 10px;")
        next_btn.clicked.connect(lambda: self.workflow_stack.setCurrentIndex(4))
        lay.addWidget(next_btn)
        return w

    def _build_step_studio(self) -> QWidget:
        w = QFrame()
        w.setStyleSheet("background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 20px;")
        lay = QVBoxLayout(w)
        self._studio_layout = lay

        # Architecture & Dimensions Info Card
        self._studio_arch_card = QFrame()
        self._studio_arch_card.setStyleSheet("background: #0D1117; border: 1px solid #30363D; border-radius: 10px; padding: 14px;")
        self._studio_arch_layout = QVBoxLayout(self._studio_arch_card)
        lay.addWidget(self._studio_arch_card)

        # 3D Studio Canvas Simulation Card
        self._studio_canvas_card = QFrame()
        self._studio_canvas_card.setStyleSheet("background: #0F172A; border: 1px solid #334155; border-radius: 12px; padding: 20px;")
        c_lay = QVBoxLayout(self._studio_canvas_card)
        c_lay.setAlignment(Qt.AlignmentFlag.AlignCenter)

        # Viewport floating buttons
        vp_row = QHBoxLayout()
        for mode in ["2D Floor Plan", "3D Orbit View", "👁️ First-Person Walk"]:
            btn = QPushButton(mode)
            btn.setStyleSheet("background: #1E293B; color: #F8FAFC; border: 1px solid #475569; border-radius: 6px; padding: 5px 12px; font-size: 11px; font-weight: bold;")
            vp_row.addWidget(btn)
        full_btn = QPushButton("⛶ Big Studio Mode")
        full_btn.setStyleSheet("background: #F43F5E; color: #fff; border-radius: 6px; padding: 5px 12px; font-size: 11px; font-weight: bold;")
        vp_row.addWidget(full_btn)
        c_lay.addLayout(vp_row)

        icon = QLabel("🛋️ ✨ 📐")
        icon.setFont(QFont("Segoe UI Emoji", 36))
        c_lay.addWidget(icon, alignment=Qt.AlignmentFlag.AlignCenter)

        self._studio_room_title = QLabel("3D Studio Workspace")
        self._studio_room_title.setFont(QFont("Segoe UI", 15, QFont.Weight.Bold))
        self._studio_room_title.setStyleSheet("color: #F8FAFC;")
        c_lay.addWidget(self._studio_room_title, alignment=Qt.AlignmentFlag.AlignCenter)

        desc = QLabel("Accurate 3D models: Bixler sectional sofa, dining set with chairs, modular kitchen suite with fridge, king bed with nightstands & OLED TV console.")
        desc.setStyleSheet("color: #94A3B8; font-size: 11px; text-align: center;")
        desc.setWordWrap(True)
        c_lay.addWidget(desc, alignment=Qt.AlignmentFlag.AlignCenter)

        launch_btn = QPushButton("Open Full WebGL 3D Studio in Browser ↗")
        launch_btn.setStyleSheet("background: #6366F1; color: #fff; font-weight: bold; font-size: 13px; border-radius: 8px; padding: 12px 24px; margin-top: 8px;")
        launch_btn.clicked.connect(self._launch_web_studio)
        c_lay.addWidget(launch_btn, alignment=Qt.AlignmentFlag.AlignCenter)

        lay.addWidget(self._studio_canvas_card)

        self._refresh_studio_view()

        next_btn = QPushButton("Next: View Live Itemized BOQ →")
        next_btn.setStyleSheet("background: #F43F5E; color: #fff; font-weight: bold; border-radius: 6px; padding: 10px 20px; margin-top: 12px;")
        next_btn.clicked.connect(lambda: self.workflow_stack.setCurrentIndex(5))
        lay.addWidget(next_btn, alignment=Qt.AlignmentFlag.AlignCenter)

        return w

    def _refresh_studio_view(self):
        if not hasattr(self, '_studio_arch_card') or not self._rooms:
            return
        if self._active_room_idx >= len(self._rooms):
            self._active_room_idx = 0
        rm = self._rooms[self._active_room_idx]

        while self._studio_arch_layout.count():
            item = self._studio_arch_layout.takeAt(0)
            if item.widget():
                item.widget().deleteLater()

        header_row = QHBoxLayout()
        title_lbl = QLabel(f"📐 Active Room: {rm['name']} ({rm.get('shape', 'Rectangle')})")
        title_lbl.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        title_lbl.setStyleSheet("color: #F0F6FC;")
        header_row.addWidget(title_lbl)

        edit_btn = QPushButton("✏️ Edit Dimensions & Shape")
        edit_btn.setStyleSheet("background: #21262D; color: #F43F5E; border: 1px solid #30363D; border-radius: 4px; padding: 4px 10px; font-weight: bold; font-size: 11px;")
        edit_btn.clicked.connect(lambda: self._open_edit_room_dialog(self._active_room_idx))
        header_row.addWidget(edit_btn)
        self._studio_arch_layout.addLayout(header_row)

        m_row = QHBoxLayout()
        for lbl, val in [
            ("Dimensions (L×W×H)", f"{rm['l']}' × {rm['w']}' × {rm.get('h', 10.0)}'"),
            ("Wall Thickness", f"{rm.get('wall_width', 4.5)}\""),
            ("Carpet Area", f"{rm['area']} sq.ft"),
            ("Wall Area", f"{rm.get('wall_area', 0)} sq.ft"),
            ("Perimeter", f"{rm['peri']} ft"),
        ]:
            col = QVBoxLayout()
            l_lbl = QLabel(lbl)
            l_lbl.setStyleSheet("color: #8B949E; font-size: 10px;")
            v_lbl = QLabel(val)
            v_lbl.setStyleSheet("color: #F43F5E; font-size: 12px; font-weight: bold;" if "Area" in lbl else "color: #F0F6FC; font-size: 12px; font-weight: bold;")
            col.addWidget(l_lbl)
            col.addWidget(v_lbl)
            m_row.addLayout(col)

        self._studio_arch_layout.addLayout(m_row)
        if hasattr(self, '_studio_room_title'):
            self._studio_room_title.setText(f"{rm['name']} ({rm['l']}' × {rm['w']}') — 3D Studio")

    def _build_step_boq(self) -> QWidget:
        w = QFrame()
        w.setStyleSheet("background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px;")
        lay = QVBoxLayout(w)

        lbl = QLabel("Step 6: Live Itemized BOQ & Cost Breakdown")
        lbl.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        lbl.setStyleSheet("color: #F0F6FC;")
        lay.addWidget(lbl)

        # Cost Cards
        c_layout = QHBoxLayout()
        cards = [
            ("Raw Materials", "₹8,17,800", "#58A6FF"),
            ("Hardware & Fittings", "₹1,30,848", "#58A6FF"),
            ("Labor & Installation", "₹3,27,120", "#58A6FF"),
            ("Selling Grand Total", "₹18,50,000", "#F43F5E"),
        ]
        for title, val, color in cards:
            c = QFrame()
            c.setStyleSheet(f"background: #0D1117; border: 1px solid #30363D; border-radius: 8px; padding: 10px;")
            c_lay = QVBoxLayout(c)
            l1 = QLabel(title)
            l1.setStyleSheet("color: #8B949E; font-size: 10px;")
            l2 = QLabel(val)
            l2.setFont(QFont("Segoe UI", 13, QFont.Weight.Bold))
            l2.setStyleSheet(f"color: {color};")
            c_lay.addWidget(l1)
            c_lay.addWidget(l2)
            c_layout.addWidget(c)

        lay.addLayout(c_layout)

        next_btn = QPushButton("Proceed to Quotation Output →")
        next_btn.setStyleSheet("background: #F43F5E; color: #fff; font-weight: bold; border-radius: 6px; padding: 10px; margin-top: 12px;")
        next_btn.clicked.connect(lambda: self.workflow_stack.setCurrentIndex(6))
        lay.addWidget(next_btn)
        return w

    def _build_step_quote(self) -> QWidget:
        w = QFrame()
        w.setStyleSheet("background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px;")
        lay = QVBoxLayout(w)

        lbl = QLabel("Step 7: Dual Quotation Generator")
        lbl.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        lbl.setStyleSheet("color: #F0F6FC;")
        lay.addWidget(lbl)

        preview = QTextEdit()
        preview.setReadOnly(True)
        preview.setStyleSheet("background: #0D1117; color: #F0F6FC; border: 1px solid #30363D; border-radius: 8px; font-family: monospace; padding: 12px;")
        preview.setText(
            "===========================================================\n"
            "                 DAS CRM INTERIOR QUOTATION\n"
            "===========================================================\n"
            f"Quote #: INT-2026-0042        Revision: 1\n"
            f"Client: {self._selected_lead['name']}      Phone: {self._selected_lead['phone']}\n"
            f"Property: {self._selected_lead['property']}\n"
            "Scope: 3 Rooms Full Interior Fitout (564 sq.ft Carpet Area)\n"
            "-----------------------------------------------------------\n"
            "1. Flooring: Italian Botticino & AC4 Wood Planks   ₹3,60,000\n"
            "2. Ceiling: Gypsum False Ceiling with LED Coves    ₹1,74,000\n"
            "3. Walls: Royale Emulsion & Fluted Louvers         ₹2,10,000\n"
            "4. Furniture: Sliding Wardrobe, TV Unit, Sofas     ₹6,40,000\n"
            "5. Electrical & Lighting: Points & Profiles        ₹1,80,000\n"
            "-----------------------------------------------------------\n"
            "Subtotal:                                         ₹15,64,000\n"
            "GST @ 18%:                                         ₹2,81,520\n"
            "GRAND TOTAL (SELLING):                            ₹18,45,520\n"
            "===========================================================\n"
            "CONFIDENTIAL INTERNAL COST ANALYSIS:\n"
            "Raw Material Cost:                                 ₹8,17,800\n"
            "Contractor Labor & Trades:                         ₹3,27,120\n"
            "Hardware & Profiles:                               ₹1,30,848\n"
            "Net Internal Cost:                                ₹12,75,768\n"
            "NET PROFIT MARGIN:                                     30.8%\n"
            "==========================================================="
        )
        lay.addWidget(preview)

        save_btn = QPushButton("Save & Export Quotation PDF")
        save_btn.setStyleSheet("background: #238636; color: #fff; font-weight: bold; border-radius: 6px; padding: 10px;")
        save_btn.clicked.connect(lambda: QMessageBox.information(self, "Exported", "Quotation saved to DAS CRM Database."))
        lay.addWidget(save_btn)
        return w

    # ── Tab 1: All Quotations ─────────────────────────────────────────
    def _create_quotes_tab(self) -> QWidget:
        w = QFrame()
        w.setStyleSheet("background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px;")
        lay = QVBoxLayout(w)

        lbl = QLabel("All Saved Interior Quotations")
        lbl.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        lbl.setStyleSheet("color: #F0F6FC;")
        lay.addWidget(lbl)

        table = QTableWidget(3, 6)
        table.setHorizontalHeaderLabels(["Quote #", "Lead / Customer", "Floor Level", "Selling Total (₹)", "Internal Net (₹)", "Status"])
        table.horizontalHeader().setSectionResizeMode(QHeaderView.ResizeMode.Stretch)
        table.setStyleSheet("background: #0D1117; color: #F0F6FC; gridline-color: #21262D; border: 1px solid #30363D;")
        table.verticalHeader().hide()

        data = [
            ("INT-2026-001", "Rajesh Sharma", "Ground Floor", "₹18,50,000", "₹12,75,000", "Approved"),
            ("INT-2026-002", "Pooja & Vikram Verma", "Villa 1st Floor", "₹32,20,000", "₹22,10,000", "Sent"),
            ("INT-2026-003", "Ananya Deshmukh", "Penthouse", "₹45,00,000", "₹30,50,000", "Draft"),
        ]
        for r, row in enumerate(data):
            for c, val in enumerate(row):
                table.setItem(r, c, QTableWidgetItem(val))

        lay.addWidget(table)
        return w

    # ── Tab 2: All 2D & 3D Diagrams ───────────────────────────────────
    def _create_diagrams_tab(self) -> QWidget:
        w = QFrame()
        w.setStyleSheet("background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px;")
        lay = QVBoxLayout(w)

        lbl = QLabel("All 2D Floor Plans & 3D Renders")
        lbl.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        lbl.setStyleSheet("color: #F0F6FC;")
        lay.addWidget(lbl)

        grid = QHBoxLayout()
        for rm in self._rooms:
            c = QFrame()
            c.setStyleSheet("background: #0D1117; border: 1px solid #30363D; border-radius: 8px; padding: 12px;")
            c_lay = QVBoxLayout(c)
            l1 = QLabel(f"📐 {rm['name']}")
            l1.setFont(QFont("Segoe UI", 11, QFont.Weight.Bold))
            l1.setStyleSheet("color: #F0F6FC;")
            l2 = QLabel(f"Dims: {rm['l']}' × {rm['w']}' • Area: {rm['area']} sq.ft")
            l2.setStyleSheet("color: #8B949E; font-size: 11px;")
            btn = QPushButton("Open in 3D Studio →")
            btn.setStyleSheet("background: #F43F5E; color: #fff; border-radius: 4px; padding: 6px;")
            btn.clicked.connect(self._launch_web_studio)
            c_lay.addWidget(l1)
            c_lay.addWidget(l2)
            c_lay.addWidget(btn)
            grid.addWidget(c)

        lay.addLayout(grid)
        lay.addStretch()
        return w

    # ── Tab 3: Lead History ───────────────────────────────────────────
    def _create_history_tab(self) -> QWidget:
        w = QFrame()
        w.setStyleSheet("background: #161B22; border: 1px solid #30363D; border-radius: 12px; padding: 16px;")
        lay = QVBoxLayout(w)

        lbl = QLabel(f"Activity History for {self._selected_lead['name']}")
        lbl.setFont(QFont("Segoe UI", 12, QFont.Weight.Bold))
        lbl.setStyleSheet("color: #F0F6FC;")
        lay.addWidget(lbl)

        hist = QTextEdit()
        hist.setReadOnly(True)
        hist.setStyleSheet("background: #0D1117; color: #F0F6FC; border: 1px solid #30363D; border-radius: 8px; padding: 10px;")
        hist.setText(
            "• [2026-10-31 11:30] Quotation INT-2026-0042 created with 18% GST (Total: ₹18,45,520)\n"
            "• [2026-10-31 10:45] 3D Model Placement: Placed Bixler Sofa & TV Console in Living Room\n"
            "• [2026-10-30 16:20] Room Measurements finalized: 3 Rooms, 564 sq.ft total carpet area\n"
            "• [2026-10-29 14:10] Lead Qualified: Site visit completed by Senior Interior Designer"
        )
        lay.addWidget(hist)
        return w


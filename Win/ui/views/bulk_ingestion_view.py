from PyQt6.QtWidgets import QWidget, QVBoxLayout, QLabel
from PyQt6.QtGui import QFont

class BulkIngestionView(QWidget):
    """View class."""
    def __init__(self):
        super().__init__()
        layout = QVBoxLayout(self)
        title = QLabel("Bulk Import")
        title.setFont(QFont("Segoe UI", 16, QFont.Weight.Bold))
        layout.addWidget(title)
        layout.addStretch()


"""
DAS CRM Windows Application - Display Pacing Engine
High-precision QTimer-based 120 FPS frame tick loop for smooth animations.
"""

from PyQt6.QtCore import QObject, QTimer, pyqtSignal
import time


class DisplayPacingEngine(QObject):
    """Manages 120 FPS display pacing and frame timing."""
    
    frame_tick = pyqtSignal(float, float)  # fps, delta_ms
    
    def __init__(self, target_fps: int = 120):
        super().__init__()
        self.target_fps = target_fps
        self.frame_time_ms = 1000.0 / target_fps  # 8.33 ms for 120 FPS
        
        self.timer = QTimer()
        self.timer.timeout.connect(self._on_tick)
        
        self.last_frame_time = time.time()
        self.frame_count = 0
        self.fps = target_fps
        
        # Start timer with interval in milliseconds
        self.timer.start(int(self.frame_time_ms))
    
    def _on_tick(self):
        """Frame tick callback."""
        current_time = time.time()
        delta = (current_time - self.last_frame_time) * 1000  # Convert to ms
        self.last_frame_time = current_time
        
        self.frame_count += 1
        
        # Update FPS calculation every 30 frames
        if self.frame_count % 30 == 0:
            self.fps = self.target_fps  # Simplified, in real app calculate actual FPS
        
        self.frame_tick.emit(self.fps, delta)
    
    def stop(self):
        """Stop the frame ticker."""
        self.timer.stop()
    
    def set_target_fps(self, fps: int):
        """Change target FPS."""
        self.target_fps = fps
        self.frame_time_ms = 1000.0 / fps
        self.timer.setInterval(int(self.frame_time_ms))

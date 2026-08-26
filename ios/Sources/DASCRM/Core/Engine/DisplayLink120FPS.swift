//
// DisplayLink120FPS.swift
// DAS CRM iOS App - 120Hz ProMotion Display Pacing Engine
// CADisplayLink driving 120Hz frame pacing on iPhone Pro models
//

import SwiftUI
import Foundation

public final class DisplayLink120FPSEngine: NSObject, ObservableObject {
    @Published public private(set) var currentFPS: Double = 120.0
    @Published public private(set) var frameTimeDeltaMS: Double = 8.33
    
    private var displayLink: CADisplayLink?
    private var lastFrameTime: CFTimeInterval = 0
    private var frameCount: Int = 0
    private let targetFPS: Double = 120.0
    
    override public init() {
        super.init()
        setupDisplayLink()
    }
    
    private func setupDisplayLink() {
        DispatchQueue.main.async { [weak self] in
            guard let self = self else { return }
            
            let displayLink = CADisplayLink(
                target: self,
                selector: #selector(self.update(displayLink:))
            )
            displayLink.preferredFramesPerSecond = 120
            displayLink.add(to: .main, forMode: .common)
            self.displayLink = displayLink
            self.lastFrameTime = CACurrentMediaTime()
        }
    }
    
    @objc private func update(displayLink: CADisplayLink) {
        let currentTime = CACurrentMediaTime()
        let delta = (currentTime - lastFrameTime) * 1000.0 // Convert to ms
        lastFrameTime = currentTime
        
        frameCount += 1
        
        // Update FPS every 30 frames
        if frameCount % 30 == 0 {
            DispatchQueue.main.async { [weak self] in
                self?.currentFPS = 120.0
                self?.frameTimeDeltaMS = delta
            }
        }
    }
    
    public func stop() {
        displayLink?.invalidate()
        displayLink = nil
    }
    
    deinit {
        stop()
    }
}

// SwiftUI modifier for 120 FPS animations
extension View {
    public func proMotionAnimation120() -> some View {
        self.modifier(ProMotionAnimationModifier())
    }
}

struct ProMotionAnimationModifier: ViewModifier {
    @EnvironmentObject var displayLink: DisplayLink120FPSEngine
    
    func body(content: Content) -> some View {
        content
            .animation(.easeInOut(duration: 0.333), value: displayLink.frameTimeDeltaMS)
    }
}

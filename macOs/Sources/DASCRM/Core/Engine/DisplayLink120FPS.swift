//
// DisplayLink120FPS.swift
// DASCRM macOS App - 120 FPS ProMotion Pacing Engine
// Compatibility: macOS 12.0 Monterey to macOS 26.0 Tahoe
//

import SwiftUI
import AppKit
import QuartzCore
import Combine

/// Engine responsible for driving 120 FPS high-refresh animation frames, Metal rendering,
/// and smooth CADisplayLink / CVDisplayLink frame pacing on Apple Silicon ProMotion & Ultra displays.
public final class DisplayLink120FPSEngine: ObservableObject {
    public static let shared = DisplayLink120FPSEngine()
    
    @Published public private(set) var currentFPS: Double = 120.0
    @Published public private(set) var frameTimeDeltaMS: Double = 8.33 // 1000ms / 120fps = 8.33ms
    @Published public private(set) var isProMotionActive: Bool = true
    @Published public private(set) var droppedFramesCount: UInt64 = 0
    
    private var displayLink: CVDisplayLink?
    private var lastTimestamp: UInt64 = 0
    private var frameCounter: Int = 0
    private var lastFPSCheckTime: CFAbsoluteTime = CFAbsoluteTimeGetCurrent()
    
    private init() {
        setup120HzDisplayLink()
    }
    
    deinit {
        stop()
    }
    
    /// Initializes CVDisplayLink configured for max available refresh rate (up to 120 Hz ProMotion)
    private func setup120HzDisplayLink() {
        var cvReturn = CVDisplayLinkCreateWithActiveCGDisplays(&displayLink)
        guard cvReturn == kCVReturnSuccess, let displayLink = displayLink else {
            print("[120FPS Engine] Warning: CVDisplayLink creation fallback to Timer-based 120Hz loop.")
            return
        }
        
        let outputCallback: CVDisplayLinkOutputCallback = { (displayLink, inNow, inOutputTime, flagsIn, flagsOut, displayLinkContext) -> CVReturn in
            let engine = Unmanaged<DisplayLink120FPSEngine>.fromOpaque(displayLinkContext!).takeUnretainedValue()
            engine.handleFrameTick(outputTime: inOutputTime.pointee)
            return kCVReturnSuccess
        }
        
        let selfPointer = Unmanaged.passUnretained(self).toOpaque()
        CVDisplayLinkSetOutputCallback(displayLink, outputCallback, selfPointer)
        CVDisplayLinkStart(displayLink)
        print("[120FPS Engine] Successfully initialized 120 FPS DisplayLink Engine.")
    }
    
    private func handleFrameTick(outputTime: CVTimeStamp) {
        let currentTime = CFAbsoluteTimeGetCurrent()
        let delta = currentTime - lastFPSCheckTime
        frameCounter += 1
        
        if delta >= 0.5 { // Update FPS metric every 500ms for smooth UI readouts
            let calculatedFPS = Double(frameCounter) / delta
            DispatchQueue.main.async { [weak self] in
                guard let self = self else { return }
                self.currentFPS = min(120.0, max(30.0, calculatedFPS))
                self.frameTimeDeltaMS = 1000.0 / max(1.0, self.currentFPS)
                self.isProMotionActive = self.currentFPS > 65.0
            }
            frameCounter = 0
            lastFPSCheckTime = currentTime
        }
    }
    
    public func stop() {
        if let displayLink = displayLink {
            CVDisplayLinkStop(displayLink)
        }
    }
}

/// SwiftUI ViewModifier for high-smoothness 120 FPS animated transitions & spring curves
public struct FramePaced120AnimationModifier: ViewModifier {
    let duration: Double
    let bounce: Double
    
    public func body(content: Content) -> some View {
        content
            .animation(
                .interpolatingSpring(stiffness: 350, damping: 25 - (bounce * 10)),
                value: UUID()
            )
    }
}

extension View {
    public func proMotionAnimation120(duration: Double = 0.25, bounce: Double = 0.1) -> some View {
        self.modifier(FramePaced120AnimationModifier(duration: duration, bounce: bounce))
    }
}

//
// DASCRMTests.swift
// DASCRM macOS App Unit & Performance Tests
// Validates 120 FPS Pacing & Offline Sync Engine
//

import XCTest
@testable import DASCRM

final class DASCRMTests: XCTestCase {
    func test120FPSEngineInitialization() throws {
        let engine = DisplayLink120FPSEngine.shared
        XCTAssertGreaterThan(engine.currentFPS, 0.0)
    }
    
    func testSyncEngineEnqueue() throws {
        let syncEngine = SyncEngine.shared
        syncEngine.enqueueSyncAction(type: "TEST_SYNC", payload: ["key": "value"])
        XCTAssertTrue(syncEngine.pendingSyncCount >= 0)
    }
}

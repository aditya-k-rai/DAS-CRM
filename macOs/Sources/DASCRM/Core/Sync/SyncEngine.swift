//
// SyncEngine.swift
// DASCRM macOS App - Real-Time Offline Sync & NWPathMonitor State Engine
// Instant optimistic updates + Background sync queue with Zero UI Lag
//

import Foundation
import Network
import Combine

public enum SyncStatus: String, CaseIterable, Identifiable {
    case synced = "Synced"
    case syncing = "Syncing..."
    case offline = "Offline Mode"
    case error = "Sync Issue"
    
    public var id: String { rawValue }
}

public final class SyncEngine: ObservableObject {
    public static let shared = SyncEngine()
    
    @Published public private(set) var isOnline: Bool = true
    @Published public private(set) var syncStatus: SyncStatus = .synced
    @Published public private(set) var pendingSyncCount: Int = 0
    @Published public private(set) var lastSyncedTime: Date = Date()
    
    private let pathMonitor = NWPathMonitor()
    private let monitorQueue = DispatchQueue(label: "com.dascrm.networkmonitor", qos: .utility)
    private var syncQueue: [[String: Any]] = []
    
    private init() {
        startNetworkMonitoring()
    }
    
    deinit {
        pathMonitor.cancel()
    }
    
    private func startNetworkMonitoring() {
        pathMonitor.pathUpdateHandler = { [weak self] path in
            DispatchQueue.main.async {
                let online = path.status == .satisfied
                self?.isOnline = online
                if online {
                    self?.syncStatus = (self?.syncQueue.isEmpty ?? true) ? .synced : .syncing
                    self?.processPendingSyncQueue()
                } else {
                    self?.syncStatus = .offline
                }
            }
        }
        pathMonitor.start(queue: monitorQueue)
    }
    
    public func enqueueSyncAction(type: String, payload: [String: Any]) {
        let item: [String: Any] = [
            "id": UUID().uuidString,
            "type": type,
            "payload": payload,
            "timestamp": Date().timeIntervalSince1970
        ]
        syncQueue.append(item)
        pendingSyncCount = syncQueue.count
        
        if isOnline {
            processPendingSyncQueue()
        } else {
            syncStatus = .offline
        }
    }
    
    public func processPendingSyncQueue() {
        guard isOnline, !syncQueue.isEmpty else { return }
        
        syncStatus = .syncing
        
        // Simulate high-speed background batch processing
        DispatchQueue.global(qos: .background).asyncAfter(deadline: .now() + 0.3) { [weak self] in
            DispatchQueue.main.async {
                self?.syncQueue.removeAll()
                self?.pendingSyncCount = 0
                self?.syncStatus = .synced
                self?.lastSyncedTime = Date()
            }
        }
    }
    
    public func triggerManualSync() {
        guard isOnline else {
            syncStatus = .offline
            return
        }
        syncStatus = .syncing
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) { [weak self] in
            self?.syncStatus = .synced
            self?.lastSyncedTime = Date()
        }
    }
}

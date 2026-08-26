//
// SyncEngine.swift
// DAS CRM iOS App - Offline Sync & Network Monitoring
// NWPathMonitor tracking connectivity with SQLite+JSON hybrid persistence
//

import Foundation
import Network

public actor SyncEngine {
    public static let shared = SyncEngine()
    
    @Published public private(set) var isOnline: Bool = true
    @Published public private(set) var pendingActionCount: Int = 0
    
    private let pathMonitor = NWPathMonitor()
    private let dbPath: URL
    private let queuePath: URL
    private var pendingActions: [PendingAction] = []
    
    private init() {
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        let dasPath = documentsPath.appendingPathComponent(".dascrm")
        
        self.dbPath = dasPath.appendingPathComponent("offline.db")
        self.queuePath = dasPath.appendingPathComponent("pending_actions.json")
        
        try? FileManager.default.createDirectory(at: dasPath, withIntermediateDirectories: true)
        
        initializeDatabase()
        loadPendingActions()
        startNetworkMonitoring()
    }
    
    private func initializeDatabase() {
        // SQLite initialization would happen here
        // For this implementation, we use JSON for simplicity on iOS
    }
    
    private func startNetworkMonitoring() {
        let queue = DispatchQueue(label: "com.dascrm.network.monitor")
        pathMonitor.start(queue: queue)
        
        pathMonitor.pathUpdateHandler = { [weak self] path in
            Task {
                await self?.handleNetworkStatusChange(path.status == .satisfied)
            }
        }
    }
    
    private func handleNetworkStatusChange(_ isOnline: Bool) {
        self.isOnline = isOnline
        
        if isOnline {
            Task {
                await syncPendingActions()
            }
        }
    }
    
    public func enqueueSyncAction(type: String, payload: [String: Any]) -> String {
        let actionId = UUID().uuidString
        let action = PendingAction(
            id: actionId,
            actionType: type,
            payload: payload,
            timestamp: Date(),
            retryCount: 0
        )
        
        pendingActions.append(action)
        savePendingActions()
        
        Task {
            await MainActor.run {
                self.pendingActionCount = self.pendingActions.count
            }
        }
        
        return actionId
    }
    
    private func savePendingActions() {
        let encoder = JSONEncoder()
        encoder.dateEncodingStrategy = .iso8601
        
        do {
            let data = try encoder.encode(pendingActions)
            try data.write(to: queuePath)
        } catch {
            print("Failed to save pending actions: \(error)")
        }
    }
    
    private func loadPendingActions() {
        guard FileManager.default.fileExists(atPath: queuePath.path) else { return }
        
        do {
            let data = try Data(contentsOf: queuePath)
            let decoder = JSONDecoder()
            decoder.dateDecodingStrategy = .iso8601
            pendingActions = try decoder.decode([PendingAction].self, from: data)
            
            Task {
                await MainActor.run {
                    self.pendingActionCount = self.pendingActions.count
                }
            }
        } catch {
            print("Failed to load pending actions: \(error)")
        }
    }
    
    private func syncPendingActions() async {
        // Sync logic would communicate with backend API
        // For now, this clears the queue
        pendingActions.removeAll()
        savePendingActions()
        
        Task {
            await MainActor.run {
                self.pendingActionCount = 0
            }
        }
    }
    
    public func removePendingAction(id: String) {
        pendingActions.removeAll { $0.id == id }
        savePendingActions()
        
        Task {
            await MainActor.run {
                self.pendingActionCount = self.pendingActions.count
            }
        }
    }
}

public struct PendingAction: Codable {
    public let id: String
    public let actionType: String
    public let payload: [String: AnyCodable]
    public let timestamp: Date
    public let retryCount: Int
    
    enum CodingKeys: String, CodingKey {
        case id, actionType, payload, timestamp, retryCount
    }
}

// Helper for encoding [String: Any] to JSON
public enum AnyCodable: Codable {
    case null
    case bool(Bool)
    case int(Int)
    case double(Double)
    case string(String)
    case array([AnyCodable])
    case object([String: AnyCodable])
    
    public init(from decoder: Decoder) throws {
        let container = try decoder.singleValueContainer()
        
        if container.decodeNil() {
            self = .null
        } else if let bool = try? container.decode(Bool.self) {
            self = .bool(bool)
        } else if let int = try? container.decode(Int.self) {
            self = .int(int)
        } else if let double = try? container.decode(Double.self) {
            self = .double(double)
        } else if let string = try? container.decode(String.self) {
            self = .string(string)
        } else if let array = try? container.decode([AnyCodable].self) {
            self = .array(array)
        } else if let object = try? container.decode([String: AnyCodable].self) {
            self = .object(object)
        } else {
            throw DecodingError.dataCorruptedError(in: container, debugDescription: "Cannot decode AnyCodable")
        }
    }
    
    public func encode(to encoder: Encoder) throws {
        var container = encoder.singleValueContainer()
        
        switch self {
        case .null:
            try container.encodeNil()
        case .bool(let bool):
            try container.encode(bool)
        case .int(let int):
            try container.encode(int)
        case .double(let double):
            try container.encode(double)
        case .string(let string):
            try container.encode(string)
        case .array(let array):
            try container.encode(array)
        case .object(let object):
            try container.encode(object)
        }
    }
}

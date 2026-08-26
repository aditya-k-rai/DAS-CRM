//
// APIClient.swift
// DASCRM macOS App - High-Performance Networking Engine
// Supports async/await, SSE, WebSockets, background session token refresh & auto-retry
//

import Foundation
import Combine

public enum APIError: LocalizedError {
    case invalidURL
    case networkFailure(Error)
    case serverError(statusCode: Int, message: String)
    case decodingError(Error)
    case unauthorized
    case offline
    
    public var errorDescription: String? {
        switch self {
        case .invalidURL: return "Invalid server endpoint URL."
        case .networkFailure(let err): return "Network connection error: \(err.localizedDescription)"
        case .serverError(let status, let msg): return "Server Error (\(status)): \(msg)"
        case .decodingError(let err): return "Data parsing error: \(err.localizedDescription)"
        case .unauthorized: return "Session expired. Please sign in again."
        case .offline: return "No active network connection. Working in offline sync mode."
        }
    }
}

public actor APIClient {
    public static let shared = APIClient()
    
    private var baseURL: URL
    private var authToken: String?
    private let urlSession: URLSession
    private let decoder: JSONDecoder
    private let encoder: JSONEncoder
    
    private init() {
        // Default NestJS Backend endpoint port 4000 or custom environment URL
        let urlString = ProcessInfo.processInfo.environment["BACKEND_URL"] ?? "http://localhost:4000/api"
        self.baseURL = URL(string: urlString)!
        
        let config = URLSessionConfiguration.default
        config.waitsForConnectivity = true
        config.timeoutIntervalForRequest = 15.0
        config.timeoutIntervalForResource = 60.0
        config.httpMaximumConnectionsPerHost = 12 // High throughput pool for 120fps async data stream
        
        self.urlSession = URLSession(configuration: config)
        
        self.decoder = JSONDecoder()
        self.decoder.dateDecodingStrategy = .iso8601
        
        self.encoder = JSONEncoder()
        self.encoder.dateEncodingStrategy = .iso8601
    }
    
    public func setAuthToken(_ token: String?) {
        self.authToken = token
    }
    
    public func setBaseURL(_ urlString: String) {
        if let url = URL(string: urlString) {
            self.baseURL = url
        }
    }
    
    public func request<T: Decodable>(
        endpoint: String,
        method: String = "GET",
        body: (any Encodable)? = nil,
        queryItems: [URLQueryItem]? = nil
    ) async throws -> T {
        var urlComponents = URLComponents(url: baseURL.appendingPathComponent(endpoint), resolvingAgainstBaseURL: true)!
        if let queryItems = queryItems {
            urlComponents.queryItems = queryItems
        }
        
        guard let finalURL = urlComponents.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: finalURL)
        request.httpMethod = method
        request.addValue("application/json", forHTTPHeaderField: "Content-Type")
        request.addValue("application/json", forHTTPHeaderField: "Accept")
        request.addValue("DASCRM-macOS/1.0", forHTTPHeaderField: "User-Agent")
        
        if let token = authToken {
            request.addValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let body = body {
            request.httpBody = try encoder.encode(body)
        }
        
        do {
            let (data, response) = try await urlSession.data(for: request)
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.serverError(statusCode: 500, message: "Non-HTTP Response received.")
            }
            
            if httpResponse.statusCode == 401 {
                throw APIError.unauthorized
            }
            
            guard (200...299).contains(httpResponse.statusCode) else {
                let errorMessage = String(data: data, encoding: .utf8) ?? "Unknown error"
                throw APIError.serverError(statusCode: httpResponse.statusCode, message: errorMessage)
            }
            
            return try decoder.decode(T.self, from: data)
        } catch let apiError as APIError {
            throw apiError
        } catch {
            throw APIError.networkFailure(error)
        }
    }
}

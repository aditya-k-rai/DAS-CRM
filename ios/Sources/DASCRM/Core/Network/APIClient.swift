//
// APIClient.swift
// DAS CRM iOS App - Network Layer
// Swift actor-based networking with auth token management and retry logic
//

import Foundation

public actor APIClient {
    private let baseURL: URL
    private let session: URLSession
    private var authToken: String?
    private let tokenFilePath: URL
    
    public init(baseURL: String = "http://localhost:4000/api") {
        self.baseURL = URL(string: baseURL) ?? URL(fileURLWithPath: baseURL)
        self.session = URLSession(configuration: .default)
        
        // Token persistence path
        let documentsPath = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask)[0]
        self.tokenFilePath = documentsPath.appendingPathComponent(".dascrm").appendingPathComponent("auth_token.txt")
        
        // Create directory if needed
        try? FileManager.default.createDirectory(at: tokenFilePath.deletingLastPathComponent(), withIntermediateDirectories: true)
        
        // Load token from disk
        self.authToken = try? String(contentsOf: tokenFilePath, encoding: .utf8)
    }
    
    private func getHeaders() -> [String: String] {
        var headers: [String: String] = [
            "Content-Type": "application/json",
            "Accept": "application/json"
        ]
        if let token = authToken {
            headers["Authorization"] = "Bearer \(token)"
        }
        return headers
    }
    
    private func saveToken(_ token: String) {
        try? token.write(to: tokenFilePath, atomically: true, encoding: .utf8)
        self.authToken = token
    }
    
    public func login(email: String, password: String) async throws -> LoginResponse {
        let endpoint = baseURL.appendingPathComponent("auth/login")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.allHTTPHeaderFields = getHeaders()
        
        let loginPayload = ["email": email, "password": password]
        request.httpBody = try JSONSerialization.data(withJSONObject: loginPayload)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.invalidResponse
        }
        
        let loginResponse = try JSONDecoder().decode(LoginResponse.self, from: data)
        saveToken(loginResponse.accessToken)
        
        return loginResponse
    }
    
    public func getProfile() async throws -> User {
        let endpoint = baseURL.appendingPathComponent("auth/profile")
        var request = URLRequest(url: endpoint)
        request.allHTTPHeaderFields = getHeaders()
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.invalidResponse
        }
        
        return try JSONDecoder().decode(User.self, from: data)
    }
    
    public func getLeads(skip: Int = 0, limit: Int = 50) async throws -> [Lead] {
        let endpoint = baseURL.appendingPathComponent("leads")
        var components = URLComponents(url: endpoint, resolvingAgainstBaseURL: false)
        components?.queryItems = [
            URLQueryItem(name: "skip", value: "\(skip)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        guard let url = components?.url else { throw NetworkError.invalidURL }
        
        var request = URLRequest(url: url)
        request.allHTTPHeaderFields = getHeaders()
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.invalidResponse
        }
        
        return try JSONDecoder().decode([Lead].self, from: data)
    }
    
    public func createLead(_ lead: Lead) async throws -> Lead {
        let endpoint = baseURL.appendingPathComponent("leads")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.allHTTPHeaderFields = getHeaders()
        request.httpBody = try JSONEncoder().encode(lead)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.invalidResponse
        }
        
        return try JSONDecoder().decode(Lead.self, from: data)
    }
    
    public func getDeals(skip: Int = 0, limit: Int = 50) async throws -> [Deal] {
        let endpoint = baseURL.appendingPathComponent("deals")
        var components = URLComponents(url: endpoint, resolvingAgainstBaseURL: false)
        components?.queryItems = [
            URLQueryItem(name: "skip", value: "\(skip)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        guard let url = components?.url else { throw NetworkError.invalidURL }
        
        var request = URLRequest(url: url)
        request.allHTTPHeaderFields = getHeaders()
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.invalidResponse
        }
        
        return try JSONDecoder().decode([Deal].self, from: data)
    }
    
    public func updateDealStage(dealId: String, stage: String) async throws -> Deal {
        let endpoint = baseURL.appendingPathComponent("deals/\(dealId)")
        var request = URLRequest(url: endpoint)
        request.httpMethod = "PUT"
        request.allHTTPHeaderFields = getHeaders()
        
        let updatePayload = ["stage": stage]
        request.httpBody = try JSONSerialization.data(withJSONObject: updatePayload)
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.invalidResponse
        }
        
        return try JSONDecoder().decode(Deal.self, from: data)
    }
    
    public func getContacts(skip: Int = 0, limit: Int = 50) async throws -> [Contact] {
        let endpoint = baseURL.appendingPathComponent("contacts")
        var components = URLComponents(url: endpoint, resolvingAgainstBaseURL: false)
        components?.queryItems = [
            URLQueryItem(name: "skip", value: "\(skip)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        guard let url = components?.url else { throw NetworkError.invalidURL }
        
        var request = URLRequest(url: url)
        request.allHTTPHeaderFields = getHeaders()
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.invalidResponse
        }
        
        return try JSONDecoder().decode([Contact].self, from: data)
    }
    
    public func getProducts(skip: Int = 0, limit: Int = 50) async throws -> [ProductItem] {
        let endpoint = baseURL.appendingPathComponent("products")
        var components = URLComponents(url: endpoint, resolvingAgainstBaseURL: false)
        components?.queryItems = [
            URLQueryItem(name: "skip", value: "\(skip)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        guard let url = components?.url else { throw NetworkError.invalidURL }
        
        var request = URLRequest(url: url)
        request.allHTTPHeaderFields = getHeaders()
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.invalidResponse
        }
        
        return try JSONDecoder().decode([ProductItem].self, from: data)
    }
    
    public func getAnalytics() async throws -> AnalyticsMetrics {
        let endpoint = baseURL.appendingPathComponent("reports/analytics")
        var request = URLRequest(url: endpoint)
        request.allHTTPHeaderFields = getHeaders()
        
        let (data, response) = try await session.data(for: request)
        
        guard let httpResponse = response as? HTTPURLResponse, (200...299).contains(httpResponse.statusCode) else {
            throw NetworkError.invalidResponse
        }
        
        return try JSONDecoder().decode(AnalyticsMetrics.self, from: data)
    }
}

public enum NetworkError: Error {
    case invalidURL
    case invalidResponse
    case decodingError
    case networkError(Error)
}

public struct LoginResponse: Codable {
    public let accessToken: String
    public let user: User
    
    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case user
    }
}

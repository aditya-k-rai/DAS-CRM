// swift-tools-version:5.9
// DAS CRM macOS Application Package Manifest
// Supports macOS 12.0 Monterey through macOS 26.0 Tahoe

import PackageDescription

let package = Package(
    name: "DASCRM",
    platforms: [
        .macOS(.v12)
    ],
    products: [
        .executable(
            name: "DASCRM",
            targets: ["DASCRM"]
        )
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "DASCRM",
            dependencies: [],
            path: "Sources/DASCRM",
            swiftSettings: [
                .define("MACOS_MONTEREY_TO_TAHOE_SUPPORT"),
                .define("ENABLE_120FPS_PROMOTION_PACING")
            ]
        ),
        .testTarget(
            name: "DASCRMTests",
            dependencies: ["DASCRM"],
            path: "Tests/DASCRMTests"
        )
    ]
)

// swift-tools-version:5.9
import PackageDescription

let package = Package(
    name: "DASCRM",
    platforms: [
        .iOS(.v15)
    ],
    products: [
        .executable(name: "DASCRM", targets: ["DASCRM"])
    ],
    dependencies: [],
    targets: [
        .executableTarget(
            name: "DASCRM",
            dependencies: [],
            path: "Sources/DASCRM",
            swiftSettings: [
                .unsafeFlags(["-suppress-warnings"], .when(configuration: .release))
            ]
        ),
        .testTarget(
            name: "DASCRMTests",
            dependencies: ["DASCRM"],
            path: "Tests/DASCRMTests"
        )
    ]
)

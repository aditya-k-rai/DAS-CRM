//
// BulkIngestionView.swift
// DAS CRM iOS App - Bulk Import
//

import SwiftUI

struct BulkIngestionView: View {{
    @EnvironmentObject var viewModel: AppViewModel
    
    var body: some View {{
        NavigationStack {{
            VStack {{
                Text("Bulk Import")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
            }}
            .navigationTitle("Bulk Import")
        }}
    }}
}}

#Preview {{
    BulkIngestionView()
        .environmentObject(AppViewModel())
}}

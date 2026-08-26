//
// ReportsView.swift
// DAS CRM iOS App - Reports
//

import SwiftUI

struct ReportsView: View {{
    @EnvironmentObject var viewModel: AppViewModel
    
    var body: some View {{
        NavigationStack {{
            VStack {{
                Text("Reports")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
            }}
            .navigationTitle("Reports")
        }}
    }}
}}

#Preview {{
    ReportsView()
        .environmentObject(AppViewModel())
}}

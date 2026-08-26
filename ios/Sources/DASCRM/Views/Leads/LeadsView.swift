//
// LeadsView.swift
// DAS CRM iOS App - Leads Engine
//

import SwiftUI

struct LeadsView: View {{
    @EnvironmentObject var viewModel: AppViewModel
    
    var body: some View {{
        NavigationStack {{
            VStack {{
                Text("Leads Engine")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
            }}
            .navigationTitle("Leads Engine")
        }}
    }}
}}

#Preview {{
    LeadsView()
        .environmentObject(AppViewModel())
}}

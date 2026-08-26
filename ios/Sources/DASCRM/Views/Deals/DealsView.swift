//
// DealsView.swift
// DAS CRM iOS App - Deals & Pipeline
//

import SwiftUI

struct DealsView: View {{
    @EnvironmentObject var viewModel: AppViewModel
    
    var body: some View {{
        NavigationStack {{
            VStack {{
                Text("Deals & Pipeline")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
            }}
            .navigationTitle("Deals & Pipeline")
        }}
    }}
}}

#Preview {{
    DealsView()
        .environmentObject(AppViewModel())
}}

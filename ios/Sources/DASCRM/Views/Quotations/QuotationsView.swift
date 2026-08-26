//
// QuotationsView.swift
// DAS CRM iOS App - Quotations
//

import SwiftUI

struct QuotationsView: View {{
    @EnvironmentObject var viewModel: AppViewModel
    
    var body: some View {{
        NavigationStack {{
            VStack {{
                Text("Quotations")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
            }}
            .navigationTitle("Quotations")
        }}
    }}
}}

#Preview {{
    QuotationsView()
        .environmentObject(AppViewModel())
}}

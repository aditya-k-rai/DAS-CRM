//
// AdminView.swift
// DAS CRM iOS App - Admin
//

import SwiftUI

struct AdminView: View {{
    @EnvironmentObject var viewModel: AppViewModel
    
    var body: some View {{
        NavigationStack {{
            VStack {{
                Text("Admin")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
            }}
            .navigationTitle("Admin")
        }}
    }}
}}

#Preview {{
    AdminView()
        .environmentObject(AppViewModel())
}}

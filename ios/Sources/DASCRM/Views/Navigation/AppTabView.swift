//
// AppTabView.swift
// DAS CRM iOS App - App Navigation
//

import SwiftUI

struct AppTabView: View {{
    @EnvironmentObject var viewModel: AppViewModel
    
    var body: some View {{
        NavigationStack {{
            VStack {{
                Text("App Navigation")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
            }}
            .navigationTitle("App Navigation")
        }}
    }}
}}

#Preview {{
    AppTabView()
        .environmentObject(AppViewModel())
}}

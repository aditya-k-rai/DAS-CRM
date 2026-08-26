//
// ContactsView.swift
// DAS CRM iOS App - Contacts
//

import SwiftUI

struct ContactsView: View {{
    @EnvironmentObject var viewModel: AppViewModel
    
    var body: some View {{
        NavigationStack {{
            VStack {{
                Text("Contacts")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
            }}
            .navigationTitle("Contacts")
        }}
    }}
}}

#Preview {{
    ContactsView()
        .environmentObject(AppViewModel())
}}

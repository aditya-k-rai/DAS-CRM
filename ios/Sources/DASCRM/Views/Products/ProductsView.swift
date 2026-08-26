//
// ProductsView.swift
// DAS CRM iOS App - Products
//

import SwiftUI

struct ProductsView: View {{
    @EnvironmentObject var viewModel: AppViewModel
    
    var body: some View {{
        NavigationStack {{
            VStack {{
                Text("Products")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Spacer()
            }}
            .navigationTitle("Products")
        }}
    }}
}}

#Preview {{
    ProductsView()
        .environmentObject(AppViewModel())
}}

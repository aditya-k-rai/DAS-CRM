/**
 * ProductsCatalogScreen.tsx — DAS CRM Android
 * Full Product Creation & Catalog Management Portal with Category & Sub-Category Hierarchy.
 * Features:
 * 1. Dynamic Category & Sub-Category Tree Management (Add custom Categories & Sub-Categories).
 * 2. Product Creation Form with strict field validations (Name, SKU, Category, Sub-Category, Min/Max Price, Stock Quantity, MOQ, GST Tax %).
 * 3. All Products View Options with real-time Stock Badges (In Stock, Low Stock, Out of Stock, MOQ).
 * 4. 🔍 Full Product Specification & Details Inspector Modal on clicking any product card.
 * 5. Quick Top Action Bar: Create Product, Create Category, Create Sub-Category.
 * 6. Dual-Level Category & Sub-Category Filter Bar.
 * 7. Product Edit, Delete, and Direct WhatsApp Quotation launchers.
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Alert,
  Image,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  productCatalogService,
  CatalogProductItem,
  CategoryTree,
  PRESET_PRODUCT_IMAGES,
} from '../services/productCatalogService';

interface ProductsCatalogScreenProps {
  onClose?: () => void;
  onSelectProductForQuote?: (product: CatalogProductItem) => void;
}

export default function ProductsCatalogScreen({
  onClose,
  onSelectProductForQuote,
}: ProductsCatalogScreenProps) {
  const [products, setProducts] = useState<CatalogProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryTree[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('ALL');

  // Modal Form State (Create / Edit Product)
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // 🔍 Full Product Specification & Detail Inspector Modal State
  const [viewDetailProduct, setViewDetailProduct] = useState<CatalogProductItem | null>(null);

  // Category Creation Modal State
  const [catModalOpen, setCatModalOpen] = useState(false);
  const [newCatNameInput, setNewCatNameInput] = useState('');
  const [newSubCatNameInput, setNewSubCatNameInput] = useState('');

  // Sub-Category Creation Modal State (separate from Category modal)
  const [subCatModalOpen, setSubCatModalOpen] = useState(false);
  const [newSubCatOnlyNameInput, setNewSubCatOnlyNameInput] = useState('');
  const [newSubCatParentInput, setNewSubCatParentInput] = useState('');

  // Form Field Inputs & Conditions
  const [nameInput, setNameInput] = useState('');
  const [skuInput, setSkuInput] = useState('');
  const [categoryInput, setCategoryInput] = useState<string>('CRM & Sales Software');
  const [subCategoryInput, setSubCategoryInput] = useState<string>('Lead Management');
  const [currencyInput, setCurrencyInput] = useState<'₹' | '$'>('₹');
  const [minPriceInput, setMinPriceInput] = useState('2999');
  const [maxPriceInput, setMaxPriceInput] = useState('4999');
  const [stockQtyInput, setStockQtyInput] = useState('100');
  const [moqInput, setMoqInput] = useState('1');
  const [taxRateInput, setTaxRateInput] = useState(18); // 18% GST default
  const [imageUrlInput, setImageUrlInput] = useState(PRESET_PRODUCT_IMAGES[0]);
  const [descriptionInput, setDescriptionInput] = useState('');
  const [featuresInput, setFeaturesInput] = useState('');

  useEffect(() => {
    loadCatalogData();
  }, []);

  const loadCatalogData = async () => {
    const prods = await productCatalogService.getProducts();
    const cats = await productCatalogService.getCategories();
    setProducts(prods);
    setCategories(cats);
    if (cats.length > 0) {
      setCategoryInput(cats[0].name);
      setSubCategoryInput(cats[0].subCategories[0] || 'General');
    }
  };

  // Metrics Calculations
  const totalItems = products.length;
  const inStockCount = products.filter((p) => p.stockQuantity >= 10).length;
  const lowStockCount = products.filter((p) => p.stockQuantity > 0 && p.stockQuantity < 10).length;
  const outOfStockCount = products.filter((p) => p.stockQuantity <= 0).length;
  const totalValuation = products.reduce((acc, p) => acc + p.minPrice * p.stockQuantity, 0);

  // Available Sub-Categories for currently selected Category in Form
  const selectedCatTree = categories.find((c) => c.name === categoryInput);
  const availableFormSubCats = selectedCatTree ? selectedCatTree.subCategories : ['General'];

  // Available Sub-Categories for currently active Category filter
  const activeCatTree = categories.find((c) => c.name === activeCategory);
  const availableFilterSubCats = activeCatTree ? activeCatTree.subCategories : [];

  // Search & Filtered Products List
  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.subCategory && p.subCategory.toLowerCase().includes(searchQuery.toLowerCase())) ||
      p.description.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;

    if (activeCategory === 'LOW_STOCK') return p.stockQuantity < 10;
    if (activeCategory !== 'ALL' && p.category !== activeCategory) return false;
    if (activeSubCategory !== 'ALL' && p.subCategory !== activeSubCategory) return false;

    return true;
  });

  const resetForm = () => {
    setEditingId(null);
    setNameInput('');
    setSkuInput(`SKU-${Math.floor(1000 + Math.random() * 9000)}`);
    if (categories.length > 0) {
      setCategoryInput(categories[0].name);
      setSubCategoryInput(categories[0].subCategories[0] || 'General');
    }
    setCurrencyInput('₹');
    setMinPriceInput('2999');
    setMaxPriceInput('4999');
    setStockQtyInput('100');
    setMoqInput('1');
    setTaxRateInput(18);
    setImageUrlInput(PRESET_PRODUCT_IMAGES[0]);
    setDescriptionInput('');
    setFeaturesInput('');
  };

  const openCreateModal = () => {
    resetForm();
    setModalOpen(true);
  };

  const openEditModal = (p: CatalogProductItem) => {
    setViewDetailProduct(null);
    setEditingId(p.id);
    setNameInput(p.name);
    setSkuInput(p.sku);
    setCategoryInput(p.category);
    setSubCategoryInput(p.subCategory || 'General');
    setCurrencyInput(p.currency);
    setMinPriceInput(p.minPrice.toString());
    setMaxPriceInput(p.maxPrice.toString());
    setStockQtyInput(p.stockQuantity.toString());
    setMoqInput(p.moq.toString());
    setTaxRateInput(p.taxRate);
    setImageUrlInput(p.imageUrl);
    setDescriptionInput(p.description);
    setFeaturesInput(p.features.join(', '));
    setModalOpen(true);
  };

  const handleSaveCategory = async () => {
    if (!newCatNameInput.trim()) {
      Alert.alert('Validation Error', 'Category Name is required.');
      return;
    }
    const subCatStr = newSubCatNameInput.trim() || 'General';
    const updatedCats = await productCatalogService.addCategory(newCatNameInput.trim(), [subCatStr]);
    setCategories(updatedCats);
    setCategoryInput(newCatNameInput.trim());
    setSubCategoryInput(subCatStr);
    setCatModalOpen(false);
    setNewCatNameInput('');
    setNewSubCatNameInput('');
    Alert.alert('✅ Category Added', `Added category "${newCatNameInput.trim()}" with sub-category "${subCatStr}"!`);
  };

  const handleSaveSubCategory = async () => {
    const subName = newSubCatOnlyNameInput.trim();
    const parentName = newSubCatParentInput.trim();
    if (!subName) {
      Alert.alert('Validation Error', 'Sub-Category Name is required.');
      return;
    }
    if (!parentName) {
      Alert.alert('Validation Error', 'Please select a Parent Category for this Sub-Category.');
      return;
    }
    // Find existing category and add sub-category under it
    const existingCat = categories.find(c => c.name === parentName);
    if (!existingCat) {
      Alert.alert('Error', `Parent category "${parentName}" does not exist. Please create it first.`);
      return;
    }
    const updatedSubs = [...existingCat.subCategories, subName];
    const updatedCats = await productCatalogService.addCategory(parentName, updatedSubs);
    setCategories(updatedCats);
    setSubCatModalOpen(false);
    setNewSubCatOnlyNameInput('');
    setNewSubCatParentInput('');
    Alert.alert('✅ Sub-Category Added', `Added sub-category "${subName}" under "${parentName}"!`);
  };

  const handleSaveProduct = async () => {
    // Validation Conditions
    if (!nameInput.trim() || nameInput.trim().length < 3) {
      Alert.alert('Validation Error', 'Product Name must be at least 3 characters long.');
      return;
    }

    if (!skuInput.trim()) {
      Alert.alert('Validation Error', 'SKU Code is required.');
      return;
    }

    const minP = parseFloat(minPriceInput);
    const maxP = parseFloat(maxPriceInput);
    if (isNaN(minP) || minP <= 0) {
      Alert.alert('Validation Error', 'Min Price must be a valid number greater than 0.');
      return;
    }
    if (isNaN(maxP) || maxP < minP) {
      Alert.alert('Validation Error', 'Max Price must be greater than or equal to Min Price.');
      return;
    }

    const stockQty = parseInt(stockQtyInput, 10);
    if (isNaN(stockQty) || stockQty < 0) {
      Alert.alert('Validation Error', 'Stock Quantity cannot be negative.');
      return;
    }

    const moq = parseInt(moqInput, 10);
    if (isNaN(moq) || moq < 1) {
      Alert.alert('Validation Error', 'Minimum Order Quantity (MOQ) must be at least 1 unit.');
      return;
    }

    const featArray = featuresInput
      .split(',')
      .map((f) => f.trim())
      .filter((f) => f.length > 0);

    const payload = {
      name: nameInput.trim(),
      sku: skuInput.trim().toUpperCase(),
      category: categoryInput,
      subCategory: subCategoryInput,
      currency: currencyInput,
      minPrice: minP,
      maxPrice: maxP,
      stockQuantity: stockQty,
      moq,
      taxRate: taxRateInput,
      imageUrl: imageUrlInput.trim() || PRESET_PRODUCT_IMAGES[0],
      description: descriptionInput.trim() || 'No description provided.',
      features: featArray.length > 0 ? featArray : ['Enterprise Quality Verified'],
    };

    let updated: CatalogProductItem[] = [];
    if (editingId) {
      updated = await productCatalogService.updateProduct(editingId, payload);
      Alert.alert('✅ Product Updated', `Updated "${payload.name}" successfully!`);
    } else {
      updated = await productCatalogService.createProduct(payload);
      Alert.alert('✅ Product Created', `Added "${payload.name}" to Product Catalog!`);
    }

    setProducts(updated);
    setModalOpen(false);
    resetForm();
  };

  const handleDeleteProduct = (id: string, name: string) => {
    setViewDetailProduct(null);
    Alert.alert(
      '🗑️ Delete Product',
      `Are you sure you want to delete "${name}" from the catalog?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            const updated = await productCatalogService.deleteProduct(id);
            setProducts(updated);
            Alert.alert('Deleted', `"${name}" removed from catalog.`);
          },
        },
      ]
    );
  };

  const handleShareWhatsAppQuote = (p: CatalogProductItem) => {
    const text = `Hi, here is the official product quotation from DAS CRM:\n\n📦 *Product:* ${p.name}\n🏷️ *SKU:* ${p.sku}\n📁 *Category:* ${p.category} -> ${p.subCategory}\n💰 *Price Range:* ${p.currency}${p.minPrice.toLocaleString()} - ${p.currency}${p.maxPrice.toLocaleString()} (+${p.taxRate}% GST)\n📦 *MOQ:* ${p.moq} Units\n🟢 *Stock Status:* ${p.stockQuantity > 0 ? `${p.stockQuantity} Units In Stock` : 'Out of Stock'}\n\n📝 *Description:* ${p.description}`;
    const waUrl = `whatsapp://send?text=${encodeURIComponent(text)}`;
    Linking.openURL(waUrl).catch(() => {
      Alert.alert('WhatsApp Launch', 'Opening WhatsApp to share quotation...');
    });
  };

  const insets = useSafeAreaInsets();
  const topPadding = Math.max(insets.top + 6, 18);
  const bottomPadding = Math.max(insets.bottom + 10, 20);

  return (
    <View style={[styles.container, { paddingTop: topPadding }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 36 }]} showsVerticalScrollIndicator={false}>

        {/* Top Navigation Sub-Header (Matched to CommunicationScreen.tsx) */}
        <View style={styles.topSubHeaderBar}>
          {onClose ? (
            <TouchableOpacity style={styles.backBtn} onPress={onClose}>
              <Text style={styles.backBtnText}>← Back to Operations</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <Text style={styles.subHeaderTitle}>📦 Products &amp; Catalog Customization</Text>
        </View>

        {/* Main Header Box (Matched to CommunicationScreen.tsx) */}
        <View style={styles.headerBox}>
          <Text style={styles.headerTitle}>Products &amp; Catalog Customization Engine</Text>
          <Text style={styles.headerSubtitle}>
            Categories • Sub-Categories • Inventory Stock • Minimum Order Quantity &amp; Tier Pricing
          </Text>
        </View>

        {/* Metrics Summary Cards */}
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}>
            <Text style={styles.metricVal}>{totalItems}</Text>
            <Text style={styles.metricLbl}>Total Items</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#34d399' }]}>{inStockCount}</Text>
            <Text style={styles.metricLbl}>In Stock (≥10)</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#facc15' }]}>{lowStockCount + outOfStockCount}</Text>
            <Text style={styles.metricLbl}>Stock Alerts</Text>
          </View>
          <View style={styles.metricCard}>
            <Text style={[styles.metricVal, { color: '#818cf8', fontSize: 13 }]}>
              ₹{(totalValuation / 1000).toFixed(1)}k
            </Text>
            <Text style={styles.metricLbl}>Catalog Value</Text>
          </View>
        </View>

        {/* Quick Action Bar: + Create Product, 📁 + Category, 📂 + Sub-Category */}
        <View style={{ width: '100%', maxWidth: 650, flexDirection: 'row', gap: 6, marginBottom: 12 }}>
          <TouchableOpacity style={[styles.createProductBtn, { flex: 1.5 }]} onPress={openCreateModal} activeOpacity={0.85}>
            <Text style={styles.createProductBtnText}>+ Create Product →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createCatBtn, { flex: 1 }]}
            onPress={() => {
              setNewCatNameInput('');
              setNewSubCatNameInput('');
              setCatModalOpen(true);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.createCatBtnText}>📁 + Category</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createSubCatBtn, { flex: 1.1 }]}
            onPress={() => {
              // Pre-fill parent with first available category
              setNewSubCatParentInput(categories.length > 0 ? categories[0].name : '');
              setNewSubCatOnlyNameInput('');
              setSubCatModalOpen(true);
            }}
            activeOpacity={0.85}
          >
            <Text style={styles.createSubCatBtnText}>📂 + Sub-Category</Text>
          </TouchableOpacity>
        </View>

        {/* Search & Dual-Level Category / Sub-Category Filter Bar */}
        <View style={styles.filterSection}>
          <TextInput
            style={styles.searchInput}
            placeholder="🔍 Search products, SKU, category or sub-category..."
            placeholderTextColor="#64748b"
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Level 1: Parent Category Chips */}
          <Text style={{ fontSize: 9, fontWeight: '800', color: '#818cf8', marginTop: 8, marginBottom: 4 }}>
            📁 Parent Category Filter:
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
            {[
              { key: 'ALL', label: `All (${products.length})` },
              ...categories.map((c) => ({ key: c.name, label: c.name })),
              { key: 'LOW_STOCK', label: `⚠️ Low Stock (${lowStockCount + outOfStockCount})` },
            ].map((f) => (
              <TouchableOpacity
                key={f.key}
                style={[styles.filterChip, activeCategory === f.key && styles.filterChipActive]}
                onPress={() => {
                  setActiveCategory(f.key);
                  setActiveSubCategory('ALL');
                }}
              >
                <Text style={[styles.filterChipText, activeCategory === f.key && styles.filterChipTextActive]}>
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Level 2: Sub-Category Chips */}
          {activeCategory !== 'ALL' && activeCategory !== 'LOW_STOCK' && availableFilterSubCats.length > 0 && (
            <>
              <Text style={{ fontSize: 9, fontWeight: '800', color: '#38bdf8', marginTop: 6, marginBottom: 4 }}>
                📂 Sub-Category Filter ({activeCategory}):
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {[
                  { key: 'ALL', label: 'All Sub-Categories' },
                  ...availableFilterSubCats.map((sc) => ({ key: sc, label: sc })),
                ].map((scObj) => (
                  <TouchableOpacity
                    key={scObj.key}
                    style={[styles.subFilterChip, activeSubCategory === scObj.key && styles.subFilterChipActive]}
                    onPress={() => setActiveSubCategory(scObj.key)}
                  >
                    <Text style={[styles.subFilterChipText, activeSubCategory === scObj.key && styles.subFilterChipTextActive]}>
                      {scObj.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </>
          )}
        </View>

        {/* Product Cards List — Tapping opens Full Details Modal */}
        <View style={styles.productsContainer}>
          {filteredProducts.map((p) => {
            const isOutOfStock = p.stockQuantity <= 0;
            const isLowStock = p.stockQuantity > 0 && p.stockQuantity < 10;
            const stockColor = isOutOfStock ? '#ef4444' : isLowStock ? '#facc15' : '#34d399';

            return (
              <TouchableOpacity
                key={p.id}
                style={styles.productCard}
                onPress={() => setViewDetailProduct(p)}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  <Image source={{ uri: p.imageUrl }} style={styles.productImg} />
                  <View style={{ flex: 1 }}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                        <Text style={styles.categoryBadgeText}>📁 {p.category}</Text>
                        {p.subCategory && (
                          <Text style={styles.subCategoryBadgeText}>📂 {p.subCategory}</Text>
                        )}
                      </View>
                      <Text style={styles.skuTagText}>{p.sku}</Text>
                    </View>

                    <Text style={styles.productTitle}>{p.name}</Text>
                    <Text style={styles.priceRangeText}>
                      {p.currency}{p.minPrice.toLocaleString()} - {p.currency}{p.maxPrice.toLocaleString()}
                      <Text style={{ fontSize: 9, color: '#94a3b8' }}> (+{p.taxRate}% GST)</Text>
                    </Text>

                    {/* Quantity & Stock Conditions */}
                    <View style={styles.conditionsRow}>
                      <View style={[styles.stockBadge, { backgroundColor: stockColor + '20', borderColor: stockColor }]}>
                        <Text style={[styles.stockBadgeText, { color: stockColor }]}>
                          {isOutOfStock ? '🔴 Out of Stock' : isLowStock ? `🟡 Low Stock (${p.stockQuantity} Left)` : `🟢 In Stock (${p.stockQuantity} Units)`}
                        </Text>
                      </View>

                      <View style={styles.moqBadge}>
                        <Text style={styles.moqBadgeText}>📦 MOQ: {p.moq} Unit(s)</Text>
                      </View>
                    </View>
                  </View>
                </View>

                <Text style={styles.descriptionText} numberOfLines={2}>{p.description}</Text>

                {/* Features List */}
                <View style={styles.featureChipsRow}>
                  {p.features.slice(0, 3).map((feat, idx) => (
                    <View key={idx} style={styles.featChip}>
                      <Text style={styles.featChipText}>✓ {feat}</Text>
                    </View>
                  ))}
                  {p.features.length > 3 && (
                    <Text style={{ fontSize: 8, color: '#818cf8', fontWeight: '800', alignSelf: 'center' }}>
                      +{p.features.length - 3} more specs →
                    </Text>
                  )}
                </View>

                <View style={styles.tapDetailsHintRow}>
                  <Text style={styles.tapDetailsHintText}>🔍 Tap Card to View Full Product Specs &amp; Tier Pricing →</Text>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 🔍 FULL PRODUCT SPECIFICATION & DETAILS INSPECTOR MODAL                     */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={!!viewDetailProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {viewDetailProduct && (
            <View style={styles.modalCardLarge}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{viewDetailProduct.name}</Text>
                  <Text style={styles.modalSub}>SKU: {viewDetailProduct.sku} • Added: {viewDetailProduct.createdAt}</Text>
                </View>
                <TouchableOpacity onPress={() => setViewDetailProduct(null)} style={styles.modalCloseBtn}>
                  <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>✕</Text>
                </TouchableOpacity>
              </View>

              <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
                {/* Product Cover Image */}
                <Image source={{ uri: viewDetailProduct.imageUrl }} style={styles.detailCoverImg} />

                {/* Category & Sub-Category Badges */}
                <View style={{ flexDirection: 'row', gap: 6, marginVertical: 8, alignItems: 'center' }}>
                  <Text style={styles.categoryBadgeText}>📁 {viewDetailProduct.category}</Text>
                  <Text style={styles.subCategoryBadgeText}>📂 {viewDetailProduct.subCategory}</Text>
                  <View style={[styles.stockBadge, { backgroundColor: (viewDetailProduct.stockQuantity > 0 ? '#34d399' : '#ef4444') + '20', borderColor: viewDetailProduct.stockQuantity > 0 ? '#34d399' : '#ef4444', marginLeft: 'auto' }]}>
                    <Text style={[styles.stockBadgeText, { color: viewDetailProduct.stockQuantity > 0 ? '#34d399' : '#ef4444' }]}>
                      {viewDetailProduct.stockQuantity > 0 ? `🟢 ${viewDetailProduct.stockQuantity} Units In Stock` : '🔴 Out of Stock'}
                    </Text>
                  </View>
                </View>

                {/* Pricing & Tax Summary */}
                <View style={styles.detailPriceCard}>
                  <Text style={styles.detailPriceTitle}>
                    Price Range: {viewDetailProduct.currency}{viewDetailProduct.minPrice.toLocaleString()} - {viewDetailProduct.currency}{viewDetailProduct.maxPrice.toLocaleString()}
                  </Text>
                  <Text style={styles.detailPriceSub}>
                    Applicable GST Tax: {viewDetailProduct.taxRate}% • Minimum Order Quantity (MOQ): {viewDetailProduct.moq} Unit(s)
                  </Text>
                </View>

                {/* Full Description */}
                <Text style={styles.inputLabel}>📝 Detailed Product Overview:</Text>
                <Text style={{ fontSize: 11, color: '#ffffff', lineHeight: 18, marginBottom: 10 }}>
                  {viewDetailProduct.description}
                </Text>

                {/* Full Features & Specifications */}
                <Text style={styles.inputLabel}>⚡ Key Features &amp; Specifications:</Text>
                <View style={{ gap: 6, marginBottom: 12 }}>
                  {viewDetailProduct.features.map((feat, idx) => (
                    <View key={idx} style={styles.detailFeatRow}>
                      <Text style={{ color: '#38bdf8', fontWeight: '900' }}>✓</Text>
                      <Text style={{ fontSize: 11, color: '#cbd5e1', flex: 1 }}>{feat}</Text>
                    </View>
                  ))}
                </View>

                {/* Tier Pricing Breakdown */}
                <Text style={styles.inputLabel}>📊 Volume Discount Tier Pricing:</Text>
                <View style={styles.tierTableCard}>
                  <View style={styles.tierTableRow}>
                    <Text style={[styles.tierTableCell, { fontWeight: '900', color: '#818cf8' }]}>Quantity Band</Text>
                    <Text style={[styles.tierTableCell, { fontWeight: '900', color: '#34d399' }]}>Unit Price</Text>
                    <Text style={[styles.tierTableCell, { fontWeight: '900', color: '#cbd5e1' }]}>Discount Tier</Text>
                  </View>
                  <View style={styles.tierTableRow}>
                    <Text style={styles.tierTableCell}>1 - 9 Units</Text>
                    <Text style={styles.tierTableCell}>{viewDetailProduct.currency}{viewDetailProduct.maxPrice}</Text>
                    <Text style={styles.tierTableCell}>Standard Base</Text>
                  </View>
                  <View style={styles.tierTableRow}>
                    <Text style={styles.tierTableCell}>10 - 49 Units</Text>
                    <Text style={styles.tierTableCell}>{viewDetailProduct.currency}{Math.round(viewDetailProduct.minPrice * 1.15)}</Text>
                    <Text style={styles.tierTableCell}>15% Team Discount</Text>
                  </View>
                  <View style={styles.tierTableRow}>
                    <Text style={styles.tierTableCell}>50+ Bulk Units</Text>
                    <Text style={styles.tierTableCell}>{viewDetailProduct.currency}{viewDetailProduct.minPrice}</Text>
                    <Text style={styles.tierTableCell}>35% Enterprise Max</Text>
                  </View>
                </View>

                {/* Detail Action Buttons */}
                <View style={{ flexDirection: 'row', gap: 8, marginTop: 14 }}>
                  <TouchableOpacity style={styles.editBtn} onPress={() => openEditModal(viewDetailProduct)}>
                    <Text style={styles.editBtnText}>✏️ Edit Product</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.quoteBtn} onPress={() => handleShareWhatsAppQuote(viewDetailProduct)}>
                    <Text style={styles.quoteBtnText}>💬 WhatsApp Quote</Text>
                  </TouchableOpacity>

                  <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteProduct(viewDetailProduct.id, viewDetailProduct.name)}>
                    <Text style={styles.deleteBtnText}>🗑️ Delete</Text>
                  </TouchableOpacity>
                </View>

              </ScrollView>
            </View>
          )}
        </View>
      </Modal>

      {/* 📁 CREATE NEW CATEGORY MODAL (Category name + its first Sub-Category) */}
      <Modal visible={catModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardSmall}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>📁 Add New Category</Text>
                <Text style={styles.modalSub}>Create a new top-level product category</Text>
              </View>
              <TouchableOpacity onPress={() => setCatModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>Category Name (Required):</Text>
            <TextInput
              style={styles.formInput}
              placeholder="e.g. Cybersecurity Software"
              placeholderTextColor="#64748b"
              value={newCatNameInput}
              onChangeText={setNewCatNameInput}
            />

            <Text style={styles.inputLabel}>Initial Sub-Category (Optional — defaults to 'General'):</Text>
            <TextInput
              style={[styles.formInput, { marginTop: 4 }]}
              placeholder="e.g. Network VPN Shield (Leave empty for 'General')"
              placeholderTextColor="#64748b"
              value={newSubCatNameInput}
              onChangeText={setNewSubCatNameInput}
            />

            <TouchableOpacity style={styles.saveProductBtn} onPress={handleSaveCategory} activeOpacity={0.85}>
              <Text style={styles.saveProductBtnText}>💾 Save Category →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* 📂 CREATE SUB-CATEGORY MODAL (Separate — adds sub under existing category) */}
      <Modal visible={subCatModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCardSmall}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>📂 Add Sub-Category</Text>
                <Text style={styles.modalSub}>Add a sub-category under an existing parent category</Text>
              </View>
              <TouchableOpacity onPress={() => setSubCatModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.inputLabel}>1. Select Parent Category:</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
              {categories.map((cat) => (
                <TouchableOpacity
                  key={cat.id}
                  style={[
                    styles.catChip,
                    newSubCatParentInput === cat.name && styles.catChipActive,
                  ]}
                  onPress={() => setNewSubCatParentInput(cat.name)}
                >
                  <Text style={[
                    styles.catChipText,
                    newSubCatParentInput === cat.name && { color: '#818cf8', fontWeight: '900' },
                  ]}>
                    📁 {cat.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            <Text style={styles.inputLabel}>2. Sub-Category Name (Required):</Text>
            <TextInput
              style={[styles.formInput, { marginTop: 4 }]}
              placeholder="e.g. Network VPN Shield"
              placeholderTextColor="#64748b"
              value={newSubCatOnlyNameInput}
              onChangeText={setNewSubCatOnlyNameInput}
            />

            <TouchableOpacity style={styles.saveProductBtn} onPress={handleSaveSubCategory} activeOpacity={0.85}>
              <Text style={styles.saveProductBtnText}>💾 Save Sub-Category →</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ➕ CREATE / EDIT PRODUCT MODAL FORM WITH CATEGORY & SUB-CATEGORY PICKERS */}
      <Modal visible={modalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>
                  {editingId ? '✏️ Edit Product Details & Stock' : '+ Create New Product / Service'}
                </Text>
                <Text style={styles.modalSub}>Category, Sub-Category, Prices, Inventory &amp; Tax Conditions</Text>
              </View>
              <TouchableOpacity onPress={() => setModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={{ color: '#ffffff', fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>

              {/* 1. Product Name */}
              <Text style={styles.inputLabel}>1. Product Name (Required):</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. DAS CRM Enterprise Suite 2026"
                placeholderTextColor="#64748b"
                value={nameInput}
                onChangeText={setNameInput}
              />

              {/* 2. SKU Code */}
              <Text style={styles.inputLabel}>2. SKU Code (Required):</Text>
              <TextInput
                style={styles.formInput}
                placeholder="e.g. DAS-CRM-001"
                placeholderTextColor="#64748b"
                value={skuInput}
                onChangeText={setSkuInput}
              />

              {/* 3. Parent Category Picker */}
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 8 }}>
                <Text style={styles.inputLabel}>3. Parent Category:</Text>
                <TouchableOpacity onPress={() => setCatModalOpen(true)}>
                  <Text style={{ fontSize: 9, color: '#38bdf8', fontWeight: '800' }}>+ Add New Category</Text>
                </TouchableOpacity>
              </View>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                {categories.map((cat) => {
                  const isSel = categoryInput === cat.name;
                  return (
                    <TouchableOpacity
                      key={cat.id}
                      style={[styles.catChip, isSel && styles.catChipActive]}
                      onPress={() => {
                        setCategoryInput(cat.name);
                        setSubCategoryInput(cat.subCategories[0] || 'General');
                      }}
                    >
                      <Text style={[styles.catChipText, isSel && { color: '#818cf8', fontWeight: '900' }]}>
                        📁 {cat.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 4. Sub-Category Picker */}
              <Text style={styles.inputLabel}>4. Sub-Category ({categoryInput}):</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 4 }}>
                {availableFormSubCats.map((subC) => {
                  const isSel = subCategoryInput === subC;
                  return (
                    <TouchableOpacity
                      key={subC}
                      style={[styles.subCatChip, isSel && styles.subCatChipActive]}
                      onPress={() => setSubCategoryInput(subC)}
                    >
                      <Text style={[styles.subCatChipText, isSel && { color: '#38bdf8', fontWeight: '900' }]}>
                        📂 {subC}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>

              {/* 5. Pricing Bounds (Min & Max Price) */}
              <Text style={styles.inputLabel}>5. Price Range Bounds (Required):</Text>
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Min Price (e.g. 2999)"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={minPriceInput}
                    onChangeText={setMinPriceInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <TextInput
                    style={styles.formInput}
                    placeholder="Max Price (e.g. 4999)"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={maxPriceInput}
                    onChangeText={setMaxPriceInput}
                  />
                </View>
              </View>

              {/* 6. Stock Quantities & MOQ Conditions */}
              <Text style={styles.inputLabel}>6. Inventory Stock &amp; MOQ Conditions:</Text>
              <View style={styles.formRow}>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, color: '#94a3b8', marginBottom: 2 }}>Available Stock (Units):</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 100"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={stockQtyInput}
                    onChangeText={setStockQtyInput}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: 9, color: '#94a3b8', marginBottom: 2 }}>Minimum Order Qty (MOQ):</Text>
                  <TextInput
                    style={styles.formInput}
                    placeholder="e.g. 1"
                    placeholderTextColor="#64748b"
                    keyboardType="numeric"
                    value={moqInput}
                    onChangeText={setMoqInput}
                  />
                </View>
              </View>

              {/* 7. GST / Tax Rate Percentage */}
              <Text style={styles.inputLabel}>7. GST / Tax Rate Percentage:</Text>
              <View style={{ flexDirection: 'row', gap: 6, marginBottom: 10 }}>
                {[0, 5, 12, 18, 28].map((rate) => (
                  <TouchableOpacity
                    key={rate}
                    style={[styles.taxChip, taxRateInput === rate && styles.taxChipActive]}
                    onPress={() => setTaxRateInput(rate)}
                  >
                    <Text style={[styles.taxChipText, taxRateInput === rate && { color: '#38bdf8', fontWeight: '900' }]}>
                      {rate}% GST
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              {/* 8. Product Image Preset Selector */}
              <Text style={styles.inputLabel}>8. Product Image (URL or Presets):</Text>
              <TextInput
                style={styles.formInput}
                placeholder="Image URL..."
                placeholderTextColor="#64748b"
                value={imageUrlInput}
                onChangeText={setImageUrlInput}
              />
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginVertical: 6 }}>
                {PRESET_PRODUCT_IMAGES.map((img, idx) => (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => setImageUrlInput(img)}
                    style={[styles.imgPresetBtn, imageUrlInput === img && styles.imgPresetActive]}
                  >
                    <Image source={{ uri: img }} style={styles.imgPresetThumb} />
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* 9. Description & Key Features */}
              <Text style={styles.inputLabel}>9. Description &amp; Key Features (Comma Separated):</Text>
              <TextInput
                style={[styles.formInput, { height: 60 }]}
                multiline
                placeholder="Enter detailed product description..."
                placeholderTextColor="#64748b"
                value={descriptionInput}
                onChangeText={setDescriptionInput}
              />
              <TextInput
                style={[styles.formInput, { marginTop: 6 }]}
                placeholder="Features (e.g. WhatsApp API, 24/7 SLA, AI Scoring)..."
                placeholderTextColor="#64748b"
                value={featuresInput}
                onChangeText={setFeaturesInput}
              />

              {/* SAVE BUTTON */}
              <TouchableOpacity style={styles.saveProductBtn} onPress={handleSaveProduct} activeOpacity={0.85}>
                <Text style={styles.saveProductBtnText}>
                  💾 {editingId ? 'Save Product Changes' : 'Create & Add to Product Catalog'} →
                </Text>
              </TouchableOpacity>

            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#090d16' },
  content: { padding: 16, alignItems: 'center', paddingBottom: 36 },

  headerRow: { width: '100%', maxWidth: 650, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: '#ffffff' },
  screenSub: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  closeBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },

  metricsGrid: { width: '100%', maxWidth: 650, flexDirection: 'row', gap: 8, marginBottom: 12 },
  metricCard: { flex: 1, backgroundColor: '#0f172a', borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1e293b' },
  metricVal: { fontSize: 16, fontWeight: '900', color: '#ffffff' },
  metricLbl: { fontSize: 9, color: '#94a3b8', marginTop: 2, textAlign: 'center' },

  createProductBtn: { backgroundColor: '#4f46e5', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  createProductBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  createCatBtn: { backgroundColor: '#1e293b', borderWidth: 1, borderColor: '#334155', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  createCatBtnText: { color: '#818cf8', fontSize: 10, fontWeight: '800' },
  createSubCatBtn: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#38bdf8', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  createSubCatBtnText: { color: '#38bdf8', fontSize: 10, fontWeight: '800' },

  filterSection: { width: '100%', maxWidth: 650, marginBottom: 12 },
  searchInput: { backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, color: '#ffffff', fontSize: 11 },

  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: '#0f172a', borderWidth: 1, borderColor: '#334155', marginRight: 6 },
  filterChipActive: { backgroundColor: 'rgba(99,102,241,0.2)', borderColor: '#818cf8' },
  filterChipText: { fontSize: 10, fontWeight: '700', color: '#94a3b8' },
  filterChipTextActive: { color: '#818cf8', fontWeight: '900' },

  subFilterChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: '#020617', borderWidth: 1, borderColor: '#1e293b', marginRight: 4 },
  subFilterChipActive: { backgroundColor: 'rgba(56,189,248,0.15)', borderColor: '#38bdf8' },
  subFilterChipText: { fontSize: 9, color: '#94a3b8', fontWeight: '700' },
  subFilterChipTextActive: { color: '#38bdf8', fontWeight: '900' },

  productsContainer: { width: '100%', maxWidth: 650, gap: 12 },
  productCard: { backgroundColor: '#0f172a', borderRadius: 16, borderWidth: 1, borderColor: '#1e293b', padding: 14 },
  productImg: { width: 64, height: 64, borderRadius: 12, resizeMode: 'cover' },

  categoryBadgeText: { fontSize: 8, fontWeight: '900', color: '#818cf8', backgroundColor: 'rgba(99,102,241,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  subCategoryBadgeText: { fontSize: 8, fontWeight: '800', color: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  skuTagText: { fontSize: 9, fontWeight: '800', color: '#64748b' },

  productTitle: { fontSize: 14, fontWeight: '900', color: '#ffffff', marginTop: 3 },
  priceRangeText: { fontSize: 12, fontWeight: '800', color: '#34d399', marginTop: 2 },

  conditionsRow: { flexDirection: 'row', gap: 6, marginTop: 6, alignItems: 'center' },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  stockBadgeText: { fontSize: 9, fontWeight: '800' },
  moqBadge: { backgroundColor: '#020617', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: '#334155' },
  moqBadgeText: { fontSize: 9, color: '#cbd5e1', fontWeight: '700' },

  descriptionText: { fontSize: 11, color: '#cbd5e1', marginTop: 8, lineHeight: 16 },

  featureChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  featChip: { backgroundColor: '#020617', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#1e293b' },
  featChipText: { fontSize: 8, color: '#94a3b8', fontWeight: '700' },

  tapDetailsHintRow: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: '#1e293b', alignItems: 'center' },
  tapDetailsHintText: { color: '#818cf8', fontSize: 10, fontWeight: '800' },

  cardActionsRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  editBtn: { backgroundColor: '#1e293b', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#334155' },
  editBtnText: { color: '#818cf8', fontSize: 10, fontWeight: '800' },
  deleteBtn: { backgroundColor: 'rgba(239,68,68,0.15)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)' },
  deleteBtnText: { color: '#fca5a5', fontSize: 10, fontWeight: '800' },
  quoteBtn: { backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginLeft: 'auto' },
  quoteBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },

  // Detail Modal Styles
  detailCoverImg: { width: '100%', height: 160, borderRadius: 14, resizeMode: 'cover', marginBottom: 4 },
  detailPriceCard: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#38bdf8', padding: 10, marginVertical: 8 },
  detailPriceTitle: { fontSize: 14, fontWeight: '900', color: '#34d399' },
  detailPriceSub: { fontSize: 10, color: '#cbd5e1', marginTop: 2 },

  detailFeatRow: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: '#020617', padding: 8, borderRadius: 8, borderWidth: 1, borderColor: '#1e293b' },

  tierTableCard: { backgroundColor: '#020617', borderRadius: 12, borderWidth: 1, borderColor: '#1e293b', padding: 8, marginBottom: 12 },
  tierTableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#1e293b' },
  tierTableCell: { flex: 1, fontSize: 10, color: '#cbd5e1', textAlign: 'center' },

  // Modal Form Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(2, 6, 23, 0.85)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 460, maxHeight: '90%', backgroundColor: '#0f172a', borderRadius: 24, borderWidth: 1, borderColor: '#1e293b', padding: 16 },
  modalCardLarge: { width: '100%', maxWidth: 500, maxHeight: '92%', backgroundColor: '#0f172a', borderRadius: 24, borderWidth: 1, borderColor: '#1e293b', padding: 16 },
  modalCardSmall: { width: '100%', maxWidth: 400, backgroundColor: '#0f172a', borderRadius: 20, borderWidth: 1, borderColor: '#1e293b', padding: 16 },

  topSubHeaderBar: {
    width: '100%',
    maxWidth: 650,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#1e293b',
  },
  backBtn: {
    backgroundColor: '#1e293b',
    borderWidth: 1,
    borderColor: '#334155',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backBtnText: {
    color: '#38bdf8',
    fontSize: 11,
    fontWeight: '800',
  },
  subHeaderTitle: { fontSize: 12, fontWeight: '900', color: '#ffffff' },
  headerBox: { width: '100%', maxWidth: 650, marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: '#ffffff', marginBottom: 2 },
  headerSubtitle: { fontSize: 11, color: '#94a3b8' },

  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#1e293b', paddingBottom: 10 },
  modalTitle: { fontSize: 15, fontWeight: '900', color: '#ffffff' },
  modalSub: { fontSize: 10, color: '#94a3b8', marginTop: 1 },
  modalCloseBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#1e293b', justifyContent: 'center', alignItems: 'center' },

  inputLabel: { fontSize: 10, fontWeight: '800', color: '#818cf8', marginTop: 8, marginBottom: 4 },
  formInput: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, color: '#ffffff', fontSize: 11 },
  formRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },

  catChip: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6 },
  catChipActive: { borderColor: '#818cf8', backgroundColor: 'rgba(99,102,241,0.15)' },
  catChipText: { fontSize: 10, color: '#cbd5e1', fontWeight: '700' },

  subCatChip: { backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginRight: 4 },
  subCatChipActive: { borderColor: '#38bdf8', backgroundColor: 'rgba(56,189,248,0.15)' },
  subCatChipText: { fontSize: 9, color: '#94a3b8', fontWeight: '700' },

  taxChip: { flex: 1, backgroundColor: '#020617', borderWidth: 1, borderColor: '#334155', borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  taxChipActive: { backgroundColor: 'rgba(56,189,248,0.15)', borderColor: '#38bdf8' },
  taxChipText: { fontSize: 10, color: '#cbd5e1', fontWeight: '700' },

  imgPresetBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: '#334155', overflow: 'hidden', marginRight: 6 },
  imgPresetActive: { borderColor: '#38bdf8', borderWidth: 2 },
  imgPresetThumb: { width: '100%', height: '100%', resizeMode: 'cover' },

  saveProductBtn: { backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 14 },
  saveProductBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
});

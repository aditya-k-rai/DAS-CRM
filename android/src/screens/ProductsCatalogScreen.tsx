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
  Switch,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  productCatalogService,
  CatalogProductItem,
  CategoryTree,
  PRESET_PRODUCT_IMAGES,
  ProductCardDisplayConfig,
  DEFAULT_CARD_DISPLAY_CONFIG,
} from '../services/productCatalogService';
import { useAuthStore, normalizeRoleStr } from '../store/authStore';
import { useTheme } from '../context/ThemeContext';

interface ProductsCatalogScreenProps {
  onClose?: () => void;
  onSelectProductForQuote?: (product: CatalogProductItem) => void;
  isModal?: boolean;
}

export default function ProductsCatalogScreen({
  onClose,
  onSelectProductForQuote,
  isModal = false,
}: ProductsCatalogScreenProps) {
  const { colors, isDark } = useTheme();
  const styles = React.useMemo(() => getStyles(colors, isDark), [colors, isDark]);
  const [products, setProducts] = useState<CatalogProductItem[]>([]);
  const [categories, setCategories] = useState<CategoryTree[]>([]);

  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('ALL');
  const [activeSubCategory, setActiveSubCategory] = useState<string>('ALL');

  const { currentUser } = useAuthStore();
  const isAdmin = normalizeRoleStr(currentUser?.role) === 'ADMIN';

  // Product Card Display Configuration State (Admin-governed)
  const [cardConfig, setCardConfig] = useState<ProductCardDisplayConfig>(DEFAULT_CARD_DISPLAY_CONFIG);
  const [configModalOpen, setConfigModalOpen] = useState(false);
  const [tempConfig, setTempConfig] = useState<ProductCardDisplayConfig>(DEFAULT_CARD_DISPLAY_CONFIG);

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
    const cfg = await productCatalogService.getCardDisplayConfig();
    setProducts(prods);
    setCategories(cats);
    setCardConfig(cfg);
    setTempConfig(cfg);
    if (cats.length > 0) {
      setCategoryInput(cats[0].name);
      setSubCategoryInput(cats[0].subCategories[0] || 'General');
    }
  };

  // ── Admin Card Display Handlers ──────────────────────────────────────────
  const handleOpenConfigModal = () => {
    if (!isAdmin) {
      Alert.alert(
        '🔒 Admin Access Required',
        'Only Organization Admins are permitted to configure product card display fields on this screen.'
      );
      return;
    }
    setTempConfig({ ...cardConfig });
    setConfigModalOpen(true);
  };

  const handleSaveCardConfig = async () => {
    if (!isAdmin) {
      Alert.alert('🔒 Admin Access Required', 'Only Organization Admins can save card display preferences.');
      return;
    }
    await productCatalogService.saveCardDisplayConfig(tempConfig);
    setCardConfig(tempConfig);
    setConfigModalOpen(false);
    Alert.alert('✅ Display Settings Saved', 'Product catalog card display configuration updated successfully!');
  };

  const handleResetCardConfig = () => {
    setTempConfig(DEFAULT_CARD_DISPLAY_CONFIG);
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
    <View style={[styles.container, { backgroundColor: colors.bg, paddingTop: isModal ? topPadding : 8 }]}>
      <ScrollView contentContainerStyle={[styles.content, { paddingBottom: bottomPadding + 36 }]} showsVerticalScrollIndicator={false}>

        {/* Top Navigation Sub-Header (Matched to CommunicationScreen.tsx) */}
        <View style={[styles.topSubHeaderBar, { borderBottomColor: colors.border }]}>
          {onClose ? (
            <TouchableOpacity style={[styles.backBtn, { backgroundColor: colors.cardBg, borderColor: colors.border }]} onPress={onClose}>
              <Text style={[styles.backBtnText, { color: colors.primary }]}>← Back to Operations</Text>
            </TouchableOpacity>
          ) : (
            <View />
          )}
          <Text style={[styles.subHeaderTitle, { color: colors.text }]}>📦 Products &amp; Catalog Customization</Text>
        </View>

        {/* Main Header Box (Matched to CommunicationScreen.tsx) */}
        <View style={styles.headerBox}>
          <Text style={[styles.headerTitle, { color: colors.text }]}>Products &amp; Catalog Customization Engine</Text>
          <Text style={[styles.headerSubtitle, { color: colors.textSecondary }]}>
            Categories • Sub-Categories • Inventory Stock • Minimum Order Quantity &amp; Tier Pricing
          </Text>
        </View>

        {/* Metrics Summary Cards */}
        <View style={styles.metricsGrid}>
          <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.metricVal, { color: colors.text }]}>{totalItems}</Text>
            <Text style={[styles.metricLbl, { color: colors.textSecondary }]}>Total Items</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.metricVal, { color: isDark ? '#34d399' : '#059669' }]}>{inStockCount}</Text>
            <Text style={[styles.metricLbl, { color: colors.textSecondary }]}>In Stock (≥10)</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.metricVal, { color: isDark ? '#facc15' : '#d97706' }]}>{lowStockCount + outOfStockCount}</Text>
            <Text style={[styles.metricLbl, { color: colors.textSecondary }]}>Stock Alerts</Text>
          </View>
          <View style={[styles.metricCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}>
            <Text style={[styles.metricVal, { color: isDark ? '#818cf8' : '#4f46e5', fontSize: 13 }]}>
              ₹{(totalValuation / 1000).toFixed(1)}k
            </Text>
            <Text style={[styles.metricLbl, { color: colors.textSecondary }]}>Catalog Value</Text>
          </View>
        </View>

        {/* Quick Action Bar: + Create Product, 📁 + Category, 📂 + Sub-Category */}
        <View style={{ width: '100%', maxWidth: 650, flexDirection: 'row', gap: 6, marginBottom: 8 }}>
          <TouchableOpacity style={[styles.createProductBtn, { flex: 1.5 }]} onPress={openCreateModal} activeOpacity={0.85}>
            <Text style={styles.createProductBtnText}>+ Create Product →</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createCatBtn, { backgroundColor: colors.cardBg, borderColor: colors.border, flex: 1 }]}
            onPress={() => {
              setNewCatNameInput('');
              setNewSubCatNameInput('');
              setCatModalOpen(true);
            }}
            activeOpacity={0.85}
          >
            <Text style={[styles.createCatBtnText, { color: isDark ? '#818cf8' : '#4f46e5' }]}>📁 + Category</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.createSubCatBtn, { backgroundColor: colors.cardBgElevated, borderColor: colors.border, flex: 1.1 }]}
            onPress={() => {
              // Pre-fill parent with first available category
              setNewSubCatParentInput(categories.length > 0 ? categories[0].name : '');
              setNewSubCatOnlyNameInput('');
              setSubCatModalOpen(true);
            }}
            activeOpacity={0.85}
          >
            <Text style={[styles.createSubCatBtnText, { color: isDark ? '#38bdf8' : '#0284c7' }]}>📂 + Sub-Category</Text>
          </TouchableOpacity>
        </View>

        {/* Admin Card Display Customization Action Row */}
        <View style={{ width: '100%', maxWidth: 650, marginBottom: 12 }}>
          <TouchableOpacity
            style={[
              styles.adminConfigBtn,
              { backgroundColor: colors.cardBg, borderColor: isDark ? '#4338ca' : '#c7d2fe' },
              !isAdmin && styles.adminConfigBtnDisabled,
            ]}
            onPress={handleOpenConfigModal}
            activeOpacity={0.85}
          >
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 }}>
              <Text style={{ fontSize: 14 }}>⚙️</Text>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={[styles.adminConfigBtnTitle, { color: colors.text }]}>Configure Card Display</Text>
                  <View style={[styles.adminRoleBadge, !isAdmin && { backgroundColor: '#334155' }]}>
                    <Text style={styles.adminRoleBadgeText}>{isAdmin ? 'ADMIN ONLY' : '🔒 ADMIN ONLY'}</Text>
                  </View>
                </View>
                <Text style={[styles.adminConfigBtnSubtitle, { color: colors.textSecondary }]}>
                  {isAdmin
                    ? 'Customize visible fields & attributes on this catalog screen'
                    : 'Only Organization Admins can configure visible screen fields'}
                </Text>
              </View>
            </View>
            <Text style={{ color: isAdmin ? (isDark ? '#818cf8' : '#4f46e5') : colors.textMuted, fontSize: 11, fontWeight: '800' }}>
              {isAdmin ? 'Customize →' : 'Locked'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Search & Dual-Level Category / Sub-Category Filter Bar */}
        <View style={styles.filterSection}>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.cardBg, borderColor: colors.border, color: colors.text }]}
            placeholder="🔍 Search products, SKU, category or sub-category..."
            placeholderTextColor={colors.textMuted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />

          {/* Level 1: Parent Category Chips */}
          <Text style={{ fontSize: 9, fontWeight: '800', color: isDark ? '#818cf8' : '#4f46e5', marginTop: 8, marginBottom: 4 }}>
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
                style={[
                  styles.filterChip,
                  { backgroundColor: colors.cardBg, borderColor: colors.border },
                  activeCategory === f.key && {
                    backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)',
                    borderColor: isDark ? '#818cf8' : '#4f46e5',
                  },
                ]}
                onPress={() => {
                  setActiveCategory(f.key);
                  setActiveSubCategory('ALL');
                }}
              >
                <Text
                  style={[
                    styles.filterChipText,
                    { color: colors.textSecondary },
                    activeCategory === f.key && { color: isDark ? '#818cf8' : '#4f46e5', fontWeight: '900' },
                  ]}
                >
                  {f.label}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Level 2: Sub-Category Chips */}
          {activeCategory !== 'ALL' && activeCategory !== 'LOW_STOCK' && availableFilterSubCats.length > 0 && (
            <>
              <Text style={{ fontSize: 9, fontWeight: '800', color: isDark ? '#38bdf8' : '#0284c7', marginTop: 6, marginBottom: 4 }}>
                📂 Sub-Category Filter ({activeCategory}):
              </Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ flexGrow: 0 }}>
                {[
                  { key: 'ALL', label: 'All Sub-Categories' },
                  ...availableFilterSubCats.map((sc) => ({ key: sc, label: sc })),
                ].map((scObj) => (
                  <TouchableOpacity
                    key={scObj.key}
                    style={[
                      styles.subFilterChip,
                      { backgroundColor: colors.cardBgElevated, borderColor: colors.border },
                      activeSubCategory === scObj.key && {
                        backgroundColor: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(14,165,233,0.12)',
                        borderColor: isDark ? '#38bdf8' : '#0284c7',
                      },
                    ]}
                    onPress={() => setActiveSubCategory(scObj.key)}
                  >
                    <Text
                      style={[
                        styles.subFilterChipText,
                        { color: colors.textSecondary },
                        activeSubCategory === scObj.key && { color: isDark ? '#38bdf8' : '#0284c7', fontWeight: '900' },
                      ]}
                    >
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
                style={[styles.productCard, { backgroundColor: colors.cardBg, borderColor: colors.border }]}
                onPress={() => setViewDetailProduct(p)}
                activeOpacity={0.85}
              >
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  {cardConfig.showImage && (
                    <Image source={{ uri: p.imageUrl }} style={styles.productImg} />
                  )}
                  <View style={{ flex: 1 }}>
                    {(cardConfig.showCategory || cardConfig.showSubCategory || cardConfig.showSku) && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {cardConfig.showCategory && (
                            <Text style={styles.categoryBadgeText}>📁 {p.category}</Text>
                          )}
                          {cardConfig.showSubCategory && p.subCategory && (
                            <Text style={styles.subCategoryBadgeText}>📂 {p.subCategory}</Text>
                          )}
                        </View>
                        {cardConfig.showSku && (
                          <Text style={[styles.skuTagText, { color: colors.textMuted }]}>{p.sku}</Text>
                        )}
                      </View>
                    )}

                    {cardConfig.showName && (
                      <Text style={[styles.productTitle, { color: colors.text }]}>{p.name}</Text>
                    )}

                    {cardConfig.showPrice && (
                      <Text style={[styles.priceRangeText, { color: isDark ? '#34d399' : '#059669' }]}>
                        {p.currency}{p.minPrice.toLocaleString()} - {p.currency}{p.maxPrice.toLocaleString()}
                        {cardConfig.showGst && (
                          <Text style={{ fontSize: 9, color: colors.textMuted }}> (+{p.taxRate}% GST)</Text>
                        )}
                      </Text>
                    )}

                    {/* Quantity & Stock Conditions */}
                    {(cardConfig.showInStock || cardConfig.showMoq) && (
                      <View style={styles.conditionsRow}>
                        {cardConfig.showInStock && (
                          <View style={[styles.stockBadge, { backgroundColor: stockColor + '20', borderColor: stockColor }]}>
                            <Text style={[styles.stockBadgeText, { color: stockColor }]}>
                              {isOutOfStock ? '🔴 Out of Stock' : isLowStock ? `🟡 Low Stock (${p.stockQuantity} Left)` : `🟢 In Stock (${p.stockQuantity} Units)`}
                            </Text>
                          </View>
                        )}

                        {cardConfig.showMoq && (
                          <View style={[styles.moqBadge, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                            <Text style={[styles.moqBadgeText, { color: colors.textSecondary }]}>📦 MOQ: {p.moq} Unit(s)</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {/* Description (Admin Configurable — Disabled by default) */}
                {cardConfig.showDescription && (
                  <Text style={[styles.descriptionText, { color: colors.textSecondary }]} numberOfLines={2}>{p.description}</Text>
                )}

                {/* Features List (Admin Configurable — Disabled by default) */}
                {cardConfig.showFeatures && p.features.length > 0 && (
                  <View style={styles.featureChipsRow}>
                    {p.features.slice(0, 3).map((feat, idx) => (
                      <View key={idx} style={[styles.featChip, { backgroundColor: colors.cardBgElevated, borderColor: colors.border }]}>
                        <Text style={[styles.featChipText, { color: colors.textSecondary }]}>✓ {feat}</Text>
                      </View>
                    ))}
                    {p.features.length > 3 && (
                      <Text style={{ fontSize: 8, color: isDark ? '#818cf8' : '#4f46e5', fontWeight: '800', alignSelf: 'center' }}>
                        +{p.features.length - 3} more specs →
                      </Text>
                    )}
                  </View>
                )}

                {cardConfig.showTapHint && (
                  <View style={[styles.tapDetailsHintRow, { borderTopColor: colors.border }]}>
                    <Text style={[styles.tapDetailsHintText, { color: isDark ? '#818cf8' : '#4f46e5' }]}>🔍 Tap Card to View Full Product Specs &amp; Tier Pricing →</Text>
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

      </ScrollView>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* ⚙️ ADMIN CARD DISPLAY CONFIGURATION MODAL                                    */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={configModalOpen} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCardLarge, { maxHeight: '92%', paddingBottom: Math.max(insets.bottom + 16, 20) }]}>
            {/* Modal Header */}
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <Text style={styles.modalTitle}>⚙️ Configure Product Card Display</Text>
                  <View style={styles.adminOnlyPill}>
                    <Text style={styles.adminOnlyPillText}>ADMIN ONLY</Text>
                  </View>
                </View>
                <Text style={styles.modalSub}>
                  Admin Governance: Control which attributes appear on catalog cards across the organization.
                </Text>
              </View>
              <TouchableOpacity onPress={() => setConfigModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView contentContainerStyle={{ paddingBottom: 16 }} showsVerticalScrollIndicator={false}>
              {/* Informational Guidance */}
              <View style={styles.configInfoBanner}>
                <Text style={styles.configInfoBannerText}>
                  💡 <Text style={{ fontWeight: '900' }}>Clean Default View:</Text> Cards show Image, Name, Category, Subcategory, Price, GST, In-Stock, and MOQ. Description and specs tags are hidden by default to keep cards sleek and readable.
                </Text>
              </View>

              {/* Live Preview Card */}
              <Text style={styles.configSectionTitle}>👁️ Live Card Preview</Text>
              <View style={[styles.productCard, { marginHorizontal: 0, marginBottom: 16, backgroundColor: '#020617', borderColor: '#4f46e5' }]}>
                <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-start' }}>
                  {tempConfig.showImage && (
                    <Image source={{ uri: PRESET_PRODUCT_IMAGES[0] }} style={styles.productImg} />
                  )}
                  <View style={{ flex: 1 }}>
                    {(tempConfig.showCategory || tempConfig.showSubCategory || tempConfig.showSku) && (
                      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 4 }}>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                          {tempConfig.showCategory && (
                            <Text style={styles.categoryBadgeText}>📁 CRM & Sales Software</Text>
                          )}
                          {tempConfig.showSubCategory && (
                            <Text style={styles.subCategoryBadgeText}>📂 Lead Management</Text>
                          )}
                        </View>
                        {tempConfig.showSku && (
                          <Text style={styles.skuTagText}>DAS-CRM-001</Text>
                        )}
                      </View>
                    )}

                    {tempConfig.showName && (
                      <Text style={styles.productTitle}>DAS CRM Enterprise Suite</Text>
                    )}

                    {tempConfig.showPrice && (
                      <Text style={styles.priceRangeText}>
                        ₹2,999 - ₹4,999
                        {tempConfig.showGst && (
                          <Text style={{ fontSize: 9, color: '#94a3b8' }}> (+18% GST)</Text>
                        )}
                      </Text>
                    )}

                    {(tempConfig.showInStock || tempConfig.showMoq) && (
                      <View style={styles.conditionsRow}>
                        {tempConfig.showInStock && (
                          <View style={[styles.stockBadge, { backgroundColor: '#34d39920', borderColor: '#34d399' }]}>
                            <Text style={[styles.stockBadgeText, { color: '#34d399' }]}>🟢 In Stock (250 Units)</Text>
                          </View>
                        )}

                        {tempConfig.showMoq && (
                          <View style={styles.moqBadge}>
                            <Text style={styles.moqBadgeText}>📦 MOQ: 1 Unit(s)</Text>
                          </View>
                        )}
                      </View>
                    )}
                  </View>
                </View>

                {tempConfig.showDescription && (
                  <Text style={styles.descriptionText} numberOfLines={2}>
                    Full sales automation, WhatsApp Cloud API, Email Marketing & AI Lead Scoring.
                  </Text>
                )}

                {tempConfig.showFeatures && (
                  <View style={styles.featureChipsRow}>
                    <View style={styles.featChip}>
                      <Text style={styles.featChipText}>✓ Unlimited Lead Ingestion</Text>
                    </View>
                    <View style={styles.featChip}>
                      <Text style={styles.featChipText}>✓ WhatsApp Cloud API (100K Quota)</Text>
                    </View>
                  </View>
                )}

                {tempConfig.showTapHint && (
                  <View style={styles.tapDetailsHintRow}>
                    <Text style={styles.tapDetailsHintText}>🔍 Tap Card to View Full Product Specs &amp; Tier Pricing →</Text>
                  </View>
                )}
              </View>

              {/* 1. Core Identity */}
              <Text style={styles.configSectionTitle}>1. Core Information & Identification</Text>

              <View style={styles.configToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.configToggleLabel}>🖼️ Product Cover Image</Text>
                  <Text style={styles.configToggleDesc}>Display product image thumbnail on the card</Text>
                </View>
                <Switch
                  value={tempConfig.showImage}
                  onValueChange={(val) => setTempConfig((prev) => ({ ...prev, showImage: val }))}
                  trackColor={{ false: '#334155', true: '#4f46e5' }}
                  thumbColor={tempConfig.showImage ? '#818cf8' : '#94a3b8'}
                />
              </View>

              <View style={styles.configToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.configToggleLabel}>🏷️ Product Name</Text>
                  <Text style={styles.configToggleDesc}>Display product title header</Text>
                </View>
                <Switch
                  value={tempConfig.showName}
                  onValueChange={(val) => setTempConfig((prev) => ({ ...prev, showName: val }))}
                  trackColor={{ false: '#334155', true: '#4f46e5' }}
                  thumbColor={tempConfig.showName ? '#818cf8' : '#94a3b8'}
                />
              </View>

              <View style={styles.configToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.configToggleLabel}>🔖 SKU Identifier</Text>
                  <Text style={styles.configToggleDesc}>Display SKU tag (e.g. DAS-CRM-001)</Text>
                </View>
                <Switch
                  value={tempConfig.showSku}
                  onValueChange={(val) => setTempConfig((prev) => ({ ...prev, showSku: val }))}
                  trackColor={{ false: '#334155', true: '#4f46e5' }}
                  thumbColor={tempConfig.showSku ? '#818cf8' : '#94a3b8'}
                />
              </View>

              {/* 2. Taxonomy & Categories */}
              <Text style={styles.configSectionTitle}>2. Taxonomy & Hierarchy</Text>

              <View style={styles.configToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.configToggleLabel}>📁 Parent Category Badge</Text>
                  <Text style={styles.configToggleDesc}>Show primary parent category pill</Text>
                </View>
                <Switch
                  value={tempConfig.showCategory}
                  onValueChange={(val) => setTempConfig((prev) => ({ ...prev, showCategory: val }))}
                  trackColor={{ false: '#334155', true: '#4f46e5' }}
                  thumbColor={tempConfig.showCategory ? '#818cf8' : '#94a3b8'}
                />
              </View>

              <View style={styles.configToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.configToggleLabel}>📂 Sub-Category Badge</Text>
                  <Text style={styles.configToggleDesc}>Show nested sub-category classification</Text>
                </View>
                <Switch
                  value={tempConfig.showSubCategory}
                  onValueChange={(val) => setTempConfig((prev) => ({ ...prev, showSubCategory: val }))}
                  trackColor={{ false: '#334155', true: '#4f46e5' }}
                  thumbColor={tempConfig.showSubCategory ? '#818cf8' : '#94a3b8'}
                />
              </View>

              {/* 3. Pricing, GST & Stock */}
              <Text style={styles.configSectionTitle}>3. Pricing, Taxes & Inventory</Text>

              <View style={styles.configToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.configToggleLabel}>💰 Price Range</Text>
                  <Text style={styles.configToggleDesc}>Show minimum and maximum price range</Text>
                </View>
                <Switch
                  value={tempConfig.showPrice}
                  onValueChange={(val) => setTempConfig((prev) => ({ ...prev, showPrice: val }))}
                  trackColor={{ false: '#334155', true: '#4f46e5' }}
                  thumbColor={tempConfig.showPrice ? '#818cf8' : '#94a3b8'}
                />
              </View>

              <View style={styles.configToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.configToggleLabel}>🧾 GST Tax Rate</Text>
                  <Text style={styles.configToggleDesc}>Display tax percentage suffix (+18% GST)</Text>
                </View>
                <Switch
                  value={tempConfig.showGst}
                  onValueChange={(val) => setTempConfig((prev) => ({ ...prev, showGst: val }))}
                  trackColor={{ false: '#334155', true: '#4f46e5' }}
                  thumbColor={tempConfig.showGst ? '#818cf8' : '#94a3b8'}
                />
              </View>

              <View style={styles.configToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.configToggleLabel}>🟢 In-Stock Quantity Badge</Text>
                  <Text style={styles.configToggleDesc}>Show current inventory status and units count</Text>
                </View>
                <Switch
                  value={tempConfig.showInStock}
                  onValueChange={(val) => setTempConfig((prev) => ({ ...prev, showInStock: val }))}
                  trackColor={{ false: '#334155', true: '#4f46e5' }}
                  thumbColor={tempConfig.showInStock ? '#818cf8' : '#94a3b8'}
                />
              </View>

              <View style={styles.configToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.configToggleLabel}>📦 Minimum Order Quantity (MOQ)</Text>
                  <Text style={styles.configToggleDesc}>Show minimum required units badge</Text>
                </View>
                <Switch
                  value={tempConfig.showMoq}
                  onValueChange={(val) => setTempConfig((prev) => ({ ...prev, showMoq: val }))}
                  trackColor={{ false: '#334155', true: '#4f46e5' }}
                  thumbColor={tempConfig.showMoq ? '#818cf8' : '#94a3b8'}
                />
              </View>

              {/* 4. Extended Content (Clutter Controls) */}
              <Text style={styles.configSectionTitle}>4. Extended Details (Optional Clutter)</Text>

              <View style={styles.configToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.configToggleLabel}>📝 Product Description Text</Text>
                  <Text style={styles.configToggleDesc}>Display multi-line overview on card (turn OFF for clean card)</Text>
                </View>
                <Switch
                  value={tempConfig.showDescription}
                  onValueChange={(val) => setTempConfig((prev) => ({ ...prev, showDescription: val }))}
                  trackColor={{ false: '#334155', true: '#4f46e5' }}
                  thumbColor={tempConfig.showDescription ? '#818cf8' : '#94a3b8'}
                />
              </View>

              <View style={styles.configToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.configToggleLabel}>⚡ Feature Specs Badges</Text>
                  <Text style={styles.configToggleDesc}>Display bullet tags on card (turn OFF for clean card)</Text>
                </View>
                <Switch
                  value={tempConfig.showFeatures}
                  onValueChange={(val) => setTempConfig((prev) => ({ ...prev, showFeatures: val }))}
                  trackColor={{ false: '#334155', true: '#4f46e5' }}
                  thumbColor={tempConfig.showFeatures ? '#818cf8' : '#94a3b8'}
                />
              </View>

              <View style={styles.configToggleRow}>
                <View style={{ flex: 1, paddingRight: 8 }}>
                  <Text style={styles.configToggleLabel}>🔍 Tap Card Hint</Text>
                  <Text style={styles.configToggleDesc}>Show footer hint for inspector modal</Text>
                </View>
                <Switch
                  value={tempConfig.showTapHint}
                  onValueChange={(val) => setTempConfig((prev) => ({ ...prev, showTapHint: val }))}
                  trackColor={{ false: '#334155', true: '#4f46e5' }}
                  thumbColor={tempConfig.showTapHint ? '#818cf8' : '#94a3b8'}
                />
              </View>

              {/* Action Buttons */}
              <View style={{ flexDirection: 'row', gap: 10, marginTop: 18 }}>
                <TouchableOpacity
                  style={styles.configResetBtn}
                  onPress={handleResetCardConfig}
                  activeOpacity={0.8}
                >
                  <Text style={styles.configResetBtnText}>↺ Reset Clean View</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={styles.configSaveBtn}
                  onPress={handleSaveCardConfig}
                  activeOpacity={0.8}
                >
                  <Text style={styles.configSaveBtnText}>💾 Save Preferences</Text>
                </TouchableOpacity>
              </View>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ─────────────────────────────────────────────────────────────────────────── */}
      {/* 🔍 FULL PRODUCT SPECIFICATION & DETAILS INSPECTOR MODAL                     */}
      {/* ─────────────────────────────────────────────────────────────────────────── */}
      <Modal visible={!!viewDetailProduct} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          {viewDetailProduct && (
            <View style={[styles.modalCardLarge, { paddingBottom: Math.max(insets.bottom + 16, 20) }]}>
              <View style={styles.modalHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalTitle}>{viewDetailProduct.name}</Text>
                  <Text style={styles.modalSub}>SKU: {viewDetailProduct.sku} • Added: {viewDetailProduct.createdAt}</Text>
                </View>
                <TouchableOpacity onPress={() => setViewDetailProduct(null)} style={styles.modalCloseBtn}>
                  <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>✕</Text>
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
                <Text style={{ fontSize: 11, color: colors.text, lineHeight: 18, marginBottom: 10 }}>
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
          <View style={[styles.modalCardSmall, { paddingBottom: Math.max(insets.bottom + 16, 20) }]}>
            <View style={styles.modalHeaderRow}>
              <View style={{ flex: 1 }}>
                <Text style={styles.modalTitle}>📁 Add New Category</Text>
                <Text style={styles.modalSub}>Create a new top-level product category</Text>
              </View>
              <TouchableOpacity onPress={() => setCatModalOpen(false)} style={styles.modalCloseBtn}>
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>✕</Text>
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
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>✕</Text>
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
                <Text style={{ color: colors.text, fontSize: 13, fontWeight: '900' }}>✕</Text>
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

const getStyles = (colors: any, isDark: boolean) => StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 16, alignItems: 'center', paddingBottom: 36 },

  headerRow: { width: '100%', maxWidth: 650, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  screenTitle: { fontSize: 20, fontWeight: '800', color: colors.text },
  screenSub: { fontSize: 11, color: colors.textSecondary, marginTop: 2 },
  closeBtn: { backgroundColor: colors.cardBgElevated, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border },

  metricsGrid: { width: '100%', maxWidth: 650, flexDirection: 'row', gap: 8, marginBottom: 12 },
  metricCard: { flex: 1, backgroundColor: colors.cardBg, borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: colors.border },
  metricVal: { fontSize: 16, fontWeight: '900', color: colors.text },
  metricLbl: { fontSize: 9, color: colors.textSecondary, marginTop: 2, textAlign: 'center' },

  createProductBtn: { backgroundColor: '#4f46e5', paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  createProductBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },
  createCatBtn: { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  createCatBtnText: { color: isDark ? '#818cf8' : '#4f46e5', fontSize: 10, fontWeight: '800' },
  createSubCatBtn: { backgroundColor: colors.cardBgElevated, borderWidth: 1, borderColor: colors.border, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  createSubCatBtnText: { color: isDark ? '#38bdf8' : '#0284c7', fontSize: 10, fontWeight: '800' },

  filterSection: { width: '100%', maxWidth: 650, marginBottom: 12 },
  searchInput: { backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 8, color: colors.text, fontSize: 11 },

  filterChip: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, backgroundColor: colors.cardBg, borderWidth: 1, borderColor: colors.border, marginRight: 6 },
  filterChipActive: { backgroundColor: isDark ? 'rgba(99,102,241,0.2)' : 'rgba(99,102,241,0.12)', borderColor: isDark ? '#818cf8' : '#4f46e5' },
  filterChipText: { fontSize: 10, fontWeight: '700', color: colors.textSecondary },
  filterChipTextActive: { color: isDark ? '#818cf8' : '#4f46e5', fontWeight: '900' },

  subFilterChip: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, backgroundColor: colors.cardBgElevated, borderWidth: 1, borderColor: colors.border, marginRight: 4 },
  subFilterChipActive: { backgroundColor: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(14,165,233,0.12)', borderColor: isDark ? '#38bdf8' : '#0284c7' },
  subFilterChipText: { fontSize: 9, color: colors.textSecondary, fontWeight: '700' },
  subFilterChipTextActive: { color: isDark ? '#38bdf8' : '#0284c7', fontWeight: '900' },

  productsContainer: { width: '100%', maxWidth: 650, gap: 12 },
  productCard: { backgroundColor: colors.cardBg, borderRadius: 16, borderWidth: 1, borderColor: colors.border, padding: 14 },
  productImg: { width: 64, height: 64, borderRadius: 12, resizeMode: 'cover' },

  categoryBadgeText: { fontSize: 8, fontWeight: '900', color: isDark ? '#818cf8' : '#4f46e5', backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  subCategoryBadgeText: { fontSize: 8, fontWeight: '800', color: isDark ? '#38bdf8' : '#0284c7', backgroundColor: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(14,165,233,0.1)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  skuTagText: { fontSize: 9, fontWeight: '800', color: colors.textMuted },

  productTitle: { fontSize: 14, fontWeight: '900', color: colors.text, marginTop: 3 },
  priceRangeText: { fontSize: 12, fontWeight: '800', color: isDark ? '#34d399' : '#059669', marginTop: 2 },

  conditionsRow: { flexDirection: 'row', gap: 6, marginTop: 6, alignItems: 'center' },
  stockBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1 },
  stockBadgeText: { fontSize: 9, fontWeight: '800' },
  moqBadge: { backgroundColor: colors.cardBgElevated, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6, borderWidth: 1, borderColor: colors.border },
  moqBadgeText: { fontSize: 9, color: colors.textSecondary, fontWeight: '700' },

  descriptionText: { fontSize: 11, color: colors.textSecondary, marginTop: 8, lineHeight: 16 },

  featureChipsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: 8 },
  featChip: { backgroundColor: colors.cardBgElevated, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: colors.border },
  featChipText: { fontSize: 8, color: colors.textSecondary, fontWeight: '700' },

  tapDetailsHintRow: { marginTop: 10, paddingTop: 8, borderTopWidth: 1, borderTopColor: colors.border, alignItems: 'center' },
  tapDetailsHintText: { color: isDark ? '#818cf8' : '#4f46e5', fontSize: 10, fontWeight: '800' },

  cardActionsRow: { flexDirection: 'row', gap: 8, marginTop: 12, alignItems: 'center' },
  editBtn: { backgroundColor: colors.cardBgElevated, paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: colors.border },
  editBtnText: { color: isDark ? '#818cf8' : '#4f46e5', fontSize: 10, fontWeight: '800' },
  deleteBtn: { backgroundColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: isDark ? 'rgba(239,68,68,0.3)' : 'rgba(239,68,68,0.2)' },
  deleteBtnText: { color: isDark ? '#fca5a5' : '#dc2626', fontSize: 10, fontWeight: '800' },
  quoteBtn: { backgroundColor: '#16a34a', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, marginLeft: 'auto' },
  quoteBtnText: { color: '#ffffff', fontSize: 10, fontWeight: '800' },

  // Detail Modal Styles
  detailCoverImg: { width: '100%', height: 160, borderRadius: 14, resizeMode: 'cover', marginBottom: 4 },
  detailPriceCard: { backgroundColor: colors.cardBgElevated, borderRadius: 12, borderWidth: 1, borderColor: isDark ? '#38bdf8' : '#0284c7', padding: 10, marginVertical: 8 },
  detailPriceTitle: { fontSize: 14, fontWeight: '900', color: isDark ? '#34d399' : '#059669' },
  detailPriceSub: { fontSize: 10, color: colors.textSecondary, marginTop: 2 },

  detailFeatRow: { flexDirection: 'row', gap: 6, alignItems: 'center', backgroundColor: colors.cardBgElevated, padding: 8, borderRadius: 8, borderWidth: 1, borderColor: colors.border },

  tierTableCard: { backgroundColor: colors.cardBgElevated, borderRadius: 12, borderWidth: 1, borderColor: colors.border, padding: 8, marginBottom: 12 },
  tierTableRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  tierTableCell: { flex: 1, fontSize: 10, color: colors.textSecondary, textAlign: 'center' },

  // Modal Form Styles
  modalOverlay: { flex: 1, backgroundColor: isDark ? 'rgba(2, 6, 23, 0.85)' : 'rgba(0, 0, 0, 0.6)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalCard: { width: '100%', maxWidth: 460, maxHeight: '90%', backgroundColor: colors.cardBg, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 16 },
  modalCardLarge: { width: '100%', maxWidth: 500, maxHeight: '92%', backgroundColor: colors.cardBg, borderRadius: 24, borderWidth: 1, borderColor: colors.border, padding: 16 },
  modalCardSmall: { width: '100%', maxWidth: 400, backgroundColor: colors.cardBg, borderRadius: 20, borderWidth: 1, borderColor: colors.border, padding: 16 },

  topSubHeaderBar: {
    width: '100%',
    maxWidth: 650,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  backBtn: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
  },
  backBtnText: {
    color: isDark ? '#38bdf8' : '#0284c7',
    fontSize: 11,
    fontWeight: '800',
  },
  subHeaderTitle: { fontSize: 12, fontWeight: '900', color: colors.text },
  headerBox: { width: '100%', maxWidth: 650, marginBottom: 12 },
  headerTitle: { fontSize: 18, fontWeight: '800', color: colors.text, marginBottom: 2 },
  headerSubtitle: { fontSize: 11, color: colors.textSecondary },

  modalHeaderRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: colors.border, paddingBottom: 10 },
  modalTitle: { fontSize: 15, fontWeight: '900', color: colors.text },
  modalSub: { fontSize: 10, color: colors.textSecondary, marginTop: 1 },
  modalCloseBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: colors.cardBgElevated, justifyContent: 'center', alignItems: 'center' },

  inputLabel: { fontSize: 10, fontWeight: '800', color: isDark ? '#818cf8' : '#4f46e5', marginTop: 8, marginBottom: 4 },
  formInput: { backgroundColor: colors.cardBgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6, color: colors.text, fontSize: 11 },
  formRow: { flexDirection: 'row', gap: 8, marginBottom: 4 },

  catChip: { backgroundColor: colors.cardBgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingHorizontal: 10, paddingVertical: 6, marginRight: 6 },
  catChipActive: { borderColor: isDark ? '#818cf8' : '#4f46e5', backgroundColor: isDark ? 'rgba(99,102,241,0.15)' : 'rgba(99,102,241,0.1)' },
  catChipText: { fontSize: 10, color: colors.textSecondary, fontWeight: '700' },

  subCatChip: { backgroundColor: colors.cardBgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 6, paddingHorizontal: 8, paddingVertical: 4, marginRight: 4 },
  subCatChipActive: { borderColor: isDark ? '#38bdf8' : '#0284c7', backgroundColor: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(14,165,233,0.1)' },
  subCatChipText: { fontSize: 9, color: colors.textSecondary, fontWeight: '700' },

  taxChip: { flex: 1, backgroundColor: colors.cardBgElevated, borderWidth: 1, borderColor: colors.border, borderRadius: 8, paddingVertical: 6, alignItems: 'center' },
  taxChipActive: { backgroundColor: isDark ? 'rgba(56,189,248,0.15)' : 'rgba(14,165,233,0.1)', borderColor: isDark ? '#38bdf8' : '#0284c7' },
  taxChipText: { fontSize: 10, color: colors.textSecondary, fontWeight: '700' },

  imgPresetBtn: { width: 36, height: 36, borderRadius: 8, borderWidth: 1, borderColor: colors.border, overflow: 'hidden', marginRight: 6 },
  imgPresetActive: { borderColor: isDark ? '#38bdf8' : '#0284c7', borderWidth: 2 },
  imgPresetThumb: { width: '100%', height: '100%', resizeMode: 'cover' },

  saveProductBtn: { backgroundColor: '#16a34a', paddingVertical: 12, borderRadius: 12, alignItems: 'center', marginTop: 14 },
  saveProductBtnText: { color: '#ffffff', fontSize: 12, fontWeight: '900' },

  // Admin Card Display Configuration Styles
  adminConfigBtn: {
    backgroundColor: colors.cardBg,
    borderWidth: 1,
    borderColor: isDark ? '#4338ca' : '#c7d2fe',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  adminConfigBtnDisabled: {
    borderColor: colors.border,
    backgroundColor: colors.cardBgElevated,
    opacity: 0.7,
  },
  adminConfigBtnTitle: {
    color: colors.text,
    fontSize: 11,
    fontWeight: '800',
  },
  adminConfigBtnSubtitle: {
    color: colors.textSecondary,
    fontSize: 9,
    marginTop: 1,
  },
  adminRoleBadge: {
    backgroundColor: '#4338ca',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminRoleBadgeText: {
    color: '#ffffff',
    fontSize: 8,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  adminOnlyPill: {
    backgroundColor: isDark ? 'rgba(239, 68, 68, 0.2)' : 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: '#ef4444',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  adminOnlyPillText: {
    color: isDark ? '#f87171' : '#dc2626',
    fontSize: 8,
    fontWeight: '900',
  },
  configInfoBanner: {
    backgroundColor: isDark ? 'rgba(59, 130, 246, 0.1)' : 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: isDark ? 'rgba(59, 130, 246, 0.3)' : 'rgba(59, 130, 246, 0.25)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  configInfoBannerText: {
    color: isDark ? '#93c5fd' : '#1d4ed8',
    fontSize: 10,
    lineHeight: 15,
  },
  configSectionTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: isDark ? '#38bdf8' : '#0284c7',
    marginTop: 10,
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  configToggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: colors.cardBgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    marginBottom: 6,
  },
  configToggleLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: colors.text,
  },
  configToggleDesc: {
    fontSize: 9,
    color: colors.textSecondary,
    marginTop: 1,
  },
  configResetBtn: {
    flex: 1,
    backgroundColor: colors.cardBgElevated,
    borderWidth: 1,
    borderColor: colors.border,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  configResetBtnText: {
    color: colors.textSecondary,
    fontSize: 11,
    fontWeight: '800',
  },
  configSaveBtn: {
    flex: 1.5,
    backgroundColor: '#4f46e5',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
  },
  configSaveBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '900',
  },
});

import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  FlatList, 
  TouchableOpacity, 
  StyleSheet, 
  Image, 
  SafeAreaView, 
  StatusBar, 
  TextInput,
  Animated,
  Dimensions
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { BlurView } from 'expo-blur';

// Get screen dimensions for responsive design
const { width, height } = Dimensions.get('window');

const categories = [
  { id: 'cat1', name: 'All', active: true, icon: '🔍' },
  { id: 'cat2', name: 'Common', active: false, icon: '👥' },
  { id: 'cat3', name: 'Severe', active: false, icon: '⚠️' },
  { id: 'cat4', name: 'Chronic', active: false, icon: '⏱️' },
  { id: 'cat5', name: 'Infectious', active: false, icon: '🦠' },
];

const diseases = [
  { 
    id: '1', 
    name: 'Acne', 
    code: 'ACNE', 
    icon: '🔴',
    color: '#FF5A76',
    category: 'Common',
    description: 'Inflammatory condition of the skin'
  },
  { 
    id: '2', 
    name: 'Eczema', 
    code: 'ECZEMA', 
    icon: '🟠',
    color: '#FF9B57',
    category: 'Chronic',
    description: 'Group of conditions causing skin inflammation'
  },
  { 
    id: '3', 
    name: 'Psoriasis', 
    code: 'PSORIASIS', 
    icon: '🔵',
    color: '#5B8CFF',
    category: 'Chronic',
    description: 'Skin cells build up forming scales and dry patches'
  },
  { 
    id: '4', 
    name: 'Rosacea', 
    code: 'ROSACEA', 
    icon: '🟣',
    color: '#B657FF',
    category: 'Chronic',
    description: 'Condition causing redness and visible blood vessels'
  },
  { 
    id: '5', 
    name: 'Melasma', 
    code: 'MELASMA', 
    icon: '⚫',
    color: '#454545',
    category: 'Common',
    description: 'Condition causing brown patches on face'
  },
  { 
    id: '6', 
    name: 'Vitiligo', 
    code: 'VITILIGO', 
    icon: '⚪',
    color: '#E0E0E0',
    category: 'Chronic',
    description: 'Loss of skin color in patches'
  },
  { 
    id: '7', 
    name: 'Hives', 
    code: 'HIVES', 
    icon: '🟢',
    color: '#56D77B',
    category: 'Common',
    description: 'Raised, itchy welts appearing on the skin'
  },
  { 
    id: '8', 
    name: 'Skin Cancer', 
    code: 'SKIN_CANCER', 
    icon: '⚠️',
    color: '#FFDD3C',
    category: 'Severe',
    description: 'Abnormal growth of skin cells'
  },
  { 
    id: '9', 
    name: 'Warts', 
    code: 'WARTS', 
    icon: '🟤',
    color: '#9E6C39',
    category: 'Infectious',
    description: 'Small growths caused by viral infection'
  },
  { 
    id: '10', 
    name: 'Fungal Infections', 
    code: 'FUNGAL', 
    icon: '🍄',
    color: '#D968D7',
    category: 'Infectious',
    description: 'Skin infections caused by fungi'
  },
  { 
    id: '11', 
    name: 'Contact Dermatitis', 
    code: 'CONTACT_DERMATITIS', 
    icon: '🧬',
    color: '#68D9D9',
    category: 'Common',
    description: 'Rash from contact with irritants or allergens'
  },
  { 
    id: '12', 
    name: 'Cold Sores', 
    code: 'COLD_SORES', 
    icon: '❄️',
    color: '#68A8D9',
    category: 'Infectious',
    description: 'Small blisters caused by herpes virus'
  },
  { 
    id: '13', 
    name: 'Alopecia Areata', 
    code: 'ALOPECIA', 
    icon: '👤',
    color: '#A87D68',
    category: 'Chronic',
    description: 'Autoimmune disorder causing hair loss'
  },
  { 
    id: '14', 
    name: 'Scabies', 
    code: 'SCABIES', 
    icon: '🕷️',
    color: '#D96868',
    category: 'Infectious',
    description: 'Skin infestation caused by tiny mites'
  },
  { 
    id: '15', 
    name: 'Lupus Rash', 
    code: 'LUPUS', 
    icon: '🐺',
    color: '#9268D9',
    category: 'Severe',
    description: 'Butterfly-shaped rash on face from autoimmune condition'
  },
];

const HomeScreen = ({ navigation }) => {
  const [searchText, setSearchText] = useState('');
  const [categoryList, setCategoryList] = useState(categories);
  const [activeCategory, setActiveCategory] = useState('All');
  const scrollY = useRef(new Animated.Value(0)).current;

  // Filter diseases based on search text and active category
  const filteredDiseases = diseases.filter(disease => {
    const matchesSearch = disease.name.toLowerCase().includes(searchText.toLowerCase()) || 
                          disease.description.toLowerCase().includes(searchText.toLowerCase());
    const matchesCategory = activeCategory === 'All' || disease.category === activeCategory;
    return matchesSearch && matchesCategory;
  });

  // Header animation values
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [220, 120],
    extrapolate: 'clamp'
  });

  const headerTitleOpacity = scrollY.interpolate({
    inputRange: [0, 60, 90],
    outputRange: [1, 0.3, 0],
    extrapolate: 'clamp'
  });

  const headerSubtitleOpacity = scrollY.interpolate({
    inputRange: [0, 60],
    outputRange: [1, 0],
    extrapolate: 'clamp'
  });

  const headerScale = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.85],
    extrapolate: 'clamp'
  });

  const setActiveCategoryHandler = (categoryName) => {
    setActiveCategory(categoryName);
    setCategoryList(categoryList.map(cat => ({
      ...cat,
      active: cat.name === categoryName
    })));
  };

  const renderCategoryItem = ({ item }) => {
    const isActive = item.name === activeCategory;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          isActive && styles.activeCategoryItem
        ]}
        onPress={() => setActiveCategoryHandler(item.name)}
        activeOpacity={0.7}
      >
        <Text style={styles.categoryIcon}>{item.icon}</Text>
        <Text 
          style={[
            styles.categoryText,
            isActive && styles.activeCategoryText
          ]}
        >
          {item.name}
        </Text>
      </TouchableOpacity>
    );
  };

  const renderDiseaseItem = ({ item, index }) => {
    // Generate a lighter version of the color for the background
    const bgColor = `${item.color}10`; // 10% opacity
    
    return (
      <TouchableOpacity
        style={[
          styles.diseaseCard,
          { borderLeftColor: item.color, borderLeftWidth: 4 }
        ]}
        onPress={() => navigation.navigate('DiseaseDetail', { disease: item })}
        activeOpacity={0.95}
      >
        <View style={styles.cardContent}>
          <View 
            style={[
              styles.iconContainer,
              { backgroundColor: bgColor }
            ]}
          >
            <Text style={styles.icon}>{item.icon}</Text>
          </View>
          <View style={styles.textContainer}>
            <View style={styles.nameCodeContainer}>
              <Text style={styles.diseaseName}>{item.name}</Text>
              <Text style={[styles.diseaseCode, {color: item.color}]}>{item.code}</Text>
            </View>
            <Text style={styles.diseaseDescription}>{item.description}</Text>
            <View style={styles.tagContainer}>
              <View style={[styles.categoryTag, { backgroundColor: bgColor }]}>
                <Text style={[styles.categoryTagText, { color: item.color }]}>{item.category}</Text>
              </View>
              <TouchableOpacity style={styles.infoButton}>
                <Text style={[styles.infoButtonText, { color: item.color }]}>Details</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#4A00E0" />
      
      {/* Animated Header */}
      <Animated.View style={[styles.header, { height: headerHeight }]}>
        <LinearGradient
          colors={['#6C13D9', '#8E2DE2', '#4A00E0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <Animated.View style={[styles.headerTitleContainer, {
            opacity: headerTitleOpacity,
            transform: [{ scale: headerScale }]
          }]}>
            <Text style={styles.headerIcon}>👨‍⚕️</Text>
            <Text style={styles.headerTitle}>SkinHealth</Text>
          </Animated.View>
          
          <Animated.Text style={[styles.headerSubtitle, { opacity: headerSubtitleOpacity }]}>
            Your complete dermatology guide
          </Animated.Text>
        </LinearGradient>
      </Animated.View>
      
      {/* Search Bar */}
      <View style={styles.searchWrapper}>
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search skin conditions..."
            value={searchText}
            onChangeText={setSearchText}
            placeholderTextColor="#9E9E9E"
          />
          {searchText.length > 0 && (
            <TouchableOpacity 
              style={styles.clearButton}
              onPress={() => setSearchText('')}
            >
              <Text style={styles.clearButtonText}>✕</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
      
      {/* Main Content */}
      <Animated.ScrollView
        style={styles.container}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        {/* Categories */}
        <View style={styles.categoriesContainer}>
          <FlatList
            data={categoryList}
            renderItem={renderCategoryItem}
            keyExtractor={(item) => item.id}
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.categoriesList}
          />
        </View>
        
        {/* Results Count */}
        <View style={styles.resultsContainer}>
          <Text style={styles.resultsText}>
            {filteredDiseases.length} {filteredDiseases.length === 1 ? 'condition' : 'conditions'} found
          </Text>
        </View>
        
        {/* Diseases List */}
        {filteredDiseases.length > 0 ? (
          filteredDiseases.map((disease, index) => (
            <View key={disease.id}>
              {renderDiseaseItem({ item: disease, index })}
            </View>
          ))
        ) : (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyIcon}>🔎</Text>
            <Text style={styles.emptyText}>No conditions found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your search terms or category filter</Text>
            <TouchableOpacity 
              style={styles.resetButton}
              onPress={() => {
                setSearchText('');
                setActiveCategoryHandler('All');
              }}
            >
              <Text style={styles.resetButtonText}>Reset Filters</Text>
            </TouchableOpacity>
          </View>
        )}
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F8F9FD',
  },
  header: {
    overflow: 'hidden',
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 1,
  },
  headerTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 28,
    marginRight: 10,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    color: 'white',
    letterSpacing: 0.5,
  },
  headerSubtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 8,
    fontWeight: '400',
  },
  searchWrapper: {
    paddingHorizontal: 20,
    marginTop: -25,
    zIndex: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    paddingHorizontal: 15,
    borderRadius: 20,
    height: 50,
    shadowColor: '#6C13D9',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 10,
    color: '#8E2DE2',
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#424242',
  },
  clearButton: {
    padding: 5,
  },
  clearButtonText: {
    fontSize: 16,
    color: '#9E9E9E',
  },
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  categoriesContainer: {
    marginTop: 15,
  },
  categoriesList: {
    paddingHorizontal: 20,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 16,
    marginRight: 12,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 14,
    marginRight: 6,
  },
  activeCategoryItem: {
    backgroundColor: '#8E2DE2',
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#757575',
  },
  activeCategoryText: {
    color: 'white',
  },
  resultsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 25,
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  resultsText: {
    fontSize: 14,
    color: '#9E9E9E',
    fontWeight: '500',
  },
  diseaseCard: {
    marginHorizontal: 20,
    marginBottom: 15,
    borderRadius: 16,
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 3,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  icon: {
    fontSize: 24,
  },
  textContainer: {
    flex: 1,
  },
  nameCodeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  diseaseName: {
    fontSize: 18,
    fontWeight: '600',
    color: '#212121',
  },
  diseaseCode: {
    fontSize: 12,
    fontWeight: 'bold',
    opacity: 0.7,
  },
  diseaseDescription: {
    fontSize: 14,
    color: '#757575',
    marginBottom: 8,
    lineHeight: 20,
  },
  tagContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  categoryTag: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: 8,
  },
  categoryTagText: {
    fontSize: 12,
    fontWeight: '500',
  },
  infoButton: {
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  infoButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 60,
    padding: 20,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
    opacity: 0.5,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#424242',
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9E9E9E',
    textAlign: 'center',
    marginBottom: 20,
  },
  resetButton: {
    backgroundColor: '#8E2DE2',
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: 12,
  },
  resetButtonText: {
    color: 'white',
    fontWeight: '500',
  },
});

export default HomeScreen;
import React, { useState, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  SafeAreaView,
  Image,
  Dimensions,
  Animated,
  StatusBar,
  Platform
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

const windowWidth = Dimensions.get('window').width;
const windowHeight = Dimensions.get('window').height;

// Enhanced disease icons with more detailed emojis
const diseaseIcons = {
  ACNE: '🔴',
  ECZEMA: '🟠',
  PSORIASIS: '🔵',
  ROSACEA: '🟣',
  MELASMA: '⚫',
  VITILIGO: '⚪',
  HIVES: '🟢',
  SKIN_CANCER: '⚠️',
  WARTS: '🟤',
  FUNGAL: '🍄',
  CONTACT_DERMATITIS: '🧬',
  COLD_SORES: '❄️',
  ALOPECIA: '👤',
  SCABIES: '🕷️',
  LUPUS: '🐺',
};

// Complete disease details with comprehensive information for all diseases
const diseaseDetails = {
  ACNE: {
    homeRemedies: [
      'Cleanse face twice daily with a gentle, non-abrasive cleanser',
      'Apply tea tree oil diluted with carrier oil to reduce inflammation',
      'Use honey masks once a week for antibacterial properties',
      'Apply aloe vera gel to soothe irritated skin',
      'Try green tea extract to reduce sebum production'
    ],
    protection: [
      'Avoid touching your face with unwashed hands',
      'Use non-comedogenic skincare and makeup products',
      'Change pillowcases frequently (at least once a week)',
      'Maintain a balanced diet low in processed sugar and dairy',
      'Stay hydrated with at least 8 glasses of water daily'
    ],
    treatment: [
      'Topical retinoids to unclog pores and reduce inflammation',
      'Benzoyl peroxide to kill bacteria and reduce excess oil',
      'Oral antibiotics for moderate to severe cases',
      'Isotretinoin for severe, cystic acne (prescribed by dermatologist)',
      'Chemical peels or laser therapy for acne scars'
    ],
    symptoms: [
      'Whiteheads (closed plugged pores)',
      'Blackheads (open plugged pores)',
      'Small red, tender bumps (papules)',
      'Pimples (pustules with pus at their tips)',
      'Painful, large lumps beneath the skin (nodules)',
      'Painful cysts beneath the skin (cystic lesions)'
    ],
    causes: [
      'Excess oil (sebum) production',
      'Hair follicles clogged by oil and dead skin cells',
      'Bacteria (Propionibacterium acnes)',
      'Hormonal changes during puberty, menstruation, or PCOS',
      'Certain medications (corticosteroids, lithium, or androgens)',
      'Genetic predisposition'
    ],
    riskFactors: [
      'Family history of acne',
      'Hormonal changes during puberty, pregnancy or PCOS',
      'Greasy or oily substances coming in contact with skin',
      'Friction or pressure on your skin from items like phones or helmets',
      'Stress which can increase cortisol production'
    ]
  },
  ECZEMA: {
    homeRemedies: [
      'Apply moisturizer immediately after bathing to lock in moisture',
      'Take lukewarm (not hot) baths with colloidal oatmeal',
      'Use gentle, fragrance-free soaps and detergents',
      'Apply coconut oil to reduce inflammation and bacterial colonization',
      'Try wet wrap therapy for severe flare-ups'
    ],
    protection: [
      'Wear soft, breathable fabrics like cotton; avoid wool and synthetic fibers',
      'Identify and avoid personal trigger factors (certain foods, stress, etc.)',
      'Maintain optimal humidity levels in your home (use a humidifier in dry weather)',
      'Avoid sudden temperature changes that can trigger flare-ups',
      'Keep fingernails short to prevent damage from scratching'
    ],
    treatment: [
      'Topical corticosteroids to reduce inflammation during flare-ups',
      'Calcineurin inhibitors such as tacrolimus and pimecrolimus',
      'Antihistamines to help control itching, especially at night',
      'Phototherapy (UV light treatment) for moderate to severe cases',
      'Biologics like dupilumab for severe cases not responding to other treatments'
    ],
    symptoms: [
      'Dry, cracked, scaly skin',
      'Itching, which may be severe, especially at night',
      'Red to brownish-gray patches on hands, feet, ankles, wrists, neck, chest',
      'Small, raised bumps that may leak fluid when scratched',
      'Thickened, cracked, or scaly skin from chronic scratching',
      'Raw, sensitive skin from scratching'
    ],
    causes: [
      'Genetic factors (mutations in the gene for filaggrin protein)',
      'Immune system dysfunction causing overreaction to triggers',
      'Environmental triggers (allergens, irritants)',
      'Compromised skin barrier function',
      'Abnormal gut microbiome composition'
    ],
    riskFactors: [
      'Family history of eczema, asthma, or allergies',
      'Living in urban areas with high pollution',
      'Having food allergies, particularly to milk, peanuts, or eggs',
      'Working with irritant chemicals (hairdressers, healthcare workers)',
      'Stress which can trigger or worsen symptoms'
    ]
  },
  PSORIASIS: {
    homeRemedies: [
      'Apply aloe vera gel directly to affected areas several times daily',
      'Take daily warm baths with Epsom salt, mineral oil, or colloidal oatmeal',
      'Apply moisturizers immediately after bathing to lock in moisture',
      'Spend short amounts of time in sunlight (careful not to burn)',
      'Try apple cider vinegar diluted with water for scalp psoriasis'
    ],
    protection: [
      'Keep skin well-moisturized to prevent dryness and flaking',
      'Avoid psoriasis triggers like alcohol, smoking, and stress',
      'Protect skin from injuries which can trigger psoriasis (Koebner phenomenon)',
      'Maintain a healthy weight to reduce inflammation and improve treatment efficacy',
      'Use gentle skin products free from fragrances and harsh chemicals'
    ],
    treatment: [
      'Topical corticosteroids to reduce inflammation and slow cell turnover',
      'Vitamin D analogues like calcipotriene to slow skin cell growth',
      'Biologics that target specific immune system pathways (TNF-alpha, IL-17, IL-23)',
      'Methotrexate to decrease skin cell production and reduce inflammation',
      'Phototherapy with UVB light or PUVA (psoralen plus UVA light)'
    ],
    symptoms: [
      'Red patches of skin covered with thick, silvery scales',
      'Small scaling spots (commonly seen in children)',
      'Dry, cracked skin that may bleed or itch',
      'Itching, burning or soreness',
      'Thickened, pitted or ridged nails',
      'Swollen and stiff joints'
    ],
    causes: [
      'Immune system dysfunction causing accelerated skin cell growth',
      'Genetic predisposition with specific HLA antigens',
      'Environmental triggers (streptococcal infections, medications)',
      'T-cell activation leading to inflammation and rapid skin cell turnover',
      'Complex interplay between genetics and environmental factors'
    ],
    riskFactors: [
      'Family history of psoriasis',
      'Viral and bacterial infections, especially streptococcal throat infections',
      'Stress which can trigger initial onset or worsen symptoms',
      'Obesity which creates skin folds and increases inflammation',
      'Smoking and alcohol consumption which may trigger flares'
    ]
  },
  ROSACEA: {
    homeRemedies: [
      'Apply green-tinted makeup to mask redness temporarily',
      'Use gentle cleansers free of alcohol and other irritants',
      'Apply cucumber slices or aloe vera gel to soothe inflamed skin',
      'Take turmeric supplements for anti-inflammatory properties',
      'Use chamomile or green tea compresses to reduce inflammation'
    ],
    protection: [
      'Identify and avoid personal triggers (spicy foods, alcohol, extreme temperatures)',
      'Apply broad-spectrum sunscreen daily (SPF 30 or higher)',
      'Protect face from extreme weather with scarves or hats',
      'Use gentle skincare products designed for sensitive skin',
      'Keep a food and symptom diary to identify personal triggers'
    ],
    treatment: [
      'Topical medications like metronidazole, azelaic acid, or ivermectin',
      'Oral antibiotics like doxycycline at anti-inflammatory doses',
      'Brimonidine or oxymetazoline to reduce redness temporarily',
      'Isotretinoin for severe cases (prescribed by a dermatologist)',
      'Laser therapy or intense pulsed light to reduce visible blood vessels'
    ],
    symptoms: [
      'Facial redness, particularly in the center of the face',
      'Swollen red bumps that may contain pus',
      'Visible blood vessels (telangiectasia)',
      'Eye problems including dryness, irritation, and swollen eyelids',
      'Enlarged nose (rhinophyma) in advanced cases',
      'Burning or stinging sensations'
    ],
    causes: [
      'Blood vessel abnormalities',
      'Demodex folliculorum mites (microscopic skin organisms)',
      'H. pylori bacteria which might stimulate protein production',
      'Genetic predisposition',
      'Abnormal immune or inflammatory responses'
    ],
    riskFactors: [
      'Fair skin, particularly Celtic or Scandinavian ancestry',
      'Family history of rosacea',
      'Being between ages 30 and 50',
      'History of acne or skin damage from sun exposure',
      'Female gender (although more severe symptoms in males)'
    ]
  },
  MELASMA: {
    homeRemedies: [
      'Apply lemon juice diluted with water to lighten dark patches',
      'Use aloe vera gel to soothe and potentially lighten skin',
      'Make a turmeric paste with milk or honey for skin brightening',
      'Apply apple cider vinegar diluted with water as a toner',
      'Use vitamin C serum to reduce pigmentation'
    ],
    protection: [
      'Apply broad-spectrum sunscreen (SPF 30+) daily',
      'Wear wide-brimmed hats and sunglasses outdoors',
      'Avoid peak sun hours (10 AM to 4 PM)',
      'Use gentle, non-irritating skincare products',
      'Maintain consistent skincare routine to protect skin barrier'
    ],
    treatment: [
      'Hydroquinone cream to lighten dark patches',
      'Tretinoin and corticosteroids to enhance skin lightening',
      'Chemical peels (glycolic acid or trichloroacetic acid)',
      'Microneedling to improve skin texture and pigmentation',
      'Laser treatments for resistant cases'
    ],
    symptoms: [
      'Dark brown or gray-brown patches on face',
      'Symmetrical patches on cheeks, forehead, nose bridge',
      'Discoloration on upper lip or chin',
      'Uneven skin tone in sun-exposed areas',
      'No associated pain or itching'
    ],
    causes: [
      'Sun exposure triggering melanin production',
      'Hormonal changes (pregnancy, birth control pills)',
      'Genetic predisposition',
      'Thyroid disease influencing hormone levels',
      'Certain medications or cosmetics causing photosensitivity'
    ],
    riskFactors: [
      'Female gender (more common in women)',
      'Darker skin types (Fitzpatrick types III-VI)',
      'Pregnancy (often called "mask of pregnancy")',
      'Family history of melasma',
      'Living in areas with intense UV radiation'
    ]
  },
  VITILIGO: {
    homeRemedies: [
      'Apply ginger juice to stimulate pigmentation',
      'Use turmeric and mustard oil paste on affected areas',
      'Drink copper-infused water from copper vessels',
      'Apply red clay mixed with ginger juice',
      'Use ginkgo biloba supplements for potential repigmentation'
    ],
    protection: [
      'Apply broad-spectrum sunscreen (SPF 30+) to protect depigmented skin',
      'Wear protective clothing to cover affected areas',
      'Avoid skin trauma or injury (Koebner phenomenon)',
      'Use hypoallergenic makeup to camouflage patches',
      'Maintain overall skin health with gentle products'
    ],
    treatment: [
      'Topical corticosteroids to encourage repigmentation',
      'Calcineurin inhibitors (tacrolimus, pimecrolimus)',
      'Phototherapy with narrowband UVB',
      'Excimer laser for small areas',
      'Skin grafting or cellular transplantation for stable cases'
    ],
    symptoms: [
      'White patches on skin, often symmetrical',
      'Loss of color in mucous membranes (mouth, nose)',
      'Premature graying of hair on scalp, eyebrows, eyelashes',
      'Loss of pigment in the eyes (rare)',
      'Patches that may spread over time'
    ],
    causes: [
      'Autoimmune destruction of melanocytes',
      'Genetic factors influencing immune response',
      'Oxidative stress damaging pigment cells',
      'Environmental triggers (chemicals, sunburn)',
      'Neurological factors affecting melanocyte survival'
    ],
    riskFactors: [
      'Family history of vitiligo or autoimmune diseases',
      'Presence of other autoimmune conditions (thyroid disease, diabetes)',
      'Stress or physical trauma to skin',
      'Exposure to certain chemicals (phenols)',
      'Fair or medium skin tones'
    ]
  },
  HIVES: {
    homeRemedies: [
      'Apply cold compresses to reduce itching and swelling',
      'Take oatmeal baths to soothe irritated skin',
      'Use aloe vera gel for cooling relief',
      'Apply witch hazel to reduce inflammation',
      'Drink nettle tea for potential antihistamine effects'
    ],
    protection: [
      'Avoid known allergens or triggers (foods, medications)',
      'Wear loose, breathable clothing to prevent irritation',
      'Keep a symptom diary to identify triggers',
      'Avoid hot showers or baths that can worsen symptoms',
      'Stay cool to prevent heat-induced hives'
    ],
    treatment: [
      'Antihistamines (cetirizine, loratadine) to reduce itching',
      'Oral corticosteroids for severe cases (short-term)',
      'Omalizumab injections for chronic hives',
      'Epinephrine for severe allergic reactions',
      'Topical anti-itch creams for mild cases'
    ],
    symptoms: [
      'Raised, red or skin-colored welts',
      'Intense itching or burning sensation',
      'Welts that change size and shape quickly',
      'Blanching (turning white when pressed)',
      'Swelling in deeper skin layers (angioedema)'
    ],
    causes: [
      'Allergic reactions to food, drugs, or insect bites',
      'Physical triggers (pressure, heat, cold, exercise)',
      'Infections (viral or bacterial)',
      'Autoimmune disorders',
      'Stress or emotional factors'
    ],
    riskFactors: [
      'History of allergies or asthma',
      'Family history of hives or angioedema',
      'Recent infections or illnesses',
      'Exposure to new medications or foods',
      'Chronic stress or anxiety'
    ]
  },
  SKIN_CANCER: {
    homeRemedies: [
      'Apply aloe vera to soothe sun-damaged skin',
      'Use green tea extract for antioxidant protection',
      'Apply honey to minor lesions for healing',
      'Use turmeric paste for anti-inflammatory effects',
      'Maintain overall skin health with hydration'
    ],
    protection: [
      'Use broad-spectrum sunscreen (SPF 30+) daily',
      'Wear protective clothing, hats, and sunglasses',
      'Avoid tanning beds and excessive sun exposure',
      'Perform monthly skin self-examinations',
      'Schedule annual dermatologist check-ups'
    ],
    treatment: [
      'Surgical excision to remove cancerous tissue',
      'Mohs surgery for precise removal of skin layers',
      'Radiation therapy for inoperable tumors',
      'Chemotherapy for advanced cases',
      'Immunotherapy to boost immune response'
    ],
    symptoms: [
      'New or changing moles (asymmetry, border, color, diameter, evolving)',
      'Sores that don’t heal within weeks',
      'Rough, scaly patches that may bleed',
      'Pearly or waxy bumps',
      'Red, firm nodules'
    ],
    causes: [
      'UV radiation from sun or tanning beds',
      'Genetic mutations (e.g., in TP53 gene)',
      'Weakened immune system',
      'Exposure to carcinogenic chemicals (arsenic)',
      'Chronic skin inflammation or injury'
    ],
    riskFactors: [
      'Fair skin that burns easily',
      'History of sunburns, especially in childhood',
      'Family or personal history of skin cancer',
      'Numerous or atypical moles',
      'Living in sunny or high-altitude regions'
    ]
  },
  WARTS: {
    homeRemedies: [
      'Apply duct tape occlusion for several days',
      'Use salicylic acid patches or solutions',
      'Apply apple cider vinegar with cotton balls',
      'Use crushed garlic for antiviral properties',
      'Try tea tree oil diluted with carrier oil'
    ],
    protection: [
      'Avoid direct contact with warts on others',
      'Wear flip-flops in public showers or pools',
      'Keep hands and feet dry to prevent spread',
      'Don’t pick or scratch existing warts',
      'Wash hands after touchingwarts'
    ],
    treatment: [
      'Cryotherapy (freezing with liquid nitrogen)',
      'Electrosurgery or curettage',
      'Salicylic acid prescription treatments',
      'Laser therapy for resistantwarts',
      'Immunotherapy to stimulate immune response'
    ],
    symptoms: [
      'Small, grainy skin growths',
      'Rough texture with black pinpoints (clotted blood vessels)',
      'Flesh-colored, white, pink, or tan appearance',
      'Clusters on hands, feet, or other areas',
      'Discomfort or pain if pressed'
    ],
    causes: [
      'Human papillomavirus (HPV) infection',
      'Direct skin-to-skin contact',
      'Entry through cuts or abrasions',
      'Weakened immune system',
      'Shared personal items (towels, razors)'
    ],
    riskFactors: [
      'Children and young adults (more susceptible)',
      'Weakened immune system (HIV, transplant patients)',
      'Frequent hand washing or wet hands',
      'Walking barefoot in public areas',
      'Nail biting or cuticle picking'
    ]
  },
  FUNGAL: {
    homeRemedies: [
      'Apply tea tree oil diluted with carrier oil',
      'Use coconut oil for its antifungal properties',
      'Apply garlic extract to affected areas',
      'Use apple cider vinegar soaks',
      'Keep affected areas dry with talcum powder'
    ],
    protection: [
      'Keep skin clean and dry, especially in folds',
      'Wear breathable fabrics like cotton',
      'Avoid sharing personal items (towels, shoes)',
      'Change socks frequently if feet are sweaty',
      'Wear protective footwear in public areas'
    ],
    treatment: [
      'Topical antifungal creams (clotrimazole, miconazole)',
      'Oral antifungals (fluconazole, terbinafine)',
      'Medicated shampoos for scalp infections',
      'Antifungal powders for prevention',
      'Surgical removal for severe nail infections'
    ],
    symptoms: [
      'Red, itchy, scaly patches',
      'Ring-shaped rash with clearer center (ringworm)',
      'Cracking or peeling skin between toes (athlete’s foot)',
      'Discolored, thickened nails (onychomycosis)',
      'White patches in mouth (thrush)'
    ],
    causes: [
      'Fungal organisms (dermatophytes, yeasts)',
      'Warm, moist environments promoting growth',
      'Direct contact with infected person or surface',
      'Weakened immune system',
      'Poor hygiene or tight clothing'
    ],
    riskFactors: [
      'Living in warm, humid climates',
      'Diabetes or compromised immunity',
      'Frequent sweating or wet skin',
      'Close contact with infected individuals',
      'Use of communal showers or pools'
    ]
  },
  CONTACT_DERMATITIS: {
    homeRemedies: [
      'Apply cool, wet compresses to soothe irritation',
      'Use colloidal oatmeal baths to reduce itching',
      'Apply aloe vera gel for cooling relief',
      'Use petroleum jelly to protect irritated skin',
      'Try chamomile tea compresses for inflammation'
    ],
    protection: [
      'Identify and avoid known irritants/allergens',
      'Wear protective gloves when handling chemicals',
      'Use hypoallergenic skincare products',
      'Wash skin immediately after contact with irritants',
      'Moisturize regularly to maintain skin barrier'
    ],
    treatment: [
      'Topical corticosteroids to reduce inflammation',
      'Antihistamines for itching relief',
      'Calcineurin inhibitors for chronic cases',
      'Oral corticosteroids for severe reactions',
      'Patch testing to identify allergens'
    ],
    symptoms: [
      'Red, inflamed skin at contact site',
      'Itching, burning, or stinging sensation',
      'Dry, cracked, or scaly skin',
      'Blisters or weeping sores in severe cases',
      'Swelling in affected area'
    ],
    causes: [
      'Irritants (soaps, detergents, acids)',
      'Allergens (nickel, fragrances, latex)',
      'Direct skin contact with offending substance',
      'Repeated exposure leading to sensitization',
      'Occupational exposure to chemicals'
    ],
    riskFactors: [
      'Occupations involving chemicals (hairdressers, cleaners)',
      'History of allergies or eczema',
      'Frequent hand washing or wet work',
      'Wearing jewelry or clothing with allergens',
      'Sensitive skin prone to irritation'
    ]
  },
  COLD_SORES: {
    homeRemedies: [
      'Apply ice to reduce pain and swelling',
      'Use lemon balm extract for antiviral effects',
      'Apply aloe vera gel to promote healing',
      'Use lysine supplements or cream',
      'Apply honey to speed up healing'
    ],
    protection: [
      'Avoid sharing utensils, lip balm, or towels',
      'Wash hands frequently during outbreaks',
      'Avoid kissing during active sores',
      'Use sunscreen on lips to prevent triggers',
      'Manage stress to reduce outbreaks'
    ],
    treatment: [
      'Antiviral creams (acyclovir, penciclovir)',
      'Oral antiviral medications (valacyclovir)',
      'Pain relievers (ibuprofen, acetaminophen)',
      'Topical anesthetics for discomfort',
      'Laser therapy for recurrent cases'
    ],
    symptoms: [
      'Tingling or burning before sores appear',
      'Small, fluid-filled blisters on or around lips',
      'Crusting and scabbing after blisters burst',
      'Pain or itching at the site',
      'Swollen lymph nodes during outbreaks'
    ],
    causes: [
      'Herpes simplex virus (HSV-1 or HSV-2)',
      'Viral reactivation due to stress or illness',
      'Sun exposure triggering outbreaks',
      'Weakened immune system',
      'Direct contact with infected saliva'
    ],
    riskFactors: [
      'Previous HSV infection',
      'Stress or fatigue',
      'Sun exposure without protection',
      'Fever or illness weakening immunity',
      'Close contact with infected individuals'
    ]
  },
  ALOPECIA: {
    homeRemedies: [
      'Massage scalp with rosemary oil to stimulate growth',
      'Apply onion juice to increase blood flow',
      'Use lavender oil for anti-inflammatory effects',
      'Try aloe vera to soothe scalp',
      'Take biotin supplements for hair strength'
    ],
    protection: [
      'Avoid tight hairstyles that pull on hair',
      'Protect scalp with hats or scarves',
      'Maintain a nutrient-rich diet',
      'Reduce stress through relaxation techniques',
      'Use gentle hair care products'
    ],
    treatment: [
      'Topical minoxidil to stimulate hair growth',
      'Corticosteroid injections to reduce inflammation',
      'Topical immunotherapy (e.g., diphencyprone)',
      'Oral immunosuppressants (e.g., methotrexate)',
      'Platelet-rich plasma (PRP) therapy'
    ],
    symptoms: [
      'Sudden, round patches of hair loss',
      'Complete scalp hair loss (alopecia totalis)',
      'Total body hair loss (alopecia universalis)',
      'Exclamation mark hairs at patch edges',
      'Nail pitting or changes'
    ],
    causes: [
      'Autoimmune attack on hair follicles',
      'Genetic predisposition',
      'Environmental triggers (stress, trauma)',
      'Associated autoimmune conditions',
      'Hormonal imbalances'
    ],
    riskFactors: [
      'Family history of alopecia or autoimmune diseases',
      'Other autoimmune conditions (thyroid, lupus)',
      'Chronic stress or emotional trauma',
      'Younger age (often starts before 30)',
      'Certain viral infections'
    ]
  },
  SCABIES: {
    homeRemedies: [
      'Apply tea tree oil diluted with carrier oil',
      'Use neem oil or leaf paste for antiparasitic effects',
      'Take warm baths with Epsom salt to soothe skin',
      'Apply aloe vera for itching relief',
      'Use turmeric paste for anti-inflammatory benefits'
    ],
    protection: [
      'Wash all clothing and bedding in hot water',
      'Avoid close physical contact with infected people',
      'Vacuum furniture and carpets thoroughly',
      'Seal non-washable items in plastic bags for 72 hours',
      'Maintain good personal hygiene'
    ],
    treatment: [
      'Permethrin cream (5%) applied to entire body',
      'Ivermectin oral medication for severe cases',
      'Lindane lotion as an alternative (with caution)',
      'Antihistamines or steroids for itching',
      'Antibiotics for secondary infections'
    ],
    symptoms: [
      'Intense itching, especially at night',
      'Pimple-like rash or burrows',
      'Sores from scratching',
      'Thick crusts in severe cases (crusted scabies)',
      'Rash between fingers, wrists, or waistline'
    ],
    causes: [
      'Sarcoptes scabiei mite infestation',
      'Direct skin-to-skin contact',
      'Sharing contaminated bedding or clothing',
      'Crowded living conditions',
      'Weakened immune system'
    ],
    riskFactors: [
      'Living in crowded environments (nursing homes, prisons)',
      'Close contact with infected individuals',
      'Poor hygiene or sanitation',
      'Young children or elderly individuals',
      'Compromised immunity (HIV, chemotherapy)'
    ]
  },
  LUPUS: {
    homeRemedies: [
      'Apply aloe vera to soothe rashes',
      'Use turmeric supplements for anti-inflammatory effects',
      'Apply cold compresses to reduce inflammation',
      'Take ginger tea to ease joint pain',
      'Use fish oil supplements for omega-3 benefits'
    ],
    protection: [
      'Use broad-spectrum sunscreen (SPF 30+) daily',
      'Wear protective clothing and hats outdoors',
      'Avoid sun exposure during peak hours',
      'Manage stress to prevent flares',
      'Maintain a balanced diet rich in antioxidants'
    ],
    treatment: [
      'Topical corticosteroids for skin rashes',
      'Antimalarial drugs (hydroxychloroquine)',
      'Immunosuppressants (methotrexate, azathioprine)',
      'Biologics (belimumab) for severe cases',
      'NSAIDs or corticosteroids for inflammation'
    ],
    symptoms: [
      'Butterfly-shaped rash across cheeks and nose',
      'Red, scaly patches on sun-exposed areas',
      'Photosensitivity (rash worsens with sun)',
      'Joint pain and swelling',
      'Fatigue and fever during flares'
    ],
    causes: [
      'Autoimmune response attacking healthy tissue',
      'Genetic predisposition',
      'Environmental triggers (UV light, infections)',
      'Hormonal factors (estrogen influence)',
      'Drug-induced lupus from certain medications'
    ],
    riskFactors: [
      'Female gender (90% of cases are women)',
      'Family history of lupus or autoimmune diseases',
      'Age 15-45 (peak onset years)',
      'Certain ethnicities (African, Asian, Hispanic)',
      'Exposure to sunlight or certain drugs'
    ]
  }
};

const DiseaseDetailScreen = ({ route, navigation }) => {
  const { disease } = route.params;
  const detail = diseaseDetails[disease.code] || {};
  const icon = diseaseIcons[disease.code] || '🔍';
  
  const [activeTab, setActiveTab] = useState('overview');
  const scrollY = new Animated.Value(0);
  const tabScrollViewRef = useRef(null);
  
  // Header animation based on scroll
  const headerHeight = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [220, 120],
    extrapolate: 'clamp'
  });
  
  const headerOpacity = scrollY.interpolate({
    inputRange: [0, 100],
    outputRange: [1, 0.95],
    extrapolate: 'clamp'
  });

  const iconScale = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [1, 0.7],
    extrapolate: 'clamp'
  });

  const headerTextSize = scrollY.interpolate({
    inputRange: [0, 120],
    outputRange: [28, 22],
    extrapolate: 'clamp'
  });

  // Function to render list items with bullet points
  const renderBulletPoints = (items) => {
    if (!items) return <Text style={styles.noInfoText}>No information available</Text>;
    
    return items.map((item, index) => (
      <View key={index} style={styles.bulletItem}>
        <View style={styles.bulletPoint} />
        <Text style={styles.bulletText}>{item}</Text>
      </View>
    ));
  };

  // Define tabs for the details screen
  const tabs = [
    { id: 'overview', title: 'Overview', icon: 'information-circle-outline' },
    { id: 'symptoms', title: 'Symptoms', icon: 'medical-outline' },
    { id: 'causes', title: 'Causes', icon: 'help-circle-outline' },
    { id: 'remedies', title: 'Remedies', icon: 'home-outline' },
  ];

  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabScrollViewRef.current) {
      tabScrollViewRef.current.scrollTo({ x: 0, y: 0, animated: true });
    }
  };

  // Render content based on active tab
  const renderTabContent = () => {
    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.tabContent}>
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: '#e1f5fe' }]}>
                  <Ionicons name="shield-outline" size={22} color="#0288d1" />
                </View>
                <Text style={styles.sectionTitle}>How to Protect Yourself</Text>
              </View>
              <View style={styles.divider} />
              {renderBulletPoints(detail.protection)}
            </View>
            
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: '#ede7f6' }]}>
                  <Ionicons name="medkit-outline" size={22} color="#673ab7" />
                </View>
                <Text style={styles.sectionTitle}>Treatment Options</Text>
              </View>
              <View style={styles.divider} />
              {renderBulletPoints(detail.treatment)}
            </View>
            
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: '#fff8e1' }]}>
                  <Ionicons name="alert-circle-outline" size={22} color="#ffa000" />
                </View>
                <Text style={styles.sectionTitle}>Risk Factors</Text>
              </View>
              <View style={styles.divider} />
              {renderBulletPoints(detail.riskFactors)}
            </View>

            <View style={styles.whatToDoCard}>
              <LinearGradient
                colors={['#6a11cb', '#2575fc']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.whatToDoGradient}
              >
                <View style={styles.whatToDoContent}>
                  <View style={styles.whatToDoIconContainer}>
                    <Ionicons name="checkmark-circle" size={36} color="#fff" />
                  </View>
                  <View style={styles.whatToDoTextContainer}>
                    <Text style={styles.whatToDoTitle}>What to Do Next</Text>
                    <Text style={styles.whatToDoDescription}>
                      Schedule an appointment with a dermatologist for personalized advice and treatment options
                    </Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </View>
        );
      
      case 'symptoms':
        return (
          <View style={styles.tabContent}>
            <View style={styles.symptomsSummaryCard}>
              <LinearGradient
                colors={['rgba(236, 64, 122, 0.9)', 'rgba(216, 27, 96, 0.95)']}
                style={styles.symptomsGradient}
              >
                <Text style={styles.symptomsSummaryTitle}>
                  Common Symptoms of {disease.name}
                </Text>
              </LinearGradient>
              <View style={styles.symptomIconsContainer}>
                {(detail.symptoms || []).slice(0, 4).map((symptom, index) => (
                  <View key={index} style={styles.symptomIconBox}>
                    <View style={styles.symptomIconCircle}>
                      <Ionicons 
                        name={getSymptomIcon(index)} 
                        size={24} 
                        color="#d81b60" 
                      />
                    </View>
                    <Text style={styles.symptomIconText}>{getSymptomShortText(symptom)}</Text>
                  </View>
                ))}
              </View>
            </View>
            
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: '#fce4ec' }]}>
                  <Ionicons name="fitness-outline" size={22} color="#d81b60" />
                </View>
                <Text style={styles.sectionTitle}>All Symptoms</Text>
              </View>
              <View style={styles.divider} />
              {renderBulletPoints(detail.symptoms)}
            </View>
            
            <View style={styles.infoCard}>
              <View style={styles.infoCardHeader}>
                <Ionicons name="warning-outline" size={24} color="#ff9800" />
                <Text style={styles.infoCardTitle}>When to See a Doctor</Text>
              </View>
              <Text style={styles.infoCardText}>
                Consult a dermatologist immediately if:
              </Text>
              <View style={styles.warningList}>
                <View style={styles.warningItem}>
                  <View style={styles.warningBullet} />
                  <Text style={styles.warningItemText}>Symptoms are severe or rapidly worsening</Text>
                </View>
                <View style={styles.warningItem}>
                  <View style={styles.warningBullet} />
                  <Text style={styles.warningItemText}>Home remedies don't improve condition after 2 weeks</Text>
                </View>
                <View style={styles.warningItem}>
                  <View style={styles.warningBullet} />
                  <Text style={styles.warningItemText}>You experience fever or severe pain with symptoms</Text>
                </View>
              </View>
            </View>
          </View>
        );
      
      case 'causes':
        return (
          <View style={styles.tabContent}>
            <View style={styles.causesOverviewCard}>
              <View style={styles.causesImageContainer}>
                <View style={styles.causesImagePlaceholder}>
                  <Ionicons name="analytics-outline" size={40} color="#fff" />
                </View>
              </View>
              <View style={styles.causesTextContent}>
                <Text style={styles.causesTitle}>What Causes {disease.name}?</Text>
                <Text style={styles.causesDescription}>
                  {disease.name} is a complex condition with multiple potential causes and triggers. Understanding these factors can help with better management.
                </Text>
              </View>
            </View>
            
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: '#e8f5e9' }]}>
                  <Ionicons name="analytics-outline" size={22} color="#4caf50" />
                </View>
                <Text style={styles.sectionTitle}>Primary Causes</Text>
              </View>
              <View style={styles.divider} />
              {renderBulletPoints(detail.causes)}
            </View>
            
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: '#fffde7' }]}>
                  <Ionicons name="flash-outline" size={22} color="#fdd835" />
                </View>
                <Text style={styles.sectionTitle}>Triggering Factors</Text>
              </View>
              <View style={styles.divider} />
              {renderBulletPoints(detail.riskFactors)}
            </View>

            <View style={styles.factCard}>
              <View style={styles.factIconContainer}>
                <Ionicons name="bulb-outline" size={26} color="#fff" />
              </View>
              <View style={styles.factContent}>
                <Text style={styles.factTitle}>Did You Know?</Text>
                <Text style={styles.factText}>
                  Recent studies have shown that environmental factors and lifestyle habits play a significant role in the manifestation and severity of {disease.name.toLowerCase()}.
                </Text>
              </View>
            </View>
          </View>
        );
      
      case 'remedies':
        return (
          <View style={styles.tabContent}>
            <View style={styles.remediesHeaderCard}>
              <LinearGradient
                colors={['#06beb6', '#48b1bf']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={styles.remediesGradient}
              >
                <Text style={styles.remediesHeaderTitle}>Home Remedies</Text>
                <Text style={styles.remediesHeaderSubtitle}>
                  Natural ways to manage {disease.name}
                </Text>
              </LinearGradient>
            </View>
            
            <View style={styles.sectionCard}>
              <View style={styles.sectionHeader}>
                <View style={[styles.sectionIconContainer, { backgroundColor: '#e0f7fa' }]}>
                  <Ionicons name="home-outline" size={22} color="#00acc1" />
                </View>
                <Text style={styles.sectionTitle}>Recommended Remedies</Text>
              </View>
              <View style={styles.divider} />
              {renderBulletPoints(detail.homeRemedies)}
            </View>
            
            <View style={styles.remedyTipsCard}>
              <Text style={styles.remedyTipsTitle}>Pro Tips</Text>
              <View style={styles.remedyTipsContent}>
                <View style={styles.remedyTip}>
                  <View style={styles.remedyTipIconContainer}>
                    <Ionicons name="water-outline" size={22} color="#fff" />
                  </View>
                  <View style={styles.remedyTipTextContainer}>
                    <Text style={styles.remedyTipTitle}>Stay Hydrated</Text>
                    <Text style={styles.remedyTipDescription}>Drink 8-10 glasses of water daily to keep skin hydrated</Text>
                  </View>
                </View>
                
                <View style={styles.remedyTip}>
                  <View style={[styles.remedyTipIconContainer, { backgroundColor: '#e74c3c' }]}>
                    <Ionicons name="close-circle-outline" size={22} color="#fff" />
                  </View>
                  <View style={styles.remedyTipTextContainer}>
                    <Text style={styles.remedyTipTitle}>Avoid Scratching</Text>
                    <Text style={styles.remedyTipDescription}>Scratching can worsen symptoms and lead to infection</Text>
                  </View>
                </View>
                
                <View style={styles.remedyTip}>
                  <View style={[styles.remedyTipIconContainer, { backgroundColor: '#27ae60' }]}>
                    <Ionicons name="nutrition-outline" size={22} color="#fff" />
                  </View>
                  <View style={styles.remedyTipTextContainer}>
                    <Text style={styles.remedyTipTitle}>Eat Healthy</Text>
                    <Text style={styles.remedyTipDescription}>Include anti-inflammatory foods like fatty fish, nuts, and leafy greens</Text>
                  </View>
                </View>
              </View>
            </View>
            
            <View style={styles.trackingCard}>
              <View style={styles.trackingHeader}>
                <Ionicons name="document-text-outline" size={24} color="#3498db" />
                <Text style={styles.trackingTitle}>Track Your Progress</Text>
              </View>
              <Text style={styles.trackingText}>
                Keep a daily log of your symptoms, treatments used, and their effectiveness.
                This can help identify patterns and improve management strategies.
              </Text>
              <TouchableOpacity style={styles.trackingButton}>
                <Text style={styles.trackingButtonText}>Download Tracking Template</Text>
                <Ionicons name="download-outline" size={18} color="white" style={styles.buttonIcon} />
              </TouchableOpacity>
            </View>
          </View>
        );
      
      default:
        return <View style={styles.tabContent} />;
    }
  };

  // Helper function to get symptom icon based on index
  const getSymptomIcon = (index) => {
    const icons = ['medical', 'warning', 'alert-circle', 'fitness'];
    return icons[index % icons.length];
  };

  // Helper function to get shorter version of symptom text
  const getSymptomShortText = (symptom) => {
    const firstPart = symptom.split('(')[0].trim();
    return firstPart.length > 20 ? firstPart.substring(0, 20) + '...' : firstPart;
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" />
      
      {/* Animated Header */}
      <Animated.View style={[
        styles.headerContainer, 
        { height: headerHeight }
      ]}>
        <LinearGradient
          colors={['#4158d0', '#c850c0']}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.headerGradient}
        >
          <TouchableOpacity 
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="white" />
          </TouchableOpacity>
          
          <Animated.View style={[styles.headerContent, { transform: [{ scale: iconScale }] }]}>
            <View style={styles.iconContainer}>
              <Text style={styles.headerIcon}>{icon}</Text>
            </View>
            <Animated.Text style={[styles.header, { fontSize: headerTextSize }]}>
              {disease.name}
            </Animated.Text>
            <Text style={styles.diseaseCode}>{disease.code}</Text>
          </Animated.View>
        </LinearGradient>
      </Animated.View>
      
      {/* Tabs Navigation */}
      <View style={styles.tabsContainer}>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.tabsScrollContent}
        >
          {tabs.map(tab => (
            <TouchableOpacity
              key={tab.id}
              style={[
                styles.tab,
                activeTab === tab.id && styles.activeTab
              ]}
              onPress={() => handleTabChange(tab.id)}
            >
              <Ionicons 
                name={tab.icon} 
                size={20} 
                color={activeTab === tab.id ? '#4158d0' : '#888'}
              />
              <Text 
                style={[
                  styles.tabText,
                  activeTab === tab.id && styles.activeTabText
                ]}
              >
                {tab.title}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      
      {/* Content Area */}
      <Animated.ScrollView 
        ref={tabScrollViewRef}
        style={styles.container}
        showsVerticalScrollIndicator={false}
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: false }
        )}
      >
        <View style={styles.contentContainer}>
          {renderTabContent()}
          
          {/* Professional Help Section */}
          <View style={styles.contactCard}>
            <LinearGradient
              colors={['#5c6bc0', '#3949ab']}
              style={styles.contactGradient}
            >
              <View style={styles.contactHeader}>
                <Ionicons name="medical" size={24} color="#fff" />
                <Text style={styles.contactHeaderText}>Professional Help</Text>
              </View>
            </LinearGradient>
            
            <View style={styles.contactContent}>
              <Text style={styles.contactText}>
                Remember to consult with a qualified dermatologist for professional medical advice.
                Self-treatment should complement, not replace professional care.
              </Text>
              
              <TouchableOpacity style={styles.consultButton}>
                <Text style={styles.consultButtonText}>Find a Dermatologist</Text>
                <Ionicons name="arrow-forward" size={18} color="white" style={styles.buttonIcon} />
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.emergencyButton}>
                <Ionicons name="call" size={18} color="#3949ab" style={styles.emergencyButtonIcon} />
                <Text style={styles.emergencyButtonText}>Emergency Contact</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Animated.ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f5f7fa',
  },
  container: {
    flex: 1,
  },
  headerContainer: {
    width: '100%',
    overflow: 'hidden',
    zIndex: 10,
  },
  headerGradient: {
    flex: 1,
    paddingVertical: 20,
    paddingHorizontal: 20,
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
  },
  backButton: {
    position: 'absolute',
    left: 15,
    top: Platform.OS === 'ios' ? 55 : 15,
    zIndex: 10,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerContent: {
    alignItems: 'center',
    marginTop: Platform.OS === 'ios' ? 60 : 40,
  },
  iconContainer: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 35,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    marginBottom: 15,
  },
  headerIcon: {
    fontSize: 36,
  },
  header: {
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
  },
  diseaseCode: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 5,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 30,
  },
  tabsContainer: {
    backgroundColor: '#fff',
    paddingVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
    zIndex: 5,
  },
  tabsScrollContent: {
    paddingHorizontal: 10,
  },
  tab: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    marginHorizontal: 4,
    borderRadius: 20,
    backgroundColor: '#f0f2f5',
  },
  activeTab: {
    backgroundColor: '#e8f0fe',
  },
  tabText: {
    fontSize: 14,
    marginLeft: 6,
    color: '#666',
  },
  activeTabText: {
    color: '#4158d0',
    fontWeight: 'bold',
  },
  tabContent: {
    paddingVertical: 10,
  },
  sectionCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  sectionIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    height: 1,
    backgroundColor: '#eee',
    marginBottom: 12,
  },
  bulletItem: {
    flexDirection: 'row',
    marginBottom: 8,
    paddingRight: 5,
  },
  bulletPoint: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4158d0',
    marginTop: 6,
    marginRight: 10,
  },
  bulletText: {
    flex: 1,
    fontSize: 15,
    color: '#444',
    lineHeight: 20,
  },
  noInfoText: {
    fontSize: 15,
    color: '#888',
    fontStyle: 'italic',
  },
  whatToDoCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  whatToDoGradient: {
    borderRadius: 12,
  },
  whatToDoContent: {
    flexDirection: 'row',
    padding: 16,
    alignItems: 'center',
  },
  whatToDoIconContainer: {
    marginRight: 15,
  },
  whatToDoTextContainer: {
    flex: 1,
  },
  whatToDoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  whatToDoDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
  },
  symptomsSummaryCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  symptomsGradient: {
    padding: 16,
  },
  symptomsSummaryTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
  },
  symptomIconsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    padding: 12,
  },
  symptomIconBox: {
    width: '50%',
    padding: 8,
    alignItems: 'center',
  },
  symptomIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#fce4ec',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  symptomIconText: {
    fontSize: 13,
    color: '#555',
    textAlign: 'center',
  },
  infoCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#ff9800',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  infoCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  infoCardTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#ff9800',
    marginLeft: 8,
  },
  infoCardText: {
    fontSize: 15,
    color: '#444',
    marginBottom: 10,
  },
  warningList: {
    marginTop: 5,
  },
  warningItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  warningBullet: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ff9800',
    marginTop: 6,
    marginRight: 10,
  },
  warningItemText: {
    flex: 1,
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  causesOverviewCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    flexDirection: 'row',
  },
  causesImageContainer: {
    width: 100,
    justifyContent: 'center',
    alignItems: 'center',
  },
  causesImagePlaceholder: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#4caf50',
    justifyContent: 'center',
    alignItems: 'center',
  },
  causesTextContent: {
    flex: 1,
    padding: 16,
  },
  causesTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  causesDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
  factCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  factIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  factContent: {
    flex: 1,
  },
  factTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  factText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
  },
  remediesHeaderCard: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  remediesGradient: {
    padding: 20,
  },
  remediesHeaderTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  remediesHeaderSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
  },
  remedyTipsCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  remedyTipsTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  remedyTipsContent: {
    marginTop: 5,
  },
  remedyTip: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
  },
  remedyTipIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3498db',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  remedyTipTextContainer: {
    flex: 1,
  },
  remedyTipTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3,
  },
  remedyTipDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 18,
  },
  trackingCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  trackingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  trackingTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    color: '#333',
    marginLeft: 8,
  },
  trackingText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 16,
  },
  trackingButton: {
    backgroundColor: '#3498db',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  trackingButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
    marginRight: 5,
  },
  contactCard: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  contactGradient: {
    padding: 16,
  },
  contactHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  contactHeaderText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginLeft: 10,
  },
  contactContent: {
    padding: 16,
  },
  contactText: {
    fontSize: 14,
    color: '#555',
    lineHeight: 20,
    marginBottom: 16,
  },
  consultButton: {
    backgroundColor: '#3949ab',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  consultButtonText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
    marginRight: 5,
  },
  emergencyButton: {
    borderWidth: 1,
    borderColor: '#3949ab',
    borderRadius: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  emergencyButtonText: {
    color: '#3949ab',
    fontWeight: 'bold',
    fontSize: 14,
  },
  emergencyButtonIcon: {
    marginRight: 8,
  },
  buttonIcon: {
    marginLeft: 5,
  },
});

export default DiseaseDetailScreen;
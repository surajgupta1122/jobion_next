// Indian States and Cities data - Complete list (sorted alphabetically)
// All Indian states and union territories sorted alphabetically
export const stateOptions = [
  "Select State",
  // States (28) - sorted alphabetically
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh", "Delhi", "Goa", "Gujarat",
  "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka", "Kerala", "Madhya Pradesh",
  "Maharashtra", "Manipur", "Meghalaya", "Mizoram", "Nagaland", "Odisha", "Punjab",
  "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana", "Tripura", "Uttar Pradesh",
  "Uttarakhand", "West Bengal",
  // Union Territories (8) - sorted alphabetically
  "Andaman and Nicobar Islands", "Chandigarh", "Dadra and Nagar Haveli and Daman and Diu",
  "Jammu and Kashmir", "Ladakh", "Lakshadweep", "Puducherry"
];

// Country options - currently only India is supported
export const countryOptions = [
  "India"
];

// Cities grouped by state (comprehensive list - all cities/districts sorted alphabetically)
export const citiesByState = {
  "Andhra Pradesh": [
    "Addanki", "Adoni", "Amalapuram", "Anakapalle", "Anantapur", "Araku Valley", "Bapatla", "Bheemunipatnam", "Bhimavaram",
    "Chilakaluripet", "Chirala", "Chittoor", "Dharmavaram", "Eluru", "Gooty", "Gudivada", "Guntur", "Hindupur", "Kadapa",
    "Kakinada", "Kandukur", "Kavali", "Kurnool", "Machilipatnam", "Madanapalle", "Mangalagiri", "Markapur", "Nandyal",
    "Narasaraopet", "Nellore", "Nidadavole", "Nuzvid", "Ongole", "Palakollu", "Palasa", "Palkonda", "Parvathipuram",
    "Piduguralla", "Ponnur", "Proddatur", "Pulivendla", "Punganur", "Puttaparthi", "Rajahmundry", "Rajampet", "Ramachandrapuram",
    "Rayachoti", "Rayadurg", "Renigunta", "Repalle", "Salur", "Samalkot", "Sattenapalle", "Siddhout", "Srikakulam", "Srisailam",
    "Sullurpeta", "Tadepalligudem", "Tadipatri", "Tanuku", "Tenali", "Tirupati", "Tiruvuru", "Tuni", "Uravakonda", "Venkatagiri",
    "Vijayawada", "Vinukonda", "Visakhapatnam", "Vizianagaram", "Yemmiganur"
  ],
  "Arunachal Pradesh": [
    "Along", "Anini", "Basar", "Bomdila", "Changlang", "Daporijo", "Deomali", "Dirang", "Hawai", "Itanagar",
    "Jairampur", "Khonsa", "Koloriang", "Longding", "Miao", "Naharlargun", "Namsai", "Pangin", "Pasighat", "Roing",
    "Rupa", "Sagalee", "Seppa", "Tawang", "Tezu", "Tuting", "Yingkiong", "Ziro"
  ],
  "Assam": [
    "Abhayapuri", "Amguri", "Badarpur", "Baksa", "Barpeta", "Behali", "Bhairabkunda", "Bihpuria", "Bijni", "Bilasipara",
    "Biswanath", "Boko", "Bongaigaon", "Cachar", "Chabua", "Chapar", "Chirang", "Darrang", "Dhemaji", "Dhubri",
    "Dibrugarh", "Digboi", "Dimapur", "Diphu", "Goalpara", "Golaghat", "Guwahati", "Hailakandi", "Hajo", "Hojai",
    "Jorhat", "Kamrup", "Karbi Anglong", "Karimganj", "Kokrajhar", "Lakhimpur", "Majuli", "Mankachar", "Marigaon",
    "Nagaon", "Nalbari", "North Cachar Hills", "Rangia", "Sadiya", "Sibsagar", "Silchar", "Sivasagar", "Sonitpur",
    "Tengakhat", "Tezpur", "Tinsukia", "Udalguri"
  ],
  "Bihar": [
    "Araria", "Arrah", "Arwal", "Aurangabad", "Banka", "Begusarai", "Bettiah", "Bhabua", "Bhagalpur", "Bhojpur",
    "Bihar Sharif", "Buxar", "Chhapra", "Darbhanga", "Gaya", "Gopalganj", "Hajipur", "Jamui", "Jehanabad", "Kaimur",
    "Katihar", "Khagaria", "Kishanganj", "Lakhisarai", "Madhepura", "Madhubani", "Munger", "Muzaffarpur", "Nalanda",
    "Nawada", "Patna", "Purnia", "Rohtas", "Saharsa", "Samastipur", "Saran", "Sheikhpura", "Sheohar", "Sitamarhi",
    "Siwan", "Supaul", "Vaishali"
  ],
  "Chhattisgarh": [
    "Ambikapur", "Baikunthpur", "Baloda Bazar", "Balrampur", "Bastar", "Bemetara", "Bhilai", "Bijapur", "Bilaspur", "Dantewada",
    "Dhamtari", "Durg", "Gariaband", "Jagdalpur", "Jashpur", "Kabirdham", "Kanker", "Kondagaon", "Korba", "Koriya",
    "Mahasamund", "Mungeli", "Narayanpur", "Raigarh", "Raipur", "Rajnandgaon", "Sukma", "Surajpur", "Surguja"
  ],
  "Delhi": [
    "Delhi"
  ],
  "Goa": [
    "Bicholim", "Canacona", "Cuncolim", "Curchorem", "Dharbandora", "Goa", "Madgaon", "Mapusa", "Margao", "Mormugao",
    "Panaji", "Pernem", "Ponda", "Quepem", "Sanguem", "Sanquelim", "Valpoi"
  ],
  "Gujarat": [
    "Ahmedabad", "Amreli", "Anand", "Ankleshwar", "Aravalli", "Banaskantha", "Bharuch", "Bhavnagar", "Botad", "Chhota Udaipur",
    "Dahod", "Dang", "Devbhoomi Dwarka", "Gandhidham", "Gandhinagar", "Gir Somnath", "Jamnagar", "Junagadh", "Kheda", "Kutch",
    "Mahisagar", "Mehsana", "Morbi", "Narmada", "Navsari", "Panchmahal", "Patan", "Porbandar", "Rajkot", "Sabarkantha",
    "Surat", "Surendranagar", "Tapi", "Vadodara", "Valsad", "Vapi", "Viramgam"
  ],
  "Haryana": [
    "Ambala", "Bahadurgarh", "Ballabhgarh", "Bhiwani", "Charkhi Dadri", "Faridabad", "Fatehabad", "Gurgaon", "Hisar", "Jhajjar", "Jind", "Kaithal",
    "Karnal", "Kurukshetra", "Mahendragarh", "Mewat", "Palwal", "Panchkula", "Panipat", "Rewari", "Rohtak", "Sirsa",
    "Sonipat", "Yamunanagar"
  ],
  "Himachal Pradesh": [
    "Bilaspur", "Chamba", "Hamirpur", "Kangra", "Kinnaur", "Kullu", "Lahaul and Spiti", "Mandi", "Shimla", "Sirmaur",
    "Solan", "Una"
  ],
  "Jharkhand": [
    "Bokaro", "Chatra", "Deoghar", "Dhanbad", "Dumka", "East Singhbhum", "Garhwa", "Giridih", "Godda", "Gumla",
    "Hazaribagh", "Jamtara", "Jamshedpur", "Khunti", "Koderma", "Latehar", "Lohardaga", "Pakur", "Palamu", "Ramgarh", "Ranchi",
    "Sahibganj", "Seraikela Kharsawan", "Simdega", "West Singhbhum"
  ],
  "Karnataka": [
    "Bagalkot", "Ballari", "Belagavi", "Bengaluru Rural", "Bengaluru Urban", "Bidar", "Chamarajanagar", "Chikballapur",
    "Chikkamagaluru", "Chitradurga", "Dakshina Kannada", "Davangere", "Dharwad", "Electronic City", "Gadag", "Hassan", "Haveri", "Hebbal", "Kalaburagi",
    "Kodagu", "Kolar", "Koppal", "KR Puram", "Mandya", "Mysuru", "Raichur", "Ramanagara", "Shivamogga", "Tumakuru", "Udupi",
    "Uttara Kannada", "Vijayapura", "Whitefield", "Yadgir", "Yelahanka"
  ],
  "Kerala": [
    "Alappuzha", "Ernakulam", "Idukki", "Kannur", "Kasaragod", "Kollam", "Kottayam", "Kozhikode", "Malappuram",
    "Palakkad", "Pathanamthitta", "Thiruvananthapuram", "Thrissur", "Wayanad"
  ],
  "Madhya Pradesh": [
    "Agar Malwa", "Alirajpur", "Anuppur", "Ashoknagar", "Balaghat", "Barwani", "Betul", "Bhind", "Bhopal", "Burhanpur",
    "Chhatarpur", "Chhindwara", "Damoh", "Datia", "Dewas", "Dhar", "Dindori", "Guna", "Gwalior", "Harda", "Hoshangabad",
    "Indore", "Jabalpur", "Jhabua", "Katni", "Khandwa", "Khargone", "Mandideep", "Mandla", "Mandsaur", "Morena", "Narsinghpur",
    "Neemuch", "Niwari", "Panna", "Pithampur", "Raisen", "Rajgarh", "Ratlam", "Rewa", "Sagar", "Satna", "Sehore", "Seoni", "Shahdol",
    "Shajapur", "Sheopur", "Shivpuri", "Sidhi", "Singrauli", "Tikamgarh", "Ujjain", "Umaria", "Vidisha"
  ],
  "Maharashtra": [
    "Ahmednagar", "Akola", "Amravati", "Aurangabad", "Beed", "Bhandara", "Bhiwandi", "Boisar", "Buldhana", "Chandrapur", "Dhule", "Dombivli", "Gadchiroli",
    "Gondia", "Hingoli", "Jalgaon", "Jalna", "Kalyan", "Kolhapur", "Latur", "Mira-Bhayandar", "Mumbai City", "Mumbai Suburban", "Nagpur", "Nanded",
    "Nandurbar", "Nashik", "Navi Mumbai", "Osmanabad", "Palghar", "Panvel", "Parbhani", "Pune", "Raigad", "Ratnagiri", "Sangli", "Satara",
    "Sindhudurg", "Solapur", "Thane", "Ulhasnagar", "Vasai", "Virar", "Wardha", "Washim", "Yavatmal"
  ],
  "Delhi": [
    "Delhi"
  ],
  "Tamil Nadu": [
    "Ambattur", "Ariyalur", "Avadi", "Chennai", "Coimbatore", "Cuddalore", "Dharmapuri", "Dindigul", "Erode", "Guduvancheri", "Kancheepuram", "Kanyakumari",
    "Karur", "Krishnagiri", "Madurai", "Maraimalai Nagar", "Nagapattinam", "Namakkal", "Perambalur", "Pudukkottai", "Ramanathapuram",
    "Salem", "Sivaganga", "Tambaram", "Thanjavur", "Theni", "The Nilgiris", "Thiruvallur", "Thiruvarur", "Tiruchirappalli",
    "Tirunelveli", "Tiruppur", "Tiruvannamalai", "Tiruvarur", "Vellore", "Viluppuram", "Virudhunagar"
  ],
  "Uttar Pradesh": [
    "Agra", "Aligarh", "Allahabad", "Ambedkar Nagar", "Amethi", "Amroha", "Auraiya", "Azamgarh", "Baghpat", "Bahraich",
    "Ballia", "Balrampur", "Banda", "Barabanki", "Bareilly", "Basti", "Bhadohi", "Bijnor", "Budaun", "Bulandshahr",
    "Chandauli", "Chitrakoot", "Deoria", "Etah", "Etawah", "Faizabad", "Farrukhabad", "Fatehpur", "Firozabad",
    "Ghaziabad", "Ghazipur", "Gonda", "Gorakhpur", "Greater Noida", "Hamirpur", "Hapur", "Hardoi", "Hathras", "Jalaun", "Jaunpur", "Jhansi",
    "Kannauj", "Kanpur Dehat", "Kanpur Nagar", "Kasganj", "Kaushambi", "Kushinagar", "Lakhimpur Kheri", "Lalitpur", "Lucknow",
    "Maharajganj", "Mahoba", "Mainpuri", "Mathura", "Mau", "Meerut", "Mirzapur", "Modinagar", "Moradabad", "Muzaffarnagar", "Noida", "Pilibhit",
    "Pratapgarh", "Rae Bareli", "Rampur", "Saharanpur", "Sambhal", "Sant Kabir Nagar", "Shahjahanpur", "Shamli", "Shravasti",
    "Siddharthnagar", "Sitapur", "Sonbhadra", "Sultanpur", "Unnao", "Varanasi"
  ],
  "West Bengal": [
    "Alipurduar", "Asansol", "Bankura", "Birbhum", "Cooch Behar", "Dakshin Dinajpur", "Darjeeling", "Durgapur", "Haldia", "Hooghly", "Howrah", "Jalpaiguri",
    "Jhargram", "Kalimpong", "Kolkata", "Malda", "Murshidabad", "Nadia", "New Town", "North 24 Parganas", "Paschim Bardhaman",
    "Paschim Medinipur", "Purba Bardhaman", "Purba Medinipur", "Purulia", "Rajarhat", "Salt Lake City", "South 24 Parganas", "Uttar Dinajpur"
  ],
  "Rajasthan": [
    "Ajmer", "Alwar", "Banswara", "Baran", "Barmer", "Bharatpur", "Bhiwadi", "Bhilwara", "Bikaner", "Bundi", "Chittorgarh",
    "Churu", "Dausa", "Dholpur", "Dungarpur", "Hanumangarh", "Jaipur", "Jaisalmer", "Jalore", "Jhalawar", "Jhunjhunun",
    "Jodhpur", "Karauli", "Kota", "Nagaur", "Neemrana", "Pali", "Pratapgarh", "Rajsamand", "Sawai Madhopur", "Sikar", "Sirohi",
    "Sri Ganganagar", "Tonk", "Udaipur"
  ],
  "Telangana": [
    "Adilabad", "Bhadradri Kothagudem", "Gachibowli", "Hyderabad", "Jagtial", "Jangaon", "Jayashankar Bhupalpally", "Jogulamba Gadwal",
    "Kamareddy", "Karimnagar", "Khammam", "Komaram Bheem", "Kukatpally", "Madhapur", "Mahabubabad", "Mahabubnagar", "Mancherial", "Medak",
    "Medchal–Malkajgiri", "Mulugu", "Nagarkurnool", "Nalgonda", "Narayanpet", "Nirmal", "Nizamabad", "Peddapalli",
    "Rajanna Sircilla", "Ranga Reddy", "Sangareddy", "Secunderabad", "Siddipet", "Suryapet", "Vikarabad", "Wanaparthy",
    "Warangal Rural", "Warangal Urban", "Yadadri Bhuvanagiri"
  ],
  "Punjab": [
    "Amritsar", "Barnala", "Bathinda", "Faridkot", "Fatehgarh Sahib", "Fazilka", "Ferozepur", "Gurdaspur", "Hoshiarpur",
    "Jalandhar", "Kapurthala", "Ludhiana", "Mansa", "Moga", "Mohali", "Muktsar", "Nawanshahr", "Pathankot", "Patiala",
    "Rupnagar", "Sangrur", "Tarn Taran"
  ],
  "Odisha": [
    "Angul", "Balangir", "Balasore", "Bargarh", "Bhadrak", "Boudh", "Cuttack", "Deogarh", "Dhenkanal", "Gajapati",
    "Ganjam", "Jagatsinghpur", "Jajpur", "Jharsuguda", "Kalahandi", "Kandhamal", "Kendrapara", "Kendujhar", "Khordha",
    "Koraput", "Malkangiri", "Mayurbhanj", "Nabarangpur", "Nayagarh", "Nuapada", "Puri", "Rayagada", "Sambalpur",
    "Sonepur", "Sundargarh"
  ],
  "Uttarakhand": [
    "Almora", "Bageshwar", "Chamoli", "Champawat", "Dehradun", "Haridwar", "Nainital", "Pauri Garhwal", "Pithoragarh",
    "Rudraprayag", "Tehri Garhwal", "Udham Singh Nagar", "Uttarkashi"
  ],
  "Jammu and Kashmir": [
    "Anantnag", "Bandipore", "Baramulla", "Budgam", "Doda", "Ganderbal", "Jammu", "Kathua", "Kishtwar", "Kulgam",
    "Kupwara", "Pulwama", "Punch", "Rajouri", "Ramban", "Reasi", "Samba", "Shopian", "Srinagar", "Udhampur"
  ],
  "Sikkim": [
    "East Sikkim", "North Sikkim", "South Sikkim", "West Sikkim"
  ],
  "Tripura": [
    "Dhalai", "Gomati", "Khowai", "North Tripura", "Sepahijala", "South Tripura", "Unakoti", "West Tripura"
  ],
  "Manipur": [
    "Bishnupur", "Chandel", "Churachandpur", "Imphal East", "Imphal West", "Jiribam", "Kakching", "Kamjong", "Kangpokpi",
    "Noney", "Pherzawl", "Senapati", "Tamenglong", "Tengnoupal", "Thoubal", "Ukhrul"
  ],
  "Meghalaya": [
    "East Garo Hills", "East Jaintia Hills", "East Khasi Hills", "North Garo Hills", "Ri Bhoi", "South Garo Hills",
    "South West Garo Hills", "South West Khasi Hills", "West Garo Hills", "West Jaintia Hills", "West Khasi Hills"
  ],
  "Nagaland": [
    "Chümoukedima", "Dimapur", "Kiphire", "Kohima", "Longleng", "Mokokchung", "Mon", "Niuland", "Noklak", "Peren",
    "Phek", "Shamator", "Tseminyü", "Tuensang", "Wokha", "Zunheboto"
  ],
  "Mizoram": [
    "Aizawl", "Lunglei", "Saiha", "Champhai", "Kolasib", "Serchhip", "Lawngtlai", "Mamit", "Khawzawl", "Zawlnuam",
    "Hnahthial", "Saitual", "Ngopa", "Reiek", "Vairengte", "Kawnpui", "Darlawn", "Sialsuk", "Biate", "Thingsulthliah"
  ],
  "Puducherry": [
    "Karaikal", "Mahe", "Puducherry", "Yanam"
  ],
  "Chandigarh": [
    "Chandigarh"
  ],
  "Andaman and Nicobar Islands": [
    "Nicobar", "North and Middle Andaman", "South Andaman"
  ],
  "Dadra and Nagar Haveli and Daman and Diu": [
    "Dadra and Nagar Haveli", "Daman", "Diu"
  ],
  "Ladakh": [
    "Kargil", "Leh"
  ],
  "Lakshadweep": [
    "Agatti", "Amini", "Androth", "Bithra", "Chetlat", "Kadmat", "Kalpeni", "Kavaratti", "Kiltan", "Minicoy"
  ]
};


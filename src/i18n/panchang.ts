// Multi-language translations for Panchangam / Calendar
// Supported: te (Telugu), en (English), hi (Hindi), ta (Tamil), kn (Kannada), ml (Malayalam), bn (Bengali), mr (Marathi)

export type Lang = 'te' | 'en' | 'hi' | 'ta' | 'kn' | 'ml' | 'bn' | 'mr';

export const LANG_LIST: { code: Lang; label: string; native: string }[] = [
  { code: 'te', label: 'Telugu', native: 'తెలుగు' },
  { code: 'en', label: 'English', native: 'English' },
  { code: 'hi', label: 'Hindi', native: 'हिन्दी' },
  { code: 'ta', label: 'Tamil', native: 'தமிழ்' },
  { code: 'kn', label: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', label: 'Malayalam', native: 'മലയാളം' },
  { code: 'bn', label: 'Bengali', native: 'বাংলা' },
  { code: 'mr', label: 'Marathi', native: 'मराठी' },
];

type Dict = Record<string, string>;

// English month names (Gregorian)
const MONTHS: Record<Lang, string[]> = {
  en: ['January','February','March','April','May','June','July','August','September','October','November','December'],
  te: ['జనవరి','ఫిబ్రవరి','మార్చి','ఏప్రిల్','మే','జూన్','జులై','ఆగస్టు','సెప్టెంబర్','అక్టోబర్','నవంబర్','డిసెంబర్'],
  hi: ['जनवरी','फ़रवरी','मार्च','अप्रैल','मई','जून','जुलाई','अगस्त','सितंबर','अक्तूबर','नवंबर','दिसंबर'],
  ta: ['ஜனவரி','பிப்ரவரி','மார்ச்','ஏப்ரல்','மே','ஜூன்','ஜூலை','ஆகஸ்ட்','செப்டம்பர்','அக்டோபர்','நவம்பர்','டிசம்பர்'],
  kn: ['ಜನವರಿ','ಫೆಬ್ರವರಿ','ಮಾರ್ಚ್','ಏಪ್ರಿಲ್','ಮೇ','ಜೂನ್','ಜುಲೈ','ಆಗಸ್ಟ್','ಸೆಪ್ಟೆಂಬರ್','ಅಕ್ಟೋಬರ್','ನವೆಂಬರ್','ಡಿಸೆಂಬರ್'],
  ml: ['ജനുവരി','ഫെബ്രുവരി','മാർച്ച്','ഏപ്രിൽ','മേയ്','ജൂൺ','ജൂലൈ','ഓഗസ്റ്റ്','സെപ്റ്റംബർ','ഒക്ടോബർ','നവംബർ','ഡിസംബർ'],
  bn: ['জানুয়ারি','ফেব্রুয়ারি','মার্চ','এপ্রিল','মে','জুন','জুলাই','আগস্ট','সেপ্টেম্বর','অক্টোবর','নভেম্বর','ডিসেম্বর'],
  mr: ['जानेवारी','फेब्रुवारी','मार्च','एप्रिल','मे','जून','जुलै','ऑगस्ट','सप्टेंबर','ऑक्टोबर','नोव्हेंबर','डिसेंबर'],
};

// Short weekday names (Sun..Sat)
const WEEKDAYS_SHORT: Record<Lang, string[]> = {
  en: ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'],
  te: ['ఆది','సోమ','మం','బుధ','గురు','శుక్ర','శని'],
  hi: ['रवि','सोम','मंगल','बुध','गुरु','शुक्र','शनि'],
  ta: ['ஞாயிறு','திங்கள்','செவ்','புதன்','வியாழன்','வெள்','சனி'],
  kn: ['ಭಾನು','ಸೋಮ','ಮಂಗಳ','ಬುಧ','ಗುರು','ಶುಕ್ರ','ಶನಿ'],
  ml: ['ഞായർ','തിങ്കൾ','ചൊവ്വ','ബുധൻ','വ്യാഴം','വെള്ളി','ശനി'],
  bn: ['রবি','সোম','মঙ্গল','বুধ','বৃহস্পতি','শুক্র','শনি'],
  mr: ['रवि','सोम','मंगळ','बुध','गुरु','शुक्र','शनि'],
};

// Full weekday names (used in day detail)
const WEEKDAYS_FULL: Record<Lang, string[]> = {
  en: ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'],
  te: ['ఆదివారం','సోమవారం','మంగళవారం','బుధవారం','గురువారం','శుక్రవారం','శనివారం'],
  hi: ['रविवार','सोमवार','मंगलवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'],
  ta: ['ஞாயிற்றுக்கிழமை','திங்கட்கிழமை','செவ்வாய்க்கிழமை','புதன்கிழமை','வியாழக்கிழமை','வெள்ளிக்கிழமை','சனிக்கிழமை'],
  kn: ['ಭಾನುವಾರ','ಸೋಮವಾರ','ಮಂಗಳವಾರ','ಬುಧವಾರ','ಗುರುವಾರ','ಶುಕ್ರವಾರ','ಶನಿವಾರ'],
  ml: ['ഞായറാഴ്ച','തിങ്കളാഴ്ച','ചൊവ്വാഴ്ച','ബുധനാഴ്ച','വ്യാഴാഴ്ച','വെള്ളിയാഴ്ച','ശനിയാഴ്ച'],
  bn: ['রবিবার','সোমবার','মঙ্গলবার','বুধবার','বৃহস্পতিবার','শুক্রবার','শনিবার'],
  mr: ['रविवार','सोमवार','मंगळवार','बुधवार','गुरुवार','शुक्रवार','शनिवार'],
};

// UI labels + misc
const UI: Record<Lang, Dict> = {
  en: { calendar:'Calendar', today:'Today', month:'Month', year:'Year', tithi:'Tithi', nakshatra:'Nakshatra', paksha:'Paksha', masam:'Month', rutuvu:'Season', ayanam:'Ayanam', samvatsara:'Samvatsara', festivals:'Festivals', vratam:'Vratam / Upavasam', sunrise:'Sunrise', sunset:'Sunset', noFestivals:'No festival today', selectLang:'Select Language', shukla:'Shukla Paksha', krishna:'Krishna Paksha' },
  te: { calendar:'క్యాలెండర్', today:'ఈ రోజు', month:'నెల', year:'సంవత్సరం', tithi:'తిథి', nakshatra:'నక్షత్రం', paksha:'పక్షం', masam:'మాసం', rutuvu:'ఋతువు', ayanam:'అయనం', samvatsara:'సంవత్సరం', festivals:'పండుగలు', vratam:'వ్రతం / ఉపవాసం', sunrise:'సూర్యోదయం', sunset:'సూర్యాస్తమయం', noFestivals:'ఈ రోజు పండుగ లేదు', selectLang:'భాషను ఎంచుకోండి', shukla:'శుక్ల పక్షం', krishna:'కృష్ణ పక్షం' },
  hi: { calendar:'कैलेंडर', today:'आज', month:'महीना', year:'वर्ष', tithi:'तिथि', nakshatra:'नक्षत्र', paksha:'पक्ष', masam:'मास', rutuvu:'ऋतु', ayanam:'अयन', samvatsara:'संवत्सर', festivals:'त्यौहार', vratam:'व्रत / उपवास', sunrise:'सूर्योदय', sunset:'सूर्यास्त', noFestivals:'आज कोई त्यौहार नहीं', selectLang:'भाषा चुनें', shukla:'शुक्ल पक्ष', krishna:'कृष्ण पक्ष' },
  ta: { calendar:'காலண்டர்', today:'இன்று', month:'மாதம்', year:'ஆண்டு', tithi:'திதி', nakshatra:'நட்சத்திரம்', paksha:'பக்ஷம்', masam:'மாதம்', rutuvu:'ருது', ayanam:'அயனம்', samvatsara:'சம்வத்சரம்', festivals:'பண்டிகைகள்', vratam:'விரதம் / உபவாசம்', sunrise:'சூரிய உதயம்', sunset:'சூரிய அஸ்தமனம்', noFestivals:'இன்று பண்டிகை இல்லை', selectLang:'மொழியைத் தேர்ந்தெடுக்கவும்', shukla:'சுக்ல பக்ஷம்', krishna:'கிருஷ்ண பக்ஷம்' },
  kn: { calendar:'ಕ್ಯಾಲೆಂಡರ್', today:'ಇಂದು', month:'ಮಾಸ', year:'ವರ್ಷ', tithi:'ತಿಥಿ', nakshatra:'ನಕ್ಷತ್ರ', paksha:'ಪಕ್ಷ', masam:'ಮಾಸ', rutuvu:'ಋತು', ayanam:'ಅಯನ', samvatsara:'ಸಂವತ್ಸರ', festivals:'ಹಬ್ಬಗಳು', vratam:'ವ್ರತ / ಉಪವಾಸ', sunrise:'ಸೂರ್ಯೋದಯ', sunset:'ಸೂರ್ಯಾಸ್ತ', noFestivals:'ಇಂದು ಹಬ್ಬವಿಲ್ಲ', selectLang:'ಭಾಷೆಯನ್ನು ಆಯ್ಕೆಮಾಡಿ', shukla:'ಶುಕ್ಲ ಪಕ್ಷ', krishna:'ಕೃಷ್ಣ ಪಕ್ಷ' },
  ml: { calendar:'കലണ്ടർ', today:'ഇന്ന്', month:'മാസം', year:'വർഷം', tithi:'തിഥി', nakshatra:'നക്ഷത്രം', paksha:'പക്ഷം', masam:'മാസം', rutuvu:'ഋതു', ayanam:'അയനം', samvatsara:'സംവത്സരം', festivals:'ആഘോഷങ്ങൾ', vratam:'വ്രതം / ഉപവാസം', sunrise:'സൂര്യോദയം', sunset:'സൂര്യാസ്തമയം', noFestivals:'ഇന്ന് ആഘോഷമില്ല', selectLang:'ഭാഷ തിരഞ്ഞെടുക്കുക', shukla:'ശുക്ല പക്ഷം', krishna:'കൃഷ്ണ പക്ഷം' },
  bn: { calendar:'ক্যালেন্ডার', today:'আজ', month:'মাস', year:'বছর', tithi:'তিথি', nakshatra:'নক্ষত্র', paksha:'পক্ষ', masam:'মাস', rutuvu:'ঋতু', ayanam:'অয়ন', samvatsara:'সংবৎসর', festivals:'উৎসব', vratam:'ব্রত / উপবাস', sunrise:'সূর্যোদয়', sunset:'সূর্যাস্ত', noFestivals:'আজ কোনো উৎসব নেই', selectLang:'ভাষা নির্বাচন করুন', shukla:'শুক্ল পক্ষ', krishna:'কৃষ্ণ পক্ষ' },
  mr: { calendar:'कॅलेंडर', today:'आज', month:'महिना', year:'वर्ष', tithi:'तिथी', nakshatra:'नक्षत्र', paksha:'पक्ष', masam:'मास', rutuvu:'ऋतू', ayanam:'अयन', samvatsara:'संवत्सर', festivals:'सण', vratam:'व्रत / उपवास', sunrise:'सूर्योदय', sunset:'सूर्यास्त', noFestivals:'आज कोणताही सण नाही', selectLang:'भाषा निवडा', shukla:'शुक्ल पक्ष', krishna:'कृष्ण पक्ष' },
};

// Tithi names (30)
const TITHIS: Record<Lang, Record<string, string>> = {
  en: { pratipada:'Pratipada', dwitiya:'Dwitiya', tritiya:'Tritiya', chaturthi:'Chaturthi', panchami:'Panchami', shashthi:'Shashthi', saptami:'Saptami', ashtami:'Ashtami', navami:'Navami', dashami:'Dashami', ekadashi:'Ekadashi', dwadashi:'Dwadashi', trayodashi:'Trayodashi', chaturdashi:'Chaturdashi', purnima:'Purnima', amavasya:'Amavasya' },
  te: { pratipada:'పాడ్యమి', dwitiya:'విదియ', tritiya:'తదియ', chaturthi:'చవితి', panchami:'పంచమి', shashthi:'షష్ఠి', saptami:'సప్తమి', ashtami:'అష్టమి', navami:'నవమి', dashami:'దశమి', ekadashi:'ఏకాదశి', dwadashi:'ద్వాదశి', trayodashi:'త్రయోదశి', chaturdashi:'చతుర్దశి', purnima:'పౌర్ణమి', amavasya:'అమావాస్య' },
  hi: { pratipada:'प्रतिपदा', dwitiya:'द्वितीया', tritiya:'तृतीया', chaturthi:'चतुर्थी', panchami:'पंचमी', shashthi:'षष्ठी', saptami:'सप्तमी', ashtami:'अष्टमी', navami:'नवमी', dashami:'दशमी', ekadashi:'एकादशी', dwadashi:'द्वादशी', trayodashi:'त्रयोदशी', chaturdashi:'चतुर्दशी', purnima:'पूर्णिमा', amavasya:'अमावस्या' },
  ta: { pratipada:'பிரதமை', dwitiya:'துவிதியை', tritiya:'திரிதியை', chaturthi:'சதுர்த்தி', panchami:'பஞ்சமி', shashthi:'சஷ்டி', saptami:'சப்தமி', ashtami:'அஷ்டமி', navami:'நவமி', dashami:'தசமி', ekadashi:'ஏகாதசி', dwadashi:'துவாதசி', trayodashi:'திரயோதசி', chaturdashi:'சதுர்தசி', purnima:'பௌர்ணமி', amavasya:'அமாவாசை' },
  kn: { pratipada:'ಪಾಡ್ಯ', dwitiya:'ಬಿದಿಗೆ', tritiya:'ತದಿಗೆ', chaturthi:'ಚೌತಿ', panchami:'ಪಂಚಮಿ', shashthi:'ಷಷ್ಠಿ', saptami:'ಸಪ್ತಮಿ', ashtami:'ಅಷ್ಟಮಿ', navami:'ನವಮಿ', dashami:'ದಶಮಿ', ekadashi:'ಏಕಾದಶಿ', dwadashi:'ದ್ವಾದಶಿ', trayodashi:'ತ್ರಯೋದಶಿ', chaturdashi:'ಚತುರ್ದಶಿ', purnima:'ಹುಣ್ಣಿಮೆ', amavasya:'ಅಮಾವಾಸ್ಯೆ' },
  ml: { pratipada:'പ്രതിപദം', dwitiya:'ദ്വിതീയ', tritiya:'തൃതീയ', chaturthi:'ചതുർത്ഥി', panchami:'പഞ്ചമി', shashthi:'ഷഷ്ഠി', saptami:'സപ്തമി', ashtami:'അഷ്ടമി', navami:'നവമി', dashami:'ദശമി', ekadashi:'ഏകാദശി', dwadashi:'ദ്വാദശി', trayodashi:'ത്രയോദശി', chaturdashi:'ചതുർദശി', purnima:'പൗർണമി', amavasya:'അമാവാസി' },
  bn: { pratipada:'প্রতিপদ', dwitiya:'দ্বিতীয়া', tritiya:'তৃতীয়া', chaturthi:'চতুর্থী', panchami:'পঞ্চমী', shashthi:'ষষ্ঠী', saptami:'সপ্তমী', ashtami:'অষ্টমী', navami:'নবমী', dashami:'দশমী', ekadashi:'একাদশী', dwadashi:'দ্বাদশী', trayodashi:'ত্রয়োদশী', chaturdashi:'চতুর্দশী', purnima:'পূর্ণিমা', amavasya:'অমাবস্যা' },
  mr: { pratipada:'प्रतिपदा', dwitiya:'द्वितीया', tritiya:'तृतीया', chaturthi:'चतुर्थी', panchami:'पंचमी', shashthi:'षष्ठी', saptami:'सप्तमी', ashtami:'अष्टमी', navami:'नवमी', dashami:'दशमी', ekadashi:'एकादशी', dwadashi:'द्वादशी', trayodashi:'त्रयोदशी', chaturdashi:'चतुर्दशी', purnima:'पौर्णिमा', amavasya:'अमावस्या' },
};

// Nakshatra names (27)
const NAKSHATRAS: Record<Lang, Record<string, string>> = {
  en: { ashwini:'Ashwini', bharani:'Bharani', krittika:'Krittika', rohini:'Rohini', mrigashira:'Mrigashira', ardra:'Ardra', punarvasu:'Punarvasu', pushya:'Pushya', ashlesha:'Ashlesha', magha:'Magha', purva_phalguni:'Purva Phalguni', uttara_phalguni:'Uttara Phalguni', hasta:'Hasta', chitra:'Chitra', swati:'Swati', vishakha:'Vishakha', anuradha:'Anuradha', jyeshtha:'Jyeshtha', mula:'Mula', purva_ashadha:'Purva Ashadha', uttara_ashadha:'Uttara Ashadha', shravana:'Shravana', dhanishta:'Dhanishta', shatabhisha:'Shatabhisha', purva_bhadrapada:'Purva Bhadrapada', uttara_bhadrapada:'Uttara Bhadrapada', revati:'Revati' },
  te: { ashwini:'అశ్విని', bharani:'భరణి', krittika:'కృత్తిక', rohini:'రోహిణి', mrigashira:'మృగశిర', ardra:'ఆర్ద్ర', punarvasu:'పునర్వసు', pushya:'పుష్యమి', ashlesha:'ఆశ్లేష', magha:'మఖ', purva_phalguni:'పూర్వ ఫల్గుణి', uttara_phalguni:'ఉత్తర ఫల్గుణి', hasta:'హస్త', chitra:'చిత్త', swati:'స్వాతి', vishakha:'విశాఖ', anuradha:'అనూరాధ', jyeshtha:'జ్యేష్ఠ', mula:'మూల', purva_ashadha:'పూర్వాషాఢ', uttara_ashadha:'ఉత్తరాషాఢ', shravana:'శ్రవణం', dhanishta:'ధనిష్ఠ', shatabhisha:'శతభిష', purva_bhadrapada:'పూర్వ భాద్ర', uttara_bhadrapada:'ఉత్తర భాద్ర', revati:'రేవతి' },
  hi: { ashwini:'अश्विनी', bharani:'भरणी', krittika:'कृत्तिका', rohini:'रोहिणी', mrigashira:'मृगशिरा', ardra:'आर्द्रा', punarvasu:'पुनर्वसु', pushya:'पुष्य', ashlesha:'अश्लेषा', magha:'मघा', purva_phalguni:'पूर्व फाल्गुनी', uttara_phalguni:'उत्तर फाल्गुनी', hasta:'हस्त', chitra:'चित्रा', swati:'स्वाति', vishakha:'विशाखा', anuradha:'अनुराधा', jyeshtha:'ज्येष्ठा', mula:'मूल', purva_ashadha:'पूर्वाषाढ़ा', uttara_ashadha:'उत्तराषाढ़ा', shravana:'श्रवण', dhanishta:'धनिष्ठा', shatabhisha:'शतभिषा', purva_bhadrapada:'पूर्व भाद्रपद', uttara_bhadrapada:'उत्तर भाद्रपद', revati:'रेवती' },
  ta: { ashwini:'அஸ்வினி', bharani:'பரணி', krittika:'கார்த்திகை', rohini:'ரோகிணி', mrigashira:'மிருகசீரிடம்', ardra:'திருவாதிரை', punarvasu:'புனர்பூசம்', pushya:'பூசம்', ashlesha:'ஆயில்யம்', magha:'மகம்', purva_phalguni:'பூரம்', uttara_phalguni:'உத்தரம்', hasta:'ஹஸ்தம்', chitra:'சித்திரை', swati:'சுவாதி', vishakha:'விசாகம்', anuradha:'அனுஷம்', jyeshtha:'கேட்டை', mula:'மூலம்', purva_ashadha:'பூராடம்', uttara_ashadha:'உத்தராடம்', shravana:'திருவோணம்', dhanishta:'அவிட்டம்', shatabhisha:'சதயம்', purva_bhadrapada:'பூரட்டாதி', uttara_bhadrapada:'உத்தரட்டாதி', revati:'ரேவதி' },
  kn: { ashwini:'ಅಶ್ವಿನಿ', bharani:'ಭರಣಿ', krittika:'ಕೃತ್ತಿಕಾ', rohini:'ರೋಹಿಣಿ', mrigashira:'ಮೃಗಶಿರ', ardra:'ಆರ್ದ್ರ', punarvasu:'ಪುನರ್ವಸು', pushya:'ಪುಷ್ಯ', ashlesha:'ಆಶ್ಲೇಷ', magha:'ಮಘ', purva_phalguni:'ಪೂರ್ವ ಫಲ್ಗುಣಿ', uttara_phalguni:'ಉತ್ತರ ಫಲ್ಗುಣಿ', hasta:'ಹಸ್ತ', chitra:'ಚಿತ್ರ', swati:'ಸ್ವಾತಿ', vishakha:'ವಿಶಾಖ', anuradha:'ಅನುರಾಧ', jyeshtha:'ಜ್ಯೇಷ್ಠ', mula:'ಮೂಲ', purva_ashadha:'ಪೂರ್ವಾಷಾಢ', uttara_ashadha:'ಉತ್ತರಾಷಾಢ', shravana:'ಶ್ರವಣ', dhanishta:'ಧನಿಷ್ಠ', shatabhisha:'ಶತಭಿಷ', purva_bhadrapada:'ಪೂರ್ವ ಭಾದ್ರ', uttara_bhadrapada:'ಉತ್ತರ ಭಾದ್ರ', revati:'ರೇವತಿ' },
  ml: { ashwini:'അശ്വതി', bharani:'ഭരണി', krittika:'കാർത്തിക', rohini:'രോഹിണി', mrigashira:'മകയിരം', ardra:'തിരുവാതിര', punarvasu:'പുണർതം', pushya:'പൂയം', ashlesha:'ആയില്യം', magha:'മകം', purva_phalguni:'പൂരം', uttara_phalguni:'ഉത്രം', hasta:'അത്തം', chitra:'ചിത്തിര', swati:'ചോതി', vishakha:'വിശാഖം', anuradha:'അനിഴം', jyeshtha:'തൃക്കേട്ട', mula:'മൂലം', purva_ashadha:'പൂരാടം', uttara_ashadha:'ഉത്രാടം', shravana:'തിരുവോണം', dhanishta:'അവിട്ടം', shatabhisha:'ചതയം', purva_bhadrapada:'പൂരുരുട്ടാതി', uttara_bhadrapada:'ഉത്തൃട്ടാതി', revati:'രേവതി' },
  bn: { ashwini:'অশ্বিনী', bharani:'ভরণী', krittika:'কৃত্তিকা', rohini:'রোহিণী', mrigashira:'মৃগশিরা', ardra:'আর্দ্রা', punarvasu:'পুনর্বসু', pushya:'পুষ্যা', ashlesha:'অশ্লেষা', magha:'মঘা', purva_phalguni:'পূর্ব ফাল্গুনী', uttara_phalguni:'উত্তর ফাল্গুনী', hasta:'হস্তা', chitra:'চিত্রা', swati:'স্বাতী', vishakha:'বিশাখা', anuradha:'অনুরাধা', jyeshtha:'জ্যেষ্ঠা', mula:'মূলা', purva_ashadha:'পূর্বাষাঢ়া', uttara_ashadha:'উত্তরাষাঢ়া', shravana:'শ্রবণা', dhanishta:'ধনিষ্ঠা', shatabhisha:'শতভিষা', purva_bhadrapada:'পূর্ব ভাদ্রপদ', uttara_bhadrapada:'উত্তর ভাদ্রপদ', revati:'রেবতী' },
  mr: { ashwini:'अश्विनी', bharani:'भरणी', krittika:'कृत्तिका', rohini:'रोहिणी', mrigashira:'मृगशीर्ष', ardra:'आर्द्रा', punarvasu:'पुनर्वसु', pushya:'पुष्य', ashlesha:'आश्लेषा', magha:'मघा', purva_phalguni:'पूर्वा फाल्गुनी', uttara_phalguni:'उत्तरा फाल्गुनी', hasta:'हस्त', chitra:'चित्रा', swati:'स्वाती', vishakha:'विशाखा', anuradha:'अनुराधा', jyeshtha:'ज्येष्ठा', mula:'मूळ', purva_ashadha:'पूर्वाषाढा', uttara_ashadha:'उत्तराषाढा', shravana:'श्रवण', dhanishta:'धनिष्ठा', shatabhisha:'शततारका', purva_bhadrapada:'पूर्वा भाद्रपदा', uttara_bhadrapada:'उत्तरा भाद्रपदा', revati:'रेवती' },
};

// Hindu Month names (12)
const MASAMS: Record<Lang, Record<string, string>> = {
  en: { chaitra:'Chaitra', vaishakha:'Vaishakha', jyeshtha:'Jyeshtha', ashadha:'Ashadha', shravana:'Shravana', bhadrapada:'Bhadrapada', ashwin:'Ashwin', karthika:'Karthika', margashirsha:'Margashirsha', pushya:'Pushya', magha:'Magha', phalguna:'Phalguna' },
  te: { chaitra:'చైత్రం', vaishakha:'వైశాఖం', jyeshtha:'జ్యేష్ఠ', ashadha:'ఆషాఢం', shravana:'శ్రావణం', bhadrapada:'భాద్రపదం', ashwin:'ఆశ్వయుజం', karthika:'కార్తికం', margashirsha:'మార్గశిరం', pushya:'పుష్యమాసం', magha:'మాఘం', phalguna:'ఫాల్గుణం' },
  hi: { chaitra:'चैत्र', vaishakha:'वैशाख', jyeshtha:'ज्येष्ठ', ashadha:'आषाढ़', shravana:'श्रावण', bhadrapada:'भाद्रपद', ashwin:'आश्विन', karthika:'कार्तिक', margashirsha:'मार्गशीर्ष', pushya:'पौष', magha:'माघ', phalguna:'फाल्गुन' },
  ta: { chaitra:'சித்திரை', vaishakha:'வைகாசி', jyeshtha:'ஆனி', ashadha:'ஆடி', shravana:'ஆவணி', bhadrapada:'புரட்டாசி', ashwin:'ஐப்பசி', karthika:'கார்த்திகை', margashirsha:'மார்கழி', pushya:'தை', magha:'மாசி', phalguna:'பங்குனி' },
  kn: { chaitra:'ಚೈತ್ರ', vaishakha:'ವೈಶಾಖ', jyeshtha:'ಜ್ಯೇಷ್ಠ', ashadha:'ಆಷಾಢ', shravana:'ಶ್ರಾವಣ', bhadrapada:'ಭಾದ್ರಪದ', ashwin:'ಆಶ್ವಯುಜ', karthika:'ಕಾರ್ತಿಕ', margashirsha:'ಮಾರ್ಗಶಿರ', pushya:'ಪುಷ್ಯ', magha:'ಮಾಘ', phalguna:'ಫಾಲ್ಗುಣ' },
  ml: { chaitra:'ചൈത്ര', vaishakha:'വൈശാഖ', jyeshtha:'ജ്യേഷ്ഠ', ashadha:'ആഷാഢ', shravana:'ശ്രാവണ', bhadrapada:'ഭാദ്രപദ', ashwin:'ആശ്വിന', karthika:'കാർത്തിക', margashirsha:'മാർഗശീർഷ', pushya:'പൗഷ', magha:'മാഘ', phalguna:'ഫാൽഗുന' },
  bn: { chaitra:'চৈত্র', vaishakha:'বৈশাখ', jyeshtha:'জ্যৈষ্ঠ', ashadha:'আষাঢ়', shravana:'শ্রাবণ', bhadrapada:'ভাদ্র', ashwin:'আশ্বিন', karthika:'কার্তিক', margashirsha:'অগ্রহায়ণ', pushya:'পৌষ', magha:'মাঘ', phalguna:'ফাল্গুন' },
  mr: { chaitra:'चैत्र', vaishakha:'वैशाख', jyeshtha:'ज्येष्ठ', ashadha:'आषाढ', shravana:'श्रावण', bhadrapada:'भाद्रपद', ashwin:'आश्विन', karthika:'कार्तिक', margashirsha:'मार्गशीर्ष', pushya:'पौष', magha:'माघ', phalguna:'फाल्गुन' },
};

// Ritu (seasons)
const RUTUVU: Record<Lang, Dict> = {
  en: { vasanta:'Vasanta (Spring)', grishma:'Grishma (Summer)', varsha:'Varsha (Monsoon)', sharat:'Sharat (Autumn)', hemanta:'Hemanta (Winter)', shishira:'Shishira (Cold)' },
  te: { vasanta:'వసంత ఋతువు', grishma:'గ్రీష్మ ఋతువు', varsha:'వర్ష ఋతువు', sharat:'శరద్ ఋతువు', hemanta:'హేమంత ఋతువు', shishira:'శిశిర ఋతువు' },
  hi: { vasanta:'वसंत ऋतु', grishma:'ग्रीष्म ऋतु', varsha:'वर्षा ऋतु', sharat:'शरद ऋतु', hemanta:'हेमंत ऋतु', shishira:'शिशिर ऋतु' },
  ta: { vasanta:'வசந்த ருது', grishma:'கிரீஷ்ம ருது', varsha:'வர்ஷ ருது', sharat:'சரத் ருது', hemanta:'ஹேமந்த ருது', shishira:'சிசிர ருது' },
  kn: { vasanta:'ವಸಂತ ಋತು', grishma:'ಗ್ರೀಷ್ಮ ಋತು', varsha:'ವರ್ಷ ಋತು', sharat:'ಶರದ್ ಋತು', hemanta:'ಹೇಮಂತ ಋತು', shishira:'ಶಿಶಿರ ಋತು' },
  ml: { vasanta:'വസന്തം', grishma:'ഗ്രീഷ്മം', varsha:'വർഷം', sharat:'ശരത്', hemanta:'ഹേമന്തം', shishira:'ശിശിരം' },
  bn: { vasanta:'বসন্ত ঋতু', grishma:'গ্রীষ্ম ঋতু', varsha:'বর্ষা ঋতু', sharat:'শরৎ ঋতু', hemanta:'হেমন্ত ঋতু', shishira:'শিশির ঋতু' },
  mr: { vasanta:'वसंत ऋतू', grishma:'ग्रीष्म ऋतू', varsha:'वर्षा ऋतू', sharat:'शरद ऋतू', hemanta:'हेमंत ऋतू', shishira:'शिशिर ऋतू' },
};

// Ayanam
const AYANAMS: Record<Lang, Dict> = {
  en: { uttarayana:'Uttarayana', dakshinayana:'Dakshinayana' },
  te: { uttarayana:'ఉత్తరాయణం', dakshinayana:'దక్షిణాయనం' },
  hi: { uttarayana:'उत्तरायण', dakshinayana:'दक्षिणायन' },
  ta: { uttarayana:'உத்தராயணம்', dakshinayana:'தக்ஷிணாயனம்' },
  kn: { uttarayana:'ಉತ್ತರಾಯಣ', dakshinayana:'ದಕ್ಷಿಣಾಯಣ' },
  ml: { uttarayana:'ഉത്തരായണം', dakshinayana:'ദക്ഷിണായനം' },
  bn: { uttarayana:'উত্তরায়ণ', dakshinayana:'দক্ষিণায়ণ' },
  mr: { uttarayana:'उत्तरायण', dakshinayana:'दक्षिणायन' },
};

// Vratam keys (translations for chips)
const VRATAMS: Record<Lang, Dict> = {
  en: { ekadashi:'Ekadashi', pradosha:'Pradosha Vratam', purnima:'Purnima', amavasya:'Amavasya', chaturthi:'Chaturthi (Ganesh)', shashthi:'Shashthi' },
  te: { ekadashi:'ఏకాదశి', pradosha:'ప్రదోష వ్రతం', purnima:'పౌర్ణమి', amavasya:'అమావాస్య', chaturthi:'చవితి (గణేశ)', shashthi:'షష్ఠి' },
  hi: { ekadashi:'एकादशी', pradosha:'प्रदोष व्रत', purnima:'पूर्णिमा', amavasya:'अमावस्या', chaturthi:'चतुर्थी (गणेश)', shashthi:'षष्ठी' },
  ta: { ekadashi:'ஏகாதசி', pradosha:'பிரதோஷ விரதம்', purnima:'பௌர்ணமி', amavasya:'அமாவாசை', chaturthi:'சதுர்த்தி (விநாயகர்)', shashthi:'சஷ்டி' },
  kn: { ekadashi:'ಏಕಾದಶಿ', pradosha:'ಪ್ರದೋಷ ವ್ರತ', purnima:'ಹುಣ್ಣಿಮೆ', amavasya:'ಅಮಾವಾಸ್ಯೆ', chaturthi:'ಚೌತಿ (ಗಣೇಶ)', shashthi:'ಷಷ್ಠಿ' },
  ml: { ekadashi:'ഏകാദശി', pradosha:'പ്രദോഷ വ്രതം', purnima:'പൗർണമി', amavasya:'അമാവാസി', chaturthi:'ചതുർത്ഥി (ഗണേശ)', shashthi:'ഷഷ്ഠി' },
  bn: { ekadashi:'একাদশী', pradosha:'প্রদোষ ব্রত', purnima:'পূর্ণিমা', amavasya:'অমাবস্যা', chaturthi:'চতুর্থী (গণেশ)', shashthi:'ষষ্ঠী' },
  mr: { ekadashi:'एकादशी', pradosha:'प्रदोष व्रत', purnima:'पौर्णिमा', amavasya:'अमावस्या', chaturthi:'चतुर्थी (गणेश)', shashthi:'षष्ठी' },
};

// Festival names (major ones)
const FESTIVALS: Record<Lang, Dict> = {
  en: { new_year:'New Year', global_family_day:'Global Family Day', bhogi:'Bhogi', makar_sankranti:'Makar Sankranti', pongal:'Pongal', kanuma:'Kanuma', republic_day:'Republic Day', maha_shivaratri:'Maha Shivaratri', maha_shivaratri_2:'Shivaratri (Day 2)', holika_dahan:'Holika Dahan', holi:'Holi', ugadi:'Ugadi / Gudi Padwa', ram_navami:'Ram Navami', hanuman_jayanti:'Hanuman Jayanti', ambedkar_jayanti:'Ambedkar Jayanti', labor_day:'Labor Day', akshaya_tritiya:'Akshaya Tritiya', buddha_purnima:'Buddha Purnima', guru_purnima:'Guru Purnima', ashadha_ekadashi:'Ashadha Ekadashi', raksha_bandhan:'Raksha Bandhan', independence_day:'Independence Day', krishna_janmashtami:'Krishna Janmashtami', ganesh_chaturthi:'Ganesh Chaturthi', ananta_chaturdashi:'Ananta Chaturdashi', gandhi_jayanti:'Gandhi Jayanti', durga_ashtami:'Durga Ashtami', maha_navami:'Maha Navami', dussehra:'Dussehra', vijayadashami:'Vijayadashami', karva_chauth:'Karva Chauth', dhanteras:'Dhanteras', naraka_chaturdashi:'Naraka Chaturdashi', diwali:'Diwali', lakshmi_puja:'Lakshmi Puja', govardhan_puja:'Govardhan Puja', bhai_dooj:'Bhai Dooj', karthika_purnima:'Karthika Purnima', christmas:'Christmas', new_year_eve:'New Year Eve' },
  te: { new_year:'నూతన సంవత్సరం', global_family_day:'గ్లోబల్ ఫ్యామిలీ డే', bhogi:'భోగి', makar_sankranti:'మకర సంక్రాంతి', pongal:'సంక్రాంతి / పొంగల్', kanuma:'కనుమ', republic_day:'గణతంత్ర దినోత్సవం', maha_shivaratri:'మహా శివరాత్రి', maha_shivaratri_2:'శివరాత్రి (2వ రోజు)', holika_dahan:'హోలికా దహనం', holi:'హోలీ', ugadi:'ఉగాది', ram_navami:'శ్రీ రామ నవమి', hanuman_jayanti:'హనుమాన్ జయంతి', ambedkar_jayanti:'అంబేద్కర్ జయంతి', labor_day:'కార్మిక దినోత్సవం', akshaya_tritiya:'అక్షయ తృతీయ', buddha_purnima:'బుద్ధ పూర్ణిమ', guru_purnima:'గురు పూర్ణిమ', ashadha_ekadashi:'ఆషాఢ ఏకాదశి', raksha_bandhan:'రక్షా బంధన్', independence_day:'స్వాతంత్ర్య దినోత్సవం', krishna_janmashtami:'శ్రీ కృష్ణాష్టమి', ganesh_chaturthi:'వినాయక చవితి', ananta_chaturdashi:'అనంత చతుర్దశి', gandhi_jayanti:'గాంధీ జయంతి', durga_ashtami:'దుర్గాష్టమి', maha_navami:'మహా నవమి', dussehra:'దసరా', vijayadashami:'విజయదశమి', karva_chauth:'కర్వా చౌత్', dhanteras:'ధన్తేరస్', naraka_chaturdashi:'నరక చతుర్దశి', diwali:'దీపావళి', lakshmi_puja:'లక్ష్మీ పూజ', govardhan_puja:'గోవర్ధన పూజ', bhai_dooj:'భాయ్ దూజ్', karthika_purnima:'కార్తీక పూర్ణిమ', christmas:'క్రిస్మస్', new_year_eve:'నూతన సంవత్సరం ముందు రోజు' },
  hi: { new_year:'नव वर्ष', global_family_day:'वैश्विक परिवार दिवस', bhogi:'भोगी', makar_sankranti:'मकर संक्रांति', pongal:'पोंगल', kanuma:'कनुमा', republic_day:'गणतंत्र दिवस', maha_shivaratri:'महा शिवरात्रि', maha_shivaratri_2:'शिवरात्रि (दिन 2)', holika_dahan:'होलिका दहन', holi:'होली', ugadi:'उगादि / गुड़ी पड़वा', ram_navami:'राम नवमी', hanuman_jayanti:'हनुमान जयंती', ambedkar_jayanti:'अम्बेडकर जयंती', labor_day:'श्रम दिवस', akshaya_tritiya:'अक्षय तृतीया', buddha_purnima:'बुद्ध पूर्णिमा', guru_purnima:'गुरु पूर्णिमा', ashadha_ekadashi:'आषाढ़ एकादशी', raksha_bandhan:'रक्षा बंधन', independence_day:'स्वतंत्रता दिवस', krishna_janmashtami:'कृष्ण जन्माष्टमी', ganesh_chaturthi:'गणेश चतुर्थी', ananta_chaturdashi:'अनंत चतुर्दशी', gandhi_jayanti:'गांधी जयंती', durga_ashtami:'दुर्गा अष्टमी', maha_navami:'महा नवमी', dussehra:'दशहरा', vijayadashami:'विजयादशमी', karva_chauth:'करवा चौथ', dhanteras:'धनतेरस', naraka_chaturdashi:'नरक चतुर्दशी', diwali:'दिवाली', lakshmi_puja:'लक्ष्मी पूजा', govardhan_puja:'गोवर्धन पूजा', bhai_dooj:'भाई दूज', karthika_purnima:'कार्तिक पूर्णिमा', christmas:'क्रिसमस', new_year_eve:'नव वर्ष की पूर्व संध्या' },
  ta: { new_year:'புத்தாண்டு', global_family_day:'உலக குடும்ப தினம்', bhogi:'போகி', makar_sankranti:'மகர சங்கிராந்தி', pongal:'பொங்கல்', kanuma:'கானுமா', republic_day:'குடியரசு தினம்', maha_shivaratri:'மகா சிவராத்திரி', maha_shivaratri_2:'சிவராத்திரி (நாள் 2)', holika_dahan:'ஹோலிகா தகனம்', holi:'ஹோலி', ugadi:'உகாதி', ram_navami:'ராம நவமி', hanuman_jayanti:'அனுமன் ஜெயந்தி', ambedkar_jayanti:'அம்பேத்கர் ஜெயந்தி', labor_day:'தொழிலாளர் தினம்', akshaya_tritiya:'அட்சய த்ரிதீயை', buddha_purnima:'புத்த பௌர்ணமி', guru_purnima:'குரு பௌர்ணமி', ashadha_ekadashi:'ஆஷாட ஏகாதசி', raksha_bandhan:'ரக்ஷா பந்தன்', independence_day:'சுதந்திர தினம்', krishna_janmashtami:'கிருஷ்ண ஜெயந்தி', ganesh_chaturthi:'விநாயக சதுர்த்தி', ananta_chaturdashi:'அனந்த சதுர்த்தசி', gandhi_jayanti:'காந்தி ஜெயந்தி', durga_ashtami:'துர்கா அஷ்டமி', maha_navami:'மகா நவமி', dussehra:'தசரா', vijayadashami:'விஜயதசமி', karva_chauth:'கர்வா சௌத்', dhanteras:'தன்தேரஸ்', naraka_chaturdashi:'நரக சதுர்த்தசி', diwali:'தீபாவளி', lakshmi_puja:'லட்சுமி பூஜை', govardhan_puja:'கோவர்த்தன பூஜை', bhai_dooj:'பாய் தூஜ்', karthika_purnima:'கார்த்திகை பௌர்ணமி', christmas:'கிறிஸ்துமஸ்', new_year_eve:'புத்தாண்டு முன் தினம்' },
  kn: { new_year:'ಹೊಸ ವರ್ಷ', global_family_day:'ಜಾಗತಿಕ ಕುಟುಂಬ ದಿನ', bhogi:'ಭೋಗಿ', makar_sankranti:'ಮಕರ ಸಂಕ್ರಾಂತಿ', pongal:'ಪೊಂಗಲ್', kanuma:'ಕನುಮಾ', republic_day:'ಗಣರಾಜ್ಯೋತ್ಸವ', maha_shivaratri:'ಮಹಾ ಶಿವರಾತ್ರಿ', maha_shivaratri_2:'ಶಿವರಾತ್ರಿ (ದಿನ 2)', holika_dahan:'ಹೋಳಿಕಾ ದಹನ', holi:'ಹೋಳಿ', ugadi:'ಯುಗಾದಿ', ram_navami:'ಶ್ರೀ ರಾಮ ನವಮಿ', hanuman_jayanti:'ಹನುಮಾನ್ ಜಯಂತಿ', ambedkar_jayanti:'ಅಂಬೇಡ್ಕರ್ ಜಯಂತಿ', labor_day:'ಕಾರ್ಮಿಕ ದಿನ', akshaya_tritiya:'ಅಕ್ಷಯ ತೃತೀಯ', buddha_purnima:'ಬುದ್ಧ ಪೂರ್ಣಿಮಾ', guru_purnima:'ಗುರು ಪೂರ್ಣಿಮಾ', ashadha_ekadashi:'ಆಷಾಢ ಏಕಾದಶಿ', raksha_bandhan:'ರಕ್ಷಾ ಬಂಧನ', independence_day:'ಸ್ವಾತಂತ್ರ್ಯ ದಿನ', krishna_janmashtami:'ಶ್ರೀ ಕೃಷ್ಣ ಜನ್ಮಾಷ್ಟಮಿ', ganesh_chaturthi:'ಗಣೇಶ ಚೌತಿ', ananta_chaturdashi:'ಅನಂತ ಚತುರ್ದಶಿ', gandhi_jayanti:'ಗಾಂಧಿ ಜಯಂತಿ', durga_ashtami:'ದುರ್ಗಾಷ್ಟಮಿ', maha_navami:'ಮಹಾ ನವಮಿ', dussehra:'ದಸರಾ', vijayadashami:'ವಿಜಯದಶಮಿ', karva_chauth:'ಕರ್ವಾ ಚೌತ್', dhanteras:'ಧನತೇರಸ್', naraka_chaturdashi:'ನರಕ ಚತುರ್ದಶಿ', diwali:'ದೀಪಾವಳಿ', lakshmi_puja:'ಲಕ್ಷ್ಮೀ ಪೂಜೆ', govardhan_puja:'ಗೋವರ್ಧನ ಪೂಜೆ', bhai_dooj:'ಭಾಯಿ ದೂಜ್', karthika_purnima:'ಕಾರ್ತಿಕ ಪೂರ್ಣಿಮಾ', christmas:'ಕ್ರಿಸ್ಮಸ್', new_year_eve:'ಹೊಸ ವರ್ಷದ ಹಿಂದಿನ ದಿನ' },
  ml: { new_year:'പുതുവർഷം', global_family_day:'ആഗോള കുടുംബ ദിനം', bhogi:'ഭോഗി', makar_sankranti:'മകര സംക്രാന്തി', pongal:'പൊങ്കൽ', kanuma:'കാനുമ', republic_day:'റിപ്പബ്ലിക് ദിനം', maha_shivaratri:'മഹാശിവരാത്രി', maha_shivaratri_2:'ശിവരാത്രി (ദിനം 2)', holika_dahan:'ഹോളിക ദഹനം', holi:'ഹോളി', ugadi:'ഉഗാദി', ram_navami:'ശ്രീരാമ നവമി', hanuman_jayanti:'ഹനുമാൻ ജയന്തി', ambedkar_jayanti:'അംബേദ്കർ ജയന്തി', labor_day:'തൊഴിലാളി ദിനം', akshaya_tritiya:'അക്ഷയ തൃതീയ', buddha_purnima:'ബുദ്ധ പൂർണിമ', guru_purnima:'ഗുരു പൂർണിമ', ashadha_ekadashi:'ആഷാഢ ഏകാദശി', raksha_bandhan:'രക്ഷാ ബന്ധൻ', independence_day:'സ്വാതന്ത്ര്യ ദിനം', krishna_janmashtami:'ശ്രീകൃഷ്ണ ജയന്തി', ganesh_chaturthi:'ഗണേശ ചതുർത്ഥി', ananta_chaturdashi:'അനന്ത ചതുർദശി', gandhi_jayanti:'ഗാന്ധി ജയന്തി', durga_ashtami:'ദുർഗാഷ്ടമി', maha_navami:'മഹാ നവമി', dussehra:'ദസറ', vijayadashami:'വിജയദശമി', karva_chauth:'കർവ ചൗത്', dhanteras:'ധന്തേരസ്', naraka_chaturdashi:'നരക ചതുർദശി', diwali:'ദീപാവലി', lakshmi_puja:'ലക്ഷ്മി പൂജ', govardhan_puja:'ഗോവർദ്ധന പൂജ', bhai_dooj:'ഭായി ദൂജ്', karthika_purnima:'കാർത്തിക പൗർണമി', christmas:'ക്രിസ്മസ്', new_year_eve:'പുതുവർഷ സന്ധ്യ' },
  bn: { new_year:'নববর্ষ', global_family_day:'বিশ্ব পরিবার দিবস', bhogi:'ভোগি', makar_sankranti:'মকর সংক্রান্তি', pongal:'পোঙ্গল', kanuma:'কানুমা', republic_day:'প্রজাতন্ত্র দিবস', maha_shivaratri:'মহা শিবরাত্রি', maha_shivaratri_2:'শিবরাত্রি (২য় দিন)', holika_dahan:'হোলিকা দহন', holi:'হোলি', ugadi:'উগাদি', ram_navami:'রাম নবমী', hanuman_jayanti:'হনুমান জয়ন্তী', ambedkar_jayanti:'আম্বেদকর জয়ন্তী', labor_day:'শ্রম দিবস', akshaya_tritiya:'অক্ষয় তৃতীয়া', buddha_purnima:'বুদ্ধ পূর্ণিমা', guru_purnima:'গুরু পূর্ণিমা', ashadha_ekadashi:'আষাঢ় একাদশী', raksha_bandhan:'রাখি বন্ধন', independence_day:'স্বাধীনতা দিবস', krishna_janmashtami:'শ্রীকৃষ্ণ জন্মাষ্টমী', ganesh_chaturthi:'গণেশ চতুর্থী', ananta_chaturdashi:'অনন্ত চতুর্দশী', gandhi_jayanti:'গান্ধী জয়ন্তী', durga_ashtami:'দুর্গাষ্টমী', maha_navami:'মহা নবমী', dussehra:'দশেরা', vijayadashami:'বিজয়া দশমী', karva_chauth:'করভা চৌথ', dhanteras:'ধনতেরস', naraka_chaturdashi:'নরক চতুর্দশী', diwali:'দীপাবলি', lakshmi_puja:'লক্ষ্মী পূজা', govardhan_puja:'গোবর্ধন পূজা', bhai_dooj:'ভাই দুজ', karthika_purnima:'কার্তিক পূর্ণিমা', christmas:'বড়দিন', new_year_eve:'বর্ষশেষ' },
  mr: { new_year:'नवीन वर्ष', global_family_day:'जागतिक कुटुंब दिन', bhogi:'भोगी', makar_sankranti:'मकर संक्रांति', pongal:'पोंगल', kanuma:'कानुमा', republic_day:'प्रजासत्ताक दिन', maha_shivaratri:'महा शिवरात्री', maha_shivaratri_2:'शिवरात्री (दिवस २)', holika_dahan:'होलिका दहन', holi:'होळी', ugadi:'गुढी पाडवा', ram_navami:'राम नवमी', hanuman_jayanti:'हनुमान जयंती', ambedkar_jayanti:'आंबेडकर जयंती', labor_day:'कामगार दिन', akshaya_tritiya:'अक्षय तृतीया', buddha_purnima:'बुद्ध पौर्णिमा', guru_purnima:'गुरु पौर्णिमा', ashadha_ekadashi:'आषाढी एकादशी', raksha_bandhan:'रक्षाबंधन', independence_day:'स्वातंत्र्य दिन', krishna_janmashtami:'श्रीकृष्ण जन्माष्टमी', ganesh_chaturthi:'गणेश चतुर्थी', ananta_chaturdashi:'अनंत चतुर्दशी', gandhi_jayanti:'गांधी जयंती', durga_ashtami:'दुर्गाष्टमी', maha_navami:'महा नवमी', dussehra:'दसरा', vijayadashami:'विजयादशमी', karva_chauth:'करवा चौथ', dhanteras:'धनत्रयोदशी', naraka_chaturdashi:'नरक चतुर्दशी', diwali:'दिवाळी', lakshmi_puja:'लक्ष्मीपूजन', govardhan_puja:'गोवर्धन पूजा', bhai_dooj:'भाऊबीज', karthika_purnima:'कार्तिक पौर्णिमा', christmas:'नाताळ', new_year_eve:'वर्षअखेर' },
};

export function tr(lang: Lang, key: string, fallback?: string) {
  return UI[lang]?.[key] || UI.en[key] || fallback || key;
}
export const trMonth = (lang: Lang, idx0: number) => MONTHS[lang]?.[idx0] || MONTHS.en[idx0];
export const trWeekShort = (lang: Lang, idx0: number) => WEEKDAYS_SHORT[lang]?.[idx0] || WEEKDAYS_SHORT.en[idx0];
export const trWeekFull = (lang: Lang, idx0: number) => WEEKDAYS_FULL[lang]?.[idx0] || WEEKDAYS_FULL.en[idx0];
export const trTithi = (lang: Lang, k: string) => TITHIS[lang]?.[k] || TITHIS.en[k] || k;
export const trNakshatra = (lang: Lang, k: string) => NAKSHATRAS[lang]?.[k] || NAKSHATRAS.en[k] || k;
export const trMasam = (lang: Lang, k: string) => MASAMS[lang]?.[k] || MASAMS.en[k] || k;
export const trRutuvu = (lang: Lang, k: string) => RUTUVU[lang]?.[k] || RUTUVU.en[k] || k;
export const trAyanam = (lang: Lang, k: string) => AYANAMS[lang]?.[k] || AYANAMS.en[k] || k;
export const trVratam = (lang: Lang, k: string) => VRATAMS[lang]?.[k] || VRATAMS.en[k] || k;
export const trFestival = (lang: Lang, k: string) => FESTIVALS[lang]?.[k] || FESTIVALS.en[k] || k.replace(/_/g, ' ');

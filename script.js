/* ================================================
   AGRI AI ASSISTANT — Application Logic
   Agent 2 (Interaction) + Agent 4 (Integration)
   ================================================ */

// ---- State Management ----
const AppState = {
    currentScreen: 'screenHome',
    previousScreen: null,
    resultSource: null, // 'disease' or 'crop'
    cameraStream: null,
    currentFacingMode: 'environment',
    activeTab: 'crops',
};

// ---- Navigation ----
function navigateTo(screenId) {
    const current = document.querySelector('.screen.active');
    if (current) {
        AppState.previousScreen = current.id;
        current.classList.remove('active');
    }

    // Cleanup camera if leaving disease detection
    if (AppState.previousScreen === 'screenDiseaseDetect' && screenId !== 'screenResult') {
        stopCamera();
        resetDiseaseScreen();
    }

    const target = document.getElementById(screenId);
    if (target) {
        target.classList.add('active');
        AppState.currentScreen = screenId;
        target.scrollTop = 0;
    }

    // Initialize screens
    if (screenId === 'screenDiseaseDetect') {
        initCamera();
    }
    if (screenId === 'screenOfflineInfo') {
        renderInfoCards();
    }
}

function goBackFromResult() {
    if (AppState.resultSource === 'disease') {
        navigateTo('screenDiseaseDetect');
    } else if (AppState.resultSource === 'crop') {
        navigateTo('screenCropForm');
    } else {
        navigateTo('screenHome');
    }
}

// ---- Status Bar Clock ----
function updateClock() {
    const el = document.getElementById('statusTime');
    if (!el) return;
    const now = new Date();
    const h = now.getHours().toString().padStart(2, '0');
    const m = now.getMinutes().toString().padStart(2, '0');
    el.textContent = `${h}:${m}`;
}
setInterval(updateClock, 1000);
updateClock();

// ---- Daily Tips (offline data) ----
const DAILY_TIPS = [
    "Water your crops early morning for best absorption.",
    "Rotate crops each season to keep soil healthy.",
    "Neem oil spray helps control many common pests.",
    "Mulching reduces water loss by up to 70%.",
    "Test soil pH before choosing fertilizer.",
    "Companion planting with marigolds repels harmful insects.",
    "Harvest vegetables in the cool morning hours.",
    "Drip irrigation saves 60% more water than flood irrigation.",
    "Add compost to improve soil structure and nutrients.",
    "Prune fruit trees in winter for better spring growth.",
];

function showDailyTip() {
    const dayIndex = new Date().getDate() % DAILY_TIPS.length;
    const el = document.getElementById('dailyTip');
    if (el) el.textContent = DAILY_TIPS[dayIndex];
}
showDailyTip();

// ================================================
//   DISEASE DETECTION — Camera & Image
// ================================================

async function initCamera() {
    const placeholder = document.getElementById('cameraPlaceholder');
    const video = document.getElementById('cameraPreview');
    const imgPreview = document.getElementById('imagePreview');

    // If image already shown, skip camera
    if (imgPreview.style.display === 'block') return;

    try {
        const constraints = {
            video: {
                facingMode: AppState.currentFacingMode,
                width: { ideal: 1280 },
                height: { ideal: 960 },
            },
            audio: false,
        };

        const stream = await navigator.mediaDevices.getUserMedia(constraints);
        AppState.cameraStream = stream;
        video.srcObject = stream;
        video.style.display = 'block';
        placeholder.style.display = 'none';
    } catch (err) {
        console.log('Camera not available:', err.message);
        placeholder.querySelector('p').textContent =
            'Camera not available. Tap Upload to select a photo.';
    }
}

function stopCamera() {
    if (AppState.cameraStream) {
        AppState.cameraStream.getTracks().forEach(t => t.stop());
        AppState.cameraStream = null;
    }
    const video = document.getElementById('cameraPreview');
    if (video) {
        video.srcObject = null;
        video.style.display = 'none';
    }
}

function switchCamera() {
    AppState.currentFacingMode =
        AppState.currentFacingMode === 'environment' ? 'user' : 'environment';
    stopCamera();
    initCamera();
}

function capturePhoto() {
    const video = document.getElementById('cameraPreview');
    const canvas = document.getElementById('cameraCanvas');
    const imgPreview = document.getElementById('imagePreview');

    if (!video || video.style.display === 'none') {
        triggerUpload();
        return;
    }

    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0);

    const dataURL = canvas.toDataURL('image/jpeg', 0.85);
    imgPreview.src = dataURL;
    imgPreview.style.display = 'block';

    stopCamera();
    showAnalyzeControls();
}

function triggerUpload() {
    document.getElementById('fileInput').click();
}

function handleFileSelect(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = function (e) {
        const imgPreview = document.getElementById('imagePreview');
        imgPreview.src = e.target.result;
        imgPreview.style.display = 'block';

        stopCamera();
        document.getElementById('cameraPlaceholder').style.display = 'none';
        showAnalyzeControls();
    };
    reader.readAsDataURL(file);
}

function showAnalyzeControls() {
    document.getElementById('cameraControls').classList.add('hidden');
    document.getElementById('analyzeControls').classList.remove('hidden');
}

function retakePhoto() {
    resetDiseaseScreen();
    initCamera();
}

function resetDiseaseScreen() {
    const imgPreview = document.getElementById('imagePreview');
    const placeholder = document.getElementById('cameraPlaceholder');

    imgPreview.style.display = 'none';
    imgPreview.src = '';
    placeholder.style.display = '';

    document.getElementById('cameraControls').classList.remove('hidden');
    document.getElementById('analyzeControls').classList.add('hidden');
    document.getElementById('fileInput').value = '';
}

// ---- Analyze Image (Simulated AI) ----
function analyzeImage() {
    showLoading('🔬 Analyzing your crop...');

    setTimeout(() => {
        hideLoading();
        AppState.resultSource = 'disease';
        showDiseaseResult();
        navigateTo('screenResult');
    }, 2200);
}

// ---- Disease Result Data (Offline) ----
const DISEASE_DB = [
    {
        name: 'Leaf Blight',
        emoji: '🍂',
        confidence: 87,
        type: 'danger',
        explanation: 'Leaf blight is caused by fungal infection (Alternaria). It appears as brown spots with yellow halos on leaves, spreading rapidly in humid conditions.',
        treatment: [
            'Remove and destroy infected leaves immediately',
            'Apply Mancozeb fungicide (2g/L water)',
            'Spray copper oxychloride solution',
            'Ensure proper spacing between plants for air flow',
        ],
        tips: [
            'Avoid overhead watering — use drip irrigation',
            'Rotate crops every season',
            'Plant resistant varieties when available',
            'Monitor fields weekly during monsoon',
        ],
    },
    {
        name: 'Powdery Mildew',
        emoji: '🤍',
        confidence: 92,
        type: 'danger',
        explanation: 'White powdery coating on leaves caused by fungal spores. Thrives in warm, dry days and cool nights. Reduces photosynthesis and weakens the plant.',
        treatment: [
            'Spray neem oil solution (5ml/L)',
            'Apply sulfur-based fungicide',
            'Remove heavily infected parts',
            'Improve air circulation around plants',
        ],
        tips: [
            'Don\'t crowd plants — maintain proper spacing',
            'Water at the base, not on leaves',
            'Apply treatments early morning or evening',
            'Use baking soda spray (1 tsp/L) as home remedy',
        ],
    },
    {
        name: 'Downy Mildew',
        emoji: '💧',
        confidence: 84,
        type: 'danger',
        explanation: 'Downy mildew causes yellow-green patches on the upper leaf surface with grayish-purple fuzzy growth underneath. Thrives in cool, moist conditions and spreads by wind and rain.',
        treatment: [
            'Apply Metalaxyl-based fungicide (2g/L)',
            'Remove and burn affected leaves',
            'Spray Bordeaux mixture (1%) preventively',
            'Avoid planting in poorly drained areas',
        ],
        tips: [
            'Water early morning so leaves dry by afternoon',
            'Ensure good drainage in the field',
            'Space plants well for air movement',
            'Choose downy mildew-resistant seed varieties',
        ],
    },
    {
        name: 'Rust',
        emoji: '🟤',
        confidence: 89,
        type: 'danger',
        explanation: 'Rust disease produces orange-brown or reddish-brown powdery pustules on undersides of leaves. Caused by Puccinia fungi, it weakens plants and reduces yield significantly.',
        treatment: [
            'Spray Propiconazole fungicide (1ml/L)',
            'Apply copper-based fungicide',
            'Remove and destroy severely rusted leaves',
            'Apply Triadimefon at early infection stage',
        ],
        tips: [
            'Plant rust-resistant crop varieties',
            'Avoid excessive nitrogen fertilizer',
            'Scout fields weekly during humid weather',
            'Maintain weed-free surroundings',
        ],
    },
    {
        name: 'Root Rot',
        emoji: '🪱',
        confidence: 81,
        type: 'danger',
        explanation: 'Root rot is caused by Pythium, Phytophthora, or Rhizoctonia fungi in waterlogged soil. Roots turn brown/black and mushy, plants wilt and die despite adequate watering.',
        treatment: [
            'Improve field drainage immediately',
            'Apply Trichoderma viride to soil (biological control)',
            'Use Metalaxyl soil drench for Phytophthora',
            'Remove and destroy dead/dying plants',
        ],
        tips: [
            'Avoid overwatering — let soil dry between waterings',
            'Raise seed beds for better drainage',
            'Treat seeds with Thiram before planting',
            'Add organic matter to improve soil structure',
        ],
    },
    {
        name: 'Leaf Curl Virus',
        emoji: '🌀',
        confidence: 86,
        type: 'danger',
        explanation: 'Leaf curl is a viral disease spread mainly by whiteflies. Leaves curl upward, become thick and leathery, and plants are severely stunted with poor fruit development.',
        treatment: [
            'Spray Imidacloprid (0.3ml/L) to control whiteflies',
            'Use yellow sticky traps (25-30 per acre)',
            'Remove and destroy infected plants early',
            'Apply neem oil spray (5ml/L) as deterrent',
        ],
        tips: [
            'Use whitefly-resistant varieties when available',
            'Install reflective mulches to repel whiteflies',
            'Avoid planting near infected fields',
            'Start seedlings under insect-proof nets',
        ],
    },
    {
        name: 'Bacterial Wilt',
        emoji: '😵',
        confidence: 83,
        type: 'danger',
        explanation: 'Bacterial wilt (Ralstonia solanacearum) causes sudden wilting of entire plants without yellowing. Cut stems show brown vascular discoloration and milky bacterial ooze in water.',
        treatment: [
            'No chemical cure — remove infected plants immediately',
            'Apply Pseudomonas fluorescens to soil (biocontrol)',
            'Solarize soil before next planting season',
            'Treat soil with bleaching powder (10kg/acre)',
        ],
        tips: [
            'Rotate with non-host crops (cereals) for 3-4 years',
            'Avoid injuring roots during weeding',
            'Use grafted seedlings on resistant rootstock',
            'Sterilize tools between plants when pruning',
        ],
    },
    {
        name: 'Mosaic Virus',
        emoji: '🟩',
        confidence: 88,
        type: 'danger',
        explanation: 'Mosaic virus causes yellow-green mottled pattern on leaves with puckering and distortion. Spread by aphids, contaminated tools, and infected seeds. No chemical cure exists.',
        treatment: [
            'Remove and burn all infected plants immediately',
            'Control aphid vectors with Thiamethoxam (0.2g/L)',
            'Spray neem oil to deter aphids (5ml/L)',
            'Use virus-free certified seeds for replanting',
        ],
        tips: [
            'Wash hands and sterilize tools after touching infected plants',
            'Plant virus-resistant varieties when available',
            'Use barrier crops (maize/sorghum) around fields',
            'Control weeds that serve as virus reservoirs',
        ],
    },
    {
        name: 'Stem Borer',
        emoji: '🐛',
        confidence: 85,
        type: 'danger',
        explanation: 'Stem borers are insect larvae that bore into stems, causing "dead hearts" in young plants and "white ears" at heading stage. Major pest of rice, maize, and sugarcane.',
        treatment: [
            'Install pheromone traps (5 per acre)',
            'Release Trichogramma egg parasitoids',
            'Apply Cartap hydrochloride granules in leaf whorls',
            'Spray Chlorantraniliprole (0.3ml/L) at egg-laying stage',
        ],
        tips: [
            'Remove and destroy crop stubble after harvest',
            'Use light traps to monitor moth activity',
            'Clip affected tillers below the bore hole',
            'Maintain proper field hygiene between seasons',
        ],
    },
    {
        name: 'Anthracnose',
        emoji: '⚫',
        confidence: 82,
        type: 'danger',
        explanation: 'Anthracnose (Colletotrichum) causes dark sunken spots on fruits, leaves, and stems. Lesions may have salmon-pink spore masses. Common in mango, chilli, beans, and banana.',
        treatment: [
            'Spray Carbendazim fungicide (1g/L)',
            'Apply copper oxychloride (3g/L) preventively',
            'Remove infected fruits and fallen debris',
            'Treat seeds with Thiram before sowing',
        ],
        tips: [
            'Avoid harvesting fruits in wet weather',
            'Prune trees for better air circulation',
            'Dip harvested fruits in hot water (52°C for 10 min)',
            'Store produce in cool, dry conditions',
        ],
    },
    {
        name: 'Aphid Infestation',
        emoji: '🐜',
        confidence: 90,
        type: 'danger',
        explanation: 'Aphids are tiny soft-bodied insects that cluster on tender shoots and undersides of leaves. They suck plant sap causing curling, yellowing, and stunted growth. They also transmit viruses.',
        treatment: [
            'Spray neem oil solution (5ml/L water)',
            'Use soapy water spray (10g detergent/L)',
            'Apply Imidacloprid (0.3ml/L) for heavy infestations',
            'Release ladybird beetles as biological control',
        ],
        tips: [
            'Inspect new growth and leaf undersides regularly',
            'Avoid excessive nitrogen which attracts aphids',
            'Use yellow sticky traps for monitoring',
            'Encourage natural predators like lacewings and ladybugs',
        ],
    },
    {
        name: 'Healthy Crop ✅',
        emoji: '🌿',
        confidence: 95,
        type: 'success',
        explanation: 'No visible signs of disease detected. The crop appears healthy with good leaf color and structure.',
        treatment: [
            'Continue regular watering schedule',
            'Maintain current fertilizer plan',
            'Keep monitoring for early signs of pests',
        ],
        tips: [
            'Apply organic compost monthly',
            'Check soil moisture regularly',
            'Inspect undersides of leaves weekly',
            'Harvest at the right maturity stage',
        ],
    },
];

function showDiseaseResult() {
    const disease = DISEASE_DB[Math.floor(Math.random() * DISEASE_DB.length)];
    const body = document.getElementById('resultBody');
    const title = document.getElementById('resultTitle');
    title.textContent = disease.type === 'danger' ? '⚠️ Disease Detected' : '✅ Crop Analysis';

    body.innerHTML = `
        <div class="result-hero result-${disease.type}">
            <div class="result-emoji">${disease.emoji}</div>
            <div class="result-name">${disease.name}</div>
            <div class="result-confidence">
                ${disease.type === 'danger' ? '⚠️' : '✅'} ${disease.confidence}% Confidence
            </div>
        </div>

        <div class="result-card">
            <div class="result-card-header">
                <span class="result-card-icon">🔍</span> What is this?
            </div>
            <div class="result-card-body">
                ${disease.explanation}
            </div>
        </div>

        <div class="result-card">
            <div class="result-card-header">
                <span class="result-card-icon">💊</span> ${disease.type === 'danger' ? 'Treatment' : 'Care Plan'}
            </div>
            <div class="result-card-body">
                <ul>
                    ${disease.treatment.map(t => `<li>${t}</li>`).join('')}
                </ul>
            </div>
        </div>

        <div class="result-card">
            <div class="result-card-header">
                <span class="result-card-icon">💡</span> Tips
            </div>
            <div class="result-card-body">
                <ul>
                    ${disease.tips.map(t => `<li>${t}</li>`).join('')}
                </ul>
            </div>
        </div>

        <button class="btn-large btn-primary btn-full result-home-btn" onclick="navigateTo('screenHome')">
            🏠 Back to Home
        </button>
    `;
}

// ================================================
//   CROP RECOMMENDATION
// ================================================

function updateTempDisplay(val) {
    document.getElementById('tempValue').textContent = `${val}°C`;
}

function getCropSuggestion() {
    const soil = document.getElementById('soilType').value;
    const temp = parseInt(document.getElementById('temperature').value);
    const rainfall = document.getElementById('rainfall').value;
    const season = document.getElementById('season').value;

    // Validation
    if (!soil) {
        shakeElement('soilType');
        return;
    }
    if (!rainfall) {
        shakeElement('rainfall');
        return;
    }
    if (!season) {
        shakeElement('season');
        return;
    }

    showLoading('🌾 Finding best crops...');

    setTimeout(() => {
        hideLoading();
        AppState.resultSource = 'crop';
        showCropResult(soil, temp, parseInt(rainfall), season);
        navigateTo('screenResult');
    }, 1800);
}

// ---- Crop Suggestion Engine (Offline rule-based) ----
const CROP_DB = [
    { name: 'Rice', emoji: '🍚', soil: ['alluvial', 'clay', 'loamy'], tempMin: 20, tempMax: 37, rainMin: 1000, rainMax: 3000, season: ['kharif'], desc: 'Staple grain, needs standing water. High yield in monsoon.' },
    { name: 'Wheat', emoji: '🌾', soil: ['alluvial', 'loamy', 'black'], tempMin: 10, tempMax: 25, rainMin: 400, rainMax: 1200, season: ['rabi'], desc: 'Winter crop, needs cool weather. Key food grain.' },
    { name: 'Sugarcane', emoji: '🎋', soil: ['alluvial', 'loamy', 'black'], tempMin: 20, tempMax: 40, rainMin: 750, rainMax: 2500, season: ['kharif', 'zaid'], desc: 'Tropical cash crop, needs plenty of water and sun.' },
    { name: 'Cotton', emoji: '☁️', soil: ['black', 'alluvial', 'red'], tempMin: 21, tempMax: 40, rainMin: 500, rainMax: 1500, season: ['kharif'], desc: 'Important fiber crop. Grows well in black soil.' },
    { name: 'Maize', emoji: '🌽', soil: ['loamy', 'alluvial', 'red', 'sandy'], tempMin: 18, tempMax: 35, rainMin: 500, rainMax: 1500, season: ['kharif', 'zaid'], desc: 'Versatile cereal crop. Tolerates various conditions.' },
    { name: 'Groundnut', emoji: '🥜', soil: ['sandy', 'loamy', 'red'], tempMin: 20, tempMax: 35, rainMin: 400, rainMax: 1000, season: ['kharif', 'zaid'], desc: 'Oilseed crop. Enriches soil with nitrogen.' },
    { name: 'Mustard', emoji: '🌼', soil: ['alluvial', 'loamy', 'sandy'], tempMin: 10, tempMax: 25, rainMin: 250, rainMax: 750, season: ['rabi'], desc: 'Important oilseed. Grows in cool dry weather.' },
    { name: 'Tomato', emoji: '🍅', soil: ['loamy', 'red', 'alluvial'], tempMin: 18, tempMax: 32, rainMin: 400, rainMax: 1200, season: ['kharif', 'rabi', 'zaid'], desc: 'Versatile vegetable. Grows in most seasons.' },
    { name: 'Potato', emoji: '🥔', soil: ['loamy', 'sandy', 'alluvial'], tempMin: 10, tempMax: 25, rainMin: 300, rainMax: 800, season: ['rabi'], desc: 'Cool weather root crop. High demand year-round.' },
    { name: 'Millet', emoji: '🌿', soil: ['sandy', 'red', 'laterite'], tempMin: 25, tempMax: 45, rainMin: 200, rainMax: 700, season: ['kharif'], desc: 'Drought-resistant, nutritious grain. Grows in poor soil.' },
    { name: 'Soybean', emoji: '🫘', soil: ['black', 'loamy', 'alluvial'], tempMin: 20, tempMax: 35, rainMin: 600, rainMax: 1500, season: ['kharif'], desc: 'Protein-rich oilseed. Improves soil fertility.' },
    { name: 'Chickpea', emoji: '🫘', soil: ['loamy', 'black', 'alluvial'], tempMin: 10, tempMax: 28, rainMin: 200, rainMax: 700, season: ['rabi'], desc: 'Important pulse crop. Fixes nitrogen in soil.' },
    { name: 'Watermelon', emoji: '🍉', soil: ['sandy', 'loamy'], tempMin: 24, tempMax: 40, rainMin: 250, rainMax: 600, season: ['zaid'], desc: 'Summer fruit. Needs warm weather and sandy soil.' },
    { name: 'Cucumber', emoji: '🥒', soil: ['loamy', 'sandy', 'alluvial'], tempMin: 18, tempMax: 35, rainMin: 300, rainMax: 800, season: ['zaid', 'kharif'], desc: 'Fast-growing vegetable. Sells well in markets.' },
];

function showCropResult(soil, temp, rain, season) {
    // Score each crop
    const scored = CROP_DB.map(crop => {
        let score = 0;
        if (crop.soil.includes(soil)) score += 40;
        if (crop.season.includes(season)) score += 30;
        if (temp >= crop.tempMin && temp <= crop.tempMax) score += 15;
        if (rain >= crop.rainMin && rain <= crop.rainMax) score += 15;
        // Partial matches
        if (temp >= crop.tempMin - 3 && temp <= crop.tempMax + 3) score += 5;
        if (rain >= crop.rainMin * 0.7 && rain <= crop.rainMax * 1.3) score += 5;
        return { ...crop, score };
    })
    .filter(c => c.score > 30)
    .sort((a, b) => b.score - a.score)
    .slice(0, 5);

    const body = document.getElementById('resultBody');
    const title = document.getElementById('resultTitle');
    title.textContent = '🌾 Recommended Crops';

    const seasonName = { kharif: 'Kharif (Monsoon)', rabi: 'Rabi (Winter)', zaid: 'Zaid (Summer)' };
    const soilName = { alluvial: 'Alluvial', black: 'Black', red: 'Red', laterite: 'Laterite', sandy: 'Sandy', clay: 'Clay', loamy: 'Loamy' };

    if (scored.length === 0) {
        body.innerHTML = `
            <div class="result-hero result-danger">
                <div class="result-emoji">🤔</div>
                <div class="result-name">No Strong Match</div>
                <div class="result-confidence">Try adjusting your inputs</div>
            </div>
            <div class="result-card">
                <div class="result-card-header">
                    <span class="result-card-icon">💡</span> Suggestion
                </div>
                <div class="result-card-body">
                    The combination of ${soilName[soil]} soil, ${temp}°C, ${rain}mm rainfall in ${seasonName[season]} didn't match our database strongly. Try adjusting temperature or rainfall values.
                </div>
            </div>
            <button class="btn-large btn-secondary btn-full result-home-btn" onclick="navigateTo('screenCropForm')">
                🔄 Try Again
            </button>
        `;
        return;
    }

    body.innerHTML = `
        <div class="result-hero result-success">
            <div class="result-emoji">🎯</div>
            <div class="result-name">Top ${scored.length} Crops</div>
            <div class="result-confidence">
                📍 ${soilName[soil]} · ${temp}°C · ${rain}mm · ${seasonName[season]}
            </div>
        </div>

        ${scored.map((crop, i) => `
            <div class="crop-card ${i === 0 ? 'top-pick' : ''}">
                <div class="crop-rank">${i === 0 ? crop.emoji : i + 1}</div>
                <div class="crop-info">
                    <h3>${crop.emoji} ${crop.name}</h3>
                    <p>${crop.desc}</p>
                </div>
                <div class="crop-match">${crop.score}%</div>
            </div>
        `).join('')}

        <div class="result-card">
            <div class="result-card-header">
                <span class="result-card-icon">💡</span> Farming Tips
            </div>
            <div class="result-card-body">
                <ul>
                    <li>Start with ${scored[0].name} — highest match for your conditions</li>
                    <li>Test soil nutrients before planting for best results</li>
                    <li>Consider crop rotation to maintain soil health</li>
                    <li>Visit your local agriculture office for seeds</li>
                </ul>
            </div>
        </div>

        <button class="btn-large btn-primary btn-full result-home-btn" onclick="navigateTo('screenHome')">
            🏠 Back to Home
        </button>
    `;
}

// ================================================
//   OFFLINE INFO / FARM GUIDE
// ================================================

const INFO_CROPS = [
    { name: 'Rice', emoji: '🍚', desc: 'Staple cereal grain. Requires standing water (paddy). Best in alluvial soil, 20-37°C, monsoon season.' },
    { name: 'Wheat', emoji: '🌾', desc: 'Major food grain. Needs cool dry climate, 10-25°C, rabi season. Grows well in loamy/alluvial soil.' },
    { name: 'Maize', emoji: '🌽', desc: 'Versatile cereal. Grows in kharif/zaid. Tolerant crop, needs 18-35°C, moderate rainfall.' },
    { name: 'Cotton', emoji: '☁️', desc: 'Cash crop for fiber. Needs black soil, warm climate 21-40°C. Major kharif crop.' },
    { name: 'Sugarcane', emoji: '🎋', desc: 'Tropical cash crop. Needs hot humid climate, plenty of water, alluvial/loamy soil.' },
    { name: 'Groundnut', emoji: '🥜', desc: 'Oilseed crop. Sandy/loamy soil, 20-35°C. Enriches soil with nitrogen fixation.' },
    { name: 'Tomato', emoji: '🍅', desc: 'Popular vegetable. Grows year-round in mild climate. Loamy soil, 18-32°C.' },
    { name: 'Potato', emoji: '🥔', desc: 'Cool weather root vegetable. Rabi crop. Sandy loam soil, 15-25°C ideal.' },
    { name: 'Millet', emoji: '🌿', desc: 'Drought-resistant grain. Grows in poor/sandy soil, hot climate. Nutritious superfood.' },
    { name: 'Soybean', emoji: '🫘', desc: 'Protein-rich oilseed. Black/loamy soil, kharif season. Improves soil fertility.' },
];

const INFO_DISEASES = [
    { name: 'Leaf Blight', emoji: '🍂', desc: 'Fungal disease (Alternaria). Brown spots with yellow halos. Treat with Mancozeb (2g/L). Avoid overhead watering. Common in rice, wheat, potato.' },
    { name: 'Powdery Mildew', emoji: '🤍', desc: 'White powdery fungus coating on leaves. Use neem oil (5ml/L) or sulfur spray. Improve air circulation. Affects cucurbits, peas, wheat.' },
    { name: 'Downy Mildew', emoji: '💧', desc: 'Yellow-green patches on upper leaves with gray fuzzy growth below. Apply Metalaxyl. Ensure drainage. Common in grape, cucurbits, bajra.' },
    { name: 'Rust', emoji: '🟤', desc: 'Orange-brown powdery pustules on leaf undersides. Fungal (Puccinia). Apply Propiconazole (1ml/L). Common in wheat, pulses, coffee.' },
    { name: 'Root Rot', emoji: '🪱', desc: 'Caused by waterlogging (Pythium, Phytophthora). Roots turn brown/black. Improve drainage, apply Trichoderma. Affects all crops in heavy soil.' },
    { name: 'Leaf Curl Virus', emoji: '🌀', desc: 'Viral disease spread by whiteflies. Leaves curl upward, thicken. Use yellow sticky traps and Imidacloprid. Affects tomato, chilli, cotton.' },
    { name: 'Bacterial Wilt', emoji: '😵', desc: 'Sudden wilting without yellowing (Ralstonia). No chemical cure. Remove plants, solarize soil. Affects tomato, potato, brinjal, ginger.' },
    { name: 'Mosaic Virus', emoji: '🟩', desc: 'Yellow-green mottled pattern on leaves. Viral — no cure. Control aphid vectors, use virus-free seeds. Affects tobacco, tomato, papaya.' },
    { name: 'Stem Borer', emoji: '🐛', desc: 'Larvae bore into stems causing dead hearts and white ears. Use pheromone traps and Trichogramma. Major pest of rice, sugarcane, maize.' },
    { name: 'Aphid Attack', emoji: '🐜', desc: 'Tiny sap-sucking insects on shoots and leaf undersides. Cause curling, transmit viruses. Spray neem oil or release ladybugs. All crops.' },
    { name: 'Anthracnose', emoji: '⚫', desc: 'Dark sunken spots on fruits and leaves (Colletotrichum). Spray Carbendazim (1g/L). Dip fruits in hot water. Affects mango, chilli, banana.' },
    { name: 'Fusarium Wilt', emoji: '🥀', desc: 'Yellowing and wilting from base upward. Vascular browning visible in cut stems. No spray cure — use resistant varieties. Affects banana, tomato, cotton.' },
    { name: 'Late Blight', emoji: '🌑', desc: 'Water-soaked lesions turning dark brown, white mold underneath (Phytophthora). Highly destructive. Spray Mancozeb + Metalaxyl. Potato, tomato.' },
    { name: 'Early Blight', emoji: '🔵', desc: 'Target-like concentric rings on older leaves (Alternaria solani). Spray Chlorothalonil. Remove lower infected leaves. Common in tomato, potato.' },
    { name: 'Bacterial Leaf Spot', emoji: '🔴', desc: 'Small water-soaked spots turning brown with yellow halo. Spray Streptocycline (1g/10L) + Copper. Avoid overhead irrigation. Pepper, tomato, lettuce.' },
    { name: 'Whitefly Damage', emoji: '🦟', desc: 'Tiny white flying insects under leaves. Suck sap, excrete honeydew causing sooty mold. Transmit viruses. Use yellow traps, neem oil. Cotton, tomato.' },
    { name: 'Fruit Borer', emoji: '🐞', desc: 'Larvae bore into fruits leaving holes and frass. Use Bacillus thuringiensis (Bt) spray, pheromone traps. Havoc in tomato (Helicoverpa), brinjal, okra.' },
    { name: 'Cercospora Leaf Spot', emoji: '🟠', desc: 'Circular gray spots with dark borders on leaves. Spray Carbendazim or Mancozeb. Remove debris. Common in groundnut, soybean, rice, beetroot.' },
    { name: 'Damping Off', emoji: '🌱', desc: 'Seedlings rot at soil line and collapse. Caused by Pythium in wet nurseries. Treat seeds with Thiram; avoid overwatering. All vegetable seedlings.' },
    { name: 'Smut Disease', emoji: '🖤', desc: 'Black powdery masses replace grains/flowers (Ustilago). Seed treatment with Carboxin. Use certified clean seeds. Affects wheat, bajra, sugarcane.' },
];

function renderInfoCards() {
    const container = document.getElementById('infoCards');
    const data = AppState.activeTab === 'crops' ? INFO_CROPS : INFO_DISEASES;
    const bgClass = AppState.activeTab === 'crops' ? 'crop-bg' : 'disease-bg';

    container.innerHTML = data.map(item => `
        <div class="info-card" onclick="showInfoDetail('${item.name}', '${item.emoji}', \`${item.desc}\`, '${AppState.activeTab}')">
            <div class="info-card-emoji ${bgClass}">${item.emoji}</div>
            <div class="info-card-text">
                <h3>${item.name}</h3>
                <p>${item.desc}</p>
            </div>
        </div>
    `).join('');
}

function switchTab(tab) {
    AppState.activeTab = tab;
    document.getElementById('tabCrops').classList.toggle('active', tab === 'crops');
    document.getElementById('tabDiseases').classList.toggle('active', tab === 'diseases');
    renderInfoCards();
}

function filterInfoCards(query) {
    const clearBtn = document.getElementById('searchClear');
    clearBtn.classList.toggle('hidden', !query);

    const cards = document.querySelectorAll('.info-card');
    const q = query.toLowerCase().trim();
    cards.forEach(card => {
        const text = card.textContent.toLowerCase();
        card.style.display = text.includes(q) ? '' : 'none';
    });
}

function clearSearch() {
    const input = document.getElementById('searchInput');
    input.value = '';
    filterInfoCards('');
    input.focus();
}

function showInfoDetail(name, emoji, desc, type) {
    AppState.resultSource = 'info';
    const body = document.getElementById('resultBody');
    const title = document.getElementById('resultTitle');
    title.textContent = type === 'crops' ? '🌾 Crop Info' : '🦠 Disease Info';

    const heroClass = type === 'crops' ? 'result-success' : 'result-danger';
    const icon = type === 'crops' ? '✅' : '⚠️';

    body.innerHTML = `
        <div class="result-hero ${heroClass}">
            <div class="result-emoji">${emoji}</div>
            <div class="result-name">${name}</div>
            <div class="result-confidence">${icon} ${type === 'crops' ? 'Crop Information' : 'Disease Information'}</div>
        </div>

        <div class="result-card">
            <div class="result-card-header">
                <span class="result-card-icon">📖</span> Details
            </div>
            <div class="result-card-body">
                ${desc}
            </div>
        </div>

        <button class="btn-large btn-secondary btn-full result-home-btn" onclick="navigateTo('screenOfflineInfo')">
            ← Back to Farm Guide
        </button>
    `;

    navigateTo('screenResult');
}

// ================================================
//   VOICE INPUT (Web Speech API)
// ================================================

let recognition = null;

function startVoiceInput() {
    const modal = document.getElementById('voiceModal');
    const statusEl = document.getElementById('voiceStatus');
    const textEl = document.getElementById('voiceText');

    modal.classList.remove('hidden');
    statusEl.textContent = 'Listening...';
    textEl.textContent = '';

    if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
        statusEl.textContent = 'Voice not supported';
        textEl.textContent = 'Your browser doesn\'t support voice input. Try Chrome.';
        setTimeout(() => modal.classList.add('hidden'), 2500);
        return;
    }

    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    recognition = new SpeechRecognition();
    recognition.lang = 'en-IN';
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onresult = function (event) {
        const transcript = Array.from(event.results)
            .map(r => r[0].transcript)
            .join('');
        textEl.textContent = `"${transcript}"`;

        if (event.results[0].isFinal) {
            statusEl.textContent = '✅ Got it!';
            setTimeout(() => {
                modal.classList.add('hidden');
                handleVoiceCommand(transcript.toLowerCase());
            }, 800);
        }
    };

    recognition.onerror = function (event) {
        statusEl.textContent = 'Could not hear you';
        textEl.textContent = 'Tap to try again.';
        setTimeout(() => modal.classList.add('hidden'), 2000);
    };

    recognition.onend = function () {
        if (!textEl.textContent) {
            statusEl.textContent = 'No speech detected';
            setTimeout(() => modal.classList.add('hidden'), 1500);
        }
    };

    recognition.start();
}

function stopVoice() {
    if (recognition) {
        recognition.stop();
        recognition = null;
    }
    document.getElementById('voiceModal').classList.add('hidden');
}

function handleVoiceCommand(text) {
    if (text.includes('disease') || text.includes('scan') || text.includes('detect') || text.includes('photo')) {
        navigateTo('screenDiseaseDetect');
    } else if (text.includes('crop') || text.includes('suggest') || text.includes('plant') || text.includes('grow')) {
        navigateTo('screenCropForm');
    } else if (text.includes('guide') || text.includes('info') || text.includes('help') || text.includes('learn')) {
        navigateTo('screenOfflineInfo');
    } else {
        navigateTo('screenOfflineInfo');
    }
}

// ================================================
//   UTILITIES
// ================================================

function showLoading(text) {
    const overlay = document.getElementById('loadingOverlay');
    const loadText = document.getElementById('loadingText');
    loadText.textContent = text || 'Processing...';
    overlay.classList.remove('hidden');
}

function hideLoading() {
    document.getElementById('loadingOverlay').classList.add('hidden');
}

function shakeElement(id) {
    const el = document.getElementById(id);
    if (!el) return;
    el.style.borderColor = '#D32F2F';
    el.style.animation = 'shake 0.4s ease';
    el.focus();
    setTimeout(() => {
        el.style.borderColor = '';
        el.style.animation = '';
    }, 600);
}

// Shake animation (injected via JS for simplicity)
const shakeStyle = document.createElement('style');
shakeStyle.textContent = `
    @keyframes shake {
        0%, 100% { transform: translateX(0); }
        20% { transform: translateX(-8px); }
        40% { transform: translateX(8px); }
        60% { transform: translateX(-6px); }
        80% { transform: translateX(6px); }
    }
`;
document.head.appendChild(shakeStyle);

// ---- Keyboard handling for inputs ----
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        hideLoading();
        stopVoice();
    }
});

// ---- Initialize ----
console.log('🌱 Agri AI Assistant loaded');

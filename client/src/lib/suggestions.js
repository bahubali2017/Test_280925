/**
 * Dynamic Medical Question Suggestions
 * Provides varied, contextual medical questions with smart randomization
 */

// Large pool of starter questions organized by category
const STARTER_QUESTIONS = {
  symptoms: [
    "What are symptoms of the flu?",
    "How do I know if I have food poisoning?",
    "What causes chest pain?",
    "When should I worry about a headache?",
    "What are signs of dehydration?",
    "How can I tell if I have an infection?",
    "What are symptoms of anxiety?",
    "How do I know if a cut needs stitches?",
    "What causes dizziness?",
    "When is a fever dangerous?",
    "What are early signs of diabetes?",
    "How can I tell if I'm having an allergic reaction?",
    "What causes stomach pain?",
    "When should I see a doctor for back pain?",
    "What are symptoms of high blood pressure?",
    "How do I know if I have a concussion?",
    "What causes shortness of breath?",
    "When is a cough serious?",
    "What are signs of a heart attack?",
    "How can I tell if I have strep throat?"
  ],
  
  conditions: [
    "What causes migraines?",
    "How is arthritis treated?",
    "What is acid reflux?",
    "How do you prevent kidney stones?",
    "What causes high cholesterol?",
    "How is pneumonia diagnosed?",
    "What are different types of diabetes?",
    "How do you treat a sprained ankle?",
    "What causes sleep apnea?",
    "How is depression managed?",
    "What triggers asthma attacks?",
    "How do you prevent UTIs?",
    "What causes thyroid problems?",
    "How is eczema treated?",
    "What are symptoms of anemia?",
    "How do you manage chronic pain?",
    "What causes vertigo?",
    "How is IBS diagnosed?",
    "What triggers panic attacks?",
    "How do you treat osteoporosis?"
  ],
  
  prevention: [
    "How can I reduce stress?",
    "What foods boost immunity?",
    "How much exercise do I need?",
    "How can I improve my sleep?",
    "What vitamins should I take?",
    "How do I prevent heart disease?",
    "What's a healthy diet plan?",
    "How can I quit smoking?",
    "How do I prevent osteoporosis?",
    "What's good for brain health?",
    "How can I lower my blood pressure?",
    "How do I maintain healthy weight?",
    "What prevents cancer?",
    "How can I improve digestion?",
    "How do I strengthen my immune system?",
    "What's good for eye health?",
    "How can I prevent infections?",
    "How do I manage stress eating?",
    "What prevents blood clots?",
    "How can I improve circulation?"
  ],
  
  checkups: [
    "Is my blood pressure normal?",
    "When do I need a colonoscopy?",
    "How often should I get blood work?",
    "When should I see a dermatologist?",
    "How often do I need an eye exam?",
    "When should I get a mammogram?",
    "How often should I see a dentist?",
    "When do I need a physical exam?",
    "How often should I check cholesterol?",
    "When should I get vaccinated?",
    "How often do I need a pap smear?",
    "When should I see a cardiologist?",
    "How often should I check blood sugar?",
    "When do I need a prostate exam?",
    "How often should I weigh myself?",
    "When should I get a bone density test?",
    "How often do I need STD testing?",
    "When should I see a specialist?",
    "How often should I check my moles?",
    "When do I need allergy testing?"
  ]
};

// Context-aware follow-up questions based on topic analysis
const CONTEXTUAL_FOLLOWUPS = {
  // Pain-related topics
  pain: [
    "What can I do for pain relief?",
    "When should pain worry me?",
    "Are there natural pain remedies?",
    "How long should this pain last?",
    "What makes this type of pain worse?",
    "Should I use heat or ice for this?",
    "What medications help with this pain?",
    "When do I need urgent care for pain?"
  ],
  
  // Digestive issues
  digestive: [
    "What foods should I avoid?",
    "How can I improve my digestion?",
    "What are probiotics good for?",
    "When should I see a gastroenterologist?",
    "Are there home remedies for this?",
    "What tests might I need?",
    "How does stress affect digestion?",
    "What's a bland diet?"
  ],
  
  // Mental health
  mental: [
    "How can I manage anxiety naturally?",
    "When should I seek professional help?",
    "What are coping strategies for stress?",
    "How does exercise affect mood?",
    "What are signs I need therapy?",
    "How can I improve my sleep?",
    "What relaxation techniques work?",
    "How do I find a therapist?"
  ],
  
  // Heart and circulation
  cardiovascular: [
    "How can I improve heart health?",
    "What exercises are good for my heart?",
    "How does diet affect heart disease?",
    "What are signs of heart problems?",
    "How often should I check blood pressure?",
    "What foods lower cholesterol?",
    "When should I see a cardiologist?",
    "How does stress affect the heart?"
  ],
  
  // Respiratory issues
  respiratory: [
    "How can I improve my breathing?",
    "What triggers breathing problems?",
    "When is shortness of breath serious?",
    "How do I prevent respiratory infections?",
    "What helps with congestion?",
    "When should I use an inhaler?",
    "How does air quality affect breathing?",
    "What are breathing exercises?"
  ],
  
  // Skin conditions
  skin: [
    "How can I improve my skin health?",
    "What causes skin irritation?",
    "When should I see a dermatologist?",
    "How do I protect my skin from sun?",
    "What are signs of skin cancer?",
    "How can I treat dry skin?",
    "What causes acne in adults?",
    "How do I care for sensitive skin?"
  ],
  
  // Women's health
  womens: [
    "What's normal for menstrual cycles?",
    "How can I manage menopause symptoms?",
    "When should I see a gynecologist?",
    "What are signs of hormonal imbalance?",
    "How can I improve fertility?",
    "What's important during pregnancy?",
    "How do I prevent UTIs?",
    "What are breast health tips?"
  ],
  
  // Men's health
  mens: [
    "What are prostate health tips?",
    "How can I improve testosterone naturally?",
    "When should I see a urologist?",
    "What causes erectile dysfunction?",
    "How can I prevent hair loss?",
    "What are signs of low testosterone?",
    "How do I maintain muscle mass?",
    "What's important for men's mental health?"
  ],
  
  // Infections
  infection: [
    "How can I prevent infections?",
    "What are signs of serious infection?",
    "When do I need antibiotics?",
    "How can I boost my immune system?",
    "What's the difference between viral and bacterial?",
    "How do I prevent spreading illness?",
    "When should I stay home from work?",
    "What are natural immune boosters?"
  ],
  
  // Emergency situations
  emergency: [
    "When should I call 911?",
    "What are signs of a medical emergency?",
    "When should I go to the ER?",
    "What's the difference between urgent care and ER?",
    "How do I know if it's serious?",
    "What should I do while waiting for help?",
    "When should I call poison control?",
    "What are signs of a stroke?"
  ],
  
  // Addiction and habit cessation
  addiction: [
    "What are nicotine replacement options?",
    "How do I deal with withdrawal symptoms?",
    "What medications can help with quitting?",
    "How can I avoid smoking triggers?",
    "What are healthy alternatives to smoking?",
    "How long do cravings typically last?",
    "What support groups are available?",
    "How can I prevent weight gain when quitting?"
  ],
  
  // Neurological conditions
  neurological: [
    "What triggers might I need to avoid?",
    "How can I track my symptoms?",
    "What lifestyle changes might help?",
    "When should I see a neurologist?",
    "Are there any warning signs to watch for?",
    "How can I manage symptoms at home?",
    "What tests might be needed?",
    "How does stress affect this condition?"
  ],
  
  // Diabetes and endocrine
  endocrine: [
    "How often should I check my levels?",
    "What foods should I avoid or include?",
    "How does exercise affect this condition?",
    "What are signs of complications?",
    "How can I monitor this at home?",
    "When should I contact my doctor?",
    "What medications are typically used?",
    "How does this affect other health conditions?"
  ],
  
  // Bone and joint health
  musculoskeletal: [
    "What exercises can help strengthen this area?",
    "How can I prevent further injury?",
    "What's the difference between rest and activity?",
    "When should I use heat vs ice?",
    "What physical therapy options exist?",
    "How long does recovery typically take?",
    "What movements should I avoid?",
    "Are there any long-term complications?"
  ],
  
  // Vision and eye health
  vision: [
    "How often should I get eye exams?",
    "What can I do to protect my vision?",
    "Are there exercises for eye health?",
    "When should I see an eye specialist?",
    "What are early warning signs to watch for?",
    "How does screen time affect my eyes?",
    "What nutritional factors support eye health?",
    "Are there any lifestyle changes I should make?"
  ],
  
  // Hearing and ear health
  hearing: [
    "How can I protect my hearing?",
    "When should I see an audiologist?",
    "What causes hearing loss?",
    "Are there hearing aids that might help?",
    "How can I clean my ears safely?",
    "What are signs of ear infection?",
    "How does age affect hearing?",
    "What lifestyle factors impact hearing?"
  ],
  
  // Kidney and urinary health
  urinary: [
    "How much water should I drink daily?",
    "What foods support kidney health?",
    "How can I prevent kidney stones?",
    "When should I see a urologist?",
    "What are signs of kidney problems?",
    "How often should I get kidney function tested?",
    "What medications can affect kidney function?",
    "How does diet impact kidney health?"
  ],
  
  // Blood and hematology
  hematology: [
    "What foods can help with this condition?",
    "How often should I get blood tests?",
    "What are signs I should watch for?",
    "When should I see a hematologist?",
    "How does this affect my daily activities?",
    "What supplements might be recommended?",
    "Are there any dietary restrictions?",
    "How can I prevent complications?"
  ],
  
  // Cancer and oncology
  oncology: [
    "What foods help prevent cancer?",
    "How does exercise affect cancer risk?",
    "What screening tests are recommended?",
    "How can I reduce my risk factors?",
    "What are early warning signs to watch for?",
    "How does family history affect my risk?",
    "What lifestyle changes make the biggest difference?",
    "Should I consider genetic testing?"
  ],
  
  // Allergies and immunology
  allergy: [
    "How can I identify my triggers?",
    "What allergy testing options exist?",
    "How can I allergy-proof my environment?",
    "When should I use an EpiPen?",
    "What medications can help manage allergies?",
    "How do I read food labels for allergens?",
    "When should I see an allergist?",
    "Are there natural remedies that help?"
  ]
};

// Default general follow-ups
const DEFAULT_FOLLOWUPS = [
  "What symptoms should I watch for?",
  "Are there any home remedies?",
  "When should I see a doctor?",
  "How can I prevent this?",
  "What tests might I need?",
  "How long does this typically last?",
  "What lifestyle changes can help?",
  "Are there any warning signs?",
  "How is this condition diagnosed?",
  "What treatment options are available?",
  "How can I manage this naturally?",
  "What complications should I know about?",
  "How does this affect daily life?",
  "What questions should I ask my doctor?",
  "Are there support groups for this?",
  "How can family members help?"
];

/**
 * Get random starter questions for the welcome screen
 * @param {number} count - Number of questions to return (default: 4)
 * @returns {string[]} Array of starter questions
 */
export function getRandomStarterQuestions(count = 4) {
  const allCategories = Object.values(STARTER_QUESTIONS);
  const allQuestions = allCategories.flat();
  
  // Shuffle and select random questions
  const shuffled = [...allQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}

/**
 * Analyze question content to determine context
 * @param {string} question - The user's question
 * @returns {string|null} Context category or null
 */
function analyzeQuestionContext(question) {
  const lowerQuestion = question.toLowerCase();
  
  // Neurological keywords (headaches, migraines, brain-related)
  if (/headache|migraine|brain|neurolog|seizure|stroke|dementia|alzheimer|parkinson|concussion|dizz/.test(lowerQuestion)) {
    return 'neurological';
  }
  
  // Diabetes and endocrine keywords
  if (/diabetes|diabetic|blood sugar|glucose|insulin|thyroid|hormone|endocrine|metabolism/.test(lowerQuestion)) {
    return 'endocrine';
  }
  
  // Bone and joint keywords
  if (/bone|joint|arthritis|osteoporosis|fracture|sprain|muscle|back|neck|shoulder|knee|hip/.test(lowerQuestion)) {
    return 'musculoskeletal';
  }
  
  // Eye and vision keywords
  if (/eye|vision|sight|blind|cataract|glaucoma|retina|visual|ophthalmol/.test(lowerQuestion)) {
    return 'vision';
  }
  
  // Ear and hearing keywords
  if (/ear|hearing|deaf|tinnitus|vertigo|balance|audio/.test(lowerQuestion)) {
    return 'hearing';
  }
  
  // Kidney and urinary keywords
  if (/kidney|urine|urinary|bladder|nephrol|dialysis|stone/.test(lowerQuestion)) {
    return 'urinary';
  }
  
  // Blood and hematology keywords
  if (/blood|anemia|clot|bleeding|hemoglobin|platelet|hematol|transfusion/.test(lowerQuestion)) {
    return 'hematology';
  }
  
  // Cancer keywords (check for prevention questions too)
  if (/cancer|tumor|oncolog|chemotherapy|radiation|malignant|benign|biopsy|metastasis|prevent.*cancer|cancer.*prevent/.test(lowerQuestion)) {
    return 'oncology';
  }
  
  // Respiratory keywords (check before addiction to catch pneumonia, lung issues first)
  if (/breath|lung|cough|wheez|asthma|pneumonia|respiratory|congestion|pulmonary/.test(lowerQuestion)) {
    return 'respiratory';
  }
  
  // Heart keywords
  if (/heart|chest|blood pressure|cholesterol|cardiovascular|circulation|pulse|cardiac|coronary/.test(lowerQuestion)) {
    return 'cardiovascular';
  }
  
  // Allergy and immunology keywords
  if (/allergy|allergic|asthma|immune|autoimmune|reaction|histamine|pollen/.test(lowerQuestion)) {
    return 'allergy';
  }
  
  // Addiction/habits keywords
  if (/quit|smoking|smoke|cigarette|tobacco|nicotine|addiction|habit|stop.*smoking|cessation|alcohol|drug/.test(lowerQuestion)) {
    return 'addiction';
  }
  
  // Pain keywords
  if (/pain|hurt|ache|sore|tender|throb|sharp|dull|burning|chronic pain/.test(lowerQuestion)) {
    return 'pain';
  }
  
  // Digestive keywords
  if (/stomach|digest|nausea|vomit|diarrhea|constipat|bowel|gut|acid|heartburn|liver|gallbladder/.test(lowerQuestion)) {
    return 'digestive';
  }
  
  // Mental health keywords
  if (/stress|anxiety|depress|mood|panic|worry|mental|emotional|sleep|insomnia|therapy|psychiatric/.test(lowerQuestion)) {
    return 'mental';
  }
  
  // Skin keywords
  if (/skin|rash|itch|acne|eczema|psoriasis|mole|sunburn|dermat|wound|cut/.test(lowerQuestion)) {
    return 'skin';
  }
  
  // Women's health keywords
  if (/menstrual|period|pregnancy|menopause|gynecol|ovarian|uterine|breast|pap smear/.test(lowerQuestion)) {
    return 'womens';
  }
  
  // Men's health keywords
  if (/prostate|testosterone|erectile|urolog|male health/.test(lowerQuestion)) {
    return 'mens';
  }
  
  // Infection keywords
  if (/infection|virus|bacteria|fever|immune|antibiotic|contagious|flu|cold/.test(lowerQuestion)) {
    return 'infection';
  }
  
  // Emergency keywords
  if (/emergency|urgent|911|ER|serious|critical|severe|immediate|ambulance/.test(lowerQuestion)) {
    return 'emergency';
  }
  
  return null;
}

/**
 * Get contextual follow-up suggestions based on the user's question and conversation history
 * @param {string} userQuestion - The user's original question
 * @param {Array} conversationHistory - Previous messages for context
 * @param {number} count - Number of suggestions to return (default: 4)
 * @returns {string[]} Array of follow-up suggestions
 */
/**
 * Extract key medical terms and concepts from user question
 * @param {string} question - The user's question
 * @returns {object} Object with extracted terms and question type
 */
function extractQuestionContext(question) {
  const lowerQuestion = question.toLowerCase();
  
  // Extract specific medical terms
  const medicalTerms = [];
  const symptoms = [];
  const bodyParts = [];
  
  // Medical conditions
  const conditionMatches = lowerQuestion.match(/\b(diabetes|cancer|pneumonia|migraine|arthritis|asthma|hypertension|depression|anxiety|stitches|cut|wound|bleeding)\b/g);
  if (conditionMatches) medicalTerms.push(...conditionMatches);
  
  // Body parts
  const bodyPartMatches = lowerQuestion.match(/\b(heart|lung|brain|kidney|liver|stomach|skin|eye|ear|back|knee|shoulder|head|chest|throat|hand|foot)\b/g);
  if (bodyPartMatches) bodyParts.push(...bodyPartMatches);
  
  // Symptoms
  const symptomMatches = lowerQuestion.match(/\b(pain|ache|fever|nausea|headache|dizziness|fatigue|cough|rash|bleeding|swelling)\b/g);
  if (symptomMatches) symptoms.push(...symptomMatches);
  
  // Question intent
  let intent = 'general';
  if (/prevent|prevention|avoid|reduce risk/.test(lowerQuestion)) intent = 'prevention';
  else if (/treatment|treat|cure|heal|fix|help/.test(lowerQuestion)) intent = 'treatment';
  else if (/symptom|sign|warning|indication|know if/.test(lowerQuestion)) intent = 'symptoms';
  else if (/cause|reason|why|what causes/.test(lowerQuestion)) intent = 'causes';
  else if (/test|exam|screening|diagnosis/.test(lowerQuestion)) intent = 'diagnosis';
  
  return { medicalTerms, symptoms, bodyParts, intent };
}

/**
 * Generate intelligent follow-up questions based on specific question analysis
 * @param {string} userQuestion - The user's original question
 * @param {string} context - Medical context category
 * @returns {string[]} Array of tailored follow-up suggestions
 */
function generateIntelligentFollowups(userQuestion, context) {
  const { medicalTerms, symptoms, bodyParts, intent } = extractQuestionContext(userQuestion);
  const suggestions = [];
  
  // Create specific follow-ups based on the question content
  if (medicalTerms.length > 0) {
    const condition = medicalTerms[0];
    if (intent === 'prevention') {
      suggestions.push(`What lifestyle changes help prevent ${condition}?`);
      suggestions.push(`Are there early screening tests for ${condition}?`);
    } else if (intent === 'treatment') {
      suggestions.push(`What are the latest treatments for ${condition}?`);
      suggestions.push(`How long does ${condition} treatment typically take?`);
    } else if (intent === 'symptoms') {
      suggestions.push(`What are the early signs of ${condition}?`);
      suggestions.push(`When should I seek immediate care for ${condition}?`);
    } else {
      suggestions.push(`What are the risk factors for ${condition}?`);
      suggestions.push(`How is ${condition} typically diagnosed?`);
    }
  }
  
  if (symptoms.length > 0 && !medicalTerms.includes(symptoms[0])) {
    const symptom = symptoms[0];
    suggestions.push(`When should I see a doctor for ${symptom}?`);
    suggestions.push(`What can cause persistent ${symptom}?`);
    suggestions.push(`Are there home remedies for ${symptom}?`);
  }
  
  if (bodyParts.length > 0) {
    const bodyPart = bodyParts[0];
    suggestions.push(`How can I keep my ${bodyPart} healthy?`);
    suggestions.push(`What are signs of ${bodyPart} problems?`);
  }
  
  // Add intent-specific questions
  if (intent === 'prevention') {
    suggestions.push("What dietary changes would help?");
    suggestions.push("How does exercise affect this condition?");
  } else if (intent === 'treatment') {
    suggestions.push("What are the side effects of treatment?");
    suggestions.push("Are there alternative treatment options?");
  } else if (intent === 'symptoms') {
    suggestions.push("What are the early warning signs?");
    suggestions.push("How can I monitor symptoms at home?");
  }
  
  return [...new Set(suggestions)].slice(0, 4); // Remove duplicates and limit to 4
}

/**
 *
 * @param userQuestion
 * @param conversationHistory
 * @param count
 */
export function getContextualFollowups(userQuestion, conversationHistory = [], count = 4) {
  // Generate intelligent, specific follow-ups first
  const context = analyzeQuestionContext(userQuestion);
  const intelligentSuggestions = generateIntelligentFollowups(userQuestion, context);
  
  if (intelligentSuggestions.length >= count) {
    return intelligentSuggestions.slice(0, count);
  }
  
  // Fill remaining slots with context-appropriate questions
  const remaining = count - intelligentSuggestions.length;
  if (context && CONTEXTUAL_FOLLOWUPS[context] && remaining > 0) {
    const contextQuestions = CONTEXTUAL_FOLLOWUPS[context];
    // Filter out questions that are too similar to what we already have
    const filtered = contextQuestions.filter(q => 
      !intelligentSuggestions.some(existing => 
        existing.toLowerCase().includes(q.toLowerCase().split(' ')[2]) ||
        q.toLowerCase().includes(existing.toLowerCase().split(' ')[2])
      )
    );
    const shuffled = [...filtered].sort(() => 0.5 - Math.random());
    return [...intelligentSuggestions, ...shuffled.slice(0, remaining)];
  }
  
  // Final fallback to default general follow-ups
  if (intelligentSuggestions.length < count) {
    const remaining = count - intelligentSuggestions.length;
    const shuffled = [...DEFAULT_FOLLOWUPS].sort(() => 0.5 - Math.random());
    return [...intelligentSuggestions, ...shuffled.slice(0, remaining)];
  }
  
  return intelligentSuggestions;
}

/**
 * Get professional follow-up suggestions for healthcare providers
 * @param {number} count - Number of suggestions to return (default: 4)
 * @returns {string[]} Array of professional follow-up suggestions
 */
export function getProfessionalFollowups(count = 4) {
  const professionalQuestions = [
    "What are the diagnostic criteria?",
    "Are there any recent treatment guideline updates?",
    "What's the typical prognosis?",
    "Are there any significant drug interactions?",
    "What are the differential diagnoses?",
    "What's the standard of care protocol?",
    "Are there any contraindications?",
    "What monitoring is required?",
    "What are the risk factors?",
    "How do you rule out complications?",
    "What's the evidence base for treatment?",
    "Are there any specialty referral criteria?"
  ];
  
  const shuffled = [...professionalQuestions].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
}
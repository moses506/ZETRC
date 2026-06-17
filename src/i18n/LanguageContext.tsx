import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export type LanguageCode = 'en' | 'ny' | 'bem' | 'toi';

type TranslationValue = string | string[];
type TranslationMap = Record<string, TranslationValue>;

const languageStorageKey = 'zetrcLanguage';

export const languages: { code: LanguageCode; label: string; shortLabel: string }[] = [
  { code: 'en', label: 'English', shortLabel: 'EN' },
  { code: 'ny', label: 'Nyanja', shortLabel: 'NY' },
  { code: 'bem', label: 'Bemba', shortLabel: 'BEM' },
  { code: 'toi', label: 'Tonga', shortLabel: 'TON' },
];

const en: TranslationMap = {
  language: 'Language',
  brandSub: 'Training + Research',
  navHome: 'Home',
  navServices: 'Services',
  navTraining: 'Training',
  navAcademy: 'Academy',
  navAbout: 'About',
  navContact: 'Contact',
  joinPilot: 'Join Pilot',
  requestProposal: 'Request Proposal',
  footerTagline:
    'Turning agricultural and environmental knowledge into real-world impact through practical training, advisory, and research-driven action.',
  footerExplore: 'Explore',
  footerPilotTraining: 'Pilot Training',
  footerReady: 'Ready to partner?',
  footerReadySub: 'For organizations and development partners seeking practical impact.',
  footerWhatsApp: 'WhatsApp',
  hero1Tag: 'Lesson Sessions',
  hero1Headline: 'Turning Agricultural Knowledge Into',
  hero1Accent: 'Real-World Impact',
  hero1Sub:
    'ZETRC helps farmers, NGOs, and institutions implement climate-resilient agriculture that improves productivity and income across Zambia.',
  hero2Tag: 'Farmer Empowerment',
  hero2Headline: 'Equipping Smallholders With',
  hero2Accent: 'Skills That Last',
  hero2Sub:
    'Our hands-on training programs reach farmers in 6 provinces, building capacity that outlasts any single project or funding cycle.',
  hero3Tag: 'Field Learning',
  hero3Headline: 'Adapting Agriculture For',
  hero3Accent: 'A Changing Climate',
  hero3Sub:
    'Evidence-based, locally rooted practices that help communities thrive in the face of drought, erratic rains, and soil degradation.',
  requestProposalArrow: 'Request a Proposal ->',
  joinPilotTraining: 'Join Pilot Training',
  farmersTrained: 'Farmers trained',
  provincesReached: 'Provinces reached',
  partnerOrgs: 'Partner orgs',
  whatWeOffer: 'What we offer',
  servicesTitle: 'Built for Farmers and Partners Who Drive Change',
  servicesSubtitle:
    "Training programs, digital learning, and implementation support tailored to Zambia's agricultural landscape.",
  whoThisIsFor: 'Who This Is For',
  audienceList: [
    'Small-scale farmers',
    'Youth in agriculture',
    'Cooperatives & farmer groups',
    'NGOs & development organizations',
    'Government institutions',
  ],
  academyDesc:
    'A digital learning platform with structured modules, certifications, and mobile-first access designed for rural communities.',
  academyPills: ['Self-paced', 'Certified', 'Mobile-first'],
  getEarlyAccess: 'Get Early Access ->',
  workWithUs: 'Work With Us',
  workWithUsDesc:
    "Need implementation support, training delivery, or environmental advisory? Let's build something together.",
  whatsappUs: 'WhatsApp Us',
  whyZetrc: 'Why ZETRC',
  localContext: 'Grounded in Local Context',
  whyDesc:
    "We don't import generic solutions. Our methodologies are designed with and for Zambian farmers - practical, tested, and sustainable.",
  whyItems: [
    'Locally Rooted|Approaches built for Zambia agroecological zones and farming realities.',
    'Evidence-Based|Programs grounded in research and field-tested results across 6 provinces.',
    'Climate-Resilient|Solutions that help farmers adapt to and thrive in a changing climate.',
    'Partnership-Driven|We work alongside communities, NGOs, and government - not above them.',
  ],
  getInTouch: 'Get in touch',
  workWithZetrc: 'Work With ZETRC',
  contactDesc:
    'We partner with farmers, NGOs, private companies, and government institutions through training, consultancy, and climate advisory support.',
  email: 'Email',
  phone: 'Phone',
  messageUs: 'Message us directly',
  contactWhatsapp: 'Contact us on WhatsApp ->',
  orgFullName: 'Organization / Full Name',
  emailAddress: 'Email Address',
  phoneNumber: 'Phone Number',
  projectNeeds: 'Tell us about your project needs...',
  sendInquiry: 'Send Inquiry ->',
  trainingJourney: 'Training Journey',
  trainingHeroTitle: 'A practical path into the ZETRC Academy',
  trainingHeroFallback:
    'This training page bridges the public website into registration, onboarding, and the academy dashboard without breaking the visual experience.',
  applyTraining: 'Apply for Training ->',
  alreadyHaveAccess: 'I already have access',
  liveLessons: 'Live lessons',
  modules: 'Modules',
  currentFocus: 'Current focus',
  programSnapshot: 'Program snapshot',
  pilotIntake: 'Pilot intake',
  snapshotFooter: 'Consistent with landing, registration, and dashboard screens',
  howItFlows: 'How it flows',
  journeyTitle: 'One clear journey from interest to active learning',
  trainingLoading: 'Loading lesson content from the training API...',
  journeyLead:
    'The page introduces the program, helps users self-identify, and channels them into either registration or sign-in with no abrupt handoff.',
  flowSteps: [
    'Explore the program|Review the training path, expected outcomes, and the support model before you enroll.',
    'Create your training profile|Register as a trainee, cooperative leader, NGO staff member, or institutional partner.',
    'Enter your learning dashboard|Access modules, assignments, certificates, and announcements in one place.',
  ],
  programStructure: 'Program structure',
  modulesPractical: 'Modules that feel practical and local',
  comingSoon: 'Training content coming soon',
  pending: 'Pending',
  noLessons: 'No live lesson content has been published yet.',
  whyItWorks: 'Why it works',
  deliveryConditions: 'Designed around real delivery conditions',
  trainingBenefits: [
    'Short lessons designed for field schedules and mobile access',
    'Assignments grounded in real farm observations and local conditions',
    'Support for individuals, cooperatives, NGOs, and partner-led cohorts',
    'Progress tracking that leads directly into the academy dashboard',
  ],
  readyForward: 'Ready to move forward?',
  readyForwardCopy:
    'Start with registration if you are new, or sign in if your cohort already has access.',
  registerNow: 'Register now',
  signIn: 'Sign in',
  lesson: 'Lesson',
  lessonsAvailable: 'lessons available now.',
  learningModules: 'learning modules in the system.',
  audioLinked: 'lesson audio files linked.',
  attachmentsAvailable: 'lesson attachments available.',
  backLanding: '<- Back to landing page',
  pilotTrainingAccess: 'Pilot Training Access',
  welcomeAcademy: 'Welcome back to the ZETRC Academy',
  loginCopy:
    'Sign in to continue your pilot training, track assignments, and access climate-smart agriculture resources built for real field work.',
  whyTrainees: 'Why trainees use this portal',
  liveCohort: 'Live cohort',
  fiveModules: '5 modules',
  structuredPathway: 'Structured pilot pathway',
  weeklyTasks: 'Weekly tasks',
  simpleTracking: 'Simple progress tracking',
  trustPoints: [
    'Mobile-friendly learning built for field access',
    'Certification-ready pilot modules and assignments',
    'Direct support for trainees, cooperatives, and partner teams',
  ],
  memberLogin: 'Member Login',
  continueJourney: 'Continue your learning journey',
  useAccess: 'Use your pilot access details to open your training dashboard.',
  password: 'Password',
  enterPassword: 'Enter your password',
  showPassword: 'Show password',
  keepSignedIn: 'Keep me signed in',
  needHelp: 'Need help?',
  signingIn: 'Signing in...',
  enterDashboard: 'Enter Dashboard ->',
  newToZetrc: 'New to ZETRC?',
  createAccount: 'Create an account',
  protectedAccess: 'Protected access for registered ZETRC pilot trainees and partners',
  enrollmentPilotAccess: 'Enrollment For Pilot Access',
  registerProfile: 'Register your training profile',
  registerCopy:
    'Create a ZETRC account for pilot training, advisory programs, and institution-supported learning. This setup helps us place each learner in the right cohort and support flow.',
  practicalOnboarding: 'Built for practical onboarding',
  cohortReady: 'Cohort-ready',
  farmersTrainees: 'Farmers & trainees',
  farmersTraineesDesc: 'Join learning tracks, assignments, and certification pathways.',
  cooperativesNgos: 'Cooperatives & NGOs',
  cooperativesNgosDesc: 'Register teams for supported delivery and coordinated reporting.',
  partnerHighlights: [
    'Structured onboarding for pilot trainees and learning cohorts',
    'Profiles for farmers, cooperatives, NGOs, and partner institutions',
    'Registration details that support training delivery and field coordination',
  ],
  startRegistration: 'Start your registration',
  registerIntro: 'Tell us who you are so we can assign the right learning path and support team.',
  firstName: 'First name',
  middleName: 'Middle name',
  lastName: 'Last name',
  organization: 'Organization or cooperative',
  provinceDistrict: 'Province / district',
  createPassword: 'Create password',
  confirmPassword: 'Confirm password',
  updatesAgreement: 'I agree to be contacted about enrollment and training updates',
  creatingAccount: 'Creating account...',
  createAccountArrow: 'Create Account ->',
  alreadyRegistered: 'Already registered?',
  passwordMismatch: 'Password confirmation does not match.',
  registerSuccess: 'Registration successful. Sign in to continue.',
  unableCreate: 'Unable to create your account right now.',
  unableSignIn: 'Unable to sign in right now.',
  backSignIn: '<- Back to sign in',
  firstTimeEnrollment: 'First-Time Enrollment',
  chooseCourse: 'Choose your learning course',
  welcomeLearner: 'Welcome',
  learnerFallback: 'Learner',
  courseIntro:
    'Before entering your dashboard, select the course you want to enroll in so we can prepare your training path.',
  enrollmentDetails: 'Enrollment details',
  required: 'Required',
  enrollmentPoints: [
    'Your name and email will be used from your learner account.',
    'You only need to do this once before accessing the dashboard.',
    'You can tell us what you hope to learn in the short note below.',
  ],
  enroll: 'Enroll',
  completeEnrollment: 'Complete course enrollment',
  pickCourse: 'Pick a course to unlock your learner dashboard and training resources.',
  learner: 'Learner',
  noEmail: 'No email provided',
  selectCourse: 'Select course',
  loadingCourses: 'Loading courses...',
  noCourses: 'No courses available',
  selectedCourse: 'Selected course',
  noCourseDesc: 'No course description is available yet.',
  courseInterest: 'Why are you interested in this course?',
  courseInterestPlaceholder:
    'Share what you want to learn or the outcomes you want from this course.',
  submittingEnrollment: 'Submitting enrollment...',
  enrollContinue: 'Enroll and Continue ->',
  selectCourseError: 'Please select a course before continuing.',
  unableCourses: 'Unable to load courses right now.',
  unableEnroll: 'Unable to submit your enrollment right now.',
  dashboard: 'Dashboard',
  myTraining: 'My Training',
  assignments: 'Assignments',
  certificates: 'Certificates',
  learningLibrary: 'Learning Library',
  support: 'Support',
  logout: 'Log out',
  main: 'Main',
  resources: 'Resources',
  continueTraining: 'Continue Training ->',
  viewAssignments: 'View Assignments ->',
  viewCertificates: 'View Certificates ->',
  openLibrary: 'Open Library ->',
};

const ny: TranslationMap = {
  language: 'Chiyankhulo',
  brandSub: 'Maphunziro + Kafukufuku',
  navHome: 'Poyamba',
  navServices: 'Ntchito',
  navTraining: 'Maphunziro',
  navAcademy: 'Akademi',
  navAbout: 'Za ife',
  navContact: 'Lumikizanani',
  joinPilot: 'Lowani mu Pilot',
  requestProposal: 'Pemphani Proposal',
  footerTagline:
    'Kusintha chidziwitso cha ulimi ndi chilengedwe kukhala phindu lenileni kudzera mu maphunziro, upangiri, ndi kafukufuku.',
  footerExplore: 'Onani',
  footerPilotTraining: 'Maphunziro a Pilot',
  footerReady: 'Mwakonzeka kugwirizana?',
  footerReadySub: 'Kwa mabungwe ndi anzathu a chitukuko ofuna zotsatira zenizeni.',
  footerWhatsApp: 'WhatsApp',
  hero1Tag: 'Maphunziro',
  hero1Headline: 'Kusintha Chidziwitso cha Ulimi Kukhala',
  hero1Accent: 'Phindu Lenileni',
  hero1Sub:
    'ZETRC imathandiza alimi, ma NGO, ndi mabungwe kugwiritsa ntchito ulimi wolimbana ndi kusintha kwa nyengo kuti zokolola ndi ndalama zikwane.',
  hero2Tag: 'Kupatsa Alimi Mphamvu',
  hero2Headline: "Kupatsa Alimi Ang'onoang'ono",
  hero2Accent: 'Luso Lokhalitsa',
  hero2Sub:
    "Maphunziro athu a manja amafika kwa alimi m'maprovinsi 6, ndikulimbitsa luso lomwe limapitirira projekiti imodzi.",
  hero3Tag: 'Kuphunzira Kumunda',
  hero3Headline: 'Kukonza Ulimi Kuti Uyendere',
  hero3Accent: 'Nyengo Yosintha',
  hero3Sub:
    'Njira zodalira umboni komanso za mdera zomwe zimathandiza anthu kupirira chilala, mvula yosakhazikika, ndi kuwonongeka kwa nthaka.',
  requestProposalArrow: 'Pemphani Proposal ->',
  joinPilotTraining: 'Lowani Maphunziro a Pilot',
  farmersTrained: 'Alimi aphunzitsidwa',
  provincesReached: 'Maprovinsi afikidwa',
  partnerOrgs: 'Mabungwe anzathu',
  whatWeOffer: 'Zomwe timapereka',
  servicesTitle: 'Zomangidwa kwa Alimi ndi Anzathu Omwe Amabweretsa Kusintha',
  servicesSubtitle:
    'Maphunziro, kuphunzira pa digito, ndi thandizo logwiritsa ntchito zomwe zikugwirizana ndi ulimi wa ku Zambia.',
  whoThisIsFor: 'Izi Ndi Za Ndani',
  audienceList: [
    "Alimi ang'onoang'ono",
    'Achinyamata mu ulimi',
    'Ma cooperative ndi magulu a alimi',
    'Ma NGO ndi mabungwe a chitukuko',
    'Mabungwe a boma',
  ],
  academyDesc:
    'Pulatifomu ya digito yokhala ndi ma module, masatifiketi, ndi kugwiritsa ntchito pafoni kwa madera akumidzi.',
  academyPills: ['Muphunzira nokha', 'Satifiketi', 'Pa foni'],
  getEarlyAccess: 'Pezani Mwayi Woyambirira ->',
  workWithUs: 'Gwirani Nafe Ntchito',
  workWithUsDesc:
    'Mukufuna thandizo la projekiti, kupereka maphunziro, kapena upangiri wa chilengedwe? Tiyeni timange limodzi.',
  whatsappUs: 'Tilembereni pa WhatsApp',
  whyZetrc: 'Chifukwa Chiyani ZETRC',
  localContext: 'Yokhazikika pa Zomwe Zimachitika Mdera',
  whyDesc:
    'Sitibweretsa mayankho a pa onse. Njira zathu zimapangidwa ndi alimi a ku Zambia komanso kwa iwo - zothandiza, zoyesedwa, ndi zokhalitsa.',
  whyItems: [
    'Zochokera Mdera|Njira zomangidwa pa nyengo, nthaka, ndi moyo wa ulimi wa ku Zambia.',
    "Zodalira Umboni|Mapulogalamu okhazikika pa kafukufuku ndi zotsatira zoyesedwa m'maprovinsi 6.",
    'Zolimbana ndi Nyengo|Njira zothandiza alimi kusintha ndi kupirira nyengo yosinthika.',
    'Zoyendetsedwa ndi Mgwirizano|Timagwira ntchito limodzi ndi anthu, ma NGO, ndi boma.',
  ],
  getInTouch: 'Lumikizanani nafe',
  workWithZetrc: 'Gwirani Ntchito ndi ZETRC',
  contactDesc:
    'Timagwirizana ndi alimi, ma NGO, makampani, ndi boma kudzera mu maphunziro, consultancy, ndi upangiri wa nyengo.',
  email: 'Imelo',
  phone: 'Foni',
  messageUs: 'Tilembereni mwachindunji',
  contactWhatsapp: 'Lumikizanani pa WhatsApp ->',
  orgFullName: 'Bungwe / Dzina Lonse',
  emailAddress: 'Imelo',
  phoneNumber: 'Nambala ya foni',
  projectNeeds: 'Tiuzeni zosowa za projekiti yanu...',
  sendInquiry: 'Tumizani Funso ->',
};

const bem: TranslationMap = {
  language: 'Ululimi',
  brandSub: 'Amasambililo + Ukufufuza',
  navHome: 'Pakutendeka',
  navServices: 'Imilimo',
  navTraining: 'Amasambililo',
  navAcademy: 'Academy',
  navAbout: 'Pali ifwe',
  navContact: 'Twalumikileni',
  joinPilot: 'Ingilenimo mu Pilot',
  requestProposal: 'Lombeni Proposal',
  footerTagline:
    'Ukucinja amano ya bulimi ne calo ukuba umulimo wa cine ukupitila mu masambililo, amano, ne kufufuza.',
  footerExplore: 'Moneni',
  footerPilotTraining: 'Amasambililo ya Pilot',
  footerReady: 'Muli abakulekanya?',
  footerReadySub: 'Ku mabungwe na ba partner abafwaya impindulo ya cine.',
  footerWhatsApp: 'WhatsApp',
  hero1Tag: 'Amasambililo',
  hero1Headline: 'Ukucinja Amano ya Bulimi Yaba',
  hero1Accent: 'Impindulo ya Cine',
  hero1Sub:
    'ZETRC ilafwilisha abalimi, ama NGO, na mabungwe ukusebenzisa ubulimi ubukwanisha ukucinja kwa nyengo no kukulisha ifisabo ne ndalama.',
  hero2Tag: 'Ukukoselesha Abalimi',
  hero2Headline: 'Ukupela Abalimi Abanono',
  hero2Accent: 'Ubukankala Ubwikalilila',
  hero2Sub:
    'Amasambililo yesu aya ku maboko yafika ku balimi mu maprovince 6, yakula ubukankala ubwikalilila.',
  hero3Tag: 'Ukusambilila mu Munda',
  hero3Headline: 'Ukupanga Ubulimi Bwendelane na',
  hero3Accent: 'Inyengo Ishilecinca',
  hero3Sub:
    'Inshila shasungililwa pa bupilibulo na pa mwebe, ishafwilisha abantu ukukonka ichilanga, imfula ishilecincila, ne kupona kwa mushili.',
  requestProposalArrow: 'Lombeni Proposal ->',
  joinPilotTraining: 'Ingilenimo mu Masambililo ya Pilot',
  farmersTrained: 'Abalimi basambilishiwa',
  provincesReached: 'Maprovince yafikilwa',
  partnerOrgs: 'Mabungwe bambi',
  whatWeOffer: 'Ifyo tupela',
  servicesTitle: 'Ifyapangilwa Abalimi na Ba Partner Abaletwala Ukucinja',
  servicesSubtitle:
    'Amasambililo, ukusambilila pa digito, ne bufwilisho ubwakulingana ne bulimi bwa Zambia.',
  whoThisIsFor: 'Ici Chaba Banani',
  audienceList: [
    'Abalimi abanono',
    'Imisepela mu bulimi',
    'Ama cooperative na amabuumba ya balimi',
    'Ama NGO na mabungwe ya citukuko',
    'Mabungwe ya boma',
  ],
  academyDesc:
    'Pulatifomu ya digito iya ma module, masatifiketi, no kwanguka pa foni ku bantu ba kumishi.',
  academyPills: ['Sambilileni mweka', 'Satifiketi', 'Pa foni'],
  getEarlyAccess: 'Pokeleleni Umwanya wa Kuntanshi ->',
  workWithUs: 'Bombeleni Nafe',
  workWithUsDesc:
    'Mulefwaya ubufwilisho bwa project, ukupela amasambililo, nangu amano ya calo? Tiyeni tubombe pamo.',
  whatsappUs: 'Tulembeni pa WhatsApp',
  whyZetrc: 'Mulandu Nshi ZETRC',
  localContext: 'Yayimilila pa Fyaba Pano',
  whyDesc:
    'Tatusenda mayankho ya onse. Inshila shesu shapangwa na ku balimi ba Zambia - shabomba, shayeseshiwa, kabili shikalilila.',
  whyItems: [
    'Yasuka Pano|Inshila shakulingana ne fifulo fya bulimi ne miyoyo ya balimi ba Zambia.',
    'Yakwata Umboni|Mapulogalamu aya pa kufufuza ne fipimo fya mu maprovince 6.',
    'Yakwata Amaka ku Nyengo|Inshila shafwilisha abalimi ukucinja no kupitilila mu nyengo ishilecinca.',
    'Yabombelwa Pamo|Tubomba pamo na abantu, ama NGO, na boma.',
  ],
  getInTouch: 'Twalumikileni',
  workWithZetrc: 'Bombeleni na ZETRC',
  contactDesc:
    'Tubomba na abalimi, ama NGO, amakampani, na boma ukupitila mu masambililo, consultancy, na amano ya nyengo.',
  email: 'Email',
  phone: 'Foni',
  messageUs: 'Tulembeni',
  contactWhatsapp: 'Twalumikileni pa WhatsApp ->',
  orgFullName: 'Bungwe / Ishina lyonse',
  emailAddress: 'Email',
  phoneNumber: 'Nambala ya foni',
  projectNeeds: 'Twebeleni ifyo project yenu ifwaya...',
  sendInquiry: 'Tumeni Ifipusho ->',
};

const toi: TranslationMap = {
  language: 'Lulimi',
  brandSub: 'Kuyiya + Kufufuzya',
  navHome: 'Kumatalikilo',
  navServices: 'Milimo',
  navTraining: 'Kuyiya',
  navAcademy: 'Academy',
  navAbout: 'Zyabbazu',
  navContact: 'Amukambane',
  joinPilot: 'Ngenani mu Pilot',
  requestProposal: 'Kumbilani Proposal',
  footerTagline:
    'Kucinca buzyi bwa bulimi abuzinguluka kuti bube mugwalo gwacine kupitila mukuyiya, malangizo, akufufuzya.',
  footerExplore: 'Amubone',
  footerPilotTraining: 'Kuyiya kwa Pilot',
  footerReady: 'Mwalilongela kugwasyanya?',
  footerReadySub: 'Kumabungwe abakambauka bafuna mugwalo gwacine.',
  footerWhatsApp: 'WhatsApp',
  hero1Tag: 'Ziyiyo',
  hero1Headline: 'Kucinca Buzyi bwa Bulimi Kuba',
  hero1Accent: 'Mugwalo Gwacine',
  hero1Sub:
    'ZETRC igwasya balimi, ma NGO, amabungwe kusebenzya bulimi bulekabila kucinca kwa mpwo kuti bukulise zilimwa amali.',
  hero2Tag: 'Kukomezya Balimi',
  hero2Headline: 'Kupa Balimi Banini',
  hero2Accent: 'Bucenje Bukkala',
  hero2Sub:
    'Kuyiya kwesu kumunda kwafika kubalimi mumaprovinsi 6, kukulisa bucibelesyo bukkala.',
  hero3Tag: 'Kuyiya Kumunda',
  hero3Headline: 'Kulunganya Bulimi Kuti Bukwasyane na',
  hero3Accent: 'Mpwo Icinjika',
  hero3Sub:
    'Nzila zyakweendelezya umboni azya kumunzi zigwasya bantu kulwana ncobeni, mvula isiyumini, akufwa kwa bulongo.',
  requestProposalArrow: 'Kumbilani Proposal ->',
  joinPilotTraining: 'Ngenani mu Kuyiya kwa Pilot',
  farmersTrained: 'Balimi bayiyigwa',
  provincesReached: 'Maprovinsi afikilwa',
  partnerOrgs: 'Mabungwe banyina',
  whatWeOffer: 'Ncotupeela',
  servicesTitle: 'Zyakapangwa Kubalimi Abanyina Bakuleta Kucinca',
  servicesSubtitle:
    'Kuyiya, kuyiiya pa digito, alugwasyo lwakulingana abulimi bwa Zambia.',
  whoThisIsFor: 'Echi Chaba Baani',
  audienceList: [
    'Balimi banini',
    'Basankwa mubulimi',
    'Ma cooperative amazunde a balimi',
    'Ma NGO amabungwe akutukula',
    'Mabungwe a boma',
  ],
  academyDesc:
    'Pulatifomu ya digito yamamodule, masatifiketi, akusebenzya pafoni kubantu bakumunzi.',
  academyPills: ['Yiiya weka', 'Satifiketi', 'Pa foni'],
  getEarlyAccess: 'Amubone Mwayi Wakutalisya ->',
  workWithUs: 'Amubombe Nesu',
  workWithUsDesc:
    'Mulafuna lugwasyo lwa project, kupeela kuyiiya, na malangizo azinguluka? Amutange cintu tonse.',
  whatsappUs: 'Mutulembele pa WhatsApp',
  whyZetrc: 'Nkaambo nzi ZETRC',
  localContext: 'Ciyimikizidwe Pazili Muno',
  whyDesc:
    'Tatuleeti nzila zyabasiyansiya. Nzila zyesu zilapangilwa abalimi ba Zambia - zyabomba, zyalingwa, azikkala.',
  whyItems: [
    'Zyakumunzi|Nzila zyakulingana abulimi abumi bwa balimi ba Zambia.',
    'Zyakweendelezya Umboni|Mapulogalamu asekedwa pakufufuzya amilingo mumaprovinsi 6.',
    'Zilekabila Mpwo|Nzila zigwasya balimi kucinca akuyumina mpwo icinjika.',
    'Zibombelwa Pamwi|Tubomba pamwi abamunzi, ma NGO, aboma.',
  ],
  getInTouch: 'Amukambane nesu',
  workWithZetrc: 'Amubombe na ZETRC',
  contactDesc:
    'Tubomba abalimi, ma NGO, makampani, aboma mukuyiya, consultancy, amalangizo ampwo.',
  email: 'Email',
  phone: 'Foni',
  messageUs: 'Mutumane mulumbe',
  contactWhatsapp: 'Amukambane pa WhatsApp ->',
  orgFullName: 'Bungwe / Zina lyoonse',
  emailAddress: 'Email',
  phoneNumber: 'Namba ya foni',
  projectNeeds: 'Mutubuzye ncimufwula mu project yanu...',
  sendInquiry: 'Tumani Mubuzo ->',
};

const translations: Record<LanguageCode, TranslationMap> = {
  en,
  ny: { ...en, ...ny },
  bem: { ...en, ...bem },
  toi: { ...en, ...toi },
};

type LanguageContextValue = {
  language: LanguageCode;
  setLanguage: (language: LanguageCode) => void;
  t: (key: string, replacements?: Record<string, string | number>) => string;
  tList: (key: string) => string[];
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

function isLanguageCode(value: string | null): value is LanguageCode {
  return value === 'en' || value === 'ny' || value === 'bem' || value === 'toi';
}

function interpolate(value: string, replacements?: Record<string, string | number>) {
  if (!replacements) {
    return value;
  }

  return Object.entries(replacements).reduce(
    (next, [key, replacement]) => next.replaceAll(`{${key}}`, String(replacement)),
    value,
  );
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<LanguageCode>(() => {
    const savedLanguage = localStorage.getItem(languageStorageKey);
    return isLanguageCode(savedLanguage) ? savedLanguage : 'en';
  });

  useEffect(() => {
    localStorage.setItem(languageStorageKey, language);
    document.documentElement.lang = language === 'en' ? 'en' : language;
  }, [language]);

  const value = useMemo<LanguageContextValue>(
    () => ({
      language,
      setLanguage: setLanguageState,
      t: (key, replacements) => {
        const raw = translations[language][key] ?? translations.en[key] ?? key;
        return interpolate(Array.isArray(raw) ? raw[0] : raw, replacements);
      },
      tList: (key) => {
        const raw = translations[language][key] ?? translations.en[key] ?? [];
        return Array.isArray(raw) ? raw : [raw];
      },
    }),
    [language],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);

  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }

  return context;
}

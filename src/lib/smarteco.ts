export type BinKey = "COMPOST" | "RECYCLE" | "EWASTE" | "LANDFILL" | "HAZARDOUS";
export type Lang = "en" | "rw" | "fr";

export const LANG_META: Record<Lang, { flag: string; label: string; speech: string; name: string }> =
  {
    en: { flag: "🇬🇧", label: "EN", speech: "en-US", name: "English" },
    rw: { flag: "🇷🇼", label: "RW", speech: "rw-RW", name: "Kinyarwanda" },
    fr: { flag: "🇫🇷", label: "FR", speech: "fr-FR", name: "French" },
  };
export const LANG_ORDER: Lang[] = ["en", "rw", "fr"];

export const BINS: Record<
  BinKey,
  {
    id: string;
    emoji: string;
    names: Record<Lang, string>;
    colorNames: Record<Lang, string>;
    token: string;
  }
> = {
  COMPOST: {
    id: "compost",
    emoji: "🌿",
    names: { en: "Compost", rw: "Ifumbire", fr: "Compost" },
    colorNames: { en: "green", rw: "icyatsi kibisi", fr: "verte" },
    token: "bin-compost",
  },
  RECYCLE: {
    id: "recycle",
    emoji: "♻️",
    names: { en: "Recycle", rw: "Kongera gukoresha", fr: "Recyclage" },
    colorNames: { en: "blue", rw: "ubururu", fr: "bleue" },
    token: "bin-recycle",
  },
  EWASTE: {
    id: "ewaste",
    emoji: "💻",
    names: { en: "E-Waste", rw: "Imyanda ya Elegitoroniki", fr: "Déchets électroniques" },
    colorNames: { en: "purple", rw: "umuhengeri", fr: "violette" },
    token: "bin-ewaste",
  },
  LANDFILL: {
    id: "landfill",
    emoji: "🗑️",
    names: { en: "Landfill", rw: "Aharirirwa imyanda", fr: "Décharge" },
    colorNames: { en: "grey", rw: "ikigina", fr: "grise" },
    token: "bin-landfill",
  },
  HAZARDOUS: {
    id: "hazardous",
    emoji: "⚠️",
    names: { en: "Hazardous", rw: "Ibyago", fr: "Dangereux" },
    colorNames: { en: "red", rw: "umutuku", fr: "rouge" },
    token: "bin-hazardous",
  },
};

export const BIN_KEYS = Object.keys(BINS) as BinKey[];

type Strings = {
  appTitle: string;
  appSubtitle: string;
  tabScan: string;
  tabHistory: string;
  tabImpact: string;
  tabSettings: string;
  promptIdle: string;
  promptIdleSub: string;
  promptScan: string;
  promptResult: string;
  scanItem: string;
  scanning: string;
  autoMode: string;
  stopAuto: string;
  camera: string;
  tapToEnable: string;
  startingCamera: string;
  cameraBlocked: string;
  putInBin: string;
  disposeInstruction: (item: string, bin: string, color: string) => string;
  disposeVoice: (item: string, bin: string, color: string) => string;
  noItemDetected: string;
  couldNotClassify: string;
  analysisFailed: (msg: string) => string;
  wait: string;
  phoneWorking: string;
  phoneDontThrow: string;
  phoneKeepIt: string;
  phoneVoiceAlert: string;
  statTotal: string;
  statToday: string;
  statDiverted: string;
  recentItems: string;
  noItemsYet: string;
  noItemsHint: string;
  smartBins: string;
  binShare: string;
  impactTitle: string;
  impactDiverted: string;
  impactRate: string;
  impactCO2: string;
  impactNote: string;
  co2HowTitle: string;
  co2Formula: string;
  co2Explain: string;
  settings: string;
  languageLabel: string;
  voice: string;
  soundEffects: string;
  on: string;
  off: string;
  testVoice: string;
  dataSection: string;
  dataHint: string;
  exportCsv: string;
  exportJson: string;
  clearData: string;
  clearConfirm: string;
  nothingToExport: string;
  electronicDevice: string;
  installTitle: string;
  installHint: string;
};

export const STRINGS: Record<Lang, Strings> = {
  en: {
    appTitle: "SmartEco AI Sorting",
    appSubtitle: "AI-powered waste sorting",
    tabScan: "Scan",
    tabHistory: "History",
    tabImpact: "Impact",
    tabSettings: "Settings",
    promptIdle: "Do you have trash?",
    promptIdleSub: "Show it in the box",
    promptScan: "Let me see…",
    promptResult: "Got it!",
    scanItem: "Scan item",
    scanning: "Scanning…",
    autoMode: "Auto mode",
    stopAuto: "Stop auto",
    camera: "Camera",
    tapToEnable: "Tap to enable the camera",
    startingCamera: "Starting camera…",
    cameraBlocked: "Camera blocked. Allow it in your browser, then tap to retry.",
    putInBin: "Put it in this bin",
    disposeInstruction: (item, bin, color) =>
      `Put ${item ? `“${item}” ` : ""}in the ${bin} bin (${color})`,
    disposeVoice: (item, bin, color) =>
      `${item ? item + ". " : ""}Please put it in the ${bin} bin. It is the ${color} one.`,
    noItemDetected: "No item detected",
    couldNotClassify: "Could not classify",
    analysisFailed: (msg) => `Analysis failed: ${msg}`,
    wait: "WAIT!",
    phoneWorking: "Your phone still works!",
    phoneDontThrow: "🚫 Don't throw away a working phone. Please keep it in your pocket.",
    phoneKeepIt: "✅ OK, I'll keep it",
    phoneVoiceAlert: "Wait! Your phone still works. Please keep it in your pocket.",
    statTotal: "Total",
    statToday: "Today",
    statDiverted: "Diverted",
    recentItems: "Recent items",
    noItemsYet: "No items sorted yet",
    noItemsHint: "Sorted items will appear here",
    smartBins: "Smart bins",
    binShare: "Share of all sorted",
    impactTitle: "Impact of sorting",
    impactDiverted: "Diverted from landfill",
    impactRate: "Recycling rate",
    impactCO2: "CO₂e avoided (est.)",
    impactNote:
      "Estimated from each item's mass and material using EPA WARM emission factors, against a Kigali open-dumpsite baseline. Landfilled and hazardous items count as 0 kg CO₂e.",
    co2HowTitle: "How this is worked out",
    co2Formula: "weight of the item × how much CO₂e that material saves",
    co2Explain:
      "The camera estimates what each item is made of and roughly what it weighs. That weight is multiplied by a published figure for the carbon saved by recycling or composting that material instead of dumping it. Heavier items save more, so a laptop counts for far more than a cable.",
    settings: "Settings",
    languageLabel: "Language",
    voice: "Voice guidance",
    soundEffects: "Sound effects",
    on: "ON",
    off: "OFF",
    testVoice: "Test voice",
    dataSection: "Data",
    dataHint:
      "Every sort is saved on this phone. Export it as a file to load into another system.",
    exportCsv: "Export CSV",
    exportJson: "Export JSON",
    clearData: "Clear all records",
    clearConfirm: "Delete every record on this phone?",
    nothingToExport: "No records to export yet",
    electronicDevice: "Electronic device",
    installTitle: "Install the app",
    installHint:
      "Open the browser menu and choose “Add to Home Screen” to use SmartEco like a native app.",
  },
  rw: {
    appTitle: "SmartEco AI Sorting",
    appSubtitle: "Gutandukanya imyanda hakoreshejwe AI",
    tabScan: "Gusuzuma",
    tabHistory: "Amateka",
    tabImpact: "Ingaruka",
    tabSettings: "Igenamiterere",
    promptIdle: "Ufite imyanda?",
    promptIdleSub: "Yishyire mu kasho",
    promptScan: "Reka mbireba…",
    promptResult: "Mbabona!",
    scanItem: "Suzuma ikintu",
    scanning: "Ndasuzuma…",
    autoMode: "Byikora",
    stopAuto: "Hagarika",
    camera: "Kamera",
    tapToEnable: "Kanda kugira ufungure kamera",
    startingCamera: "Gufungura kamera…",
    cameraBlocked: "Kamera yahagaritswe. Yemere muri navigateur, hanyuma wongere ugerageze.",
    putInBin: "Shyira muri iki kasho",
    disposeInstruction: (item, bin, color) =>
      `Shyira ${item ? `“${item}” ` : ""}mu kasho rya ${bin} (${color})`,
    disposeVoice: (item, bin, color) =>
      `${item ? item + ". " : ""}Nyamuneka yishyire mu kasho rya ${bin}. Ibara ryaryo ni ${color}.`,
    noItemDetected: "Nta kintu kigaragara",
    couldNotClassify: "Ntibyashobotse gutandukanya",
    analysisFailed: (msg) => `Isuzuma ryanze: ${msg}`,
    wait: "HAGARARA!",
    phoneWorking: "Telefoni yawe iracyakora!",
    phoneDontThrow: "🚫 Ntugatere telefoni ikora neza mu myanda! Nyamuneka yibike mu mufuka wawe.",
    phoneKeepIt: "✅ Yego, ndayibika",
    phoneVoiceAlert: "Mwihangane! Telefoni yawe iracyakora. Nyamuneka yibike mu mufuka wawe.",
    statTotal: "Byose",
    statToday: "Uyu munsi",
    statDiverted: "Byakuwe mu myanda",
    recentItems: "Ibya vuba",
    noItemsYet: "Nta kintu cyatondekanyijwe",
    noItemsHint: "Ibyatondekanyijwe bizagaragara hano",
    smartBins: "Amakasho",
    binShare: "Ijanisha ry’ibyose",
    impactTitle: "Ingaruka zo gutandukanya",
    impactDiverted: "Byakuwe mu myanda",
    impactRate: "Ijanisha ryo kongera gukoresha",
    impactCO2: "CO₂e yakijijwe (igereranyo)",
    impactNote:
      "Bibarwa hakoreshejwe uburemere n’ibigize buri kintu, hifashishijwe imibare ya EPA WARM, ugereranyije n’aho imyanda ijugunywa i Kigali.",
    co2HowTitle: "Uko iyi mibare ibarwa",
    co2Formula: "uburemere bw’ikintu × CO₂e ibyo bikoresho bikiza",
    co2Explain:
      "Kamera igereranya icyo ikintu gikozwemo n’uburemere bwacyo. Ubwo buremere bugwizwa n’umubare wemewe werekana CO₂e ikizwa iyo ibyo bikoresho bisubijwe mu ruganda aho kujugunywa.",
    settings: "Igenamiterere",
    languageLabel: "Ururimi",
    voice: "Ijwi",
    soundEffects: "Amajwi",
    on: "BIRAKORA",
    off: "BIRAHAGAZE",
    testVoice: "Gerageza",
    dataSection: "Amakuru",
    dataHint: "Buri kintu cyatondekanyijwe kibikwa kuri iyi telefoni. Ushobora kuyakuramo nka dosiye.",
    exportCsv: "Kuramo CSV",
    exportJson: "Kuramo JSON",
    clearData: "Siba amakuru yose",
    clearConfirm: "Siba amakuru yose ari kuri iyi telefoni?",
    nothingToExport: "Nta makuru ahari",
    electronicDevice: "Igikoresho cya elegitoroniki",
    installTitle: "Shyira porogaramu kuri telefoni",
    installHint:
      "Fungura menu ya navigateur hanyuma uhitemo “Add to Home Screen” kugira ukoreshe SmartEco nka porogaramu.",
  },
  fr: {
    appTitle: "SmartEco AI Sorting",
    appSubtitle: "Tri des déchets par IA",
    tabScan: "Scanner",
    tabHistory: "Historique",
    tabImpact: "Impact",
    tabSettings: "Réglages",
    promptIdle: "Avez-vous des déchets ?",
    promptIdleSub: "Montrez-les dans le cadre",
    promptScan: "Voyons voir…",
    promptResult: "Compris !",
    scanItem: "Scanner l’objet",
    scanning: "Analyse…",
    autoMode: "Mode auto",
    stopAuto: "Arrêter",
    camera: "Caméra",
    tapToEnable: "Touchez pour activer la caméra",
    startingCamera: "Démarrage de la caméra…",
    cameraBlocked: "Caméra bloquée. Autorisez-la dans le navigateur, puis réessayez.",
    putInBin: "Mettez-le dans cette poubelle",
    disposeInstruction: (item, bin, color) =>
      `Mettez ${item ? `« ${item} » ` : ""}dans la poubelle ${bin} (${color})`,
    disposeVoice: (item, bin, color) =>
      `${item ? item + ". " : ""}Veuillez le mettre dans la poubelle ${bin}. C’est la ${color}.`,
    noItemDetected: "Aucun objet détecté",
    couldNotClassify: "Classement impossible",
    analysisFailed: (msg) => `Échec de l’analyse : ${msg}`,
    wait: "ATTENDEZ !",
    phoneWorking: "Votre téléphone fonctionne encore !",
    phoneDontThrow: "🚫 Ne jetez pas un téléphone qui fonctionne. Gardez-le dans votre poche.",
    phoneKeepIt: "✅ D’accord, je le garde",
    phoneVoiceAlert:
      "Attendez ! Votre téléphone fonctionne encore. Gardez-le dans votre poche.",
    statTotal: "Total",
    statToday: "Aujourd’hui",
    statDiverted: "Détournés",
    recentItems: "Objets récents",
    noItemsYet: "Aucun objet trié",
    noItemsHint: "Les objets triés apparaîtront ici",
    smartBins: "Poubelles",
    binShare: "Part du total trié",
    impactTitle: "Impact du tri",
    impactDiverted: "Détournés de la décharge",
    impactRate: "Taux de recyclage",
    impactCO2: "CO₂e évité (est.)",
    impactNote:
      "Estimé à partir de la masse et du matériau de chaque objet, avec les facteurs EPA WARM et une référence de décharge à ciel ouvert de Kigali.",
    co2HowTitle: "Comment ce chiffre est calculé",
    co2Formula: "poids de l’objet × CO₂e économisé par ce matériau",
    co2Explain:
      "La caméra estime la matière de chaque objet et son poids approximatif. Ce poids est multiplié par un facteur publié indiquant le CO₂ évité en recyclant ou compostant ce matériau plutôt qu’en le jetant.",
    settings: "Réglages",
    languageLabel: "Langue",
    voice: "Voix",
    soundEffects: "Effets sonores",
    on: "OUI",
    off: "NON",
    testVoice: "Tester la voix",
    dataSection: "Données",
    dataHint:
      "Chaque tri est enregistré sur ce téléphone. Exportez-le pour l’utiliser ailleurs.",
    exportCsv: "Exporter CSV",
    exportJson: "Exporter JSON",
    clearData: "Effacer les enregistrements",
    clearConfirm: "Supprimer tous les enregistrements de ce téléphone ?",
    nothingToExport: "Aucun enregistrement",
    electronicDevice: "Appareil électronique",
    installTitle: "Installer l’application",
    installHint:
      "Ouvrez le menu du navigateur et choisissez « Ajouter à l’écran d’accueil » pour utiliser SmartEco comme une app.",
  },
};

export function binName(key: BinKey, lang: Lang) {
  return BINS[key].names[lang] || BINS[key].names.en;
}
export function binColorName(key: BinKey, lang: Lang) {
  return BINS[key].colorNames[lang] || BINS[key].colorNames.en;
}

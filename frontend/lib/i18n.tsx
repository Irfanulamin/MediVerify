"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";

export type Lang = "en" | "bn";

const translations = {
  en: {
    nav: {
      links: [
        { label: "Features", href: "#features" },
        { label: "Product", href: "#product" },
        { label: "How it works", href: "#how" },
        { label: "Mission", href: "#mission" },
      ],
      cta: "Get started",
    },
    hero: {
      badge: "Medicine verification · Bangladesh",
      h1a: "Verify medicines",
      h1b: "before they harm.",
      p: "A verification layer for Bangladesh's pharmacies and patients. Detect counterfeits, check interactions, find safer alternatives in seconds.",
      cta1: "Verify a medicine",
      cta2: "See how it works",
      stat: "In use across Dhaka, Chattogram and Sylhet.",
      scanLabel: "Scan",
      scanValue: "Napa Extra · Verified",
    },
    features: {
      eyebrow: "Capabilities",
      h2a: "A safety layer between",
      h2b: "the pharmacy and the patient.",
      items: [
        {
          title: "Verify medicines",
          desc: "Detect suspicious or counterfeit medicines through cross-referenced pharmaceutical data and AI pattern analysis.",
        },
        {
          title: "Check interactions",
          desc: "Surface medicine-to-medicine interaction risks and dosage conflicts before dispensing to a patient.",
        },
        {
          title: "Find alternatives",
          desc: "Locally available substitutes with matching composition and pricing transparency across Bangladesh.",
        },
      ],
    },
    how: {
      h2a: "Three steps.",
      h2b: "Seconds, not appointments.",
      steps: [
        {
          n: "01",
          t: "Enter or scan",
          d: "Type the medicine name, scan the strip, or describe the package. Any input works.",
        },
        {
          n: "02",
          t: "AI analyzes",
          d: "We cross-check pharmaceutical data, manufacturer records, and known counterfeit patterns.",
        },
        {
          n: "03",
          t: "Verified result",
          d: "Get a clear verification status, safety summary, interaction flags, and alternatives.",
        },
      ],
    },
    testimonials: {
      h2a: "Real people.",
      h2b: "Real prescriptions.",
      items: [
        {
          quote: "I had a customer bring in a strip that didn't feel right. MediVerify flagged it as suspicious in seconds and saved us from dispensing it.",
          name: "Tahmid Rahman",
          role: "Pharmacist, Dhanmondi",
        },
        {
          quote: "The interaction checker is what hooked me. It explains drug conflicts in a way that's actually useful at the counter, not just a database dump.",
          name: "Naima Sultana",
          role: "Medical student, DMC",
        },
        {
          quote: "I used it for my mother's blood pressure medicine and found a cheaper alternative with the same composition. Real peace of mind.",
          name: "Rafiqul Haque",
          role: "Patient, Sylhet",
        },
      ],
    },
    showcase: {
      row1: {
        eyebrow: "Verification dashboard",
        h3a: "Clinical-grade insight,",
        h3b: "consumer-grade clarity.",
        p: "Every scan returns a transparent breakdown: manufacturer authenticity, batch validity, regulatory status, and a plain-language safety summary anyone can act on.",
        bullets: [
          "Batch and registration cross-check",
          "DGDA-aligned data signals",
          "Plain-language explanations",
        ],
      },
      row2: {
        eyebrow: "In your pocket",
        h3a: "Scan a strip.",
        h3b: "Trust the result.",
        p: "Patients and pharmacists verify a pack in seconds with a tone that respects every patient's literacy level.",
        stats: [
          ["12k+", "Medicines indexed"],
          ["98.4%", "Detection accuracy"],
          ["<2s", "Avg. verification"],
          ["64", "Districts covered"],
        ],
      },
    },
    mission: {
      missionEyebrow: "Mission",
      missionA: "Make medicine verification accessible to",
      missionItalic: "every person",
      missionB: "in Bangladesh.",
      visionEyebrow: "Vision",
      visionA: "A future where counterfeit medicines",
      visionItalic: "cannot circulate",
      visionB: "unnoticed.",
    },
    cta: {
      h2a: "Start verifying medicines",
      h2b: "today.",
      p: "Free for individuals. Built for pharmacies and regulators.",
      btn: "Get started",
    },
    footer: {
      tagline: "AI-powered medicine verification, built with care in Bangladesh.",
      cols: [
        {
          title: "Product",
          links: [["Features", "#features"], ["API", "#"], ["Pricing", "#"], ["Changelog", "#"]],
        },
        {
          title: "Company",
          links: [["About", "#"], ["Mission", "#mission"], ["Careers", "#"], ["Press", "#"]],
        },
        {
          title: "Legal",
          links: [["Privacy", "#"], ["Terms", "#"], ["Security", "#"], ["Contact", "#"]],
        },
      ],
      copyright: "MediVerify. All rights reserved.",
      madeFor: "Made for patient safety in Bangladesh.",
    },
    dashboard: {
      logout: "Logout",
      searchTab1: "Type medicine name",
      searchTab2: "Upload photo",
      searchPlaceholder: "e.g. Napa Extra, Ciprofloxacin 500mg...",
      verifyBtn: "Verify",
      verifying: "Verifying...",
      uploadLabel: "Choose medicine photo",
      voiceTooltip: "Voice input not supported in this browser",
      recentSearches: "Recent Searches",
      noRecent: "No recent searches yet",
      resultVerified: "Verified",
      resultSuspicious: "Suspicious",
      resultUnknown: "Unknown",
      trustScore: "Trust Score",
      medicineName: "Medicine",
      genericName: "Generic Name",
      manufacturer: "Manufacturer",
      fakeIndicators: "Fake Indicators to Watch",
      safeAlternatives: "Safe Alternatives",
      aiExplanation: "AI Analysis",
      errorGeneric: "Verification failed. Please try again.",
    },
    interactions: {
      title: "Drug Interaction Checker",
      medicine1: "Medicine 1",
      medicine2: "Medicine 2",
      placeholder1: "e.g. Metformin 500mg",
      placeholder2: "e.g. Atenolol 50mg",
      checkBtn: "Check Interaction",
      checking: "Checking...",
      severityMild: "Mild",
      severityModerate: "Moderate",
      severitySevere: "Severe",
      explanation: "Interaction Analysis",
      recommendation: "Recommendation",
      errorBothRequired: "Please enter both medicine names.",
      errorGeneric: "Interaction check failed. Please try again.",
    },
    alerts: {
      title: "Medicine Safety Alerts",
      subtitle: "Reported counterfeit and substandard medicines across Bangladesh",
      typeFake: "Fake",
      typeExpired: "Expired",
      typeMislabeled: "Mislabeled",
      verified: "Verified",
      location: "Location",
      reported: "Reported",
      emptyTitle: "No alerts at this time",
      emptySubtitle: "No medicine safety alerts have been reported yet.",
      refreshing: "Auto-refreshing every 30 seconds",
    },
    admin: {
      overview: "Overview",
      alertsMgmt: "Alerts",
      users: "Users",
      medicineDb: "Medicine DB",
      totalUsers: "Total Users",
      verificationsToday: "Verifications Today",
      totalAlerts: "Total Alerts",
      totalMedicines: "Total Medicines",
      approveBtn: "Approve",
      deleteBtn: "Delete",
      colName: "Name",
      colEmail: "Email",
      colRole: "Role",
      colJoined: "Joined",
      colMedicine: "Medicine",
      colType: "Type",
      colLocation: "Location",
      colDate: "Date",
      colVerified: "Verified",
      colActions: "Actions",
      colGeneric: "Generic Name",
      colManufacturer: "Manufacturer",
      colPrice: "Price (BDT)",
      searchMedicines: "Search medicines...",
    },
  },

  bn: {
    nav: {
      links: [
        { label: "বৈশিষ্ট্য", href: "#features" },
        { label: "পণ্য", href: "#product" },
        { label: "কীভাবে কাজ করে", href: "#how" },
        { label: "মিশন", href: "#mission" },
      ],
      cta: "শুরু করুন",
    },
    hero: {
      badge: "ওষুধ যাচাইকরণ · বাংলাদেশ",
      h1a: "ওষুধ যাচাই করুন",
      h1b: "ক্ষতির আগেই।",
      p: "বাংলাদেশের ফার্মেসি ও রোগীদের জন্য একটি যাচাইকরণ স্তর। জাল ওষুধ শনাক্ত করুন, মিথস্ক্রিয়া পরীক্ষা করুন, মুহূর্তেই নিরাপদ বিকল্প খুঁজুন।",
      cta1: "ওষুধ যাচাই করুন",
      cta2: "কীভাবে কাজ করে দেখুন",
      stat: "ঢাকা, চট্টগ্রাম ও সিলেটে ব্যবহৃত।",
      scanLabel: "স্ক্যান",
      scanValue: "নাপা এক্সট্রা · যাচাইকৃত",
    },
    features: {
      eyebrow: "সক্ষমতা",
      h2a: "ফার্মেসি ও রোগীর মধ্যে",
      h2b: "একটি নিরাপত্তা স্তর।",
      items: [
        {
          title: "ওষুধ যাচাই করুন",
          desc: "ফার্মাসিউটিক্যাল ডেটা ও এআই বিশ্লেষণের মাধ্যমে সন্দেহজনক বা নকল ওষুধ শনাক্ত করুন।",
        },
        {
          title: "মিথস্ক্রিয়া পরীক্ষা করুন",
          desc: "রোগীকে ওষুধ দেওয়ার আগে মিথস্ক্রিয়ার ঝুঁকি এবং মাত্রার দ্বন্দ্ব খুঁজে বের করুন।",
        },
        {
          title: "বিকল্প খুঁজুন",
          desc: "বাংলাদেশ জুড়ে একই উপাদান ও মূল্য স্বচ্ছতা সহ স্থানীয়ভাবে পাওয়া যায় এমন বিকল্প।",
        },
      ],
    },
    how: {
      h2a: "তিনটি ধাপ।",
      h2b: "সেকেন্ডে, অ্যাপয়েন্টমেন্ট ছাড়াই।",
      steps: [
        {
          n: "০১",
          t: "লিখুন বা স্ক্যান করুন",
          d: "ওষুধের নাম টাইপ করুন, স্ট্রিপ স্ক্যান করুন বা প্যাকেজিং বর্ণনা করুন। যেকোনো ইনপুট কাজ করে।",
        },
        {
          n: "০২",
          t: "এআই বিশ্লেষণ করে",
          d: "আমরা ফার্মাসিউটিক্যাল ডেটা, উৎপাদনকারীর রেকর্ড ও পরিচিত নকল প্যাটার্নের সাথে ক্রস-চেক করি।",
        },
        {
          n: "০৩",
          t: "যাচাইকৃত ফলাফল",
          d: "একটি স্পষ্ট যাচাই স্ট্যাটাস, নিরাপত্তা সারসংক্ষেপ, মিথস্ক্রিয়া সতর্কতা ও বিকল্প পান।",
        },
      ],
    },
    testimonials: {
      h2a: "বাস্তব মানুষ।",
      h2b: "বাস্তব প্রেসক্রিপশন।",
      items: [
        {
          quote: "আমার কাছে একজন গ্রাহক একটি স্ট্রিপ নিয়ে আসেন যেটা সঠিক মনে হচ্ছিল না। MediVerify সেকেন্ডের মধ্যে এটিকে সন্দেহজনক হিসেবে চিহ্নিত করে এবং আমাদের বিতরণ করা থেকে রক্ষা করে।",
          name: "তাহমিদ রহমান",
          role: "ফার্মাসিস্ট, ধানমন্ডি",
        },
        {
          quote: "ইন্টারঅ্যাকশন চেকার আমাকে আকৃষ্ট করেছে। এটি ওষুধের দ্বন্দ্ব এমনভাবে ব্যাখ্যা করে যা কাউন্টারে সত্যিকারের কাজে লাগে, শুধু ডেটাবেস ডাম্প নয়।",
          name: "নাইমা সুলতানা",
          role: "মেডিকেল শিক্ষার্থী, ডিএমসি",
        },
        {
          quote: "আমি আমার মায়ের রক্তচাপের ওষুধের জন্য এটি ব্যবহার করেছিলাম এবং একই উপাদানের সাথে একটি সস্তা বিকল্প খুঁজে পেয়েছিলাম। সত্যিকারের মানসিক শান্তি।",
          name: "রফিকুল হক",
          role: "রোগী, সিলেট",
        },
      ],
    },
    showcase: {
      row1: {
        eyebrow: "যাচাই ড্যাশবোর্ড",
        h3a: "ক্লিনিক্যাল-গ্রেড অন্তর্দৃষ্টি,",
        h3b: "সাধারণের বোধগম্য স্বচ্ছতা।",
        p: "প্রতিটি স্ক্যানে স্বচ্ছ বিশ্লেষণ পাবেন: উৎপাদনকারীর সত্যতা, ব্যাচ বৈধতা, নিয়ন্ত্রক স্ট্যাটাস এবং সহজ ভাষায় নিরাপত্তা সারসংক্ষেপ।",
        bullets: [
          "ব্যাচ ও নিবন্ধন ক্রস-চেক",
          "ডিজিডিএ-সামঞ্জস্যপূর্ণ ডেটা সংকেত",
          "সহজ ভাষায় ব্যাখ্যা",
        ],
      },
      row2: {
        eyebrow: "আপনার পকেটে",
        h3a: "স্ট্রিপ স্ক্যান করুন।",
        h3b: "ফলাফল বিশ্বাস করুন।",
        p: "রোগী ও ফার্মাসিস্ট সেকেন্ডের মধ্যে একটি প্যাক যাচাই করতে পারবেন, এমন ভাষায় যা সবার বোধগম্য।",
        stats: [
          ["১২হাজার+", "ওষুধ তালিকাভুক্ত"],
          ["৯৮.৪%", "শনাক্তের নির্ভুলতা"],
          ["<২সেকেন্ড", "গড় যাচাই সময়"],
          ["৬৪", "জেলা আচ্ছাদিত"],
        ],
      },
    },
    mission: {
      missionEyebrow: "মিশন",
      missionA: "বাংলাদেশের",
      missionItalic: "প্রতিটি মানুষের",
      missionB: "কাছে ওষুধ যাচাইকরণ সহজলভ্য করা।",
      visionEyebrow: "দৃষ্টিভঙ্গি",
      visionA: "এমন একটি ভবিষ্যৎ যেখানে নকল ওষুধ",
      visionItalic: "অলক্ষ্যে ছড়িয়ে পড়তে",
      visionB: "পারবে না।",
    },
    cta: {
      h2a: "ওষুধ যাচাই শুরু করুন",
      h2b: "আজই।",
      p: "ব্যক্তিদের জন্য বিনামূল্যে। ফার্মেসি ও নিয়ন্ত্রকদের জন্য তৈরি।",
      btn: "শুরু করুন",
    },
    footer: {
      tagline: "এআই-চালিত ওষুধ যাচাইকরণ, বাংলাদেশে যত্নের সাথে তৈরি।",
      cols: [
        {
          title: "পণ্য",
          links: [["বৈশিষ্ট্য", "#features"], ["এপিআই", "#"], ["মূল্য", "#"], ["পরিবর্তনলগ", "#"]],
        },
        {
          title: "কোম্পানি",
          links: [["আমাদের সম্পর্কে", "#"], ["মিশন", "#mission"], ["ক্যারিয়ার", "#"], ["প্রেস", "#"]],
        },
        {
          title: "আইনি",
          links: [["গোপনীয়তা", "#"], ["শর্তাবলি", "#"], ["নিরাপত্তা", "#"], ["যোগাযোগ", "#"]],
        },
      ],
      copyright: "মেডিভেরিফাই। সর্বস্বত্ব সংরক্ষিত।",
      madeFor: "বাংলাদেশে রোগীর নিরাপত্তার জন্য তৈরি।",
    },
    dashboard: {
      logout: "লগআউট",
      searchTab1: "ওষুধের নাম লিখুন",
      searchTab2: "ছবি আপলোড করুন",
      searchPlaceholder: "যেমন: নাপা এক্সট্রা, সিপ্রোফ্লক্সাসিন ৫০০মিগ্রা...",
      verifyBtn: "যাচাই করুন",
      verifying: "যাচাই হচ্ছে...",
      uploadLabel: "ওষুধের ছবি বেছে নিন",
      voiceTooltip: "এই ব্রাউজারে ভয়েস ইনপুট সমর্থিত নয়",
      recentSearches: "সাম্প্রতিক অনুসন্ধান",
      noRecent: "এখনো কোনো সাম্প্রতিক অনুসন্ধান নেই",
      resultVerified: "যাচাইকৃত",
      resultSuspicious: "সন্দেহজনক",
      resultUnknown: "অজানা",
      trustScore: "বিশ্বাসযোগ্যতা স্কোর",
      medicineName: "ওষুধ",
      genericName: "জেনেরিক নাম",
      manufacturer: "উৎপাদনকারী",
      fakeIndicators: "নকল চেনার উপায়",
      safeAlternatives: "নিরাপদ বিকল্প",
      aiExplanation: "এআই বিশ্লেষণ",
      errorGeneric: "যাচাই ব্যর্থ হয়েছে। আবার চেষ্টা করুন।",
    },
    interactions: {
      title: "ড্রাগ ইন্টারঅ্যাকশন চেকার",
      medicine1: "ওষুধ ১",
      medicine2: "ওষুধ ২",
      placeholder1: "যেমন: মেটফর্মিন ৫০০মিগ্রা",
      placeholder2: "যেমন: অ্যাটেনোলল ৫০মিগ্রা",
      checkBtn: "মিথস্ক্রিয়া পরীক্ষা করুন",
      checking: "পরীক্ষা হচ্ছে...",
      severityMild: "মৃদু",
      severityModerate: "মাঝারি",
      severitySevere: "তীব্র",
      explanation: "মিথস্ক্রিয়া বিশ্লেষণ",
      recommendation: "পরামর্শ",
      errorBothRequired: "উভয় ওষুধের নাম লিখুন।",
      errorGeneric: "মিথস্ক্রিয়া পরীক্ষা ব্যর্থ হয়েছে। আবার চেষ্টা করুন।",
    },
    alerts: {
      title: "ওষুধ নিরাপত্তা সতর্কতা",
      subtitle: "বাংলাদেশ জুড়ে রিপোর্ট করা নকল ও নিম্নমানের ওষুধ",
      typeFake: "নকল",
      typeExpired: "মেয়াদোত্তীর্ণ",
      typeMislabeled: "ভুল লেবেল",
      verified: "যাচাইকৃত",
      location: "অবস্থান",
      reported: "রিপোর্ট করা হয়েছে",
      emptyTitle: "এই মুহূর্তে কোনো সতর্কতা নেই",
      emptySubtitle: "এখনো কোনো ওষুধ নিরাপত্তা সতর্কতা রিপোর্ট করা হয়নি।",
      refreshing: "প্রতি ৩০ সেকেন্ডে স্বয়ংক্রিয় আপডেট",
    },
    admin: {
      overview: "সারসংক্ষেপ",
      alertsMgmt: "সতর্কতা",
      users: "ব্যবহারকারী",
      medicineDb: "ওষুধ ডেটাবেস",
      totalUsers: "মোট ব্যবহারকারী",
      verificationsToday: "আজকের যাচাই",
      totalAlerts: "মোট সতর্কতা",
      totalMedicines: "মোট ওষুধ",
      approveBtn: "অনুমোদন",
      deleteBtn: "মুছুন",
      colName: "নাম",
      colEmail: "ইমেইল",
      colRole: "ভূমিকা",
      colJoined: "যোগদান",
      colMedicine: "ওষুধ",
      colType: "ধরন",
      colLocation: "অবস্থান",
      colDate: "তারিখ",
      colVerified: "যাচাইকৃত",
      colActions: "কার্যক্রম",
      colGeneric: "জেনেরিক নাম",
      colManufacturer: "উৎপাদনকারী",
      colPrice: "মূল্য (টাকা)",
      searchMedicines: "ওষুধ খুঁজুন...",
    },
  },
};

export type Translations = typeof translations.en;

interface LangContextType {
  lang: Lang;
  t: Translations;
  toggle: () => void;
}

const LangContext = createContext<LangContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  useEffect(() => {
    const stored = localStorage.getItem("mv-lang") as Lang | null;
    if (stored === "en" || stored === "bn") setLang(stored);
  }, []);

  useEffect(() => {
    document.documentElement.lang = lang;
    document.documentElement.setAttribute("data-lang", lang);
    localStorage.setItem("mv-lang", lang);
  }, [lang]);

  const toggle = () => setLang((l) => (l === "en" ? "bn" : "en"));

  return (
    <LangContext.Provider value={{ lang, t: translations[lang], toggle }}>
      {children}
    </LangContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LangContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}

// src/lib/mock-assistant.ts файлд нэмж оруулах эсвэл солих

export interface CareerAnalysisResult {
  summary: string;
  strengths: { subject: string; note: string }[];
  careers: { title: string; matchPercent: number; reason: string; demand: "Маш өндөр" | "Өндөр" | "Дунд"; salaryRange: string }[];
  universities: { 
    name: string; 
    program: string; 
    requiredGpa: string; 
    examInfo: string;
    departments: {
      name: string;
      requiredScore: number;
      matchPercent: number;
      advice: string;
    }[];
  }[];
  studyAbroad: { country: string; language: string; scholarship: string; steps: string[] }[];
  plan: { year: string; goal: string }[];
}

export function analyzeCareerLocal(input: {
  grades: { subject: string; score: number }[];
  mbti: string;
  interests: string[];
}): CareerAnalysisResult {
  
  const mathScore = input.grades.find(g => g.subject === "Математик")?.score || 0;
  const physicsScore = input.grades.find(g => g.subject === "Физик")?.score || 0;
  const englishScore = input.grades.find(g => g.subject === "Англи хэл")?.score || 0;

  // 1. Давуу тал
  const strengths = input.grades
    .filter((g) => g.score >= 80)
    .map((g) => ({
      subject: g.subject,
      note: `${g.subject} хичээлд тогтмол өндөр (${g.score}%) үзүүлэлттэй байна.`
    }));

  if (strengths.length === 0 && input.grades.length > 0) {
    const maxGrade = input.grades.reduce((prev, current) => (prev.score > current.score) ? prev : current);
    strengths.push({
      subject: maxGrade.subject,
      note: `Хамгийн өндөр оноотой хичээл (${maxGrade.subject} - ${maxGrade.score}%). Үүнийгээ давуу тал болгох боломжтой.`
    });
  }

  return {
    summary: `Таны оролтын өгөгдөлд үндэлэн ${input.mbti} төрлийн зан төлөв болон ${input.interests.join(", ")} чиглэлийн сонирхол танд тохирох карьерийн замыг тодорхойлж байна. Хэрэв та зорилгоо зөв тавьж, сул талаа сайжруулбал дотоодын болон гадаадын шилдэг сургуулиудад элсэх бүрэн боломжтой.`,
    strengths: strengths.slice(0, 3),
    careers: [
      {
        title: "Программ хангамжийн инженер",
        matchPercent: 92,
        reason: "Таны логик сэтгэлгээ (MBTI), тоон дүнтэй ажиллах чадвар энэ мэргэжилд төгс тохирно.",
        demand: "Маш өндөр",
        salaryRange: "1.5M - 4M ₮"
      },
      {
        title: "Өгөгдлийн шинжээч",
        matchPercent: 85,
        reason: "Математик болон аналитик чадвар нь өгөгдөлд нуугдсан үнэрийг илрүүлэхэд тустай.",
        demand: "Өндөр",
        salaryRange: "2M - 5M ₮"
      },
      {
        title: "Системийн аналитикч",
        matchPercent: 78,
        reason: "Бизнес процессыг ойлгоход MBTI төрлийн бодлогын хандлага тустай.",
        demand: "Өндөр",
        salaryRange: "1.8M - 3.5M ₮"
      }
    ],
    universities: [
      { 
        name: "ШУТИС", 
        program: "Мэдээллийн технологи, Программ хангамж", 
        requiredGpa: "Элсэлтийн шалгалт (300+ оноо)", 
        examInfo: "Математик, Физик, Англи хэл",
        departments: [
          { name: "Программ хангамж (Software Engineering)", requiredScore: 80, matchPercent: 88, advice: mathScore >= 80 ? "Таны математикийн оноо шаардлагатай түвшинд хүрсэн. Амжилттай өрсөлдөх боломжтой." : `Таны математикийн оноо ${mathScore}%. Шаардлагатай 80%-аас өндөр байх тул 10%-иар дээшлүүлэх хэрэгтэй.` },
          { name: "Хиймэл оюун ухаан (AI)", requiredScore: 85, matchPercent: 75, advice: mathScore >= 85 ? "Хангалттай оноотой." : "Хамгийн хүнд хөтөлбөр. Математикийн оноог 85+ болгох шаардлагатай." },
          { name: "Компьютерийн архитектур", requiredScore: 75, matchPercent: 82, advice: "Физикийн оноог анхаарах хэрэгтэй." }
        ]
      },
      { 
        name: "МУИС", 
        program: "Компьютерийн ухаан, Мэдээлэл судлал", 
        requiredGpa: "Элсэлтийн шалгалт (Голч дүн + Шалгалт)", 
        examInfo: "Математик, Англи хэл",
        departments: [
          { name: "Компьютерийн ухаан (CS)", requiredScore: 75, matchPercent: 90, advice: mathScore >= 75 ? "Математик хангалттай. Голч дүнгээ 3.5+ барих хэрэгтэй." : "Математикийг 75% хүртэл сайжруул." },
          { name: "Мэдээлэл судлал (IS)", requiredScore: 70, matchPercent: 85, advice: "Хөнгөн өрсөлдөөнтэй. Амжилттай элсэх боломжтой." }
        ]
      },
    ],
    studyAbroad: [
      { 
        country: "Өмнөд Солонгос", 
        language: "TOPIK 4+", 
        scholarship: "GKS (Global Korea Scholarship)", 
        steps: ["1. TOPIK шалгалт өгөх", "2. IELTS 6.0+ авах", "3. Аппликейшн бөглөх", "4. Интервьюд бэлдэх"] 
      },
      { 
        country: "Япон", 
        language: "JLPT N3+", 
        scholarship: "MEXT Scholarship", 
        steps: ["1. Япон хэл сурах", "2. ЭСЯ-нд бүртгүүлэх", "3. Бичгэн шалгалт", "4. Интервью"] 
      },
    ],
    plan: [
      { year: "2026", goal: `Математикийн дүнг ${mathScore < 80 ? "80" : "90"}+ болгож, гүнзгийрүүлсэн курсд хамрагдах` },
      { year: "2027", goal: "Програмчлалын үндэс сурч, өөрийн төсөл хийж эхлэх" },
      { year: "2028", goal: "ШУТИС эсвэл МУИС-д элсэж, олон улсын тэтгэлэгийн аппликейшн хийх" },
    ],
  };
}

// Эцэг эхийн AI дүгнэлт үүсгэгч
export function generateParentInsight(data: {
  studentName: string;
  avgGrade: number | null;
  attendanceRate: number | null;
  absentCount: number;
  lateCount: number;
  lowSubjects: { subject: string; average_percentage: number }[];
  overdueCount: number;
  riskScore: number;
  riskLevel: "safe" | "caution" | "alert";
}): string {
  const parts: string[] = [];
  const { studentName, riskLevel } = data;

  if (riskLevel === "alert") {
    parts.push(`${studentName}-д яаралтай анхаарал хэрэгтэй. `);
    if (data.attendanceRate && data.attendanceRate < 80) {
      parts.push(`Ирц ${data.attendanceRate}% хүртэл буурсан нь сурлагын амжилтад шууд нөлөөлж байна. `);
    }
    if (data.lowSubjects.length > 0) {
      parts.push(`${data.lowSubjects.map(s => s.subject).join(", ")} хичээлүүдэд хоцрогдол ажиглагдаж байна. `);
    }
    parts.push(`Багштайгаа уулзах, хичээлийн дараа нэмэлт хичээлд хамруулахыг зөвлөж байна. Эцэг эхийн дэмжлэг энэ үед маш чухал.`);
  } else if (riskLevel === "caution") {
    parts.push(`${studentName} зарим үзүүлэлтээр анхааруулга өгч байна. `);
    if (data.avgGrade && data.avgGrade < 70) {
      parts.push(`Дундаж дүн ${Math.round(data.avgGrade)}% — илүү сайжруулах зайлшгүй шаардлагатай. `);
    }
    if (data.lateCount > 2) {
      parts.push(`Хоцорсон тоо ${data.lateCount} удаа болсон нь цагийн удирдлагад анхаарах хэрэгтэйг харуулж байна. `);
    }
    parts.push(`Энэ үед эцэг эхийн хяналт, дэмжлэг эрсдэлийг бууруулах гол түлхүүр юм.`);
  } else {
    parts.push(`${studentName} сайн явж байна! `);
    parts.push(`Сурлага, ирцийн үзүүлэлтүүд хэвийн түвшинд байна. `);
    if (data.avgGrade && data.avgGrade >= 80) {
      parts.push(`Дундаж дүн ${Math.round(data.avgGrade)}% — маш сайн үр дүн. `);
    }
    parts.push(`Одоогийн амжилтыг хадгалахын зэрэгцээ илүү өндөр зорилго тавьж дэмжих нь зүйтэй.`);
  }

  return parts.join("");
}

// Хүүхдийн сэтгэл зүйн байдлын шинжилгээ
export function analyzeChildPsychology(data: {
  avgGrade: number | null;
  attendanceRate: number | null;
  trend: "up" | "down" | "stable";
  overdueCount: number;
  messageActivity: number;
}): {
  mood: "Хэвийн" | "Түгшсэн" | "Гутарсан" | "Эрч хүчтэй";
  moodScore: number;
  factors: string[];
  recommendation: string;
} {
  let score = 50; // 0-100, 50 = neutral
  const factors: string[] = [];

  if (data.attendanceRate && data.attendanceRate < 75) {
    score -= 20;
    factors.push("Ирц доогуур — хичээлд сонирхол буурч байж болзошгүй");
  }
  if (data.avgGrade && data.avgGrade < 60) {
    score -= 15;
    factors.push("Дүн доогуур — сэтгэл хөдлөлийн стресст орох эрсдэл");
  }
  if (data.overdueCount > 3) {
    score -= 10;
    factors.push("Даалгавар хийгээгүй — ухамсрын асуудал эсвэл залхуурал");
  }
  if (data.trend === "down") {
    score -= 15;
    factors.push("Үзүүлэлт буурч байна — нийт байдал сөрөг чиглэлд байна");
  }
  if (data.trend === "up") {
    score += 20;
    factors.push("Үзүүлэлт сайжирч байна — сэргэн мандах хандлага");
  }
  if (data.avgGrade && data.avgGrade >= 80 && data.attendanceRate && data.attendanceRate >= 90) {
    score += 15;
    factors.push("Сурлага, ирц сайн — урам зоригтой байна");
  }

  score = Math.max(0, Math.min(100, score));

  let mood: "Хэвийн" | "Түгшсэн" | "Гутарсан" | "Эрч хүчтэй";
  if (score >= 70) mood = "Эрч хүчтэй";
  else if (score >= 50) mood = "Хэвийн";
  else if (score >= 30) mood = "Түгшсэн";
  else mood = "Гутарсан";

  let recommendation = "";
  if (mood === "Гутарсан") {
    recommendation = "Хүүхэдтэйгээ илүү ойр болж, ямар ч шүүмжлэлгүйгээр сонсох хэрэгтэй. Мэргэжлийн сэтгэл зүйчтэй холбогдохыг зөвлөдөг.";
  } else if (mood === "Түгшсэн") {
    recommendation = "Хүүхдийнхээ сэтгэл хөдлөлийг анхаарч, дэмжих үгс хэрэглэх. Сургуулийн багштай холбогдож нөхцөл байдлыг ойлгох.";
  } else if (mood === "Хэвийн") {
    recommendation = "Одоогийн байдал хэвийн. Гэхдээ хүүхдийнхээ сонирхлыг дэмжиж, шинэ зүйл туршихыг заах нь зүйтэй.";
  } else {
    recommendation = "Хүүхэд маш сайн байна! Илүү өндөр зорилго тавьж, урт хугацааны карьер төлөвлөлт хийх цаг ирлээ.";
  }

  return { mood, moodScore: score, factors, recommendation };
}

// Хүүхдийн карьерын чиг хандлага
export function analyzeChildCareerDirection(data: {
  grades: { subject: string; average_percentage: number }[];
}): {
  strengths: string[];
  direction: string;
  potentialCareers: string[];
  advice: string;
} {
  const strong = data.grades.filter(g => g.average_percentage >= 75);
  const strengths = strong.map(s => s.subject);

  let direction = "";
  let potentialCareers: string[] = [];
  let advice = "";

  const hasMath = strengths.includes("Математик");
  const hasScience = strengths.some(s => ["Физик", "Хими", "Биологи"].includes(s));
  const hasLang = strengths.some(s => ["Монгол хэл", "Англи хэл"].includes(s));

  if (hasMath && hasScience) {
    direction = "Технологи, Инженерийн чиглэл";
    potentialCareers = ["Программист", "Инженер", "Өгөгдлийн шинжээч", "AI судлаач"];
    advice = "Хүүхэд математик болон шинжлэх ухаанд авьяастай байна. Програмчлалын курс, STEM төсөлд хамруулах нь зүйтэй.";
  } else if (hasLang) {
    direction = "Хэл шинжлэл, Хүмүүнлэгийн чиглэл";
    potentialCareers = ["Орчуулагч", "Сэтгүүлч", "Харилцаа холбооны мэргэжилтэн", "Дипломатч"];
    advice = "Хэлний авьяасыг нь гадаадад сурах боломжтой. Солонгос, Японы тэтгэлэгийг судлахыг зөвлөж байна.";
  } else if (strengths.length > 0) {
    direction = "Улсын болон нийгмийн чиглэл";
    potentialCareers = ["Багш", "Нийгмийн ажилтан", "Менежер"];
    advice = "Хүүхдийнхээ хүчтэй тал болох " + strengths.join(", ") + "-ийг дэмжиж, холбогдох мэргэжлээр зөвлөгөө авахыг зөвлөдөг.";
  } else {
    direction = "Чиглэл тодорхойгүй — илүү судалгаа шаардлагатай";
    potentialCareers = ["Олон чиглэлээр турших боломжтой"];
    advice = "Хүүхэд одоогоор тодорхой чиг хандлагагүй байна. Олон төрлийн хичээл, хоббит туршуулах нь зүйтэй.";
  }

  return { strengths, direction, potentialCareers, advice };
}
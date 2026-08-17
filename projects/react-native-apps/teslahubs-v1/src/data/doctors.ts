export type DoctorSpecialty = 'cardiology' | 'neurology' | 'orthopedics' | 'pediatrics' | 'dermatology' | 'dentistry' | 'surgery' | 'gynecology';

export const DOCTOR_SPECIALTIES: { key: DoctorSpecialty; label: string }[] = [
  { key: 'cardiology', label: 'Kardiologiya' },
  { key: 'neurology', label: 'Nevrologiya' },
  { key: 'orthopedics', label: 'Ortopediya' },
  { key: 'pediatrics', label: 'Pediatriya' },
  { key: 'dermatology', label: 'Dermatologiya' },
  { key: 'dentistry', label: 'Stomatologiya' },
  { key: 'surgery', label: 'Cərrahiyyə' },
  { key: 'gynecology', label: 'Ginekologiya' },
];

export function getSpecialtyLabel(key: DoctorSpecialty): string {
  return DOCTOR_SPECIALTIES.find(s => s.key === key)?.label ?? key;
}

export type Operation = {
  id: string;
  name: string;
  description: string;
  price: number;
};

export type Article = {
  title: string;
  year: number;
};

// Additional-credential fields, all of which feed the ranking algorithm
// below (getDoctorScore / getTopDoctors) — kept separate from the core
// profile fields so the scoring weights are easy to see and tune in one place.
export type Doctor = {
  id: string;
  name: string;
  specialty: DoctorSpecialty;
  photo: string;
  rating: number;
  reviewCount: number;
  experienceYears: number;
  bio: string;
  clinic: string;
  address: string;
  phone?: string;
  operations: Operation[];
  operationsPerformed: number;
  articles: Article[];
  newTechniques: string[];
  internationalConferences: number;
  certificates: string[];
};

export const DOCTORS: Doctor[] = [
  {
    id: 'aynur-mammadova',
    name: 'Dr. Aynur Məmmədova',
    specialty: 'cardiology',
    photo: 'https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=600&q=80',
    rating: 4.9,
    reviewCount: 214,
    experienceYears: 16,
    bio: 'Ürək-damar xəstəlikləri üzrə 16 illik təcrübəyə malikdir. Aritmiya, hipertoniya və ürək çatışmazlığı diaqnostikası və müalicəsi sahəsində ixtisaslaşıb. Avropa Kardiologiya Cəmiyyətinin üzvüdür.',
    clinic: 'Baku Heart Center',
    address: 'Bakı, Nərimanov rayonu, Tbilisi pr. 3',
    phone: '+994 12 404 10 10',
    operations: [
      { id: 'ecg', name: 'EKQ müayinəsi', description: 'Ürəyin elektrik fəaliyyətinin qeydə alınması', price: 40 },
      { id: 'echo', name: 'EXO-KQ (ürək ultrasəsi)', description: 'Ürək əzələsi və qapaqların ətraflı görüntülənməsi', price: 90 },
      { id: 'stent', name: 'Koronar stentləmə', description: 'Daralmış damarın stentlə bərpası', price: 3500 },
      { id: 'holter', name: 'Holter monitorinqi (24 saat)', description: '24 saatlıq ambulator EKQ izləməsi', price: 120 },
    ],
    operationsPerformed: 1850,
    articles: [
      { title: 'Aritmiya müalicəsində yeni yanaşmalar', year: 2023 },
      { title: 'Hipertoniyanın erkən diaqnostikası', year: 2021 },
    ],
    newTechniques: ['TAVI (transkateter aortal qapaq implantasiyası)', 'Kardiak MRT ilə erkən diaqnostika'],
    internationalConferences: 22,
    certificates: ['Avropa Kardiologiya Cəmiyyəti (ESC) sertifikatı', 'Amerika Ürək Assosiasiyası (AHA) ACLS'],
  },
  {
    id: 'elvin-hasanov',
    name: 'Dr. Elvin Həsənov',
    specialty: 'orthopedics',
    photo: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=600&q=80',
    rating: 4.8,
    reviewCount: 178,
    experienceYears: 12,
    bio: 'Ortopediya və travmatologiya üzrə cərrah. Oynaq protezləmə, artroskopiya və idman travmalarının müalicəsində geniş təcrübəyə malikdir.',
    clinic: 'Modern Hospital',
    address: 'Bakı, Yasamal rayonu, Süleyman Rəhimov küç. 41',
    phone: '+994 12 404 20 20',
    operations: [
      { id: 'knee-arthroscopy', name: 'Diz artroskopiyası', description: 'Minimal invaziv diz oynağı əməliyyatı', price: 2200 },
      { id: 'hip-replacement', name: 'Qalça oynağı protezləməsi', description: 'Tam qalça endoprotezləmə əməliyyatı', price: 5800 },
      { id: 'fracture-fix', name: 'Sınıq fiksasiyası', description: 'Metal plastinka/vint ilə sınığın bərpası', price: 1800 },
      { id: 'consult', name: 'İlkin baxış və konsultasiya', description: 'Diaqnoz və müalicə planının müəyyənləşdirilməsi', price: 50 },
    ],
    operationsPerformed: 1200,
    articles: [{ title: 'Robotik diz protezləməsində nəticələr', year: 2022 }],
    newTechniques: ['Robotik diz oynağı protezləməsi', 'PRP (trombositlə zəngin plazma) terapiyası'],
    internationalConferences: 9,
    certificates: ['AAOS (Amerika Ortopedik Cərrahlar Akademiyası) üzvlüyü', 'Artroskopik Cərrahiyyə Sertifikatı'],
  },
  {
    id: 'leyla-quliyeva',
    name: 'Dr. Leyla Quliyeva',
    specialty: 'pediatrics',
    photo: 'https://images.unsplash.com/photo-1594824476967-48c8b964273f?w=600&q=80',
    rating: 5.0,
    reviewCount: 302,
    experienceYears: 10,
    bio: 'Uşaq həkimi (pediatr). Yenidoğulmuşdan yeniyetməliyə qədər bütün yaş qruplarında peyvənd, inkişaf monitorinqi və kəskin xəstəliklərin müalicəsi ilə məşğul olur.',
    clinic: 'Uşaq Sağlamlıq Mərkəzi',
    address: 'Bakı, Xətai rayonu, Həzi Aslanov küç. 15',
    phone: '+994 12 404 30 30',
    operations: [
      { id: 'checkup', name: 'Ümumi baxış', description: 'Planlı inkişaf və sağlamlıq yoxlaması', price: 35 },
      { id: 'vaccination', name: 'Peyvəndləmə', description: 'Milli təqvimə uyğun peyvənd tətbiqi', price: 25 },
      { id: 'fever-treatment', name: 'Kəskin xəstəlik müayinəsi', description: 'Qızdırma, öskürək və s. şikayətlərin qiymətləndirilməsi', price: 30 },
    ],
    operationsPerformed: 40,
    articles: [{ title: 'Uşaqlarda peyvənd təqviminin effektivliyi', year: 2023 }],
    newTechniques: ['Rəqəmsal inkişaf monitorinqi tətbiqi'],
    internationalConferences: 5,
    certificates: ['Beynəlxalq Pediatriya Akademiyası sertifikatı'],
  },
  {
    id: 'tural-nagiyev',
    name: 'Dr. Tural Nağıyev',
    specialty: 'surgery',
    photo: 'https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=600&q=80',
    rating: 4.7,
    reviewCount: 156,
    experienceYears: 18,
    bio: 'Ümumi cərrah, laparoskopik əməliyyatlar üzrə ixtisaslaşıb. Qarın boşluğu orqanlarının cərrahi müalicəsi sahəsində 18 illik təcrübəsi var.',
    clinic: 'Baku Surgery Clinic',
    address: 'Bakı, Nizami rayonu, 28 May küç. 8',
    phone: '+994 12 404 40 40',
    operations: [
      { id: 'appendectomy', name: 'Appendektomiya (laparoskopik)', description: 'Kor bağırsağın minimal invaziv çıxarılması', price: 1600 },
      { id: 'hernia', name: 'Yırtıq əməliyyatı', description: 'Qarın divarı yırtığının bərpası', price: 1400 },
      { id: 'gallbladder', name: 'Öd kisəsinin çıxarılması', description: 'Laparoskopik xolesistektomiya', price: 1900 },
      { id: 'surgery-consult', name: 'Cərrahi konsultasiya', description: 'Əməliyyatönü qiymətləndirmə', price: 50 },
    ],
    operationsPerformed: 2600,
    articles: [
      { title: 'Laparoskopik cərrahiyyədə ERAS protokolunun tətbiqi', year: 2024 },
      { title: 'Yırtıq əməliyyatlarında residiv riskinin azaldılması', year: 2020 },
    ],
    newTechniques: ['Tam laparoskopik cərrahiyyə', 'ERAS (sürətləndirilmiş bərpa) protokolu'],
    internationalConferences: 15,
    certificates: ['Avropa Cərrahlar Kolleci (FEBS) sertifikatı'],
  },
  {
    id: 'sevinc-abbasova',
    name: 'Dr. Sevinc Abbasova',
    specialty: 'dermatology',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&q=80',
    rating: 4.9,
    reviewCount: 241,
    experienceYears: 9,
    bio: 'Dermatoloq və kosmetoloq. Dəri xəstəlikləri, akne müalicəsi, lazer və estetik prosedurlar üzrə ixtisaslaşıb.',
    clinic: 'Derma Clinic Baku',
    address: 'Bakı, Səbail rayonu, Neftçilər pr. 61',
    phone: '+994 12 404 50 50',
    operations: [
      { id: 'skin-consult', name: 'Dermatoloji baxış', description: 'Dəri müayinəsi və diaqnostika', price: 40 },
      { id: 'mole-removal', name: 'Xalların lazerlə çıxarılması', description: 'Zərərsiz xalların lazer üsulu ilə götürülməsi', price: 80 },
      { id: 'acne-treatment', name: 'Akne müalicə kursu', description: '6 seansdan ibarət kompleks müalicə', price: 350 },
      { id: 'laser-resurfacing', name: 'Lazer dəri yenilənməsi', description: 'Fraksional lazerlə üz dərisinin yenilənməsi', price: 280 },
    ],
    operationsPerformed: 900,
    articles: [{ title: 'Aknenin lazer terapiyası ilə müalicəsi', year: 2022 }],
    newTechniques: ['Fraksional CO2 lazer', 'PRP saç bərpası'],
    internationalConferences: 7,
    certificates: ['Amerika Dermatologiya Akademiyası (AAD) üzvlüyü'],
  },
  {
    id: 'rashad-ismayilov',
    name: 'Dr. Rəşad İsmayılov',
    specialty: 'dentistry',
    photo: 'https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=600&q=80',
    rating: 4.6,
    reviewCount: 189,
    experienceYears: 14,
    bio: 'Diş həkimi-implantoloq. İmplantasiya, protezləmə və estetik stomatologiya sahəsində 14 illik təcrübəyə malikdir.',
    clinic: 'Smile Dental Clinic',
    address: 'Bakı, Binəqədi rayonu, Hüseyn Cavid pr. 33',
    phone: '+994 12 404 60 60',
    operations: [
      { id: 'implant', name: 'Diş implantı', description: 'Bir ədəd titan implant quraşdırılması', price: 650 },
      { id: 'whitening', name: 'Dişlərin ağardılması', description: 'Peşəkar lazer ağardılma prosedur', price: 150 },
      { id: 'crown', name: 'Keramik tac', description: 'Bir dişə keramik tac hazırlanması', price: 320 },
      { id: 'dental-checkup', name: 'Baxış və gigiyena', description: 'Ümumi baxış + peşəkar diş təmizliyi', price: 45 },
    ],
    operationsPerformed: 1500,
    articles: [{ title: 'Rəqəmsal planlamanın implant uğur nisbətinə təsiri', year: 2023 }],
    newTechniques: ['Rəqəmsal 3D implant planlaması', 'Ağrısız lazer stomatologiyası'],
    internationalConferences: 6,
    certificates: ['ITI İmplantologiya sertifikatı'],
  },
];

export function getDoctor(id: string): Doctor | undefined {
  return DOCTORS.find(d => d.id === id);
}

// Ranking algorithm — combines rating, patient volume, and professional
// credentials into a single 0-100 score so we can surface "top doctors"
// instead of relying on rating alone (a doctor with few reviews can look
// artificially perfect). Each factor is capped before weighting so no single
// very large number (e.g. 3000 operations) can dominate the score.
const SCORE_WEIGHTS = {
  rating: 25, // out of 5 stars
  reviewCount: 15, // capped at 300 reviews
  experienceYears: 15, // capped at 20 years
  operationsPerformed: 20, // capped at 2500 operations
  articles: 10, // capped at 10 published articles
  internationalConferences: 10, // capped at 25 conferences
  certificates: 5, // capped at 5 certificates
};

function capped(value: number, cap: number): number {
  return Math.min(value, cap) / cap;
}

export function getDoctorScore(doctor: Doctor): number {
  const score =
    capped(doctor.rating, 5) * SCORE_WEIGHTS.rating +
    capped(doctor.reviewCount, 300) * SCORE_WEIGHTS.reviewCount +
    capped(doctor.experienceYears, 20) * SCORE_WEIGHTS.experienceYears +
    capped(doctor.operationsPerformed, 2500) * SCORE_WEIGHTS.operationsPerformed +
    capped(doctor.articles.length, 10) * SCORE_WEIGHTS.articles +
    capped(doctor.internationalConferences, 25) * SCORE_WEIGHTS.internationalConferences +
    capped(doctor.certificates.length, 5) * SCORE_WEIGHTS.certificates;
  return Math.round(score * 10) / 10;
}

export function getRankedDoctors(): Doctor[] {
  return [...DOCTORS].sort((a, b) => getDoctorScore(b) - getDoctorScore(a));
}

export function getTopDoctors(limit = 3): Doctor[] {
  return getRankedDoctors().slice(0, limit);
}

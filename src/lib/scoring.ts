export interface AssessmentData {
  productName: string;
  category: string;
  capacity: number;
  capacityUnit: string;
  price: number;
  certifications: string[];
  exportExperience: string;
}

export interface ScoreBreakdown {
  certificationScore: number;
  capacityScore: number;
  priceScore: number;
  experienceScore: number;
  totalScore: number;
}

export function calculateReadinessScore(data: AssessmentData): ScoreBreakdown {
  // Sertifikasi score = (number of certifications / 3) * 30, max 30
  const certificationScore = Math.min((data.certifications.length / 3) * 30, 30);

  // Kapasitas score = if production > 1000 units: 25, if 500-1000: 18, if 100-500: 12, else: 5
  let capacityScore = 5;
  if (data.capacity > 1000) capacityScore = 25;
  else if (data.capacity >= 500) capacityScore = 18;
  else if (data.capacity >= 100) capacityScore = 12;

  // Harga score = if price > 100000 IDR: 25, if 50000-100000: 18, else: 12
  let priceScore = 12;
  if (data.price > 100000) priceScore = 25;
  else if (data.price >= 50000) priceScore = 18;

  // Pengalaman score = if "Sudah rutin": 20, if "Pernah mencoba": 12, else: 5
  let experienceScore = 5;
  if (data.exportExperience === 'Sudah rutin ekspor') experienceScore = 20;
  else if (data.exportExperience === 'Pernah mencoba') experienceScore = 12;

  const totalScore = Math.round(certificationScore + capacityScore + priceScore + experienceScore);

  return {
    certificationScore: Math.round(certificationScore),
    capacityScore,
    priceScore,
    experienceScore,
    totalScore: Math.min(totalScore, 100),
  };
}

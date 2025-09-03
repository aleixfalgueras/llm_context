import { AffiliationStatus, Affiliation } from "@prisma/client"

export type AffiliationWithValid = Affiliation & {
  valid: boolean
}

export const AffiliationStatusLabels: Record<AffiliationStatus, string> = {
  [AffiliationStatus.GenY]: "Gen Y",
  [AffiliationStatus.Indigo]: "Indigo",
  [AffiliationStatus.LightWorker]: "Light Worker", 
  [AffiliationStatus.CristalClub]: "Cristal Club",
  [AffiliationStatus.D5Level]: "5 D Level",
  [AffiliationStatus.Walkin]: "Walkin",
  [AffiliationStatus.SevenStars]: "Seven Stars",
  [AffiliationStatus.InfinityStars]: "Infinity Stars",
  [AffiliationStatus.Alpha]: "Alpha",
  [AffiliationStatus.Omega]: "Omega"
}

export const AffiliationStatusEmoji = {
  [AffiliationStatus.GenY]: `${AffiliationStatusLabels[AffiliationStatus.GenY]} ⚡`,
  [AffiliationStatus.Indigo]: `${AffiliationStatusLabels[AffiliationStatus.Indigo]} 🌊`,
  [AffiliationStatus.LightWorker]: `${AffiliationStatusLabels[AffiliationStatus.LightWorker]} ⚒️`,
  [AffiliationStatus.CristalClub]: `${AffiliationStatusLabels[AffiliationStatus.CristalClub]} ❄️`,
  [AffiliationStatus.D5Level]: `${AffiliationStatusLabels[AffiliationStatus.D5Level]} 🔥`,
  [AffiliationStatus.Walkin]: `${AffiliationStatusLabels[AffiliationStatus.Walkin]} 🦅`,
  [AffiliationStatus.SevenStars]: `${AffiliationStatusLabels[AffiliationStatus.SevenStars]} ⭐`,
  [AffiliationStatus.InfinityStars]: `${AffiliationStatusLabels[AffiliationStatus.InfinityStars]} 🌟`,
  [AffiliationStatus.Alpha]: `${AffiliationStatusLabels[AffiliationStatus.Alpha]} 🐺`,
  [AffiliationStatus.Omega]: `${AffiliationStatusLabels[AffiliationStatus.Omega]} 🦁`,
}

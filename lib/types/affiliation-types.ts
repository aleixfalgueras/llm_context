import { AffiliationStatus } from "@prisma/client"

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

export const AffiliationStatusComissions = {
  [AffiliationStatus.GenY]: "10% of user's subscribed plan",
  [AffiliationStatus.Indigo]: "15% of user's subscribed plan",
  [AffiliationStatus.LightWorker]: "20% of user's subscribed plan & 10% discount on events",
  [AffiliationStatus.CristalClub]: "25% of user's subscribed plan & 10% discount on events & cryptocurrency asset and fund rewards",
  [AffiliationStatus.D5Level]: "30% of user's subscribed plan & 10% discount on events & cryptocurrency asset and fund rewards & Speaker Program",
  [AffiliationStatus.Walkin]: "30% of user's subscribed plan & 10% discount on events & cryptocurrency asset and fund rewards & Speaker Program & NFT Altruist",
  [AffiliationStatus.SevenStars]: "30% of user's subscribed plan & 10% discount on events & cryptocurrency asset and fund rewards & Speaker Program & NFT Altruist & 12.5% Bonus Events",
  [AffiliationStatus.InfinityStars]: "30% of user's subscribed plan & 10% discount on events & cryptocurrency asset and fund rewards & Speaker Program & NFT Altruist & 12.5% Bonus Events &  NFT Leader",
  [AffiliationStatus.Alpha]: "30% of user's subscribed plan & 10% discount on events & cryptocurrency asset and fund rewards & Speaker Program & NFT Altruist & 15% Bonus Events & NFT Leader",
  [AffiliationStatus.Omega]: "30% of user's subscribed plan & 10% discount on events & cryptocurrency asset and fund rewards & Speaker Program & NFT Altruist & 15% Bonus Events & NFT Erudith",
}

export const AffiliationStatusConditions = {
  [AffiliationStatus.GenY]: "10 users",
  [AffiliationStatus.Indigo]: "25 users",
  [AffiliationStatus.LightWorker]: "50 users",
  [AffiliationStatus.CristalClub]: `100 users & 1 ${AffiliationStatusLabels[AffiliationStatus.GenY]} user`,
  [AffiliationStatus.D5Level]: `200 users & 5 ${AffiliationStatusLabels[AffiliationStatus.GenY]} users`,
  [AffiliationStatus.Walkin]: `400 users & 10 ${AffiliationStatusLabels[AffiliationStatus.GenY]} users`,
  [AffiliationStatus.SevenStars]: `1000 users & 1 ${AffiliationStatusLabels[AffiliationStatus.CristalClub]} user`,
  [AffiliationStatus.InfinityStars]: `2000 users & 5 ${AffiliationStatusLabels[AffiliationStatus.CristalClub]} users`,
  [AffiliationStatus.Alpha]: `4000 users & 10 ${AffiliationStatusLabels[AffiliationStatus.CristalClub]} users`,
  [AffiliationStatus.Omega]: `1000 users & 1 ${AffiliationStatusLabels[AffiliationStatus.SevenStars]} user`,
}

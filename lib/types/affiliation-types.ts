
export enum AffiliationStatus {
  GenY = "Gen Y",
  Indigo = "Indigo",
  LightWorker = "Light Worker",
  CristalClub = "Cristal Club",
  D5Level = "5 D Level",
  Walkin = "Walkin",
  SevenStars = "Seven Stars",
  InfinityStars = "InfinityStars",
  Alpha = "Alpha",
  Omega = "Omega"
}

export const AffiliationStatusEmoji = {
  [AffiliationStatus.GenY]: "⚡",
  [AffiliationStatus.Indigo]: "🌊",
  [AffiliationStatus.LightWorker]: "⚒️",
  [AffiliationStatus.CristalClub]: "❄️",
  [AffiliationStatus.D5Level]: "🔥",
  [AffiliationStatus.Walkin]: "🦅",
  [AffiliationStatus.SevenStars]: "⭐",
  [AffiliationStatus.InfinityStars]: "🌟",
  [AffiliationStatus.Alpha]: "🐺",
  [AffiliationStatus.Omega]: "🦁",
}

export const AffiliationStatusComissions = {
  [AffiliationStatus.GenY]: "10% of user's subscribed plan",
  [AffiliationStatus.Indigo]: "15% of user's subscribed plan",
  [AffiliationStatus.LightWorker]: "20% of user's subscribed plan & 10% discount on events",
  [AffiliationStatus.CristalClub]: "25% of user's subscribed plan & 10% discount on events & Cryptocurrency asset and fund rewards",
  [AffiliationStatus.D5Level]: "30% of user's subscribed plan & 10% discount on events & Cryptocurrency asset and fund rewards & Speaker Program",
  [AffiliationStatus.Walkin]: "30% of user's subscribed plan & 10% discount on events & Cryptocurrency asset and fund rewards & Speaker Program & NFT Altruist",
  [AffiliationStatus.SevenStars]: "30% of user's subscribed plan & 10% discount on events & Cryptocurrency asset and fund rewards & Speaker Program & NFT Altruist & 12.5% Bonus Events",
  [AffiliationStatus.InfinityStars]: "30% of user's subscribed plan & 10% discount on events & Cryptocurrency asset and fund rewards & Speaker Program & NFT Altruist & 12.5% Bonus Events &  NFT Leader",
  [AffiliationStatus.Alpha]: "30% of user's subscribed plan & 10% discount on events & Cryptocurrency asset and fund rewards & Speaker Program & NFT Altruist & 15% Bonus Events & NFT Leader",
  [AffiliationStatus.Omega]: "30% of user's subscribed plan & 10% discount on events & Cryptocurrency asset and fund rewards & Speaker Program & NFT Altruist & 15% Bonus Events & NFT Erudith",
}

export const AffiliationStatusConditions = {
  [AffiliationStatus.GenY]: "10 users",
  [AffiliationStatus.Indigo]: "25 users",
  [AffiliationStatus.LightWorker]: "50 users",
  [AffiliationStatus.CristalClub]: `100 users & 1 ${AffiliationStatus.GenY}${AffiliationStatusEmoji[AffiliationStatus.GenY]} user`,
  [AffiliationStatus.D5Level]: `200 users & 5 ${AffiliationStatus.GenY}${AffiliationStatusEmoji[AffiliationStatus.GenY]} users`,
  [AffiliationStatus.Walkin]: `400 users & 10 ${AffiliationStatus.GenY}${AffiliationStatusEmoji[AffiliationStatus.GenY]} users`,
  [AffiliationStatus.SevenStars]: `1000 users & 1 ${AffiliationStatus.CristalClub}${AffiliationStatusEmoji[AffiliationStatus.CristalClub]} user`,
  [AffiliationStatus.InfinityStars]: `2000 users & 5 ${AffiliationStatus.CristalClub}${AffiliationStatusEmoji[AffiliationStatus.CristalClub]} users`,
  [AffiliationStatus.Alpha]: `4000 users & 10 ${AffiliationStatus.CristalClub}${AffiliationStatusEmoji[AffiliationStatus.CristalClub]} users`,
  [AffiliationStatus.Omega]: `1000 users & 1 ${AffiliationStatus.SevenStars}${AffiliationStatusEmoji[AffiliationStatus.SevenStars]} user`,
}

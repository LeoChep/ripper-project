// Feat 映射表：将 feat 名称映射到对应的模块路径和导出名称
export const FEAT_MAP: Record<string, { path: string; className: string }> = {
  WeaponFocus: { path: "../feat/WeaponFocus", className: "WeaponFocus" },
  WeaponExpertise: { path: "../feat/WeaponExpertise", className: "WeaponExpertise" },
  LightningReflexes: { path: "../feat/LightningReflexes", className: "LightningReflexes" },
  SuperiorWill: { path: "../feat/SuperiorWill", className: "SuperiorWill" },
};

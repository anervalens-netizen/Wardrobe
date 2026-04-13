function isTrue(value: string | undefined): boolean {
  return value?.trim() === "true";
}

export const serverFeatureFlags = {
  forceOnboarding: isTrue(process.env.FORCE_ONBOARDING),
  memoryCompactionEnabled: isTrue(process.env.MEMORY_COMPACTION_ENABLED),
};

export const publicFeatureFlags = {
  personaAdamEnabled: isTrue(process.env.NEXT_PUBLIC_PERSONA_ADAM_ENABLED),
  thematicSessionsEnabled: isTrue(process.env.NEXT_PUBLIC_THEMATIC_SESSIONS_ENABLED),
};

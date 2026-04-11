/**
 * COMPATIBILITY LAYER v1.0
 * Ensures new intelligence features don't break existing system
 * 
 * PRINCIPLE: Old system = engine, New system = intelligence layer
 * If intelligence fails → engine still runs
 */

interface FeatureFlags {
  viral_engine_enabled: boolean;
  real_data_enforcement_enabled: boolean;
  decision_engine_enabled: boolean;
  content_intelligence_enabled: boolean;
  hook_scoring_enabled: boolean;
  anti_suppression_enabled: boolean;
  traffic_detection_enabled: boolean;
  scale_engine_enabled: boolean;
}

const DEFAULT_FLAGS: FeatureFlags = {
  viral_engine_enabled: true,
  real_data_enforcement_enabled: true,
  decision_engine_enabled: false, // READ-ONLY initially
  content_intelligence_enabled: true,
  hook_scoring_enabled: true,
  anti_suppression_enabled: true,
  traffic_detection_enabled: true,
  scale_engine_enabled: false // OFF initially
};

let currentFlags: FeatureFlags = { ...DEFAULT_FLAGS };

/**
 * Safe wrapper for intelligence features
 * Returns fallback value if feature fails
 */
export async function safeIntelligence<T>(
  featureName: string,
  intelligenceFunction: () => Promise<T>,
  fallbackValue: T,
  options?: { log?: boolean; silent?: boolean }
): Promise<T> {
  try {
    const result = await intelligenceFunction();
    
    if (options?.log) {
      console.log(`✅ ${featureName} succeeded`);
    }
    
    return result;
  } catch (error) {
    if (!options?.silent) {
      console.error(`⚠️ ${featureName} failed, using fallback:`, error);
    }
    
    // Log degradation but don't throw
    logFeatureDegradation(featureName, error);
    
    return fallbackValue;
  }
}

/**
 * Check if a feature is enabled
 */
export function isFeatureEnabled(feature: keyof FeatureFlags): boolean {
  return currentFlags[feature] ?? false;
}

/**
 * Enable/disable features dynamically
 */
export function setFeatureFlag(feature: keyof FeatureFlags, enabled: boolean): void {
  currentFlags[feature] = enabled;
  console.log(`🔧 Feature ${feature}: ${enabled ? 'ENABLED' : 'DISABLED'}`);
}

/**
 * Get all feature flags
 */
export function getFeatureFlags(): FeatureFlags {
  return { ...currentFlags };
}

/**
 * Reset to defaults
 */
export function resetFeatureFlags(): void {
  currentFlags = { ...DEFAULT_FLAGS };
  console.log('🔄 Feature flags reset to defaults');
}

/**
 * Log feature degradation (non-blocking)
 */
function logFeatureDegradation(featureName: string, error: any): void {
  try {
    // Could store in degradation_log table
    console.warn(`📊 Feature degradation logged: ${featureName}`, {
      timestamp: new Date().toISOString(),
      error: error?.message || 'Unknown error'
    });
  } catch (logError) {
    // Even logging shouldn't crash the system
    console.error('Failed to log degradation:', logError);
  }
}

/**
 * Compatibility wrapper for viral hooks
 * Falls back to basic hooks if viral engine fails
 */
export async function getHooksWithFallback(params: {
  productName: string;
  niche: string;
  benefit?: string;
}): Promise<Array<{ text: string; total_score: number }>> {
  // Basic fallback hooks
  const fallbackHooks = [
    { 
      text: `Check out this ${params.productName} - amazing for ${params.benefit || 'you'}!`,
      total_score: 50
    },
    {
      text: `Best ${params.niche} product I've found`,
      total_score: 45
    },
    {
      text: `This ${params.productName} is worth trying`,
      total_score: 40
    }
  ];

  return fallbackHooks;
}

/**
 * Safe content generation wrapper
 * Never blocks publishing even if intelligence fails
 */
export function wrapContentGeneration<T>(
  originalFunction: () => Promise<T>,
  fallbackFunction: () => Promise<T>
): () => Promise<T> {
  return async () => {
    try {
      return await originalFunction();
    } catch (error) {
      console.warn('⚠️ Enhanced content generation failed, using fallback:', error);
      return await fallbackFunction();
    }
  };
}

/**
 * Safe database write wrapper
 * Logs errors but doesn't crash on failure
 */
export async function safeDbWrite(
  tableName: string,
  writeFunction: () => Promise<any>
): Promise<{ success: boolean; error?: any }> {
  try {
    await writeFunction();
    return { success: true };
  } catch (error) {
    console.error(`⚠️ Safe DB write failed for ${tableName}:`, error);
    return { success: false, error };
  }
}

/**
 * Advisory mode wrapper
 * Returns recommendations without blocking
 */
export async function advisoryMode<T>(
  actionName: string,
  advisoryFunction: () => Promise<T | null>
): Promise<T | null> {
  try {
    const result = await advisoryFunction();
    
    if (result) {
      console.log(`💡 Advisory: ${actionName}`, result);
    }
    
    return result;
  } catch (error) {
    console.warn(`⚠️ Advisory mode failed for ${actionName}:`, error);
    return null;
  }
}

/**
 * Graceful degradation status
 */
export interface DegradationStatus {
  system_health: 'healthy' | 'degraded' | 'critical';
  working_features: string[];
  degraded_features: string[];
  fallback_active: boolean;
}

let degradationStatus: DegradationStatus = {
  system_health: 'healthy',
  working_features: [],
  degraded_features: [],
  fallback_active: false
};

export function updateDegradationStatus(
  feature: string,
  working: boolean
): void {
  if (working) {
    degradationStatus.working_features.push(feature);
    degradationStatus.degraded_features = degradationStatus.degraded_features.filter(f => f !== feature);
  } else {
    degradationStatus.degraded_features.push(feature);
    degradationStatus.working_features = degradationStatus.working_features.filter(f => f !== feature);
  }

  // Update health status
  const degradedCount = degradationStatus.degraded_features.length;
  if (degradedCount === 0) {
    degradationStatus.system_health = 'healthy';
    degradationStatus.fallback_active = false;
  } else if (degradedCount < 3) {
    degradationStatus.system_health = 'degraded';
    degradationStatus.fallback_active = true;
  } else {
    degradationStatus.system_health = 'critical';
    degradationStatus.fallback_active = true;
  }
}

export function getDegradationStatus(): DegradationStatus {
  return { ...degradationStatus };
}

/**
 * Reset degradation tracking
 */
export function resetDegradationStatus(): void {
  degradationStatus = {
    system_health: 'healthy',
    working_features: [],
    degraded_features: [],
    fallback_active: false
  };
}
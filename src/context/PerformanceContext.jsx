import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import {
  PERFORMANCE_SETTINGS,
  TIERS,
  detectPerformanceTier,
} from '../config/performanceConfig';

export { TIERS } from '../config/performanceConfig';

const PerformanceContext = createContext(null);

export const usePerformance = () => {
  const context = useContext(PerformanceContext);
  if (!context) {
    throw new Error("usePerformance must be used within a PerformanceProvider");
  }
  return context;
};

export const PerformanceProvider = ({ children, initialTier }) => {
  const [tier, setTier] = useState(() => initialTier || detectPerformanceTier());

  const downgradeTier = useCallback(() => {
    setTier((current) => {
      if (current === TIERS.HIGH) return TIERS.MEDIUM;
      if (current === TIERS.MEDIUM) return TIERS.LOW;
      return TIERS.LOW;
    });
  }, []);

  const value = useMemo(() => ({
    tier,
    settings: PERFORMANCE_SETTINGS[tier],
    downgradeTier,
  }), [tier, downgradeTier]);

  return (
    <PerformanceContext.Provider value={value}>
      {children}
    </PerformanceContext.Provider>
  );
};

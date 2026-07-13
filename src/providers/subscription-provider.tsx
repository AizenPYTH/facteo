import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react';

import { PlanLimitModal } from '@/components/subscription/plan-limit-modal';

type SubscriptionContextValue = {
  showLimitModal: () => void;
  hideLimitModal: () => void;
};

const SubscriptionContext = createContext<SubscriptionContextValue | null>(null);

export function SubscriptionProvider({ children }: { children: ReactNode }) {
  const [limitModalVisible, setLimitModalVisible] = useState(false);

  const showLimitModal = useCallback(() => {
    setLimitModalVisible(true);
  }, []);

  const hideLimitModal = useCallback(() => {
    setLimitModalVisible(false);
  }, []);

  const value = useMemo(
    () => ({
      showLimitModal,
      hideLimitModal,
    }),
    [showLimitModal, hideLimitModal],
  );

  return (
    <SubscriptionContext.Provider value={value}>
      {children}
      <PlanLimitModal onClose={hideLimitModal} visible={limitModalVisible} />
    </SubscriptionContext.Provider>
  );
}

export function useSubscriptionContext(): SubscriptionContextValue {
  const context = useContext(SubscriptionContext);

  if (!context) {
    throw new Error('useSubscriptionContext must be used within SubscriptionProvider.');
  }

  return context;
}

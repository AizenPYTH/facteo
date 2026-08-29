import { useCallback, useEffect, useRef, useState } from 'react';

import { getFeatureIntroConfig } from '@/lib/feature-intros/config';
import {
  claimFeatureIntroPresentation,
  hasSeenFeatureIntro,
  markFeatureIntroSeen,
  resetFeatureIntro,
} from '@/lib/feature-intros/storage';
import type { FeatureIntroConfig, FeatureIntroId } from '@/lib/feature-intros/types';

type PresentOptions = {
  /** Called after the intro is dismissed (CTA / skip / don't show). */
  onContinue?: () => void;
  /** Force show even if already seen (Découvrir INVEQ). */
  force?: boolean;
};

export function useFeatureIntro(id: FeatureIntroId) {
  const config: FeatureIntroConfig = getFeatureIntroConfig(id);
  const [seen, setSeen] = useState<boolean | null>(null);
  const [visible, setVisible] = useState(false);
  const continueRef = useRef<(() => void) | null>(null);
  const presentationPendingRef = useRef(false);

  useEffect(() => {
    let mounted = true;
    void hasSeenFeatureIntro(id).then((value) => {
      if (mounted) {
        setSeen(value);
      }
    });
    return () => {
      mounted = false;
    };
  }, [id]);

  const finish = useCallback(
    async (opts?: { persist?: boolean; runContinue?: boolean }) => {
      const persist = opts?.persist ?? true;
      const runContinue = opts?.runContinue ?? true;
      if (persist) {
        await markFeatureIntroSeen(id);
        setSeen(true);
      }
      setVisible(false);
      const next = continueRef.current;
      continueRef.current = null;
      if (runContinue) {
        next?.();
      }
    },
    [id],
  );

  const present = useCallback(
    async (options?: PresentOptions) => {
      if (presentationPendingRef.current || visible) {
        return true;
      }

      continueRef.current = options?.onContinue ?? null;
      if (options?.force) {
        setVisible(true);
        return true;
      }
      if (seen === true) {
        options?.onContinue?.();
        return false;
      }
      // If storage not ready yet, don't block the feature.
      if (seen === null) {
        options?.onContinue?.();
        return false;
      }
      presentationPendingRef.current = true;
      const canPresent = await claimFeatureIntroPresentation(id);
      presentationPendingRef.current = false;

      if (canPresent) {
        setVisible(true);
        return true;
      }

      continueRef.current = null;
      options?.onContinue?.();
      return false;
    },
    [id, seen, visible],
  );

  /** Show intro on first use; otherwise run action immediately. */
  const runWithIntro = useCallback(
    (action: () => void) => {
      void present({ onContinue: action });
    },
    [present],
  );

  /** Auto-present once when a screen mounts (invoice/quote/stats). */
  const presentOnFirstVisit = useCallback(() => {
    if (seen !== false) {
      return;
    }
    // Defer so the host screen finishes its first paint (avoids startup jank/crashes).
    const timer = setTimeout(() => {
      void present();
    }, 450);
    return () => clearTimeout(timer);
  }, [present, seen]);

  const resetAndShow = useCallback(async () => {
    await resetFeatureIntro(id);
    setSeen(false);
    presentationPendingRef.current = false;
    continueRef.current = null;
    setVisible(true);
  }, [id]);

  return {
    id,
    config,
    seen,
    isReady: seen !== null,
    visible,
    present,
    runWithIntro,
    presentOnFirstVisit,
    resetAndShow,
    onClose: () => {
      void finish({ persist: false, runContinue: true });
    },
    onDontShowAgain: () => {
      void finish({ persist: true, runContinue: true });
    },
    onCta: () => {
      void finish({ persist: true, runContinue: true });
    },
  };
}

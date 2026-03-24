import { useCallback } from 'react';

import { translate, TranslationKey } from '@/core/i18n/translations';
import { useAppStore } from '@/core/store/app-store';

export const useI18n = () => {
  const locale = useAppStore((state) => state.locale);
  const t = useCallback((key: TranslationKey) => translate(locale, key), [locale]);

  return {
    locale,
    t,
  };
};

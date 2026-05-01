import { Select } from 'antd';

import { LOCALE_OPTIONS } from '@/constants';
import { useLocaleStore } from '@/stores/locale';

export function LanguageSwitcher() {
  const { currentLocale, setLocale } = useLocaleStore();

  return (
    <Select
      value={currentLocale}
      onChange={setLocale}
      options={LOCALE_OPTIONS}
      style={{ width: 90 }}
      variant='borderless'
    />
  );
}

import { Select } from 'antd';
import { useTranslation } from 'react-i18next';

const languages = [
  { value: 'zh', label: '中文' },
  { value: 'en', label: 'English' },
];

export function LanguageSwitcher() {
  const { i18n } = useTranslation();

  return (
    <Select
      value={i18n.language}
      onChange={value => i18n.changeLanguage(value)}
      options={languages}
      style={{ width: 90 }}
      variant='borderless'
    />
  );
}

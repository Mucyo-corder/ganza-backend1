import React, {createContext, useContext, useState, useCallback} from 'react';
import {translations, Language} from './translations';
import {Translation} from '../types';

interface LocalizationContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const LocalizationContext = createContext<LocalizationContextType>({
  language: 'kin',
  setLanguage: () => {},
  t: (key: string) => key,
});

export const useLocalization = () => useContext(LocalizationContext);

export const LocalizationProvider: React.FC<{children: React.ReactNode}> = ({children}) => {
  const [language, setLanguage] = useState<Language>('kin');

  const t = useCallback(
    (key: string, params?: Record<string, string | number>): string => {
      const text = translations[language][key] || translations['en'][key] || key;
      if (params) {
        return Object.entries(params).reduce(
          (acc, [k, v]) => acc.replace(`{${k}}`, String(v)),
          text
        );
      }
      return text;
    },
    [language]
  );

  return (
    <LocalizationContext.Provider value={{language, setLanguage, t}}>
      {children}
    </LocalizationContext.Provider>
  );
};

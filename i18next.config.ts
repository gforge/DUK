import { defineConfig } from 'i18next-cli'

export default defineConfig({
  locales: ['sv', 'en'],

  extract: {
    input: ['src/**/*.{ts,tsx}'],
    output: 'src/i18n/locales/{{language}}/{{namespace}}.json',

    defaultNS: 'translation',
    namespaceSeparator: false,
    keySeparator: '.',
    contextSeparator: '_',

    sort: true,
    indentation: 2,

    removeUnusedKeys: true,
    defaultValue: '__NOT_TRANSLATED__',

    primaryLanguage: 'sv',

    // Preserve keys constructed via template literals at runtime
    preservePatterns: [
      'role.*',
      'status.*',
      'category.*',
      'severity.*',
      'nextStep.*',
      'trigger.*',
      'audit.actions.*',
      'questionnaire.*',
      'eq.*',
    ],
  },
})

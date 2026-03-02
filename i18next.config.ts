import { defineConfig } from 'i18next-cli'
import { enumExtractionPlugin } from './i18n-enum-plugin'

export default defineConfig({
  locales: ['sv', 'en'],

  // Generates concrete keys for all t(`prefix.${enumValue}`) template literals.
  // When a TypeScript enum gains a new value, update ENUM_KEYS in i18n-enum-plugin.ts
  // and run `npm run generate:i18n` — the new key appears as __NOT_TRANSLATED__.
  plugins: [enumExtractionPlugin()],

  extract: {
    input: ['src/**/*.{ts,tsx}'],
    output: 'src/i18n/locales/{{language}}/{{namespace}}.json',

    defaultNS: 'translation',
    keySeparator: '.',
    contextSeparator: '_',

    sort: true,
    indentation: 2,

    removeUnusedKeys: true,
    defaultValue: '__NOT_TRANSLATED__',

    primaryLanguage: 'sv',

    // Keep only data-driven dynamic keys whose values are not fixed TypeScript
    // enums. Fixed-set enum namespaces are handled by enumExtractionPlugin.
    preservePatterns: [
      'nurseContact.suggestion.*', // runtime suggestion strings
      'audit.actions.*', // action label strings from event data
      'questionnaire.*', // questionnaire IDs from seed/runtime data
      'eq.*', // EQ-5D scoring dimension keys
      'policy.syntaxExample*', // number-indexed examples: syntaxExample1/2/3
      'policy.var*', // general variable label keys in policy editor
    ],
  },
})

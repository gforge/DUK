import { defineConfig } from 'i18next-cli'

// eslint-disable-next-line import/no-default-export
export default defineConfig({
  locales: ['sv', 'en'],

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

    // Keep dynamic keys whose values are data-driven and not statically analyzable.
    preservePatterns: [
      'contactActions.suggestion.*', // runtime suggestion strings
      'audit.actions.*', // action label strings from event data
      'questionnaire.*', // questionnaire IDs from seed/runtime data
      'eq.*', // EQ-5D scoring dimension keys
      'policy.syntaxExample*', // number-indexed examples: syntaxExample1/2/3
      'policy.var*', // general variable label keys in policy editor
    ],
  },
})

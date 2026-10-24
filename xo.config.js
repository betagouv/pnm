const xoConfig = [
  {
    semicolon: false,
    space: 2,
  },
  {
    // These rules target published packages, not npm workspaces
    files: ['apps/*/package.json', 'packages/*/package.json', 'pipelines/package.json'],
    rules: {
      'package-json/no-nested-exports': 'off',
      'package-json/no-wildcard-dependencies': 'off',
      'package-json/prefer-side-effects-field': 'off',
      'package-json/require-engines': 'off',
    },
  },
  {
    // GeoJSON is a format, not a package: its types have no runtime counterpart
    files: ['apps/web/package.json'],
    rules: {
      'package-json/no-orphan-types': 'off',
    },
  },
  {
    // No public URL or sharing image yet
    files: ['**/*.html'],
    rules: {
      '@html-eslint/require-open-graph-protocol': 'off',
    },
  },
]

export default xoConfig

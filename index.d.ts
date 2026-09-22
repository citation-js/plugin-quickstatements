import '@citation-js/core'

declare module '@citation-js/core' {
  namespace plugins {
    namespace output {
      interface Formats {
        quickstatements: () => string
      }
    }
  }
}

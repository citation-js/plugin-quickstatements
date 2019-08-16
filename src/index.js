import { plugins } from '@citation-js/core'

// Loads plugin definitions
import output from './output'

// Define plugin name (this is how it is referenced in the code)
const ref = '@quickstatements'

// Registers the plugin
// docs: https://citation.js.org/api/tutorial-plugins.html
plugins.add(ref, { output })

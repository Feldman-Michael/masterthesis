
/**
 * Main JS module loaded in the wizard.html page.
 * This module checks if the Google API is loaded and generates the wizard object and the wizard steps.
 * @author Cristian Anastasiu
 * @module main_wizard.js
 */

require([
  'base/js/namespace',
  'base/js/utils',
  'base/js/events',
  'jquery',
  'jqueryui',
  'require',
  'nbextensions/ma/client/common/js/googledrive/gdapi',
  'nbextensions/ma/client/html/wizard/steps'
], function(
  IPython,
  utils,
  events,
  $,
  jqueryui,
  require,
  gdapi,
  steps
) {
  console.log('Entered main.js of ma_distproject extension');
  
});

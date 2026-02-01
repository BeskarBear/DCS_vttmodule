/**
 * ============================================================================
 * DEATH CAP SAUTE - Main Entry Point
 * ============================================================================
 *
 * This is the main JavaScript file that Foundry VTT loads when the system starts.
 * It's specified in system.json under the "esmodules" key.
 *
 * WHAT THIS FILE DOES:
 * 1. Imports all our custom classes and configuration
 * 2. Registers our custom Actor document class (DCSActor)
 * 3. Registers our custom character sheet (RestaurantSheet)
 * 4. Sets up Handlebars helpers for use in templates
 * 5. Preloads HTML templates for faster rendering
 *
 * HOW FOUNDRY HOOKS WORK:
 * Foundry uses an event system called "Hooks". We register callback functions
 * that run at specific points during Foundry's lifecycle:
 * - "init" - Runs early, before the game is ready. Used for registration.
 * - "ready" - Runs after everything is loaded. Used for final setup.
 *
 * Hooks.once() means the callback only runs once (not every time the event fires)
 */

// ============================================================================
// IMPORTS
// ============================================================================
// ES6 modules let us split code into separate files and import what we need.
// The ".mjs" extension tells the browser this is a JavaScript module.

import { DCSActor } from "./documents/actor.mjs";      // Our custom Actor class
import { RestaurantSheet } from "./sheets/restaurant-sheet.mjs";  // Our sheet UI class
import { DCS_CONFIG } from "./helpers/config.mjs";     // All game data (mutations, locations, etc.)
import { createDefaultTables } from "./helpers/roll-tables.mjs";  // Helper to create roll tables

// ============================================================================
// INITIALIZATION HOOK
// ============================================================================
/**
 * The "init" hook runs when Foundry first starts loading the system.
 * This is where we register all our custom classes and configuration.
 *
 * IMPORTANT: At this point, the game world isn't fully loaded yet,
 * so we can't access things like actors or items. We can only do setup work.
 */
Hooks.once("init", async function() {
  // Log to browser console (F12 to open developer tools)
  console.log("Death Cap Saute | Initializing the Death Cap Saute Game System");

  // -------------------------------------------------------------------------
  // STORE REFERENCES ON GLOBAL GAME OBJECT
  // -------------------------------------------------------------------------
  /**
   * The "game" object is Foundry's global namespace. By adding our stuff to
   * game.deathcapsaute, we make it accessible from anywhere:
   * - In macros: game.deathcapsaute.introduceLocation('saltyDesert')
   * - In browser console for debugging
   * - In other modules that might want to interact with us
   */
  game.deathcapsaute = {
    DCSActor,           // Our Actor class (for instanceof checks, etc.)
    createDefaultTables, // Function to create roll tables in the world

    /**
     * Helper function to post a location's intro text to chat.
     * This can be called from a macro or the console:
     *   game.deathcapsaute.introduceLocation('saltyDesert')
     *
     * @param {string} locationKey - One of: saltyDesert, kingsCourt, onionSwamp,
     *                               meltedMountain, shroompLair
     */
    introduceLocation: async (locationKey) => {
      const location = CONFIG.DCS.locations[locationKey];
      if (!location) {
        ui.notifications.warn(`Unknown location: ${locationKey}`);
        return;
      }

      // Template literal (backticks) lets us embed variables with ${}
      // and write multi-line strings easily
      const messageContent = `
        <div class="dcs-location-intro">
          <h2>${location.label}</h2>
          <p class="flavor-text"><em>${location.flavorText}</em></p>
          <hr>
          <h3>Judge: ${location.judge}</h3>
          <p>${location.judgeDescription}</p>
          <p class="hazard-range"><strong>Hazard Range:</strong> ${location.hazardMin} - ${location.hazardMax}</p>
        </div>
      `;

      // ChatMessage.create() posts a message to the chat log
      await ChatMessage.create({ content: messageContent });
    }
  };

  // -------------------------------------------------------------------------
  // STORE SYSTEM CONFIGURATION
  // -------------------------------------------------------------------------
  /**
   * CONFIG is Foundry's global configuration object. Every system stores
   * its data here. By convention, we use a short namespace (DCS).
   *
   * This makes our game data accessible anywhere as CONFIG.DCS
   * For example: CONFIG.DCS.mutations.knifeFingers.description
   */
  CONFIG.DCS = DCS_CONFIG;

  // -------------------------------------------------------------------------
  // REGISTER CUSTOM DOCUMENT CLASS
  // -------------------------------------------------------------------------
  /**
   * In Foundry, "Documents" are data objects stored in the database.
   * Actors, Items, JournalEntries, etc. are all Documents.
   *
   * By default, Foundry uses its base Actor class. We override this with
   * our own DCSActor class that adds custom methods like rollChallengeDice().
   *
   * Now whenever an Actor is created or loaded, Foundry will use DCSActor
   * instead of the default Actor class.
   */
  CONFIG.Actor.documentClass = DCSActor;

  // -------------------------------------------------------------------------
  // REGISTER ACTOR SHEETS
  // -------------------------------------------------------------------------
  /**
   * "Sheets" are the UI windows that display when you open an Actor.
   * We register our custom ApplicationV2 sheet here.
   *
   * The registerSheet() options:
   * - types: Which actor types this sheet handles (from template.json)
   * - makeDefault: Whether this is the default sheet for that type
   * - label: Display name shown in the sheet selection dropdown
   */
  Actors.registerSheet("death-cap-saute", RestaurantSheet, {
    types: ["restaurant"],  // This sheet is for "restaurant" type actors
    makeDefault: true,      // Automatically use this sheet for new restaurants
    label: "DCS.SheetLabels.Restaurant"  // Localization key (see lang/en.json)
  });

  // -------------------------------------------------------------------------
  // PRELOAD TEMPLATES
  // -------------------------------------------------------------------------
  /**
   * Handlebars templates need to be compiled before they can be rendered.
   * Preloading them at startup caches the compiled templates, making
   * sheet rendering faster during gameplay.
   */
  return preloadHandlebarsTemplates();
});

// ============================================================================
// TEMPLATE PRELOADING
// ============================================================================
/**
 * Load and cache all Handlebars templates used by the system.
 *
 * The paths are relative to Foundry's Data folder, using the format:
 * "systems/{system-id}/path/to/template.hbs"
 *
 * @returns {Promise} Resolves when all templates are loaded
 */
async function preloadHandlebarsTemplates() {
  const templatePaths = [
    // Main sheet template
    "systems/death-cap-saute/templates/actor/restaurant-sheet.hbs",
    // We could add partial templates here if we had them:
    // "systems/death-cap-saute/templates/partials/team-member.hbs",
  ];

  // loadTemplates() is a Foundry helper that fetches and compiles templates
  return loadTemplates(templatePaths);
}

// ============================================================================
// HANDLEBARS HELPERS
// ============================================================================
/**
 * Handlebars is a templating language that Foundry uses for HTML templates.
 * "Helpers" are custom functions we can call from within templates.
 *
 * For example, if we register a helper called "eq", we can use it in templates:
 *   {{#if (eq value1 value2)}}They're equal!{{/if}}
 *
 * We register these in the "init" hook so they're available before any
 * templates are rendered.
 */
Hooks.once("init", function() {

  /**
   * Equality helper - checks if two values are equal
   * Usage: {{#if (eq someValue "expectedValue")}}...{{/if}}
   */
  Handlebars.registerHelper('eq', function(a, b) {
    return a === b;
  });

  /**
   * Array includes helper - checks if an array contains a value
   * Usage: {{#if (includes myArray "searchValue")}}...{{/if}}
   */
  Handlebars.registerHelper('includes', function(arr, val) {
    return arr && arr.includes(val);
  });

  /**
   * Get mutation data by key
   * Usage: {{#with (getMutation "knifeFingers")}}{{label}}: {{description}}{{/with}}
   *
   * This lets us look up mutation details from the config in templates
   */
  Handlebars.registerHelper('getMutation', function(key) {
    return CONFIG.DCS.mutations[key] || { label: key, description: "Unknown mutation" };
  });

  /**
   * Get location data by key
   * Usage: {{#with (getLocation "saltyDesert")}}{{label}}{{/with}}
   */
  Handlebars.registerHelper('getLocation', function(key) {
    return CONFIG.DCS.locations[key] || { label: key };
  });

  /**
   * Returns CSS class based on alive status
   * Usage: <div class="team-member {{deadClass member.alive}}">
   * Returns "" if alive, "dead" if not alive
   */
  Handlebars.registerHelper('deadClass', function(alive) {
    return alive ? '' : 'dead';
  });

  /**
   * Simple math helper for addition
   * Usage: {{math index "+" 1}} outputs index + 1
   * Useful for displaying 1-based indices (humans count from 1, arrays from 0)
   */
  Handlebars.registerHelper('math', function(a, operator, b) {
    a = parseFloat(a);
    b = parseFloat(b);
    switch (operator) {
      case '+': return a + b;
      case '-': return a - b;
      case '*': return a * b;
      case '/': return a / b;
      default: return a;
    }
  });
});

// ============================================================================
// READY HOOK
// ============================================================================
/**
 * The "ready" hook runs after Foundry is fully loaded and the game world
 * is available. This is a good place for:
 * - Final initialization that needs the world data
 * - Logging helpful information for users
 * - Setting up anything that depends on the game being fully loaded
 */
Hooks.once("ready", async function() {
  console.log("Death Cap Saute | System Ready");

  // Log some helpful commands users can run in the console or macros
  console.log("Death Cap Saute | Useful commands:");
  console.log("  game.deathcapsaute.introduceLocation('saltyDesert')");
  console.log("  game.deathcapsaute.introduceLocation('kingsCourt')");
  console.log("  game.deathcapsaute.introduceLocation('onionSwamp')");
  console.log("  game.deathcapsaute.introduceLocation('meltedMountain')");
  console.log("  game.deathcapsaute.introduceLocation('shroompLair')");
});

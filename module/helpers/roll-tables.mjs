/**
 * Roll Table Helpers
 *
 * This module provides functions to create the game's roll tables.
 * Roll tables let players roll randomly on a list of results.
 *
 * In Death Cap Saute, tables are used for:
 * - Shroomp types (what mushroom you find)
 * - Dish themes (what kind of dish to make)
 * - Hazard events (what danger you encounter)
 */

/**
 * Sample Shroomp types - these would ideally come from the rulebook
 * You can expand this list based on the actual game content
 */
export const SHROOMP_TYPES = [
  { range: [1, 1], text: "Spotted Deathcap" },
  { range: [2, 2], text: "Golden Chanterelle" },
  { range: [3, 3], text: "Crimson Puffball" },
  { range: [4, 4], text: "Midnight Morel" },
  { range: [5, 5], text: "Phosphor Shroom" },
  { range: [6, 6], text: "Royal Truffle" }
];

/**
 * Sample dish themes
 */
export const DISH_THEMES = [
  { range: [1, 1], text: "Rustic Comfort" },
  { range: [2, 2], text: "Elegant Presentation" },
  { range: [3, 3], text: "Spicy Challenge" },
  { range: [4, 4], text: "Sweet Surprise" },
  { range: [5, 5], text: "Traditional Classic" },
  { range: [6, 6], text: "Experimental Fusion" }
];

/**
 * Create a roll table document
 *
 * @param {string} name - Table name
 * @param {string} formula - Dice formula (e.g., "1d6")
 * @param {Array} results - Array of {range: [min, max], text: string}
 * @returns {Promise<RollTable>} The created table
 */
export async function createRollTable(name, formula, results) {
  // Check if table already exists
  const existing = game.tables.getName(name);
  if (existing) {
    console.log(`Death Cap Saute | Roll table "${name}" already exists`);
    return existing;
  }

  // Format results for Foundry's RollTable
  const tableResults = results.map((r, idx) => ({
    text: r.text,
    range: r.range,
    weight: 1
  }));

  // Create the table
  const table = await RollTable.create({
    name: name,
    formula: formula,
    results: tableResults,
    displayRoll: true
  });

  console.log(`Death Cap Saute | Created roll table: ${name}`);
  return table;
}

/**
 * Create all default roll tables for the system
 * Call this from a macro or the ready hook
 */
export async function createDefaultTables() {
  await createRollTable("Shroomp Types", "1d6", SHROOMP_TYPES);
  await createRollTable("Dish Themes", "1d6", DISH_THEMES);

  ui.notifications.info("Death Cap Saute roll tables created!");
}

/**
 * ============================================================================
 * DEATH CAP SAUTE - Actor Document Class
 * ============================================================================
 *
 * This file defines DCSActor, our custom Actor class that extends Foundry's
 * built-in Actor class.
 *
 * WHAT IS A DOCUMENT?
 * In Foundry VTT, a "Document" is any data object stored in the database.
 * Actors, Items, Scenes, JournalEntries are all Documents. They have:
 * - A unique ID
 * - Persistent data stored in the database
 * - Methods for CRUD operations (Create, Read, Update, Delete)
 *
 * WHY EXTEND ACTOR?
 * By extending Actor, we can:
 * 1. Add custom methods (like rollChallengeDice())
 * 2. Override data preparation (calculate totals automatically)
 * 3. Add computed properties (like aliveTeamMembers)
 *
 * The custom class is registered in death-cap-saute.mjs:
 *   CONFIG.Actor.documentClass = DCSActor;
 */
export class DCSActor extends Actor {

  // ==========================================================================
  // DATA PREPARATION
  // ==========================================================================
  /**
   * Foundry calls prepareDerivedData() automatically whenever the actor's
   * data changes. This is where we calculate values that depend on other data.
   *
   * THE DATA PREPARATION FLOW:
   * 1. prepareBaseData() - Set up data that doesn't depend on anything else
   * 2. prepareEmbeddedDocuments() - Process owned items (not used in this system)
   * 3. prepareDerivedData() - Calculate values from other data
   *
   * We override prepareDerivedData() to calculate running totals.
   */
  prepareDerivedData() {
    // Always call the parent class method first!
    // This ensures Foundry's base processing runs before our custom code.
    super.prepareDerivedData();

    // Get a reference to this actor's system data
    // In Foundry v10+, custom data is stored in actor.system (not actor.data.data)
    const systemData = this.system;

    // Only process restaurant actors (in case we add other types later)
    if (this.type !== 'restaurant') return;

    // Calculate running totals across all completed challenges
    this._calculateTotals(systemData);
  }

  /**
   * Calculate running totals for presentation, flavor, originality, and shroomps.
   * This runs automatically whenever the actor data changes.
   *
   * @param {Object} systemData - Reference to this.system
   * @private - The underscore prefix is a convention indicating this is internal
   */
  _calculateTotals(systemData) {
    // Initialize our totals object
    const totals = {
      presentation: 0,
      flavor: 0,
      originality: 0,
      shroomps: 0
    };

    // Loop through all challenges and sum up scores from completed ones
    const challenges = systemData.challenges || {};

    // Object.entries() converts {key: value} to [[key, value], ...]
    // This lets us loop through object properties easily
    for (const [key, challenge] of Object.entries(challenges)) {
      if (challenge.completed) {
        // The || 0 ensures we don't add undefined/null values
        totals.presentation += challenge.presentation || 0;
        totals.flavor += challenge.flavor || 0;
        totals.originality += challenge.originality || 0;

        // Count shroomps earned from challenges
        if (challenge.earnedShroomp) totals.shroomps += 1;
      }
    }

    // Add end-game bonus shroomps (one for each category if highest)
    const endGame = systemData.endGame || {};
    if (endGame.presentationBonus) totals.shroomps += 1;
    if (endGame.flavorBonus) totals.shroomps += 1;
    if (endGame.originalityBonus) totals.shroomps += 1;
    if (endGame.wildShroomp) totals.shroomps += 1;

    // Store the calculated totals back on the system data
    // This makes them available in templates as {{system.totals.shroomps}}
    systemData.totals = totals;
  }

  // ==========================================================================
  // COMPUTED PROPERTIES (GETTERS)
  // ==========================================================================
  /**
   * JavaScript "getters" are special properties that run a function when accessed.
   * Instead of calling actor.aliveTeamMembers(), we can just use actor.aliveTeamMembers
   *
   * These provide convenient ways to query the actor's state.
   */

  /**
   * Get teamMembers as an array, whether stored as array or object.
   * Foundry's form handling can convert arrays to objects when using
   * dot notation in form field names (e.g., "system.teamMembers.0.name").
   * @returns {Array} Array of team member objects
   * @private
   */
  get _teamMembersArray() {
    const members = this.system.teamMembers;
    if (!members) return [];
    if (Array.isArray(members)) return members;
    // Convert object with numeric keys to array
    return Object.values(members);
  }

  /**
   * Count how many team members are still alive.
   * @returns {number} Number of alive team members (0-3)
   */
  get aliveTeamMembers() {
    // filter() creates a new array with only elements that pass the test
    // The arrow function (m => m.alive) returns true for alive members
    return this._teamMembersArray.filter(m => m.alive).length;
  }

  /**
   * Count how many team members have died.
   * @returns {number} Number of dead team members (0-3)
   */
  get deadTeamMembers() {
    return this._teamMembersArray.filter(m => !m.alive).length;
  }

  /**
   * Check if the restaurant is eliminated (all team members dead).
   * In the game rules, you can't participate in future rounds if everyone dies.
   * @returns {boolean} True if all team members are dead
   */
  get isEliminated() {
    return this.aliveTeamMembers === 0;
  }

  // ==========================================================================
  // DICE ROLLING METHODS
  // ==========================================================================
  /**
   * These methods handle the game's dice mechanics. They:
   * 1. Create a Roll object with the dice formula
   * 2. Evaluate the roll (actually roll the dice)
   * 3. Post the results to chat
   * 4. Return the results for further processing
   *
   * All methods are async because they involve database operations (chat messages)
   */

  /**
   * Roll 5d6 for a cooking challenge.
   * This is the main roll players make each round - 5 dice to assign to
   * Presentation, Flavor, Originality, Hazard1, and Hazard2.
   *
   * @returns {Promise<{roll: Roll, results: number[]}>} The roll and individual results
   */
  async rollChallengeDice() {
    // Create a new Roll object with the formula "5d6"
    // Roll is Foundry's class for handling dice, supporting formulas like "2d20+5"
    const roll = new Roll("5d6");

    // evaluate() actually rolls the dice. It's async in Foundry v10+
    await roll.evaluate();

    // Extract the individual die results from the roll
    // roll.dice[0] is the first dice term (the 5d6)
    // .results is an array of {result: number} objects
    const results = roll.dice[0].results.map(r => r.result);

    // Build the HTML content for the chat message
    // Template literals (backticks) let us embed expressions with ${}
    const messageContent = `
      <div class="dcs-roll challenge-dice">
        <h3>${this.name} rolls Challenge Dice</h3>
        <div class="dice-results">
          ${results.map(r => `<span class="die">${r}</span>`).join('')}
        </div>
        <p class="hint">Assign these to: Presentation, Flavor, Originality, Hazard 1, Hazard 2</p>
        <p class="hint">You may use one Mutation from an alive team member.</p>
      </div>
    `;

    // Create a chat message to display the roll
    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: messageContent,
      // Including the roll object enables Foundry's dice animation and roll display
      rolls: [roll]
    });

    // Return both the Roll object and the extracted results
    return { roll, results };
  }

  /**
   * Roll on the Shroomp table to determine the Shroomp requirement and Dish Theme.
   * Each location has its own table with 6 entries (one per die face).
   *
   * @param {string} locationKey - The location key (e.g., "saltyDesert")
   * @returns {Promise<Object|null>} The table entry or null if location not found
   */
  async rollShroompTable(locationKey) {
    // Look up the location data from our config
    const location = CONFIG.DCS.locations[locationKey];
    if (!location) {
      // ui.notifications shows a toast message to the user
      ui.notifications.error(`Unknown location: ${locationKey}`);
      return null;
    }

    // Roll a single d6
    const roll = new Roll("1d6");
    await roll.evaluate();
    const result = roll.total;  // .total gives the final number

    // Find the matching entry in the shroomp table
    // Array.find() returns the first element that matches the condition
    const tableEntry = location.shroompTable.find(e => e.roll === result);

    // Build and send the chat message
    const messageContent = `
      <div class="dcs-roll shroomp-table">
        <h3>Shroomp & Dish Theme - ${location.label}</h3>
        <p><strong>Roll:</strong> ${result}</p>
        <p><strong>Shroomp Requirement:</strong> ${tableEntry.requirement}</p>
        <p><strong>Dish Theme:</strong> ${tableEntry.dishTheme}</p>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: messageContent,
      rolls: [roll]
    });

    return tableEntry;
  }

  /**
   * Roll on the Hazard table to determine what danger the team faces.
   * Each location has hazards with different values and optional penalties.
   *
   * @param {string} locationKey - The location key
   * @param {number} bonus - Bonus to add to hazard value (from Curse of the Moon Ladle)
   * @returns {Promise<Object|null>} The hazard entry with effectiveValue added
   */
  async rollHazardTable(locationKey, bonus = 0) {
    const location = CONFIG.DCS.locations[locationKey];
    if (!location) {
      ui.notifications.error(`Unknown location: ${locationKey}`);
      return null;
    }

    const roll = new Roll("1d6");
    await roll.evaluate();
    const result = roll.total;

    const tableEntry = location.hazardTable.find(e => e.roll === result);

    // Apply any bonus to the hazard value
    // (Curse of the Moon Ladle mutation adds +1 to hazard value)
    const effectiveValue = tableEntry.value + bonus;

    // Build message with conditional penalty display
    // The ${condition ? valueIfTrue : valueIfFalse} is a ternary operator
    const messageContent = `
      <div class="dcs-roll hazard-table">
        <h3>Hazard Roll - ${location.label}</h3>
        <p><strong>Roll:</strong> ${result}</p>
        <p><strong>Hazard:</strong> ${tableEntry.name}</p>
        <p><strong>Hazard Value:</strong> ${tableEntry.value}${bonus ? ` (+${bonus} bonus = ${effectiveValue})` : ''}</p>
        ${tableEntry.penalty ? `<p><strong>Added Penalty (if failed):</strong> ${tableEntry.penalty}</p>` : ''}
        <p class="hint">Your Hazard dice total must meet or beat ${effectiveValue} to survive!</p>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: messageContent,
      rolls: [roll]
    });

    // Use spread operator (...) to copy tableEntry and add effectiveValue
    return { ...tableEntry, effectiveValue };
  }

  /**
   * Roll for Wild Shroomp at the end of the game.
   * This determines which special condition grants a bonus Shroomp.
   *
   * @returns {Promise<Object>} The wild shroomp table entry
   */
  async rollWildShroomp() {
    const roll = new Roll("1d6");
    await roll.evaluate();
    const result = roll.total;

    // Look up in the wildShroompTable from config
    const tableEntry = CONFIG.DCS.wildShroompTable.find(e => e.roll === result);

    const messageContent = `
      <div class="dcs-roll wild-shroomp">
        <h3>Wild Shroomp Roll</h3>
        <p><strong>Roll:</strong> ${result}</p>
        <p><strong>${tableEntry.name}</strong></p>
        <p><strong>Requirement:</strong> ${tableEntry.requirement}</p>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: messageContent,
      rolls: [roll]
    });

    return tableEntry;
  }

  /**
   * Roll a single d6, typically for mutations like Tongue Sight.
   * This is a utility method for any situation needing one die.
   *
   * @param {string} purpose - Description of why we're rolling (shown in chat)
   * @returns {Promise<number>} The die result (1-6)
   */
  async rollSingleDie(purpose = "Mutation") {
    const roll = new Roll("1d6");
    await roll.evaluate();

    const messageContent = `
      <div class="dcs-roll single-die">
        <h3>${this.name} - ${purpose}</h3>
        <p><strong>Result:</strong> <span class="die">${roll.total}</span></p>
      </div>
    `;

    await ChatMessage.create({
      speaker: ChatMessage.getSpeaker({ actor: this }),
      content: messageContent,
      rolls: [roll]
    });

    return roll.total;
  }

  // ==========================================================================
  // TEAM MANAGEMENT METHODS
  // ==========================================================================

  /**
   * Kill a team member (mark them as dead).
   * When a team member dies, their mutation is no longer available.
   *
   * @param {number} index - Index of the team member (0, 1, or 2)
   */
  async killTeamMember(index) {
    // foundry.utils.deepClone() creates a deep copy of the array
    // We need to clone because we can't modify the data directly
    const teamMembers = foundry.utils.deepClone(this.system.teamMembers);

    if (teamMembers[index]) {
      // Mark the team member as dead
      teamMembers[index].alive = false;

      // Update the actor in the database
      // The path uses dot notation: "system.teamMembers" points to the array
      await this.update({ "system.teamMembers": teamMembers });

      // Post a death announcement to chat
      const member = teamMembers[index];
      await ChatMessage.create({
        speaker: ChatMessage.getSpeaker({ actor: this }),
        content: `<div class="dcs-death"><strong>${member.name}</strong> from ${this.name} has perished! Their mutation (${member.mutation}) is no longer available.</div>`
      });
    }
  }

  /**
   * Post location flavor text and judge info to chat.
   * This introduces a new cooking challenge to all players.
   *
   * @param {string} locationKey - The location key
   */
  async introduceLocation(locationKey) {
    const location = CONFIG.DCS.locations[locationKey];
    if (!location) return;

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

    await ChatMessage.create({
      content: messageContent,
      whisper: []  // Empty array = public message (not a whisper)
    });
  }
}

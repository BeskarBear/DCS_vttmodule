/**
 * ============================================================================
 * DEATH CAP SAUTE - Restaurant Sheet Class
 * ============================================================================
 *
 * This file defines RestaurantSheet, our custom ActorSheet class that creates
 * the UI for restaurant actors.
 *
 * WHAT IS AN ACTORSHEET?
 * In Foundry VTT, every Actor has a "sheet" - a window that opens when you
 * double-click the actor. The sheet displays data and provides UI for editing.
 *
 * ActorSheet is Foundry's base class for these windows. By extending it, we can:
 * 1. Use our own HTML template (the .hbs file)
 * 2. Prepare custom data for the template
 * 3. Add our own event listeners (button clicks, etc.)
 * 4. Control the sheet's appearance and behavior
 *
 * The sheet is registered in death-cap-saute.mjs:
 *   Actors.registerSheet("death-cap-saute", RestaurantSheet, {...});
 */
export class RestaurantSheet extends ActorSheet {

  // ==========================================================================
  // STATIC OPTIONS
  // ==========================================================================
  /**
   * defaultOptions is a static getter that defines the sheet's configuration.
   * Foundry calls this when creating the sheet to get its settings.
   *
   * IMPORTANT: This is a static getter, not a regular method!
   * Static means it belongs to the class itself, not instances.
   * Getter means it's accessed like a property: RestaurantSheet.defaultOptions
   *
   * We use foundry.utils.mergeObject() to combine our options with the
   * parent class defaults, ensuring we don't lose any base functionality.
   */
  static get defaultOptions() {
    return foundry.utils.mergeObject(super.defaultOptions, {
      // CSS classes applied to the sheet window
      // These let us style this sheet specifically in our CSS
      classes: ["death-cap-saute", "sheet", "actor", "restaurant"],

      // Path to our Handlebars template (relative to Foundry's Data folder)
      template: "systems/death-cap-saute/templates/actor/restaurant-sheet.hbs",

      // Default window dimensions in pixels
      width: 750,
      height: 900,

      // Tab configuration for the navigation
      // navSelector: CSS selector for the tab navigation element
      // contentSelector: CSS selector for the tab content container
      // initial: Which tab to show when the sheet first opens
      tabs: [{
        navSelector: ".sheet-tabs",
        contentSelector: ".sheet-body",
        initial: "team"
      }]
    });
  }

  // ==========================================================================
  // DATA PREPARATION
  // ==========================================================================
  /**
   * getData() prepares all the data that will be available in our template.
   * Foundry calls this every time the sheet needs to render.
   *
   * TEMPLATE CONTEXT:
   * Whatever we return from getData() becomes the "context" in our .hbs template.
   * For example, if we return { foo: "bar" }, we can use {{foo}} in the template.
   *
   * @returns {Object} The data context for the Handlebars template
   */
  async getData() {
    // Get the base data from the parent ActorSheet class
    // This includes things like actor, data, editable, etc.
    const context = await super.getData();

    // Get a clean copy of the actor's data
    // toObject(false) means don't include derived data, just the raw stored data
    const actorData = this.actor.toObject(false);

    // Add the system data to context for easy access in templates
    // Now we can use {{system.teamMembers}} instead of {{actor.system.teamMembers}}
    context.system = actorData.system;

    // Add our game configuration so templates can access mutations, locations, etc.
    // This lets us iterate over CONFIG.DCS.mutations in the template
    context.config = CONFIG.DCS;

    // Flag to check if the sheet is editable (for conditional rendering)
    context.editable = this.isEditable;

    // -------------------------------------------------------------------------
    // MUTATION OPTIONS
    // -------------------------------------------------------------------------
    // Transform the mutations config into an array for the dropdown selects.
    // Object.entries() converts {key: value} to [[key, value], ...]
    // Then map() transforms each entry into our desired format.
    context.mutationOptions = Object.entries(CONFIG.DCS.mutations).map(([key, data]) => ({
      key,                      // "knifeFingers", "tongueSight", etc.
      label: data.label,        // "Knife Fingers", "Tongue Sight", etc.
      description: data.description
    }));

    // -------------------------------------------------------------------------
    // CHALLENGE DATA
    // -------------------------------------------------------------------------
    // Merge stored challenge data with location config for display.
    // This gives each challenge card access to both the saved values
    // (like presentation score) and the config info (like hazard range).
    context.challengeData = this._prepareChallengeData(context.system.challenges);

    // -------------------------------------------------------------------------
    // DERIVED VALUES
    // -------------------------------------------------------------------------
    // These use the getters we defined in DCSActor
    context.aliveCount = this.actor.aliveTeamMembers;
    context.deadCount = this.actor.deadTeamMembers;
    context.isEliminated = this.actor.isEliminated;

    return context;
  }

  /**
   * Prepare challenge data by merging stored data with location configuration.
   * This creates a complete object for each challenge with both saved scores
   * and static location info like judge names and hazard ranges.
   *
   * @param {Object} challenges - The stored challenge data from actor.system.challenges
   * @returns {Array} Array of challenge objects ready for display
   * @private
   */
  _prepareChallengeData(challenges) {
    // Define the order challenges should appear (matches the game's progression)
    const locationOrder = ['saltyDesert', 'kingsCourt', 'onionSwamp', 'meltedMountain', 'shroompLair'];

    // Map each location key to a complete challenge object
    return locationOrder.map(key => {
      // Get the static config for this location
      const config = CONFIG.DCS.locations[key];
      // Get any stored data for this challenge (or empty object if none)
      const data = challenges[key] || {};

      return {
        key,                          // The location key for data binding
        label: config.label,          // Display name like "Salty Desert"
        order: config.order,          // Challenge number (1-5)
        hazardMin: config.hazardMin,  // Minimum hazard value
        hazardMax: config.hazardMax,  // Maximum hazard value
        judge: config.judge,          // Judge name
        ...data,                      // Spread in all stored data (scores, notes, etc.)

        // Calculate totals for display
        // The || 0 ensures we get numbers even if fields are empty
        dishTotal: (data.presentation || 0) + (data.flavor || 0) + (data.originality || 0),
        hazardTotal: (data.hazard1 || 0) + (data.hazard2 || 0)
      };
    });
  }

  // ==========================================================================
  // EVENT LISTENERS
  // ==========================================================================
  /**
   * activateListeners() sets up all the interactive functionality for our sheet.
   * Foundry calls this after the HTML is rendered and injected into the DOM.
   *
   * JQUERY AND THE HTML PARAMETER:
   * The html parameter is a jQuery object containing our rendered template.
   * jQuery lets us find elements and attach event handlers easily:
   *   html.find('.some-class')  - Find all elements with that class
   *   .click(handler)           - Attach a click handler
   *   .change(handler)          - Attach a change handler (for inputs/checkboxes)
   *
   * THE BIND PATTERN:
   * We use .bind(this) on our handler functions. This is because JavaScript
   * loses the 'this' context when passing functions as callbacks. Without bind,
   * 'this' inside the handler would be undefined or the DOM element.
   * With bind, 'this' correctly refers to our RestaurantSheet instance.
   *
   * @param {jQuery} html - The rendered HTML as a jQuery object
   */
  activateListeners(html) {
    // Always call the parent's activateListeners first!
    // This sets up Foundry's built-in functionality like form saving.
    super.activateListeners(html);

    // Only add interactive listeners if the sheet is editable
    // (Observers in Foundry can view sheets but not edit them)
    if (!this.isEditable) return;

    // -------------------------------------------------------------------------
    // ROLL BUTTONS
    // -------------------------------------------------------------------------
    // Each button class triggers a different roll method on our actor
    html.find('.roll-challenge-dice').click(this._onRollChallengeDice.bind(this));
    html.find('.roll-shroomp-table').click(this._onRollShroompTable.bind(this));
    html.find('.roll-hazard-table').click(this._onRollHazardTable.bind(this));
    html.find('.roll-wild-shroomp').click(this._onRollWildShroomp.bind(this));
    html.find('.roll-single-die').click(this._onRollSingleDie.bind(this));
    html.find('.introduce-location').click(this._onIntroduceLocation.bind(this));

    // -------------------------------------------------------------------------
    // TEAM MEMBER MANAGEMENT
    // -------------------------------------------------------------------------
    html.find('.kill-member').click(this._onKillMember.bind(this));
    html.find('.revive-member').click(this._onReviveMember.bind(this));

    // -------------------------------------------------------------------------
    // CHALLENGE STATUS TOGGLES
    // -------------------------------------------------------------------------
    // .change() fires when checkbox state changes
    html.find('.shroomp-checkbox').change(this._onToggleShroomp.bind(this));
    html.find('.complete-challenge').change(this._onToggleChallengeComplete.bind(this));
  }

  // ==========================================================================
  // EVENT HANDLERS
  // ==========================================================================
  /**
   * These methods are called when users interact with the sheet.
   * They typically:
   * 1. Prevent the default browser behavior (event.preventDefault())
   * 2. Extract data from the event (which button, what data attributes)
   * 3. Call a method on the actor to do the actual work
   * 4. The actor's methods handle rolling dice and posting to chat
   */

  /**
   * Handle clicking the "Roll 5d6 (Challenge Dice)" button.
   * This is the main roll players make each cooking challenge.
   *
   * @param {Event} event - The click event
   */
  async _onRollChallengeDice(event) {
    // Prevent form submission (buttons inside forms trigger submit by default)
    event.preventDefault();
    // Call the actor's roll method - it handles everything
    await this.actor.rollChallengeDice();
  }

  /**
   * Handle clicking the mushroom button to roll Shroomp/Dish Theme.
   * Uses data-location attribute to know which location's table to roll on.
   *
   * @param {Event} event - The click event
   */
  async _onRollShroompTable(event) {
    event.preventDefault();
    // Get the location from the button's data-location attribute
    // In the template: data-location="{{challenge.key}}"
    // Here: event.currentTarget.dataset.location
    const location = event.currentTarget.dataset.location;
    await this.actor.rollShroompTable(location);
  }

  /**
   * Handle clicking the skull button to roll Hazard.
   * Uses data-location attribute to know which location's table to roll on.
   *
   * @param {Event} event - The click event
   */
  async _onRollHazardTable(event) {
    event.preventDefault();
    const location = event.currentTarget.dataset.location;
    await this.actor.rollHazardTable(location);
  }

  /**
   * Handle clicking the "Roll Wild Shroomp" button (Totals tab).
   * This determines the end-game bonus condition.
   *
   * @param {Event} event - The click event
   */
  async _onRollWildShroomp(event) {
    event.preventDefault();
    await this.actor.rollWildShroomp();
  }

  /**
   * Handle clicking the "Roll 1d6 (Mutation)" button.
   * A generic single die roll for mutations that need it.
   *
   * @param {Event} event - The click event
   */
  async _onRollSingleDie(event) {
    event.preventDefault();
    // Get the purpose from data-purpose attribute (defaults to "Mutation Roll")
    const purpose = event.currentTarget.dataset.purpose || "Mutation Roll";
    await this.actor.rollSingleDie(purpose);
  }

  /**
   * Handle clicking the scroll button to post location intro to chat.
   * This reads out the location's flavor text and judge info.
   *
   * @param {Event} event - The click event
   */
  async _onIntroduceLocation(event) {
    event.preventDefault();
    const location = event.currentTarget.dataset.location;
    await this.actor.introduceLocation(location);
  }

  /**
   * Handle clicking the "Kill" button for a team member.
   * Shows a confirmation dialog before actually killing them.
   *
   * @param {Event} event - The click event
   */
  async _onKillMember(event) {
    event.preventDefault();
    // Get the team member index from data-index attribute
    const index = parseInt(event.currentTarget.dataset.index);
    const member = this.actor.system.teamMembers[index];

    // Dialog.confirm() shows a yes/no dialog and returns true/false
    // This is an async operation - we await the user's response
    const confirmed = await Dialog.confirm({
      title: "Kill Team Member",
      content: `<p>Are you sure ${member.name || "this team member"} should die?</p><p>Their mutation will no longer be available.</p>`
    });

    // Only kill if they confirmed
    if (confirmed) {
      await this.actor.killTeamMember(index);
    }
  }

  /**
   * Handle clicking the "Revive" button for a dead team member.
   * This is for corrections - if someone clicked Kill by mistake.
   * No confirmation needed since this is a "fix" action.
   *
   * @param {Event} event - The click event
   */
  async _onReviveMember(event) {
    event.preventDefault();
    const index = parseInt(event.currentTarget.dataset.index);

    // We need to clone the array before modifying it
    // Foundry's data is immutable - we can't modify it directly
    const teamMembers = foundry.utils.deepClone(this.actor.system.teamMembers);

    if (teamMembers[index]) {
      teamMembers[index].alive = true;
      // Update the actor in the database
      await this.actor.update({ "system.teamMembers": teamMembers });
    }
  }

  /**
   * Handle toggling the "Earned Shroomp" checkbox for a challenge.
   * Updates the actor's data to reflect whether they earned the shroomp.
   *
   * @param {Event} event - The change event from the checkbox
   */
  async _onToggleShroomp(event) {
    // event.currentTarget is the checkbox element
    const checkbox = event.currentTarget;
    // Get the location from the checkbox's data attribute
    const location = checkbox.dataset.location;

    // Build the data path using dot notation
    // Example: "system.challenges.saltyDesert.earnedShroomp"
    const path = `system.challenges.${location}.earnedShroomp`;

    // Update using computed property name syntax: { [path]: value }
    // This lets us use a variable as the property name
    await this.actor.update({ [path]: checkbox.checked });
  }

  /**
   * Handle toggling the "Challenge Complete" checkbox.
   * Completed challenges contribute to the running totals.
   *
   * @param {Event} event - The change event from the checkbox
   */
  async _onToggleChallengeComplete(event) {
    const checkbox = event.currentTarget;
    const location = checkbox.dataset.location;
    const path = `system.challenges.${location}.completed`;
    await this.actor.update({ [path]: checkbox.checked });
  }
}

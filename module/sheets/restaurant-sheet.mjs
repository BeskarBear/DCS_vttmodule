/**
 * ============================================================================
 * DEATH CAP SAUTE - Restaurant Sheet Class (ApplicationV2)
 * ============================================================================
 *
 * This file defines RestaurantSheet using Foundry's V2 Application framework.
 * V2 is the modern API introduced in Foundry v12 and required from v16+.
 *
 * KEY DIFFERENCES FROM V1:
 * - Uses static DEFAULT_OPTIONS instead of static get defaultOptions()
 * - Uses static PARTS to define template sections
 * - Uses _prepareContext() instead of getData()
 * - Uses _onRender() instead of activateListeners()
 * - Event handling uses native DOM instead of jQuery
 */

const { ActorSheetV2 } = foundry.applications.sheets;
const { HandlebarsApplicationMixin } = foundry.applications.api;

/**
 * RestaurantSheet - The character sheet for restaurant actors.
 *
 * We extend ActorSheetV2 and mix in HandlebarsApplicationMixin to get
 * Handlebars template rendering support.
 */
export class RestaurantSheet extends HandlebarsApplicationMixin(ActorSheetV2) {

  // ==========================================================================
  // STATIC CONFIGURATION
  // ==========================================================================

  /**
   * Default application options. In V2, this is a static property, not a getter.
   * We use Object.assign to merge with parent defaults.
   */
  static DEFAULT_OPTIONS = {
    // CSS classes applied to the application window
    classes: ["death-cap-saute", "sheet", "actor", "restaurant"],

    // Position and dimensions
    position: {
      width: 750,
      height: 900
    },

    // Window configuration
    window: {
      resizable: true
    },

    // Actions define event handlers for elements with data-action attributes
    actions: {
      rollChallengeDice: RestaurantSheet.#onRollChallengeDice,
      rollShroompTable: RestaurantSheet.#onRollShroompTable,
      rollHazardTable: RestaurantSheet.#onRollHazardTable,
      rollWildShroomp: RestaurantSheet.#onRollWildShroomp,
      rollSingleDie: RestaurantSheet.#onRollSingleDie,
      introduceLocation: RestaurantSheet.#onIntroduceLocation,
      killMember: RestaurantSheet.#onKillMember,
      reviveMember: RestaurantSheet.#onReviveMember,
      editImage: RestaurantSheet.#onEditImage
    },

    // Form configuration
    form: {
      submitOnChange: true
    }
  };

  /**
   * Template parts define the sections of our sheet.
   * Each part can have its own template and be re-rendered independently.
   */
  static PARTS = {
    // Main sheet template - contains the entire sheet
    sheet: {
      template: "systems/death-cap-saute/templates/actor/restaurant-sheet.hbs"
    }
  };

  /**
   * Configure tabs for the sheet.
   * V2 uses a different tab configuration format.
   */
  tabGroups = {
    primary: "team"
  };

  // ==========================================================================
  // DATA PREPARATION
  // ==========================================================================

  /**
   * The window title for the application.
   * @returns {string}
   */
  get title() {
    return this.actor.name || "Restaurant";
  }

  /**
   * Prepare the data context for rendering.
   * This replaces getData() from V1.
   *
   * @param {object} options - Rendering options
   * @returns {Promise<object>} The context object for the template
   */
  async _prepareContext(options) {
    // Get base context from parent class
    const context = await super._prepareContext(options);

    // Get a clean copy of the actor's data
    const actorData = this.actor.toObject(false);

    // Add the actor reference for template access (V2 doesn't include this by default)
    context.actor = this.actor;

    // Add the system data to context for easy access in templates
    context.system = actorData.system;

    // Add our game configuration so templates can access mutations, locations, etc.
    context.config = CONFIG.DCS;

    // Flag to check if the sheet is editable
    context.editable = this.isEditable;

    // -------------------------------------------------------------------------
    // MUTATION OPTIONS
    // -------------------------------------------------------------------------
    context.mutationOptions = Object.entries(CONFIG.DCS.mutations).map(([key, data]) => ({
      key,
      label: data.label,
      description: data.description
    }));

    // -------------------------------------------------------------------------
    // CHALLENGE DATA
    // -------------------------------------------------------------------------
    context.challengeData = this._prepareChallengeData(context.system.challenges);

    // -------------------------------------------------------------------------
    // DERIVED VALUES
    // -------------------------------------------------------------------------
    context.aliveCount = this.actor.aliveTeamMembers;
    context.deadCount = this.actor.deadTeamMembers;
    context.isEliminated = this.actor.isEliminated;

    // -------------------------------------------------------------------------
    // TAB CONFIGURATION
    // -------------------------------------------------------------------------
    context.tabs = this._prepareTabs(options);

    return context;
  }

  /**
   * Prepare tab configuration for the sheet.
   *
   * @param {object} options - Application options
   * @returns {object} Tab configuration
   */
  _prepareTabs(options) {
    const tabs = {
      team: {
        id: "team",
        group: "primary",
        icon: "fas fa-users",
        label: "Team",
        active: false,
        cssClass: ""
      },
      challenges: {
        id: "challenges",
        group: "primary",
        icon: "fas fa-utensils",
        label: "Challenges",
        active: false,
        cssClass: ""
      },
      totals: {
        id: "totals",
        group: "primary",
        icon: "fas fa-trophy",
        label: "Totals",
        active: false,
        cssClass: ""
      }
    };

    // Set active tab
    const activeTab = this.tabGroups.primary || "team";
    if (tabs[activeTab]) {
      tabs[activeTab].active = true;
      tabs[activeTab].cssClass = "active";
    }

    return tabs;
  }

  /**
   * Prepare challenge data by merging stored data with location configuration.
   *
   * @param {Object} challenges - The stored challenge data
   * @returns {Array} Array of challenge objects ready for display
   * @private
   */
  _prepareChallengeData(challenges) {
    const locationOrder = ['saltyDesert', 'kingsCourt', 'onionSwamp', 'meltedMountain', 'shroompLair'];

    return locationOrder.map(key => {
      const config = CONFIG.DCS.locations[key];
      const data = challenges[key] || {};

      return {
        key,
        label: config.label,
        order: config.order,
        hazardMin: config.hazardMin,
        hazardMax: config.hazardMax,
        judge: config.judge,
        ...data,
        dishTotal: (data.presentation || 0) + (data.flavor || 0) + (data.originality || 0),
        hazardTotal: (data.hazard1 || 0) + (data.hazard2 || 0)
      };
    });
  }

  // ==========================================================================
  // RENDERING
  // ==========================================================================

  /**
   * Called after the application is rendered.
   * This replaces activateListeners() from V1.
   * We use this for any DOM manipulation that can't be done with actions.
   *
   * @param {object} context - The prepared context
   * @param {object} options - Rendering options
   */
  _onRender(context, options) {
    super._onRender(context, options);

    // Only add interactive listeners if the sheet is editable
    if (!this.isEditable) return;

    // Set up checkbox change handlers (these need special handling)
    const html = this.element;

    // Shroomp checkbox toggles
    html.querySelectorAll('.shroomp-checkbox').forEach(checkbox => {
      checkbox.addEventListener('change', this._onToggleShroomp.bind(this));
    });

    // Challenge complete checkbox toggles
    html.querySelectorAll('.complete-challenge').forEach(checkbox => {
      checkbox.addEventListener('change', this._onToggleChallengeComplete.bind(this));
    });

    // Tab click handling
    html.querySelectorAll('.sheet-tabs .item').forEach(tab => {
      tab.addEventListener('click', this._onTabClick.bind(this));
    });
  }

  /**
   * Handle tab clicks manually since V2 has different tab handling.
   *
   * @param {Event} event - The click event
   */
  _onTabClick(event) {
    event.preventDefault();
    const tab = event.currentTarget;
    const tabName = tab.dataset.tab;
    const group = tab.closest('.tabs').dataset.group || 'primary';

    // Update tab group state
    this.tabGroups[group] = tabName;

    // Update active states in DOM
    const tabContainer = tab.closest('.tabs');
    tabContainer.querySelectorAll('.item').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');

    // Update content visibility
    const body = this.element.querySelector('.sheet-body');
    body.querySelectorAll('.tab').forEach(content => {
      content.classList.toggle('active', content.dataset.tab === tabName);
    });
  }

  // ==========================================================================
  // ACTION HANDLERS
  // ==========================================================================
  /**
   * In V2, actions are static methods called with the event and target.
   * The 'this' context is bound to the application instance automatically.
   */

  /**
   * Handle clicking the "Roll 5d6 (Challenge Dice)" button.
   * @param {PointerEvent} event - The click event
   * @param {HTMLElement} target - The element that triggered the action
   */
  static async #onRollChallengeDice(event, target) {
    event.preventDefault();
    await this.actor.rollChallengeDice();
  }

  /**
   * Handle clicking the mushroom button to roll Shroomp/Dish Theme.
   * @param {PointerEvent} event - The click event
   * @param {HTMLElement} target - The element that triggered the action
   */
  static async #onRollShroompTable(event, target) {
    event.preventDefault();
    const location = target.dataset.location;
    await this.actor.rollShroompTable(location);
  }

  /**
   * Handle clicking the skull button to roll Hazard.
   * @param {PointerEvent} event - The click event
   * @param {HTMLElement} target - The element that triggered the action
   */
  static async #onRollHazardTable(event, target) {
    event.preventDefault();
    const location = target.dataset.location;
    await this.actor.rollHazardTable(location);
  }

  /**
   * Handle clicking the "Roll Wild Shroomp" button.
   * @param {PointerEvent} event - The click event
   * @param {HTMLElement} target - The element that triggered the action
   */
  static async #onRollWildShroomp(event, target) {
    event.preventDefault();
    await this.actor.rollWildShroomp();
  }

  /**
   * Handle clicking the "Roll 1d6 (Mutation)" button.
   * @param {PointerEvent} event - The click event
   * @param {HTMLElement} target - The element that triggered the action
   */
  static async #onRollSingleDie(event, target) {
    event.preventDefault();
    const purpose = target.dataset.purpose || "Mutation Roll";
    await this.actor.rollSingleDie(purpose);
  }

  /**
   * Handle clicking the scroll button to post location intro.
   * @param {PointerEvent} event - The click event
   * @param {HTMLElement} target - The element that triggered the action
   */
  static async #onIntroduceLocation(event, target) {
    event.preventDefault();
    const location = target.dataset.location;
    await this.actor.introduceLocation(location);
  }

  /**
   * Handle clicking the "Kill" button for a team member.
   * @param {PointerEvent} event - The click event
   * @param {HTMLElement} target - The element that triggered the action
   */
  static async #onKillMember(event, target) {
    event.preventDefault();
    const index = parseInt(target.dataset.index);
    const member = this.actor.system.teamMembers[index];

    const confirmed = await foundry.applications.api.DialogV2.confirm({
      window: { title: "Kill Team Member" },
      content: `<p>Are you sure ${member.name || "this team member"} should die?</p><p>Their mutation will no longer be available.</p>`,
      yes: { default: true }
    });

    if (confirmed) {
      await this.actor.killTeamMember(index);
    }
  }

  /**
   * Handle clicking the "Revive" button for a dead team member.
   * @param {PointerEvent} event - The click event
   * @param {HTMLElement} target - The element that triggered the action
   */
  static async #onReviveMember(event, target) {
    event.preventDefault();
    const index = parseInt(target.dataset.index);

    const teamMembers = foundry.utils.deepClone(this.actor.system.teamMembers);

    if (teamMembers[index]) {
      teamMembers[index].alive = true;
      await this.actor.update({ "system.teamMembers": teamMembers });
    }
  }

  /**
   * Handle clicking the profile image to change it.
   * Opens Foundry's file picker to select a new image.
   * @param {PointerEvent} event - The click event
   * @param {HTMLElement} target - The element that triggered the action
   */
  static async #onEditImage(event, target) {
    event.preventDefault();
    const fp = new FilePicker({
      type: "image",
      current: this.actor.img,
      callback: async (path) => {
        await this.actor.update({ img: path });
      }
    });
    fp.render(true);
  }

  // ==========================================================================
  // INSTANCE EVENT HANDLERS
  // ==========================================================================
  /**
   * These are instance methods for events that need special handling
   * (like checkbox change events that aren't click actions).
   */

  /**
   * Handle toggling the "Earned Shroomp" checkbox.
   * @param {Event} event - The change event
   */
  async _onToggleShroomp(event) {
    const checkbox = event.currentTarget;
    const location = checkbox.dataset.location;
    const path = `system.challenges.${location}.earnedShroomp`;
    await this.actor.update({ [path]: checkbox.checked });
  }

  /**
   * Handle toggling the "Challenge Complete" checkbox.
   * @param {Event} event - The change event
   */
  async _onToggleChallengeComplete(event) {
    const checkbox = event.currentTarget;
    const location = checkbox.dataset.location;
    const path = `system.challenges.${location}.completed`;
    await this.actor.update({ [path]: checkbox.checked });
  }
}

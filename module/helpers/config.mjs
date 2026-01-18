/**
 * ============================================================================
 * DEATH CAP SAUTE - Configuration Data
 * ============================================================================
 *
 * This file contains all the static game data from the Death Cap Saute rulebook.
 * It's the "source of truth" for game content like mutations, locations, and tables.
 *
 * WHY A SEPARATE CONFIG FILE?
 * 1. Keeps data separate from logic (easier to maintain)
 * 2. Easy to update if game rules change
 * 3. Can be referenced from anywhere via CONFIG.DCS
 * 4. Makes the codebase more organized and readable
 *
 * HOW IT'S USED:
 * This object is imported in death-cap-saute.mjs and stored on CONFIG.DCS:
 *   CONFIG.DCS = DCS_CONFIG;
 *
 * Then anywhere in the system, you can access it:
 *   CONFIG.DCS.mutations.knifeFingers.description
 *   CONFIG.DCS.locations.saltyDesert.hazardTable
 *   CONFIG.DCS.wildShroompTable
 */

export const DCS_CONFIG = {

  // ==========================================================================
  // MUTATIONS
  // ==========================================================================
  /**
   * Mutations are special abilities each team member can have.
   * - Each player has 3 team members, each with a different mutation
   * - A mutation can only be used once per challenge round
   * - Dead team members cannot use their mutations
   * - The Gastromancy mutation lets you use dead members' mutations
   *
   * DATA STRUCTURE:
   * - Key: camelCase identifier used in code (e.g., "knifeFingers")
   * - label: Display name for the UI (e.g., "Knife Fingers")
   * - description: The rules text explaining what the mutation does
   */
  mutations: {
    knifeFingers: {
      label: "Knife Fingers",
      description: "Re-roll all 5 dice."
    },
    tongueSight: {
      label: "Tongue Sight",
      description: "Roll a die. On 1-3, -2 to your dice. On 4-6, +2 to your dice. Split as you wish."
    },
    permanentChefHat: {
      label: "Permanent Chef Hat",
      description: "Re-roll any single die."
    },
    gastromancy: {
      label: "Gastromancy",
      description: "You can use the Mutation of a dead person from any team."
    },
    soupGlands: {
      label: "Soup Glands",
      description: "Set your highest die to any number."
    },
    buttMouth: {
      label: "Butt Mouth",
      description: "-1 to any die and +1 to any die."
    },
    cannibalConnoisseur: {
      label: "Cannibal Connoisseur",
      description: "+1 to a die for each dead team member."
    },
    curseOfTheMoonLadle: {
      label: "Curse of the Moon Ladle",
      description: "+1 to the Hazard roll this round. This can stack if other players also use this Mutation."
    }
  },

  // ==========================================================================
  // LOCATIONS (Cooking Challenges)
  // ==========================================================================
  /**
   * The game has 5 cooking challenges, each at a different location.
   * Players progress through them in order (Salty Desert → Shroomp Lair).
   *
   * LOCATION DATA STRUCTURE:
   * - label: Display name of the location
   * - order: Which challenge number (1-5)
   * - judge: Name of the NPC judge for this location
   * - judgeDescription: Flavor text describing the judge
   * - flavorText: Atmospheric description read when starting the challenge
   * - hazardMin/hazardMax: Range of hazard values for this location
   * - shroompTable: Array of 6 entries (one per die face 1-6)
   * - hazardTable: Array of 6 entries (one per die face 1-6)
   *
   * SHROOMP TABLE ENTRIES:
   * - roll: The die result (1-6)
   * - requirement: What the player must achieve to earn a Shroomp
   * - dishTheme: The theme their dish must follow
   *
   * HAZARD TABLE ENTRIES:
   * - roll: The die result (1-6)
   * - name: Name of the hazard
   * - value: The target number to beat with hazard dice
   * - penalty: What happens if you fail (null if no penalty)
   */
  locations: {
    // -------------------------------------------------------------------------
    // CHALLENGE 1: SALTY DESERT
    // -------------------------------------------------------------------------
    saltyDesert: {
      label: "Salty Desert",
      order: 1,
      judge: "Billy Wishbones",
      judgeDescription: "An elder chef and sentient skeleton. Her bones have become encrusted in salt. Won the last Shroomp competition over 50 years ago.",
      flavorText: "The pink and white salt dunes coruscate as the sun rises over the great desert. The ancient cooking stations are weathered by the sharp wind. Something rumbles deep beneath the ground.",
      hazardMin: 5,
      hazardMax: 8,
      // Shroomp requirements and dish themes (roll 1d6 to determine)
      shroompTable: [
        { roll: 1, requirement: "All same number", dishTheme: "Comfort Classics" },
        { roll: 2, requirement: "All different numbers", dishTheme: "Desert Delights" },
        { roll: 3, requirement: "3 in a row", dishTheme: "Sippin' and Dippin'" },
        { roll: 4, requirement: "Pair of 6's", dishTheme: "Salt and Sand" },
        { roll: 5, requirement: "Total 12+", dishTheme: "Bone Broth" },
        { roll: 6, requirement: "No 1's", dishTheme: "Skeleton's Feast" }
      ],
      // Hazards to overcome (roll 1d6 to determine)
      hazardTable: [
        { roll: 1, name: "Mirage of the Knife", value: 5, penalty: "Swap Presentation with Originality" },
        { roll: 2, name: "Cactus Gnomes", value: 6, penalty: null },
        { roll: 3, name: "Salt Goblin", value: 6, penalty: "-1 to lowest Dish die" },
        { roll: 4, name: "Pickling Pond", value: 7, penalty: null },
        { roll: 5, name: "Mirage of the Knife", value: 7, penalty: "Swap Presentation with Originality" },
        { roll: 6, name: "Cactus Gnomes", value: 8, penalty: "-2 to any Dish die" }
      ]
    },

    // -------------------------------------------------------------------------
    // CHALLENGE 2: KING'S COURT
    // -------------------------------------------------------------------------
    kingsCourt: {
      label: "King's Court",
      order: 2,
      judge: "Scrangly, the Rat King",
      judgeDescription: "An ancient, rusting animatronic construct that inexplicably gained artificial intelligence. Their taste in food varies with their mood.",
      flavorText: "Heralded as a site of historic culinary significance in the Wastelands, the ruins of The King's Court are meticulously maintained by a dedicated few. Researchers believe it was once a common area where food was served in something called a 'mall.'",
      hazardMin: 5,
      hazardMax: 9,
      shroompTable: [
        { roll: 1, requirement: "Dish score 10+", dishTheme: "Doomsday Pepper" },
        { roll: 2, requirement: "No 2's or 5's", dishTheme: "Stir Fried Sorcery" },
        { roll: 3, requirement: "Pair in Dish dice", dishTheme: "Royal Feast" },
        { roll: 4, requirement: "All Dish dice odd", dishTheme: "Court Cuisine" },
        { roll: 5, requirement: "Presentation 5+", dishTheme: "Animatronic Appetizers" },
        { roll: 6, requirement: "All Dish dice even", dishTheme: "Mall Food Revival" }
      ],
      hazardTable: [
        { roll: 1, name: "Crumb Rats", value: 5, penalty: null },
        { roll: 2, name: "Acidic Critics", value: 6, penalty: "-1 to Flavor" },
        { roll: 3, name: "Kitchen Cutlery Rain", value: 7, penalty: null },
        { roll: 4, name: "Acidic Critics", value: 7, penalty: "-2 to Flavor" },
        { roll: 5, name: "The Tenderizer", value: 8, penalty: "-1 to all Dish dice" },
        { roll: 6, name: "The Tenderizer", value: 9, penalty: "-2 to all Dish dice" }
      ]
    },

    // -------------------------------------------------------------------------
    // CHALLENGE 3: ONION SWAMP
    // -------------------------------------------------------------------------
    onionSwamp: {
      label: "Onion Swamp",
      order: 3,
      judge: "The Shallot Witch",
      judgeDescription: "A practitioner of gastromancy with a focused interest in food properties beyond look and taste. Her palette prefers dishes that would be considered 'absolute shit' by most.",
      flavorText: "The acrid air hits the senses like a big, rotten dump truck. Ironwood docks host a thriving black market where the most forbidden ingredients are bartered away. One false step in the waters may pull you under, never to resurface.",
      hazardMin: 6,
      hazardMax: 10,
      shroompTable: [
        { roll: 1, requirement: "Lowest die is 3+", dishTheme: "Swamp Stew" },
        { roll: 2, requirement: "Total Dish 11+", dishTheme: "Forbidden Flavors" },
        { roll: 3, requirement: "No matching dice", dishTheme: "Witch's Brew" },
        { roll: 4, requirement: "Originality 5+", dishTheme: "Black Market Bites" },
        { roll: 5, requirement: "3 of a kind in Dish", dishTheme: "Onion Layers" },
        { roll: 6, requirement: "Survive Hazard", dishTheme: "Gastromancy Special" }
      ],
      hazardTable: [
        { roll: 1, name: "Reeking Rapscallions", value: 6, penalty: null },
        { roll: 2, name: "The Searing Fumes", value: 6, penalty: "Lose 1 Mutation from Team" },
        { roll: 3, name: "Onion Ogre", value: 7, penalty: null },
        { roll: 4, name: "The Bog of Beguiling", value: 8, penalty: "Re-roll each Dish die and put in same place" },
        { roll: 5, name: "The Devil's Lettuce", value: 9, penalty: null },
        { roll: 6, name: "Fish of the Day", value: 10, penalty: "Score 0 in Category of your choice" }
      ]
    },

    // -------------------------------------------------------------------------
    // CHALLENGE 4: MELTED MOUNTAIN
    // -------------------------------------------------------------------------
    meltedMountain: {
      label: "Melted Mountain",
      order: 4,
      judge: "Gooble Froot",
      judgeDescription: "A massive, mutated slug with a bad boy attitude. His thick coat of fuzz is always cultivating a new flavor through fermentation. Rumored to swap recipes with the Shroomp Lord each full moon.",
      flavorText: "The dense forests along the mountainside give off a dull green glow that can be seen from miles away at night. Unknown shrieks and growls pierce through the cold fog. Pockets of searing radiation turn to sub-zero temperatures at the summit.",
      hazardMin: 6,
      hazardMax: 11,
      shroompTable: [
        { roll: 1, requirement: "Flavor 6", dishTheme: "Fermented Fuzz" },
        { roll: 2, requirement: "Total Hazard 10+", dishTheme: "Mountain Melt" },
        { roll: 3, requirement: "All dice 3+", dishTheme: "Glowing Greens" },
        { roll: 4, requirement: "Dish total 13+", dishTheme: "Radiation Risotto" },
        { roll: 5, requirement: "No 4's", dishTheme: "Frosty Fusion" },
        { roll: 6, requirement: "Straight (1-2-3-4-5 or 2-3-4-5-6)", dishTheme: "Summit Surprise" }
      ],
      hazardTable: [
        { roll: 1, name: "Pepper Ghosts", value: 6, penalty: null },
        { roll: 2, name: "The Brothman", value: 7, penalty: "Roll die. If 6, +3 next dish. Else, -3 next dish" },
        { roll: 3, name: "Boiling Ooze", value: 8, penalty: null },
        { roll: 4, name: "The Forbidden Pit", value: 9, penalty: "Score 2 in all Categories for Dish" },
        { roll: 5, name: "Parasitic Frost", value: 10, penalty: "Roll die, subtract value from Dish, split as you wish" },
        { roll: 6, name: "The Breathless Fog", value: 11, penalty: "Next Challenge, can't use Mutations" }
      ]
    },

    // -------------------------------------------------------------------------
    // CHALLENGE 5: SHROOMP LAIR (Final Challenge)
    // -------------------------------------------------------------------------
    shroompLair: {
      label: "Shroomp Lair",
      order: 5,
      judge: "The Shroomp Lord",
      judgeDescription: "Nobody knows if they were a human taken over by mushrooms or a massive mushroom colony that developed intelligence. They are the only source of the most coveted ingredient across the Wasteland: Shroomps!",
      flavorText: "The location of the Shroomp Lair is a closely guarded secret and the journey to it is treacherous. Sounds in the cavernous space are dampened by the soft, fungal walls. The Shroomp Lord awaits upon their massive mycelium throne!",
      hazardMin: 7,
      hazardMax: 12,
      shroompTable: [
        { roll: 1, requirement: "Dish Score 14+, all Evens", dishTheme: "Fungimentals" },
        { roll: 2, requirement: "All Dish dice same", dishTheme: "Mycelium Medley" },
        { roll: 3, requirement: "3 in a row, Total Dish score Even", dishTheme: "Chili Bones" },
        { roll: 4, requirement: "Survive Hazard, +2 to Hazard Roll", dishTheme: "Herbs and Vices" },
        { roll: 5, requirement: "6 in Presentation and Originality", dishTheme: "Doomed Legumes" },
        { roll: 6, requirement: "Dish total 15+", dishTheme: "Signature Dish" }
      ],
      // The Shroomp Lair has the most dangerous hazards
      // Note: Roll 1 causes instant elimination (team wipe)!
      hazardTable: [
        { roll: 1, name: "The Gelatinous Oubliette", value: 7, penalty: "Your Team dies & don't present Dish" },
        { roll: 2, name: "Mind Spores", value: 8, penalty: "Swap 2 Dish Dice with 2 Hazard Dice" },
        { roll: 3, name: "The Ceaseless Void", value: 9, penalty: "Score 1 in all Categories for Dish" },
        { roll: 4, name: "Shroomp Cultist", value: 10, penalty: "Lose a Shroomp" },
        { roll: 5, name: "Cast Iron Maiden", value: 11, penalty: null },
        { roll: 6, name: "The Whispering Sentinel", value: 12, penalty: "Give a Shroomp to another player" }
      ]
    }
  },

  // ==========================================================================
  // WILD SHROOMP TABLE
  // ==========================================================================
  /**
   * At the end of the game, roll 1d6 on this table to determine a
   * special bonus Shroomp that one player can earn.
   *
   * This adds excitement at the end and can change the final standings!
   *
   * DATA STRUCTURE:
   * - roll: The die result (1-6)
   * - name: The name of this special Shroomp
   * - requirement: What condition must be met to earn it
   */
  wildShroompTable: [
    { roll: 1, requirement: "Most 1's among all your dishes", name: "Consolation Shroomp" },
    { roll: 2, requirement: "Most 6's among all your dishes", name: "Lucky Shroomp" },
    { roll: 3, requirement: "Most dead team members", name: "Sacrifice Shroomp" },
    { roll: 4, requirement: "Fewest total Shroomps so far", name: "Underdog Shroomp" },
    { roll: 5, requirement: "Highest single dish score", name: "Masterpiece Shroomp" },
    { roll: 6, requirement: "All team members alive", name: "Survivor Shroomp" }
  ],

  // ==========================================================================
  // GAME CONSTANTS
  // ==========================================================================
  /**
   * Static values used throughout the system.
   * Having these as named constants makes the code more readable
   * and easier to update if the game rules ever change.
   */

  /**
   * The three scoring categories for dishes.
   * Each die roll assigns a value to one of these (or to hazard).
   */
  dishCategories: ["presentation", "flavor", "originality"],

  /**
   * Number of dice rolled per challenge.
   * Players roll 5d6 and assign them to: Presentation, Flavor,
   * Originality, Hazard 1, and Hazard 2.
   */
  dicePerChallenge: 5,

  /**
   * Each player controls a team of 3 chefs.
   * Each chef has a unique mutation ability.
   */
  teamMembersPerPlayer: 3,

  /**
   * The game consists of 5 cooking challenges,
   * one at each location, played in order.
   */
  totalChallenges: 5
};

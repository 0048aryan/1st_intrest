/*
 * The personal details live here so the experience can be changed without
 * touching the page structure. Keep private notification credentials on the
 * server - never add them to this file.
 */
window.proposalConfig = {
  personName: "Vishwa",
  senderName: "Someone who cares",
  welcomeEyebrow: "for Vishwa, quietly",
  welcomeTitle: "I made something for you.",
  welcomeDescription: "Not a grand gesture. Just a little place to tell a story I have carried for a while.",
  startLabel: "Start the journey",
  timelineIntro: "That's how long I've been carrying something I never said.",
  confessionEnding: "So today, I'm finally telling you.",
  finalQuestion: "Would you give me a chance?",

  timeline: [
    { year: "Year 1", text: "Something about you stayed in my mind." },
    { year: "Year 2", text: "I still didn't say anything." },
    { year: "Year 3", text: "Still keeping it to myself." },
    { year: "Year 4", text: "Still wondering what would happen if I told you." },
    { year: "Year 5", text: "Maybe it's finally time." }
  ],

  confessionLines: [
    "For five years, I've liked you.",
    "Five years of thinking about saying it.",
    "Five years of wondering...",
    "What if I told you?"
  ],

  // Replace these thoughtful placeholders with the reasons that are yours.
  reasons: [
    { title: "Your smile", detail: "Add the small, very specific detail that makes this feel like only you could have written it." },
    { title: "The little things", detail: "A habit, a joke, or a moment that you keep returning to." },
    { title: "Ordinary moments", detail: "How they somehow felt a little different when you were around." },
    { title: "The person you are", detail: "The qualities you admire and want to say with care." },
    { title: "Honestly, just you", detail: "Your own final reason belongs here." }
  ],

  // Add image: "assets/photos/name.jpg" to any memory when you are ready.
  memories: [
    { caption: "A place for a memory", background: "linear-gradient(135deg, #f5c5bd 0%, #b77c8f 47%, #5a435d 100%)" },
    { caption: "A note worth keeping", background: "linear-gradient(135deg, #e8d2a8 0%, #b88771 52%, #634451 100%)" },
    { caption: "An inside joke, maybe", background: "linear-gradient(135deg, #9eb4be 0%, #71869a 49%, #3f3f61 100%)" }
  ],

  responses: {
    yes: {
      eyebrow: "a new little chapter",
      title: "You said yes. ♥",
      text: "I honestly don't know what to say... except that you just made these five years worth it. Thank you, Vishwa."
    },
    time: {
      eyebrow: "take all the time you need",
      title: "That's completely okay.",
      text: "Take your time. I just wanted you to know how I feel."
    }
  },

  /*
   * Add owned or licensed audio URLs here. The site only tries to play after
   * a visitor presses Start the journey, respecting browser autoplay rules.
   */
  music: {
    welcome: "",
    beginning: "",
    timeline: "",
    confession: "",
    reasons: "",
    memories: "",
    buildup: "",
    proposal: "",
    acceptance: ""
  },

  notification: {
    endpoint: "/api/acceptance",
    enabled: true
  }
};

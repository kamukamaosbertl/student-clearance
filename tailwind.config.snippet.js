/**
 * Merge this `extend` block into your existing tailwind.config.js.
 * These are the exact tokens read from the Figma file (not approximations) —
 * this is why we don't hand-write hexes anywhere in components below.
 */
module.exports = {
  theme: {
    extend: {
      colors: {
        navy: {
          DEFAULT: "#16233b", // sidebar background
        },
        teal: {
          DEFAULT: "#3e7c74", // primary buttons, active nav pill, active tab
          dark: "#2c5a54",    // "Student" eyebrow label
          soft: "rgba(62,124,116,0.35)", // active nav item background
        },
        surface: "#f3f5f7",   // page background + read-only input fill
        border: "#d7dce2",    // input borders, stepper connector lines
        body: "#4c5a6e",      // body copy
        muted: "#7c8aa0",     // placeholders, helper text, inactive dots
        mutedLight: "#c8d0dc",// sidebar secondary text
        navLink: "#c7d1de",   // inactive sidebar nav text
        danger: "#b3261e",    // required-field asterisk
      },
      borderRadius: {
        card: "10px",
        field: "7px",
        pill: "6px",
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
    },
  },
};

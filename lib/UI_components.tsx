
export interface UIComponentMeta {
  id: string;
  localImage: string;
  title: string;
  description: string;
  category: string;
}

export const UI_COMPONENT_CATEGORIES = [
  "Colors",
  "Gradients",
  "Buttons",
  
];

export const UI_COMPONENTS: UIComponentMeta[] = [
  // ─────────────────────────────────────────────
  // COLORS
  // ─────────────────────────────────────────────

  {
    id: "color-01",
    localImage: "/ui-components/colors/color-01.png",
    title: "Midnight",
    description: "Deep dark color palette for premium interfaces.",
    category: "Colors",
  },
  {
    id: "color-02",
    localImage: "/ui-components/colors/color-02.png",
    title: "Ocean",
    description: "Cool blue palette for modern digital products.",
    category: "Colors",
  },
  {
    id: "color-03",
    localImage: "/ui-components/colors/color-03.png",
    title: "Sunset",
    description: "Warm orange and pink palette.",
    category: "Colors",
  },
  {
    id: "color-04",
    localImage: "/ui-components/colors/color-04.png",
    title: "Forest",
    description: "Natural green palette with earthy tones.",
    category: "Colors",
  },

  // ─────────────────────────────────────────────
  // GRADIENTS
  // ─────────────────────────────────────────────

  {
    id: "gradient-01",
    localImage: "/ui-components/gradients/gradient-01.png",
    title: "Aurora",
    description: "Soft multi-color aurora gradient.",
    category: "Gradients",
  },
  {
    id: "gradient-02",
    localImage: "/ui-components/gradients/gradient-02.png",
    title: "Cosmic",
    description: "Deep purple cosmic gradient.",
    category: "Gradients",
  },
  {
    id: "gradient-03",
    localImage: "/ui-components/gradients/gradient-03.png",
    title: "Sunrise",
    description: "Bright sunrise-inspired gradient.",
    category: "Gradients",
  },
  {
    id: "gradient-04",
    localImage: "/ui-components/gradients/gradient-04.png",
    title: "Ocean Glow",
    description: "Smooth blue and cyan gradient.",
    category: "Gradients",
  },

  // ─────────────────────────────────────────────
  // BUTTONS
  // ─────────────────────────────────────────────

  {
    id: "button-01",
    localImage: "/ui-components/buttons/button-01.png",
    title: "Premium CTA",
    description: "Elegant primary call-to-action button.",
    category: "Buttons",
  },
  {
    id: "button-02",
    localImage: "/ui-components/buttons/button-02.png",
    title: "Glow Button",
    description: "Modern glowing button interaction.",
    category: "Buttons",
  },
  {
    id: "button-03",
    localImage: "/ui-components/buttons/button-03.png",
    title: "Magnetic Button",
    description: "Interactive button with a magnetic feel.",
    category: "Buttons",
  },
  {
    id: "button-04",
    localImage: "/ui-components/buttons/button-04.png",
    title: "Minimal Button",
    description: "Simple clean button for minimal interfaces.",
    category: "Buttons",
  },

  // ─────────────────────────────────────────────
  // CARDS
  // ─────────────────────────────────────────────

  {
    id: "card-01",
    localImage: "/ui-components/cards/card-01.png",
    title: "Glass Card",
    description: "Modern glassmorphism card.",
    category: "Cards",
  },
  {
    id: "card-02",
    localImage: "/ui-components/cards/card-02.png",
    title: "Feature Card",
    description: "Clean card for highlighting product features.",
    category: "Cards",
  },
  {
    id: "card-03",
    localImage: "/ui-components/cards/card-03.png",
    title: "Pricing Card",
    description: "Premium pricing card layout.",
    category: "Cards",
  },
  {
    id: "card-04",
    localImage: "/ui-components/cards/card-04.png",
    title: "Profile Card",
    description: "Modern profile and user information card.",
    category: "Cards",
  },

  // ─────────────────────────────────────────────
  // FORMS
  // ─────────────────────────────────────────────

  {
    id: "form-01",
    localImage: "/ui-components/forms/form-01.png",
    title: "Contact Form",
    description: "Simple modern contact form.",
    category: "Forms",
  },
  {
    id: "form-02",
    localImage: "/ui-components/forms/form-02.png",
    title: "Login Form",
    description: "Clean authentication form.",
    category: "Forms",
  },
  {
    id: "form-03",
    localImage: "/ui-components/forms/form-03.png",
    title: "Multi Step Form",
    description: "Elegant multi-step onboarding form.",
    category: "Forms",
  },
  {
    id: "form-04",
    localImage: "/ui-components/forms/form-04.png",
    title: "Search Form",
    description: "Minimal search input component.",
    category: "Forms",
  },

  // ─────────────────────────────────────────────
  // NAVIGATION
  // ─────────────────────────────────────────────

  {
    id: "navigation-01",
    localImage: "/ui-components/navigation/navigation-01.png",
    title: "Floating Navbar",
    description: "Floating navigation bar for modern websites.",
    category: "Navigation",
  },
  {
    id: "navigation-02",
    localImage: "/ui-components/navigation/navigation-02.png",
    title: "Minimal Navbar",
    description: "Clean minimal navigation.",
    category: "Navigation",
  },
  {
    id: "navigation-03",
    localImage: "/ui-components/navigation/navigation-03.png",
    title: "Sidebar",
    description: "Modern collapsible sidebar navigation.",
    category: "Navigation",
  },
  {
    id: "navigation-04",
    localImage: "/ui-components/navigation/navigation-04.png",
    title: "Mega Menu",
    description: "Large navigation menu for content-heavy websites.",
    category: "Navigation",
  },

  // ─────────────────────────────────────────────
  // TYPOGRAPHY
  // ─────────────────────────────────────────────

  {
    id: "typography-01",
    localImage: "/ui-components/typography/typography-01.png",
    title: "Hero Heading",
    description: "Large editorial-style hero typography.",
    category: "Typography",
  },
  {
    id: "typography-02",
    localImage: "/ui-components/typography/typography-02.png",
    title: "Gradient Text",
    description: "Modern gradient typography effect.",
    category: "Typography",
  },
  {
    id: "typography-03",
    localImage: "/ui-components/typography/typography-03.png",
    title: "Editorial",
    description: "Elegant editorial typography system.",
    category: "Typography",
  },
  {
    id: "typography-04",
    localImage: "/ui-components/typography/typography-04.png",
    title: "Bold Display",
    description: "Bold display typography for landing pages.",
    category: "Typography",
  },

  // ─────────────────────────────────────────────
  // ANIMATIONS
  // ─────────────────────────────────────────────

  {
    id: "animation-01",
    localImage: "/ui-components/animations/animation-01.png",
    title: "Fade Up",
    description: "Smooth fade-up entrance animation.",
    category: "Animations",
  },
  {
    id: "animation-02",
    localImage: "/ui-components/animations/animation-02.png",
    title: "Magnetic Hover",
    description: "Interactive magnetic hover effect.",
    category: "Animations",
  },
  {
    id: "animation-03",
    localImage: "/ui-components/animations/animation-03.png",
    title: "Scroll Reveal",
    description: "Reveal elements as the user scrolls.",
    category: "Animations",
  },
  {
    id: "animation-04",
    localImage: "/ui-components/animations/animation-04.png",
    title: "Floating",
    description: "Subtle continuous floating animation.",
    category: "Animations",
  },
];


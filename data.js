const PORTFOLIO = {
    name: "NIGAR ALIYEVA",
    title: "SOFTWARE DEVELOPER",

    // ---------- HOME ----------
  home: {
    className: "SOFTWARE DEVELOPER",
    text:
      "Some text " //later will be updated
  },

   // ---------- ABOUT ----------
  about: {
    heading: "ORIGIN STORY",
    text:
      "Placeholder text", //todo: fill
    cards: [
      { label: "HOME BASE", value: "Dortmund, DE" },
      { label: "MAIN QUEST", value: "Java backend" },
      { label: "STATUS", value: "Open to work", online: true },
    ],
  },

   // ---------- SKILLS ----------
  // levels 1-10
  skillGroups: [
    {
      name: "LANGUAGES",
      items: [
        { name: "Java", level: 7 },
        { name: "SQL", level: 6 },
        { name: "JavaScript", level: 4 },
        { name: "HTML / CSS", level: 6 },
      ],
    },
    {
      name: "INTERFACE",
      items: [
        { name: "Thymeleaf", level: 5 },
        { name: "JSP", level: 6 },
        { name: "ExtJS", level: 5 },
        { name: "Chart.js", level: 4 },
      ],
    },
    {
      name: "BACKEND",
      items: [
        { name: "Spring Boot", level: 6 },
        { name: "Spring MVC", level: 7 },
        { name: "Hibernate", level: 6 },
        { name: "PostgreSQL", level: 6 },
      ],
    },
    {
      name: "SUPPORT",
      items: [
        { name: "Git / SVN", level: 6 }
      ],
    },
  ],
};
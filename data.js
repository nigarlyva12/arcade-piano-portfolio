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

  // ---------- PROJECTS ----------
  projects: [
    {
      tag: "QUEST 01",
      stars: "★★★",
      name: "ABSCHLUSSPROJEKT",
      text: "A monitoring tool that reads pg_stat_statements and shows slow PostgreSQL queries in charts.",
      tech: ["Java", "Spring Boot", "PostgreSQL", "Chart.js"],
    },
    {
      tag: "QUEST 02",
      stars: "★★★",
      name: "Project 2",
      text: "Placeholder",
      tech: ["Java", "Spring Boot", "PostgreSQL", "Thymeleaf"],
    },
    {
      tag: "SIDE QUEST",
      stars: "★★☆",
      name: "Project 3",
      text: "Placeholder.",
      tech: ["Java", "Spring Boot", "PostgreSQL", "Placeholder"],
    },
  ],

  // ---------- EXPERIENCE ----------
  experience: [
    {
      level: "LV 3",
      years: "SEP 2024 - JAN 2027",
      role: "Junior Developer (Ausbildung)",
      company: "SPIE Germany Switzerland Austria",
      text:
        "Accelerated Ausbildung as Fachinformatikerin für Anwendungsentwicklung. " +
        "Placeholder",
      current: true,
    },
    {
      level: "LV 2",
      years: "Placeholder",
      role: "Mathematics Teacher",
      company: "DERS EVI EDUCATION CENTER", 
      text: "Placeholder",
      current: false,
    },
    {
      level: "LV 1",
      years: "Placeholder",
      role: "B.Sc. Petroleum Engineering",
      company: "BAKU HIGHER OIL SCHOOL",
      text: "Placeholder",
      current: false,
    },
  ],
};
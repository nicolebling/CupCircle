
export const getCoffeeTheme = (level: string): string => {
  switch (level) {
    case "Student": return "Warm Milk";
    case "Internship": return "Latte";
    case "Entry": return "Light Roast";
    case "Junior": return "Medium Roast";
    case "Senior": return "Dark Roast";
    case "Director": return "Nitro Cold Brew";
    case "Executive": return "Espresso";
    default: return "";
  }
};

export const getCoffeeColor = (level: string): string => {
  switch (level) {
    case "Student": return "#E6C8A0";
    case "Internship": return "#D2B48C";
    case "Entry": return "#C19A6B";
    case "Junior": return "#A67B5B";
    case "Senior": return "#654321";
    case "Director": return "#483C32";
    case "Executive": return "#301E1E";
    default: return "#F97415";
  }
};

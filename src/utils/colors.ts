export const profileAccents = {
  red: "#BA5650",
  orange: "#C27C3E",
  violet: "#956AC8",
  green: "#49A355",
  cyan: "#3E97AD",
  blue: "#5A8FBB",
  pink: "#B85378",
};

export const accentColorsList = [
  "#f76169", // red
  "#f8a357", // orange
  "#b48bf2", // violet
  "#85de85", // green
  "#62d4e3", // cyan
  "#65bdf3", // blue
  "#f85694", // pink
  "#7F8B95", // grey
  // The following colors should be multicolor
  "#C9565D",
  "#CF7244",
  "#9662D4",
  "#3D9755",
  "#3D95BA",
  "#538BC2",
  "#B04F74",
  "#637482",
];

export const randomAccent = () => {
  const array = Object.values(profileAccents);
  return array[Math.floor(Math.random() * array.length)];
};

// It might be possible to get the accent color from ChatFullInfo
// https://core.telegram.org/bots/api#chatfullinfo

export const getAccent = (index?: number) => {
  if (!index || index < 0) {
    return randomAccent();
  }
  return accentColorsList[index % accentColorsList.length];
};

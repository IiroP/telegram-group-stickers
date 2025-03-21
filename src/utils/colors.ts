export const profileAccents = {
  red: "#BA5650",
  orange: "#C27C3E",
  violet: "#956AC8",
  green: "#49A355",
  cyan: "#3E97AD",
  blue: "#5A8FBB",
  purple: "#B85378",
};

export const randomAccent = () => {
  const array = Object.values(profileAccents);
  return array[Math.floor(Math.random() * array.length)];
};

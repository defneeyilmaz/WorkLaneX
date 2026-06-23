export function getInitials(name: string, maxLength = 2): string {
  return name
    .split(" ")
    .map((part) => part[0])
    .join("")
    .slice(0, maxLength)
    .toUpperCase();
}

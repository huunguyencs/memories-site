export interface Memory {
  title: string;
  slug: string;
  year: number;
  date: string;
  dateDisplay: string;
  cover: string;
  photos: string[];
  music?: string;
}

const memoryFiles = import.meta.glob<Memory>("../content/memories/*.json", {
  eager: true,
  import: "default",
});

export function getAllMemories(): Memory[] {
  return Object.values(memoryFiles).sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );
}

export function getMemoryBySlug(slug: string): Memory | undefined {
  return getAllMemories().find((m) => m.slug === slug);
}

export function getYears(): number[] {
  const years = [...new Set(getAllMemories().map((m) => m.year))];
  return years.sort((a, b) => b - a);
}

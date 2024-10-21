function arraySort(a: any, b: any): number {
  return JSON.stringify(a).localeCompare(JSON.stringify(b));
}

export function deepSort<T>(data: T): T {
  if (!data) return data;
  const visited = new Set<any>();

  function sortHelper(obj: any): any {
    if (visited.has(obj)) return obj;
    visited.add(obj);

    if (Array.isArray(obj)) {
      return obj.map(sortHelper).sort(arraySort);
    }

    if (typeof obj === "object" && obj !== null) {
      const sortedObject: any = {};
      const sortedKeys = Object.keys(obj).sort();

      for (const key of sortedKeys) {
        sortedObject[key] = sortHelper(obj[key]);
      }

      return sortedObject;
    }

    return obj;
  }

  return sortHelper(data) as T;
}

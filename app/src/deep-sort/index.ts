function arraySort(a: any, b: any): number {
  try {
    const stringifiedA = JSON.stringify(a);
    const stringifiedB = JSON.stringify(b);

    const result = stringifiedA.localeCompare(stringifiedB);
    return result;
  } catch (e) {
    return 0;
  }
}

export function deepSort<T>(data: T): T {
  if (!data) return data;
  const visited = new Set<any>();

  function sortHelper(value: any): any {
    if (visited.has(value)) return value;
    visited.add(value);

    if (Array.isArray(value)) {
      return value.map(sortHelper).sort(arraySort);
    }

    if (typeof value === "object" && value !== null) {
      const sortedObject: any = {};
      const sortedKeys = Object.keys(value).sort();

      for (const key of sortedKeys) {
        sortedObject[key] = sortHelper(value[key]);
      }

      return sortedObject;
    }

    return value;
  }

  return sortHelper(data) as T;
}

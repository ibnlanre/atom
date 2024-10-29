export function arraySort(a: any, b: any): number {
  try {
    const stringifiedA = JSON.stringify(a);
    const stringifiedB = JSON.stringify(b);

    const result = stringifiedA.localeCompare(stringifiedB);
    return result;
  } catch (e) {
    return 0;
  }
}

export type StyleVarValues = Record<string, string>;

export type StyleVarWriter = {
  setMany: (values: StyleVarValues) => void;
  clear: () => void;
};

export function createStyleVarWriter(element: HTMLElement): StyleVarWriter {
  const lastValues = new Map<string, string>();

  return {
    setMany(values) {
      for (const [name, value] of Object.entries(values)) {
        if (lastValues.get(name) === value) {
          continue;
        }
        lastValues.set(name, value);
        element.style.setProperty(name, value);
      }
    },
    clear() {
      lastValues.clear();
    },
  };
}

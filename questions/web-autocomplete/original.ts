export function createAutocomplete(options: string[]) {
  let value = "";
  let open = false;
  let pressed = -1;

  function matches(): string[] {
    const typed = value.trim().toLowerCase();
    if (typed === "") {
      return [];
    }
    return options
      .filter((option) => option.toLowerCase().startsWith(typed))
      .slice(0, 5);
  }

  function choose(index: number): void {
    const option = matches()[index];
    if (option !== undefined) {
      value = option;
      open = false;
      pressed = -1;
    }
  }

  return {
    value: () => value,
    suggestions: () => (open ? matches() : []),
    pressedIndex: () => pressed,
    input(text: string): void {
      value = text;
      pressed = -1;
      open = matches().length > 0;
    },
    blur(): void {
      open = false;
      pressed = -1;
    },
    optionPointerDown(index: number): void {
      pressed = index;
    },
    optionClick(index: number): void {
      choose(index);
    },
  };
}

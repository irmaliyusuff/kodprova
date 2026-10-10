export interface PressAwareValidation {
  /** pointerdown anywhere on the page */
  pointerDown(): void;
  /** click anywhere on the page */
  click(): void;
  /** pointercancel anywhere on the page */
  pointerCancel(): void;
  /** the page was hidden or the window lost focus */
  pageLeft(): void;
  /** focusout on a form field */
  focusOut(field: string): void;
}

export function createPressAwareValidation(
  validate: (field: string) => void,
): PressAwareValidation {
  const held: string[] = [];
  let pressed = false;

  function runHeld(): void {
    for (const field of held.splice(0)) {
      validate(field);
    }
  }

  function endPress(): void {
    pressed = false;
    runHeld();
  }

  return {
    pointerDown() {
      pressed = true;
    },
    click: endPress,
    pointerCancel: endPress,
    // The press will not end on this page, so end it here.
    pageLeft: endPress,
    focusOut(field) {
      if (!pressed) {
        validate(field);
      } else if (!held.includes(field)) {
        held.push(field);
      }
    },
  };
}

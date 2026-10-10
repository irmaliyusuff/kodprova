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
    pageLeft() {
      // Run the held checks now, so the errors are up to date when the
      // user comes back.
      runHeld();
    },
    focusOut(field) {
      if (!pressed) {
        validate(field);
      } else if (!held.includes(field)) {
        held.push(field);
      }
    },
  };
}

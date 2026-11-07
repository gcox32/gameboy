/**
 * Buttons in the Lab never look disabled. One with nothing to do still presses like the
 * others and simply does nothing, the way a real console button would. Screen readers are
 * told it's unavailable.
 */
export function press(inactive: boolean | undefined, onClick: () => void) {
    return {
        'aria-disabled': inactive || undefined,
        onClick: inactive ? undefined : onClick,
    };
}

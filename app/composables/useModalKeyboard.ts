// Escape-to-close + focus restore for modals.
//
// Modals can stack (e.g. GameDetail opens from CountryDetail), so a
// module-level stack ensures Escape only closes the topmost open modal.
// Focus returns to whatever element was focused when the modal opened.

const stack: symbol[] = []

export function useModalKeyboard(isOpen: () => boolean, close: () => void) {
  const token = Symbol()
  let restoreTarget: HTMLElement | null = null

  function onKeydown(e: KeyboardEvent) {
    if (e.key !== 'Escape') return
    if (stack[stack.length - 1] !== token) return
    close()
  }

  function pop() {
    const i = stack.indexOf(token)
    if (i !== -1) stack.splice(i, 1)
  }

  watch(isOpen, (open) => {
    if (!import.meta.client) return
    if (open) {
      stack.push(token)
      restoreTarget =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null
    } else {
      pop()
      restoreTarget?.focus()
      restoreTarget = null
    }
  })

  onMounted(() => {
    if (!import.meta.client) return
    window.addEventListener('keydown', onKeydown)
    if (isOpen()) stack.push(token)
  })

  onUnmounted(() => {
    if (!import.meta.client) return
    window.removeEventListener('keydown', onKeydown)
    pop()
  })
}

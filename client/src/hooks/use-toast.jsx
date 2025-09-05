import * as React from "react"

const TOAST_LIMIT = 3
const TOAST_REMOVE_DELAY = 5000 // 5 seconds is more reasonable

let count = 0

function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER
  return count.toString()
}

const toastTimeouts = new Map()

/**
 * Adds a toast to the removal queue to be removed after a delay
 * @param {string} toastId - ID of the toast to remove
 */
const addToRemoveQueue = (toastId) => {
  if (toastTimeouts.has(toastId)) {
    return
  }

  const timeout = globalThis.setTimeout(() => {
    toastTimeouts.delete(toastId)
    dispatch({
      type: "REMOVE_TOAST",
      toastId: toastId,
    })
  }, TOAST_REMOVE_DELAY)

  toastTimeouts.set(toastId, timeout)
}

/**
 * @typedef {object} Toast
 * @property {string} id - Unique identifier for the toast
 * @property {string} [title] - Toast title
 * @property {string} [description] - Toast description
 * @property {boolean} [open] - Whether the toast is open
 * @property {string} [variant] - Toast variant ('default', 'destructive', etc.)
 * @property {Function} [onOpenChange] - Callback for when the toast open state changes
 */

/**
 * @typedef {object} ToastPropsDef
 * @property {string} [title] - Toast title
 * @property {string} [description] - Toast description
 * @property {string} [variant] - Toast variant ('default', 'destructive', etc.)
 * @property {Function} [onOpenChange] - Callback for when the toast open state changes
 */

/**
 * Reducer function for managing toast state
 * @typedef {object} ToastState
 * @property {Array<Toast>} toasts - Array of toast notifications
 * 
 * @typedef {object} ToastAction
 * @property {string} type - Action type ('ADD_TOAST', 'UPDATE_TOAST', 'DISMISS_TOAST', 'REMOVE_TOAST')
 * @property {Toast} [toast] - Toast object for ADD_TOAST and UPDATE_TOAST actions
 * @property {string} [toastId] - ID of the toast for DISMISS_TOAST and REMOVE_TOAST actions
 * 
 * @param {ToastState} state - Current toast state
 * @param {ToastAction} action - Action to perform
 * @returns {ToastState} New toast state
 */
export const reducer = (state, action) => {
  switch (action.type) {
    case "ADD_TOAST":
      return {
        ...state,
        toasts: action.toast ? [action.toast, ...state.toasts].slice(0, TOAST_LIMIT) : [...state.toasts],
      }

    case "UPDATE_TOAST":
      return {
        ...state,
        toasts: state.toasts.map((t) =>
          (action.toast && t.id === action.toast.id) ? { ...t, ...action.toast } : t
        ),
      }

    case "DISMISS_TOAST": {
      const { toastId } = action

      if (toastId) {
        addToRemoveQueue(toastId)
      } else {
        state.toasts.forEach((toast) => {
          addToRemoveQueue(toast.id)
        })
      }

      return {
        ...state,
        toasts: state.toasts.map((t) =>
          t.id === toastId || toastId === undefined
            ? {
                ...t,
                open: false,
              }
            : t
        ),
      }
    }
    case "REMOVE_TOAST":
      if (action.toastId === undefined) {
        return {
          ...state,
          toasts: [],
        }
      }
      return {
        ...state,
        toasts: state.toasts.filter((t) => t.id !== action.toastId),
      }
    default:
      return state
  }
}

/** @type {Array<(state: ToastState) => void>} */
const listeners = []
/** @type {ToastState} */
let memoryState = { toasts: [] }

/**
 * Dispatches an action to update toast state
 * @param {ToastAction} action - Action to dispatch
 */
function dispatch(action) {
  memoryState = reducer(memoryState, action)
  listeners.forEach((listener) => {
    listener(memoryState)
  })
}

/**
 * Creates a new toast notification
 * @param {ToastPropsDef} props - Toast properties
 * @returns {{id: string, dismiss: Function, update: Function}} Toast control object
 */
function toast(props) {
  const id = genId()

  /**
   * @param {ToastPropsDef} props - Updated toast properties 
   * @returns {void} Dispatches an action to update the toast
   */
  const update = (props) =>
    dispatch({
      type: "UPDATE_TOAST",
      toast: { ...props, id },
    })

  const dismiss = () => dispatch({ type: "DISMISS_TOAST", toastId: id })

  dispatch({
    type: "ADD_TOAST",
    toast: {
      ...props,
      id,
      open: true,
      onOpenChange: (/** @type {boolean} */ open) => {
        if (!open) dismiss()
      },
    },
  })

  return {
    id: id,
    dismiss,
    update,
  }
}

/**
 * Custom hook for managing toast notifications
 * @typedef {object} ToastHookReturn
 * @property {Array<object>} toasts - Array of current toast notifications
 * @property {Function} toast - Function to create a new toast
 * @property {Function} dismiss - Function to dismiss a toast by ID
 * 
 * @returns {ToastHookReturn} Toast state and control functions
 */
export function useToast() {
  const [state, setState] = React.useState(memoryState)

  React.useEffect(() => {
    listeners.push(setState)
    return () => {
      const index = listeners.indexOf(setState)
      if (index > -1) {
        listeners.splice(index, 1)
      }
    }
  }, [state])

  return {
    ...state,
    toast,
    dismiss: (/** @type {string} */ toastId) => dispatch({ type: "DISMISS_TOAST", toastId }),
  }
}

/**
 * Export the toast function for standalone usage
 * @type {Function}
 * @param {ToastPropsDef} props - Toast properties
 * @returns {{id: string, dismiss: Function, update: Function}} Toast control object
 */
export { toast }
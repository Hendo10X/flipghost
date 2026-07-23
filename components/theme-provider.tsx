"use client"

import * as React from "react"

export type Theme = "light" | "dark" | "system"

interface ThemeContextValue {
  theme: Theme
  resolvedTheme: "light" | "dark"
  setTheme: (theme: Theme) => void
}

const ThemeContext = React.createContext<ThemeContextValue | null>(null)
const STORAGE_KEY = "flipghost:theme"

function resolveTheme(theme: Theme): "light" | "dark" {
  return theme === "light" ? "light" : "dark"
}

function applyTheme(theme: Theme) {
  if (typeof document === "undefined") return
  const resolved = resolveTheme(theme)
  document.documentElement.classList.toggle("dark", resolved === "dark")
  document.documentElement.style.colorScheme = resolved
}

function readStoredTheme(): Theme {
  if (typeof window === "undefined") return "dark"
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    if (stored === "light" || stored === "dark" || stored === "system") {
      return stored
    }
  } catch {
    // Ignore blocked storage.
  }
  return "dark"
}

function writeStoredTheme(theme: Theme) {
  try {
    window.localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    // Ignore blocked storage.
  }
}

function syncDocumentTheme(theme: Theme) {
  applyTheme(theme)
}

interface ThemeProviderProps {
  children: React.ReactNode
}

function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = React.useState<Theme>(() => readStoredTheme())
  const resolvedTheme = resolveTheme(theme)

  React.useEffect(() => {
    syncDocumentTheme(theme)
  }, [theme])

  React.useEffect(() => {
    if (theme !== "system") return
    function onChange() {
      syncDocumentTheme("system")
    }
    const media = window.matchMedia("(prefers-color-scheme: dark)")
    media.addEventListener("change", onChange)
    return () => media.removeEventListener("change", onChange)
  }, [theme])

  const setTheme = React.useCallback((nextTheme: Theme) => {
    setThemeState(nextTheme)
    writeStoredTheme(nextTheme)
    syncDocumentTheme(nextTheme)
  }, [])

  const value = React.useMemo<ThemeContextValue>(
    () => ({ theme, resolvedTheme, setTheme }),
    [theme, resolvedTheme, setTheme]
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

function useTheme() {
  const value = React.useContext(ThemeContext)
  if (!value) {
    throw new Error("useTheme must be used within ThemeProvider")
  }
  return value
}

export { ThemeProvider, useTheme }

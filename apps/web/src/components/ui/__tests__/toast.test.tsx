// @vitest-environment jsdom
import { describe, it, expect, beforeEach } from "vitest"
import { render, screen } from "@testing-library/react"
import {
  Toast,
  ToastProvider,
  ToastTitle,
  ToastDescription,
  ToastClose,
  ToastViewport,
  Toaster,
  toast,
  toastVariants,
} from "../toast"

describe("Toast primitives", () => {
  it("renders a toast with title and description", () => {
    render(
      <ToastProvider>
        <Toast open data-testid="toast">
          <ToastTitle>Success</ToastTitle>
          <ToastDescription>Item created</ToastDescription>
          <ToastClose />
        </Toast>
        <ToastViewport />
      </ToastProvider>
    )
    expect(screen.getByText("Success")).toBeTruthy()
    expect(screen.getByText("Item created")).toBeTruthy()
  })

  it("applies success variant classes", () => {
    render(
      <ToastProvider>
        <Toast open variant="success" data-testid="toast">
          <ToastTitle>Done</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    )
    const toastEl = screen.getByText("Done").closest("[data-testid='toast']")
    expect(toastEl?.className).toContain("bg-success-muted")
  })

  it("applies error variant classes", () => {
    render(
      <ToastProvider>
        <Toast open variant="error" data-testid="toast">
          <ToastTitle>Error</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    )
    const toastEl = screen.getByText("Error").closest("[data-testid='toast']")
    expect(toastEl?.className).toContain("bg-destructive/10")
  })

  it("applies info variant classes", () => {
    render(
      <ToastProvider>
        <Toast open variant="info" data-testid="toast">
          <ToastTitle>Info</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    )
    const toastEl = screen.getByText("Info").closest("[data-testid='toast']")
    expect(toastEl?.className).toContain("bg-info-muted")
  })

  it("applies warning variant classes", () => {
    render(
      <ToastProvider>
        <Toast open variant="warning" data-testid="toast">
          <ToastTitle>Warning</ToastTitle>
        </Toast>
        <ToastViewport />
      </ToastProvider>
    )
    const toastEl = screen.getByText("Warning").closest("[data-testid='toast']")
    expect(toastEl?.className).toContain("bg-warning-muted")
  })
})

describe("toastVariants", () => {
  it("returns correct classes for each variant", () => {
    expect(toastVariants({ variant: "success" })).toContain("bg-success-muted")
    expect(toastVariants({ variant: "error" })).toContain("bg-destructive/10")
    expect(toastVariants({ variant: "info" })).toContain("bg-info-muted")
    expect(toastVariants({ variant: "warning" })).toContain("bg-warning-muted")
    expect(toastVariants({ variant: "default" })).toContain("bg-background")
  })
})

describe("toast function", () => {
  it("returns an id and dismiss function", () => {
    const result = toast({ title: "Test", description: "Hello" })
    expect(result.id).toBeDefined()
    expect(typeof result.dismiss).toBe("function")
  })
})

describe("Toaster", () => {
  it("renders without crashing", () => {
    const { container } = render(<Toaster />)
    expect(container).toBeTruthy()
  })
})

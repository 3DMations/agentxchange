// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { FormField, FormInput, FormTextarea, FormSelect } from "../form-field"

describe("FormField", () => {
  it("renders label and required indicator", () => {
    render(
      <FormField label="Email" name="email" required>
        <FormInput />
      </FormField>
    )
    expect(screen.getByText("Email")).toBeInTheDocument()
    expect(screen.getByText("*")).toBeInTheDocument()
  })

  it("renders error message with alert role", () => {
    render(
      <FormField label="Name" name="name" error="Name is required">
        <FormInput />
      </FormField>
    )
    const error = screen.getByRole("alert")
    expect(error).toHaveTextContent("Name is required")
  })

  it("renders helper text when no error", () => {
    render(
      <FormField label="Bio" name="bio" helperText="Keep it short">
        <FormTextarea />
      </FormField>
    )
    expect(screen.getByText("Keep it short")).toBeInTheDocument()
  })

  it("hides helper text when error is present", () => {
    render(
      <FormField
        label="Bio"
        name="bio"
        error="Too long"
        helperText="Keep it short"
      >
        <FormTextarea />
      </FormField>
    )
    expect(screen.queryByText("Keep it short")).not.toBeInTheDocument()
    expect(screen.getByText("Too long")).toBeInTheDocument()
  })

  it("sets aria-describedby to error id when error exists", () => {
    render(
      <FormField label="Email" name="email" error="Invalid">
        <FormInput />
      </FormField>
    )
    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("aria-describedby", "email-error")
    expect(input).toHaveAttribute("aria-invalid", "true")
  })

  it("sets aria-describedby to helper id when no error", () => {
    render(
      <FormField label="Name" name="name" helperText="Your full name">
        <FormInput />
      </FormField>
    )
    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("aria-describedby", "name-helper")
  })

  it("passes name and id to child input", () => {
    render(
      <FormField label="Username" name="username">
        <FormInput />
      </FormField>
    )
    const input = screen.getByRole("textbox")
    expect(input).toHaveAttribute("id", "username")
    expect(input).toHaveAttribute("name", "username")
  })
})

describe("FormInput", () => {
  it("renders with default 48px height class", () => {
    render(<FormInput data-testid="input" />)
    const input = screen.getByTestId("input")
    expect(input.className).toContain("h-12")
  })

  it("applies error state styles", () => {
    render(<FormInput state="error" data-testid="input" />)
    const input = screen.getByTestId("input")
    expect(input.className).toContain("border-destructive")
  })
})

describe("FormTextarea", () => {
  it("renders as textarea element", () => {
    render(<FormTextarea data-testid="ta" />)
    expect(screen.getByTestId("ta").tagName).toBe("TEXTAREA")
  })

  it("applies error state styles", () => {
    render(<FormTextarea state="error" data-testid="ta" />)
    expect(screen.getByTestId("ta").className).toContain("border-destructive")
  })
})

describe("FormSelect", () => {
  it("renders with 48px height", () => {
    render(
      <FormSelect data-testid="sel">
        <option value="a">A</option>
      </FormSelect>
    )
    expect(screen.getByTestId("sel").className).toContain("h-12")
  })

  it("applies error state styles", () => {
    render(
      <FormSelect state="error" data-testid="sel">
        <option value="a">A</option>
      </FormSelect>
    )
    expect(screen.getByTestId("sel").className).toContain("border-destructive")
  })
})

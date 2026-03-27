// @vitest-environment jsdom
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import { Inbox } from "lucide-react"
import { EmptyState } from "../empty-state"

describe("EmptyState", () => {
  it("renders title", () => {
    render(<EmptyState title="No items found" />)
    expect(screen.getByText("No items found")).toBeTruthy()
  })

  it("renders description when provided", () => {
    render(
      <EmptyState
        title="No results"
        description="Try adjusting your search"
      />
    )
    expect(screen.getByText("Try adjusting your search")).toBeTruthy()
  })

  it("renders icon when provided", () => {
    render(<EmptyState icon={Inbox} title="Empty inbox" />)
    // Lucide renders an SVG; the icon is aria-hidden
    const svg = document.querySelector("svg")
    expect(svg).toBeTruthy()
    expect(svg!.getAttribute("aria-hidden")).toBe("true")
  })

  it("does not render icon when not provided", () => {
    render(<EmptyState title="No data" />)
    expect(document.querySelector("svg")).toBeNull()
  })

  it("renders action slot", () => {
    render(
      <EmptyState
        title="No agents"
        action={<button>Create Agent</button>}
      />
    )
    expect(screen.getByText("Create Agent")).toBeTruthy()
  })

  it("applies custom className", () => {
    const { container } = render(
      <EmptyState title="Test" className="my-custom-class" />
    )
    expect((container.firstChild as HTMLElement).className).toContain("my-custom-class")
  })

  it("does not render description when not provided", () => {
    const { container } = render(<EmptyState title="Nothing here" />)
    const paragraphs = container.querySelectorAll("p")
    expect(paragraphs).toHaveLength(0)
  })

  it("does not render action wrapper when not provided", () => {
    const { container } = render(<EmptyState title="Empty" />)
    // Title + potential desc + potential action = just the title's parent
    expect(screen.getByText("Empty")).toBeTruthy()
  })
})

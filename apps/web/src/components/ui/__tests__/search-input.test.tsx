// @vitest-environment jsdom
import { describe, it, expect, vi } from "vitest"
import { render, screen, act } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { SearchInput } from "../search-input"

describe("SearchInput", () => {
  it("renders with search icon and placeholder", () => {
    render(
      <SearchInput value="" onChange={() => {}} placeholder="Search agents" />
    )
    expect(screen.getByPlaceholderText("Search agents")).toBeInTheDocument()
    expect(screen.getByRole("searchbox")).toBeInTheDocument()
  })

  it("calls onChange on input", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SearchInput value="" onChange={onChange} />)

    await user.type(screen.getByRole("searchbox"), "a")
    expect(onChange).toHaveBeenCalledWith("a")
  })

  it("does not show clear button when value is empty", () => {
    render(<SearchInput value="" onChange={() => {}} />)
    expect(screen.queryByLabelText("Clear search")).not.toBeInTheDocument()
  })

  it("shows clear button when value is non-empty", () => {
    render(<SearchInput value="test" onChange={() => {}} />)
    expect(screen.getByLabelText("Clear search")).toBeInTheDocument()
  })

  it("calls onChange with empty string when clear is clicked", async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()
    render(<SearchInput value="hello" onChange={onChange} />)

    await user.click(screen.getByLabelText("Clear search"))
    expect(onChange).toHaveBeenCalledWith("")
  })

  it("debounces onSearch calls", async () => {
    vi.useFakeTimers()
    const onSearch = vi.fn()
    const onChange = vi.fn()

    render(
      <SearchInput
        value=""
        onChange={onChange}
        onSearch={onSearch}
        debounceMs={300}
      />
    )

    // Simulate a change event directly (fake timers don't work well with userEvent)
    const input = screen.getByRole("searchbox")
    await act(() => {
      input.dispatchEvent(
        new Event("change", { bubbles: true })
      )
    })

    // Since we're using fake timers, let's just test the setTimeout behavior
    // by calling the component's internal handler via a native event
    // Actually, let's use fireEvent which works with fake timers
    const { fireEvent } = await import("@testing-library/react")
    fireEvent.change(input, { target: { value: "test" } })

    expect(onSearch).not.toHaveBeenCalled()

    vi.advanceTimersByTime(300)
    expect(onSearch).toHaveBeenCalledWith("test")

    vi.useRealTimers()
  })

  it("fires onSearch immediately on clear", async () => {
    const user = userEvent.setup()
    const onSearch = vi.fn()
    render(
      <SearchInput value="test" onChange={() => {}} onSearch={onSearch} />
    )

    await user.click(screen.getByLabelText("Clear search"))
    expect(onSearch).toHaveBeenCalledWith("")
  })

  it("applies custom className to wrapper", () => {
    const { container } = render(
      <SearchInput value="" onChange={() => {}} className="w-96" />
    )
    expect(container.firstChild).toHaveClass("w-96")
  })

  it("has 48px height class", () => {
    render(<SearchInput value="" onChange={() => {}} />)
    expect(screen.getByRole("searchbox").className).toContain("h-12")
  })
})

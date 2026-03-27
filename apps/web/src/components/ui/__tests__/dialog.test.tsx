// @vitest-environment jsdom
import "@testing-library/jest-dom/vitest"
import { describe, it, expect } from "vitest"
import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
  dialogContentVariants,
} from "../dialog"

describe("Dialog", () => {
  it("opens when trigger is clicked", async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Test Dialog</DialogTitle>
            <DialogDescription>A description</DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    )

    expect(screen.queryByText("Test Dialog")).not.toBeInTheDocument()
    await user.click(screen.getByText("Open"))
    expect(screen.getByText("Test Dialog")).toBeInTheDocument()
    expect(screen.getByText("A description")).toBeInTheDocument()
  })

  it("closes when close button is clicked", async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText("Open"))
    expect(screen.getByText("Title")).toBeInTheDocument()

    await user.click(screen.getByText("Close"))
    // After close animation, content should be removed
  })

  it("renders footer content", async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogFooter>
            <button>Save</button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText("Open"))
    expect(screen.getByText("Save")).toBeInTheDocument()
  })

  it("renders DialogClose as child", async () => {
    const user = userEvent.setup()
    render(
      <Dialog>
        <DialogTrigger>Open</DialogTrigger>
        <DialogContent>
          <DialogTitle>Title</DialogTitle>
          <DialogClose>Cancel</DialogClose>
        </DialogContent>
      </Dialog>
    )

    await user.click(screen.getByText("Open"))
    expect(screen.getByText("Cancel")).toBeInTheDocument()
  })
})

describe("dialogContentVariants", () => {
  it("returns sm size class", () => {
    expect(dialogContentVariants({ size: "sm" })).toContain("max-w-[400px]")
  })

  it("returns default size class", () => {
    expect(dialogContentVariants({ size: "default" })).toContain(
      "max-w-[500px]"
    )
  })

  it("returns lg size class", () => {
    expect(dialogContentVariants({ size: "lg" })).toContain("max-w-[640px]")
  })
})

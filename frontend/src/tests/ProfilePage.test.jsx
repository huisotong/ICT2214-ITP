import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import ProfilePage from "../pages/ProfilePage";

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

const testUser = { userID: "u1", name: "Andrea" };
const mockSetModal = jest.fn();

const userDetailsResponse = {
  name: "Andrea",
  nickname: "Andy",
  email: "andrea@example.com",
  address: "123 Main St",
  mobileNumber: "+1 234 567 890",
};

describe("ProfilePage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("fetches and displays user details", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => userDetailsResponse,
    });
    render(<ProfilePage user={testUser} setModal={mockSetModal} />);
    expect(global.fetch).toHaveBeenCalledWith(
      "http://localhost:5000/api/users/u1"
    );
    await waitFor(() =>
      expect(screen.getByDisplayValue("Andrea")).toBeInTheDocument()
    );
    expect(screen.getByDisplayValue("Andy")).toBeInTheDocument();
    expect(screen.getByDisplayValue("andrea@example.com")).toBeInTheDocument();
    expect(screen.getByDisplayValue("123 Main St")).toBeInTheDocument();
    expect(screen.getByDisplayValue("+1 234 567 890")).toBeInTheDocument();
    expect(screen.getByText("Andrea")).toBeInTheDocument();
    expect(screen.getByText("andrea@example.com")).toBeInTheDocument();
  });

  it("shows N/A if name is missing", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ ...userDetailsResponse, name: undefined }),
    });
    render(<ProfilePage user={testUser} setModal={mockSetModal} />);
    await waitFor(() => expect(screen.getByText("N/A")).toBeInTheDocument());
  });

  it("enables inputs in edit mode and disables otherwise", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => userDetailsResponse,
    });
    render(<ProfilePage user={testUser} setModal={mockSetModal} />);
    await waitFor(() =>
      expect(screen.getByDisplayValue("Andrea")).toBeInTheDocument()
    );
    // Inputs should be disabled
    expect(screen.getByDisplayValue("Andrea")).toBeDisabled();
    // Click Edit
    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    // Inputs should be enabled
    expect(screen.getByDisplayValue("Andrea")).not.toBeDisabled();
    expect(screen.getByDisplayValue("Andy")).not.toBeDisabled();
    expect(screen.getByDisplayValue("andrea@example.com")).not.toBeDisabled();
    expect(screen.getByDisplayValue("123 Main St")).not.toBeDisabled();
    expect(screen.getByDisplayValue("+1 234 567 890")).not.toBeDisabled();
  });

  it("changing input updates state in edit mode", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => userDetailsResponse,
    });
    render(<ProfilePage user={testUser} setModal={mockSetModal} />);
    await waitFor(() =>
      expect(screen.getByDisplayValue("Andrea")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    const nameInput = screen.getByPlaceholderText("John Doe");
    fireEvent.change(nameInput, { target: { value: "New Name" } });
    expect(nameInput.value).toBe("New Name");
  });

  it("saves changes and exits edit mode on success", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => userDetailsResponse,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({}),
      });
    render(<ProfilePage user={testUser} setModal={mockSetModal} />);
    await waitFor(() =>
      expect(screen.getByDisplayValue("Andrea")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    const nameInput = screen.getByPlaceholderText("John Doe");
    fireEvent.change(nameInput, { target: { value: "New Name" } });
    fireEvent.click(screen.getByText(/save changes/i));
    await waitFor(() =>
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/users/u1",
        expect.objectContaining({
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: expect.stringContaining("New Name"),
        })
      )
    );
    // Inputs should be disabled after save
    // We wait for the "Edit" button to reappear, which confirms we are out of edit mode.
    await waitFor(() => {
      expect(
        screen.getByRole("button", { name: /^edit$/i })
      ).toBeInTheDocument();
    });
    expect(screen.getByDisplayValue("New Name")).toBeDisabled();
  });

  it("logs error and stays in edit mode if save fails", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => userDetailsResponse,
      })
      .mockResolvedValueOnce({
        ok: false,
      });
    render(<ProfilePage user={testUser} setModal={mockSetModal} />);
    await waitFor(() =>
      expect(screen.getByDisplayValue("Andrea")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /^edit$/i }));
    fireEvent.click(screen.getByText(/save changes/i));
    await waitFor(() =>
      expect(console.error).toHaveBeenCalledWith(
        "Error saving user details:",
        expect.any(Error)
      )
    );
    // Should still be in edit mode (inputs enabled)
    expect(screen.getByDisplayValue("Andrea")).not.toBeDisabled();
    errorSpy.mockRestore();
  });

  it("navigates to /request-credits when Request credits is clicked", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => userDetailsResponse,
    });
    render(<ProfilePage user={testUser} setModal={mockSetModal} />);
    await waitFor(() =>
      expect(screen.getByDisplayValue("Andrea")).toBeInTheDocument()
    );
    fireEvent.click(screen.getByRole("button", { name: /request credits/i }));
    expect(mockNavigate).toHaveBeenCalledWith("/request-credits");
  });
});

import React from "react";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import RequestCreditsPage from "../pages/RequestCreditsPage";

// Mock useAuth
const mockUser = { userID: "u1", name: "Andrea" };
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    auth: { user: mockUser },
  }),
}));

// Mock useNotifications
const mockCheckForNewNotifications = jest.fn();
jest.mock("../context/NotificationContext", () => ({
  useNotifications: () => ({
    checkForNewNotifications: mockCheckForNewNotifications,
  }),
}));

// Mock fetchAssignedModules
const mockFetchAssignedModules = jest.fn();
jest.mock("../../utils/fetchAssignedModules", () => ({
  fetchAssignedModules: (...args) => mockFetchAssignedModules(...args),
}));

const mockSetModal = jest.fn();

const modules = [
  {
    assignmentID: "a1",
    moduleID: "M101",
    moduleName: "Math",
    studentCredits: 5,
  },
  {
    assignmentID: "a2",
    moduleID: "M102",
    moduleName: "Science",
    studentCredits: 10,
  },
];

const requests = [
  {
    requestID: 1,
    assignmentID: "a1",
    creditsRequested: 5,
    status: "Pending",
    requestDate: "2024-06-01T00:00:00Z",
  },
  {
    requestID: 2,
    assignmentID: "a2",
    creditsRequested: 10,
    status: "Approved",
    requestDate: "2024-06-02T00:00:00Z",
  },
];

beforeEach(() => {
  jest.clearAllMocks();
  global.fetch = jest.fn();
  window.confirm = jest.fn(() => true);
  mockFetchAssignedModules.mockResolvedValue(modules);
  // Provide a default mock for fetching requests to prevent errors in tests that don't override it.
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => [],
  });
});

describe("RequestCreditsPage", () => {
  it("loads modules and requests, displays table", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => requests,
    });
    render(<RequestCreditsPage setModal={mockSetModal} />);
    await waitFor(() =>
      expect(screen.getByText(/Your Credit Requests/i)).toBeInTheDocument()
    );
    expect(screen.getByText("M101 - Math")).toBeInTheDocument();
    expect(screen.getByText("M102 - Science")).toBeInTheDocument();
    expect(screen.getByText("Pending")).toBeInTheDocument();
    expect(screen.getByText("Approved")).toBeInTheDocument();
  });

  it("shows loading spinner while fetching modules", async () => {
    mockFetchAssignedModules.mockImplementation(() => new Promise(() => {}));
    render(<RequestCreditsPage setModal={mockSetModal} />);
    expect(screen.getByText(/Loading your modules/i)).toBeInTheDocument();
  });

  it("shows error modal if module fetch fails", async () => {
    mockFetchAssignedModules.mockRejectedValueOnce(new Error("fail"));
    render(<RequestCreditsPage setModal={mockSetModal} />);
    await waitFor(() =>
      expect(mockSetModal).toHaveBeenCalledWith(
        expect.objectContaining({ type: "fail" })
      )
    );
  });

  it("shows message if no modules", async () => {
    mockFetchAssignedModules.mockResolvedValueOnce([]);
    render(<RequestCreditsPage setModal={mockSetModal} />);
    await waitFor(() =>
      expect(
        screen.getByText(/You are not enrolled in any modules yet/i)
      ).toBeInTheDocument()
    );
  });

  it("validates form: no module or credits", async () => {
    mockFetchAssignedModules.mockResolvedValueOnce(modules);
    global.fetch.mockResolvedValueOnce({ ok: true, json: async () => [] });
    render(<RequestCreditsPage setModal={mockSetModal} />);

    await waitFor(() => screen.getByLabelText(/Select Module/i));
    // Submitting the form directly is more reliable than clicking the button
    fireEvent.submit(
      screen.getByRole("button", { name: /submit credit request/i })
    );
    await waitFor(() =>
      expect(mockSetModal).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "fail",
          message: expect.stringContaining("select a module"),
        })
      )
    );
  });

  it("validates form: credits <= 0", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => requests,
    });
    render(<RequestCreditsPage setModal={mockSetModal} />);
    await waitFor(() => screen.getByLabelText(/Select Module/i));
    fireEvent.change(screen.getByLabelText(/Select Module/i), {
      target: { value: "a1" },
    });
    fireEvent.change(screen.getByLabelText(/Credits Requested/i), {
      target: { value: "0" },
    });
    // Submitting the form directly is more reliable than clicking the button
    fireEvent.submit(
      screen.getByRole("button", { name: /submit credit request/i })
    );
    await waitFor(() =>
      expect(mockSetModal).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "fail",
          message: expect.stringContaining("must be a positive number"),
        })
      )
    );
  });

  it("submits a credit request successfully", async () => {
    global.fetch
      // initial GET for requests
      .mockResolvedValueOnce({ ok: true, json: async () => requests })
      // POST for submit
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      // GET for refresh
      .mockResolvedValueOnce({ ok: true, json: async () => requests });

    render(<RequestCreditsPage setModal={mockSetModal} />);
    await waitFor(() => screen.getByLabelText(/Select Module/i));
    fireEvent.change(screen.getByLabelText(/Select Module/i), {
      target: { value: "a1" },
    });
    fireEvent.change(screen.getByLabelText(/Credits Requested/i), {
      target: { value: "7" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /submit credit request/i })
    );
    await waitFor(() =>
      expect(mockSetModal).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          message: expect.stringContaining("submitted"),
        })
      )
    );
  });

  it("shows error modal if credit request fails", async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => requests })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "fail" }),
      });
    render(<RequestCreditsPage setModal={mockSetModal} />);
    await waitFor(() => screen.getByLabelText(/Select Module/i));
    fireEvent.change(screen.getByLabelText(/Select Module/i), {
      target: { value: "a1" },
    });
    fireEvent.change(screen.getByLabelText(/Credits Requested/i), {
      target: { value: "7" },
    });
    fireEvent.click(
      screen.getByRole("button", { name: /submit credit request/i })
    );
    await waitFor(() =>
      expect(mockSetModal).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "fail",
          message: expect.stringContaining("fail"),
        })
      )
    );
  });

  it("deletes a pending request successfully", async () => {
    global.fetch
      // initial GET for requests
      .mockResolvedValueOnce({ ok: true, json: async () => requests })
      // DELETE
      .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
      // GET for refresh
      .mockResolvedValueOnce({ ok: true, json: async () => requests });

    render(<RequestCreditsPage setModal={mockSetModal} />);
    await waitFor(() => screen.getByText(/Your Credit Requests/i));
    fireEvent.click(screen.getAllByText(/Delete/i)[0]);
    await waitFor(() =>
      expect(mockSetModal).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          message: expect.stringContaining("deleted"),
        })
      )
    );
  });

  it("does not delete if user cancels confirm", async () => {
    window.confirm = jest.fn(() => false);
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => requests,
    });
    render(<RequestCreditsPage setModal={mockSetModal} />);
    await waitFor(() => screen.getByText(/Your Credit Requests/i));
    fireEvent.click(screen.getAllByText(/Delete/i)[0]);
    expect(global.fetch).toHaveBeenCalledTimes(1); // Only initial GET
  });

  it("shows error modal if delete fails", async () => {
    global.fetch
      .mockResolvedValueOnce({ ok: true, json: async () => requests })
      .mockResolvedValueOnce({
        ok: false,
        json: async () => ({ error: "fail" }),
      });
    render(<RequestCreditsPage setModal={mockSetModal} />);
    await waitFor(() => screen.getByText(/Your Credit Requests/i));
    fireEvent.click(screen.getAllByText(/Delete/i)[0]);
    await waitFor(() =>
      expect(mockSetModal).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "fail",
          message: expect.stringContaining("fail"),
        })
      )
    );
  });

  it("disables submit button when loading", async () => {
    // Mock fetch to not resolve immediately, keeping it in a loading state
    global.fetch.mockImplementation(() => new Promise(() => {}));

    render(<RequestCreditsPage setModal={mockSetModal} />);
    await waitFor(() => screen.getByLabelText(/Select Module/i));

    fireEvent.change(screen.getByLabelText(/Select Module/i), {
      target: { value: "a1" },
    });
    fireEvent.change(screen.getByLabelText(/Credits Requested/i), {
      target: { value: "7" },
    });

    // Simulate loading
    fireEvent.click(
      screen.getByRole("button", { name: /submit credit request/i })
    );

    // The button text changes, so we find it by its role and check if it's disabled.
    expect(screen.getByRole("button")).toBeDisabled();
    expect(screen.getByText(/Submitting Request/i)).toBeInTheDocument();
  });
});

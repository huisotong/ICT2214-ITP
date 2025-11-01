/**
 * @file ManageModules.test.jsx
 * @description Frontend unit tests for ManageModules component using Jest and React Testing Library.
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import ManageModules from "../pages/ManageModules";
import { useAuth } from "../context/AuthContext";

// Mock child components to isolate the ManageModules component
jest.mock("../components/manage-modules/ModuleSettings", () => () => (
  <div data-testid="module-settings">Module Settings</div>
));
jest.mock("../components/manage-modules/LLMSettings", () => () => (
  <div data-testid="llm-settings">LLM Settings</div>
));
jest.mock(
  "../components/manage-modules/ManageStudents",
  () =>
    ({ refreshTrigger }) =>
      (
        <div data-testid="manage-students">
          Manage Students - Refresh: {refreshTrigger}
        </div>
      )
);

// Mock AuthContext
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

// Mock fetchAssignedModules utility
jest.mock("../../utils/fetchAssignedModules", () => ({
  fetchAssignedModules: jest.fn(),
}));

import { fetchAssignedModules } from "../../utils/fetchAssignedModules";

describe("ManageModules Component", () => {
  const mockSetModal = jest.fn();
  const mockUser = { userID: "prof1" };
  const mockModules = [
    {
      moduleID: "CS101",
      moduleName: "Intro to CS",
      moduleDesc: "Basics of Computer Science",
      initialCredit: 10,
    },
    {
      moduleID: "CS102",
      moduleName: "Data Structures",
      moduleDesc: "Advanced data structures",
      initialCredit: 15,
    },
  ];

  beforeEach(() => {
    jest.clearAllMocks();

    // Mock authentication
    useAuth.mockReturnValue({
      auth: { user: mockUser },
    });

    // Mock initial module fetch
    fetchAssignedModules.mockResolvedValue(mockModules);

    // Mock global fetch for other API calls
    global.fetch = jest.fn((url) => {
      if (url.includes("/api/search-students")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve([{ studentID: "S123", fullName: "John Doe" }]),
        });
      }
      if (url.includes("/api/enroll-student")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ message: "Student enrolled!" }),
        });
      }
      if (url.includes("/api/delete-module")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({ message: "Module deleted successfully!" }),
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Unknown endpoint" }),
      });
    });

    // Mock window.confirm
    window.confirm = jest.fn(() => true);
  });

  test("renders initial state and fetches modules", async () => {
    await act(async () => {
      render(<ManageModules setModal={mockSetModal} />);
    });

    expect(screen.getByText("Select a module")).toBeInTheDocument();
    await waitFor(() => {
      expect(fetchAssignedModules).toHaveBeenCalledWith(mockUser.userID);
    });

    expect(await screen.findByText("CS101 - Intro to CS")).toBeInTheDocument();
    expect(screen.getByText("CS102 - Data Structures")).toBeInTheDocument();
  });

  test("selects a module and displays its details and components", async () => {
    render(<ManageModules setModal={mockSetModal} />);

    await waitFor(() => {
      expect(screen.getByText("CS101 - Intro to CS")).toBeInTheDocument();
    });

    // Select a module from the dropdown
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "CS101" },
    });

    await waitFor(() => {
      // Check if child components are rendered
      expect(screen.getByTestId("manage-students")).toBeInTheDocument();
      expect(screen.getByTestId("module-settings")).toBeInTheDocument();
      expect(screen.getByText("Delete Module")).toBeInTheDocument();
      expect(screen.getByText("+ Add Student")).toBeInTheDocument();
    });
  });

  test("switches between Module Settings and LLM Settings tabs", async () => {
    render(<ManageModules setModal={mockSetModal} />);
    await screen.findByText("CS101 - Intro to CS");

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "CS101" },
    });

    await screen.findByTestId("module-settings");
    expect(screen.getByTestId("module-settings")).toBeVisible();
    expect(screen.queryByTestId("llm-settings")).not.toBeInTheDocument();

    // Click LLM Settings tab
    fireEvent.click(screen.getByText("LLM Settings"));

    await screen.findByTestId("llm-settings");
    expect(screen.getByTestId("llm-settings")).toBeVisible();
    expect(screen.queryByTestId("module-settings")).not.toBeInTheDocument();
  });

  test("opens add student panel and handles single student enrollment", async () => {
    jest.useFakeTimers();
    render(<ManageModules setModal={mockSetModal} />);
    await screen.findByText("CS101 - Intro to CS");

    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "CS101" },
    });

    // Open the panel
    const addStudentButton = await screen.findByText("+ Add Student");
    fireEvent.click(addStudentButton);

    expect(
      await screen.findByText("Enroll Single Student")
    ).toBeInTheDocument();

    // Search for a student
    const searchInput = screen.getByPlaceholderText("Student ID");
    fireEvent.change(searchInput, { target: { value: "S123" } });

    // Fast-forward timers to trigger the search
    act(() => {
      jest.runAllTimers();
    });

    // Click suggestion
    const suggestion = await screen.findByText("S123 – John Doe");
    fireEvent.click(suggestion);
    expect(searchInput.value).toBe("S123");

    // Enroll the student
    const enrollButton = screen.getByRole("button", { name: "Enroll student" });
    fireEvent.click(enrollButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/enroll-student",
        expect.objectContaining({
          method: "POST",
          body: JSON.stringify({ moduleID: "CS101", studentID: "S123" }),
        })
      );
    });

    await waitFor(() => {
      expect(mockSetModal).toHaveBeenCalledWith({
        active: true,
        type: "success",
        message: "Student enrolled!",
      });
    });

    // Wait for the panel to close
    await waitFor(() => {
      expect(
        screen.queryByRole("button", { name: "Go back" })
      ).not.toBeInTheDocument();
    });

    jest.useRealTimers();
  });

  test("handles mass enrollment via CSV", async () => {
    // Mock CSV upload response
    global.fetch = jest.fn().mockResolvedValue({
      ok: true,
      json: () =>
        Promise.resolve({ message: "Processed 1 students.", skipped: [] }),
    });

    const { container } = render(<ManageModules setModal={mockSetModal} />);
    await screen.findByText("CS101 - Intro to CS");
    fireEvent.change(screen.getByRole("combobox"), {
      target: { value: "CS101" },
    });

    const addStudentButton = await screen.findByText("+ Add Student");
    fireEvent.click(addStudentButton);

    const massEnrollTab = await screen.findByText("Mass Enroll via CSV");
    fireEvent.click(massEnrollTab);

    // Simulate file upload
    const file = new File(["studentID\nS123"], "students.csv", {
      type: "text/csv",
    });
    // Since there's no label or test-id, we'll find the input element directly.
    const fileInput = container.querySelector('input[type="file"]');

    // RTL to test file inputs, so we mock the event
    Object.defineProperty(fileInput, "files", {
      value: [file],
    });
    fireEvent.change(fileInput);

    const uploadButton = screen.getByRole("button", { name: "Upload CSV" });
    fireEvent.click(uploadButton);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/enroll-students-csv",
        expect.any(Object)
      );
      const fetchCall = global.fetch.mock.calls[0];
      const formData = fetchCall[1].body;
      expect(formData.get("file")).toEqual(file);
      expect(formData.get("moduleID")).toBe("CS101");
    });

    await waitFor(() => {
      expect(mockSetModal).toHaveBeenCalledWith(
        expect.objectContaining({ type: "success" })
      );
    });
  });

  test("deletes a module after confirmation", async () => {
    await act(async () => {
      render(<ManageModules setModal={mockSetModal} />);
    });

    await act(async () => {
      fireEvent.change(screen.getByRole("combobox"), {
        target: { value: "CS101" },
      });
    });

    const deleteButton = await screen.findByText("Delete Module");
    fireEvent.click(deleteButton);

    expect(window.confirm).toHaveBeenCalledWith(
      "Are you sure you want to delete module CS101? This action cannot be undone."
    );

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/delete-module",
        expect.objectContaining({
          method: "DELETE",
          body: JSON.stringify({ moduleID: "CS101" }),
        })
      );
    });

    await waitFor(() => {
      expect(mockSetModal).toHaveBeenCalledWith({
        active: true,
        type: "success",
        message: "Module CS101 deleted successfully!",
      });
      expect(screen.queryByText("Delete Module")).not.toBeInTheDocument();
      // Also wait for the module list to be re-fetched, which resolves the `act` warning.
      // The mock is called once on load, and a second time after deletion.
      expect(fetchAssignedModules).toHaveBeenCalledTimes(2);
    });
  });
});

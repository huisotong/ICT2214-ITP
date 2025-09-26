import { render, screen, fireEvent, waitFor } from "@testing-library/react";

// Mock useAuth BEFORE importing HomePage
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));
import { useAuth } from "../context/AuthContext";

// Mock fetchAssignedModules
const mockFetchAssignedModules = jest.fn();
jest.mock("../../utils/fetchAssignedModules", () => ({
  fetchAssignedModules: (...args) => mockFetchAssignedModules(...args),
}));

// Mock child components
jest.mock("../components/home/Modules", () => (props) => (
  <div data-testid="modules">{JSON.stringify(props.modules)}</div>
));
jest.mock("../components/home/AddModuleOverlay", () => (props) => (
  <div data-testid="add-module-overlay">
    <button onClick={props.onClose}>Close Overlay</button>
  </div>
));

// 4️⃣ Import HomePage after mocks
import HomePage from "../pages/HomePage";

/* -----------------------------------------------
   ADMIN TESTS
----------------------------------------------- */
describe("HomePage (Admin)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      auth: { user: { userID: "u1", name: "AdminUser", role: "Admin" } },
    });
  });

  it("renders welcome message with user name", async () => {
    mockFetchAssignedModules.mockResolvedValueOnce([]);
    render(<HomePage setModal={jest.fn()} />);
    expect(screen.getByText(/Welcome, AdminUser!/)).toBeInTheDocument();
    await waitFor(() =>
      expect(mockFetchAssignedModules).toHaveBeenCalledWith("u1")
    );
  });

  it("calls fetchAssignedModules and passes modules to Modules", async () => {
    const modulesData = [{ id: 1, name: "Math" }];
    mockFetchAssignedModules.mockResolvedValueOnce(modulesData);
    render(<HomePage setModal={jest.fn()} />);
    await waitFor(() =>
      expect(screen.getByTestId("modules")).toHaveTextContent("Math")
    );
  });

  it("shows Add Module button for Admin", async () => {
    mockFetchAssignedModules.mockResolvedValueOnce([]);
    render(<HomePage setModal={jest.fn()} />);
    expect(screen.getByText(/Add Module/i)).toBeInTheDocument();
  });

  it("shows AddModuleOverlay when Add Module is clicked and closes on onClose", async () => {
    mockFetchAssignedModules.mockResolvedValueOnce([]);
    render(<HomePage setModal={jest.fn()} />);
    fireEvent.click(screen.getByText(/Add Module/i));
    expect(screen.getByTestId("add-module-overlay")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Close Overlay/i));
    expect(screen.queryByTestId("add-module-overlay")).not.toBeInTheDocument();
  });

  it("handles fetchAssignedModules error gracefully", async () => {
    const errorSpy = jest.spyOn(console, "error").mockImplementation(() => {});
    mockFetchAssignedModules.mockRejectedValueOnce(new Error("fail"));
    render(<HomePage setModal={jest.fn()} />);
    await waitFor(() => expect(mockFetchAssignedModules).toHaveBeenCalled());
    expect(errorSpy).toHaveBeenCalledWith(
      "Error fetching assigned modules:",
      expect.any(Error)
    );
    errorSpy.mockRestore();
  });
});

/* -----------------------------------------------
   STUDENT TESTS
----------------------------------------------- */
describe("HomePage (Student)", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useAuth.mockReturnValue({
      auth: { user: { userID: "u2", name: "StudentUser", role: "Student" } },
    });
  });

  it("does not show Add Module button for non-Admin", async () => {
    mockFetchAssignedModules.mockResolvedValueOnce([]);
    render(<HomePage setModal={jest.fn()} />);
    expect(screen.queryByText(/Add Module/i)).not.toBeInTheDocument();
  });
});

import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../pages/LoginPage";

// Mock sessionStorage
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage
});

// Mock AuthContext
const mockSetAuth = jest.fn();
const mockAuth = {
  isAuthenticated: false,
  user: null,
};

jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    auth: mockAuth,
    setAuth: mockSetAuth,
  }),
}));

// Mock the navigate function
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: () => mockNavigate,
}));

// Mock validateEmail utility
jest.mock("../../utils/helper", () => ({
  validateEmail: jest.fn(),
}));

// Mock fetch
global.fetch = jest.fn();

import { validateEmail } from "../../utils/helper";

const renderLoginPage = () => {
  return render(
    <MemoryRouter>
      <LoginPage />
    </MemoryRouter>
  );
};

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    validateEmail.mockReturnValue(true);
    
    // Setup default fetch response for successful login
    fetch.mockResolvedValue({
      ok: true,
      json: async () => ({
        user: { email: "student@sit.singaporetech.edu.sg" },
        token: "abc123"
      })
    });
  });

  afterEach(() => {
    mockSessionStorage.setItem.mockClear();
    mockSessionStorage.getItem.mockClear();
  });

  it("should render login form with all required elements", () => {
    renderLoginPage();

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your email")).toBeInTheDocument();
    expect(screen.getByPlaceholderText("Enter your password")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: /log in/i })).toBeInTheDocument();
  });

  it("should show error when email and password are empty", async () => {
    renderLoginPage();

    const submitButton = screen.getByRole("button", { name: /log in/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Email and password cannot be empty")
      ).toBeInTheDocument();
    });
  });

  it("should show error when email is invalid", async () => {
    validateEmail.mockReturnValue(false);
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const submitButton = screen.getByRole("button", { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: "invalid-email" } });
    fireEvent.change(passwordInput, { target: { value: "123456" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
    });
  });

  it("should show error for invalid credentials", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 401
    });

    renderLoginPage();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const submitButton = screen.getByRole("button", { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: "wrong@email.com" } });
    fireEvent.change(passwordInput, { target: { value: "wrongpassword" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("Invalid email or password")).toBeInTheDocument();
    });
  });

  it("should successfully login with valid credentials", async () => {
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const submitButton = screen.getByRole("button", { name: /log in/i });

    fireEvent.change(emailInput, {
      target: { value: "student@sit.singaporetech.edu.sg" },
    });
    fireEvent.change(passwordInput, { target: { value: "123456" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        "token",
        "abc123"
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        "user",
        JSON.stringify({ email: "student@sit.singaporetech.edu.sg" })
      );
      expect(mockNavigate).toHaveBeenCalledWith("/home");
    });
  });

  it("should update email input value when typed", () => {
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    expect(emailInput.value).toBe("test@example.com");
  });

  it("should update password input value when typed", () => {
    renderLoginPage();

    const passwordInput = screen.getByPlaceholderText("Enter your password");
    fireEvent.change(passwordInput, { target: { value: "testpassword" } });

    expect(passwordInput.value).toBe("testpassword");
  });

  it("should clear error message on successful login", async () => {
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const submitButton = screen.getByRole("button", { name: /log in/i });

    // First, trigger an error
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(
        screen.getByText("Email and password cannot be empty")
      ).toBeInTheDocument();
    });

    // Then, provide valid credentials
    fireEvent.change(emailInput, {
      target: { value: "student@sit.singaporetech.edu.sg" },
    });
    fireEvent.change(passwordInput, { target: { value: "123456" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.queryByText("Email and password cannot be empty")
      ).not.toBeInTheDocument();
    });
  });

  it("should handle form submission with Enter key", async () => {
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");

    fireEvent.change(emailInput, {
      target: { value: "student@sit.singaporetech.edu.sg" },
    });
    fireEvent.change(passwordInput, { target: { value: "123456" } });
    fireEvent.submit(emailInput.closest("form"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/home");
    });
  });

  it("should show error when only email is provided", async () => {
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const submitButton = screen.getByRole("button", { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Email and password cannot be empty")
      ).toBeInTheDocument();
    });
  });

  it("should show error when only password is provided", async () => {
    renderLoginPage();

    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const submitButton = screen.getByRole("button", { name: /log in/i });

    fireEvent.change(passwordInput, { target: { value: "testpassword" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(
        screen.getByText("Email and password cannot be empty")
      ).toBeInTheDocument();
    });
  });

  it("should handle network error during login", async () => {
    fetch.mockRejectedValueOnce(new Error("Network error"));

    renderLoginPage();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const submitButton = screen.getByRole("button", { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "testpassword" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("An error occurred. Please try again.")).toBeInTheDocument();
    });
  });

  it("should clear previous error when starting new login attempt", async () => {
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const submitButton = screen.getByRole("button", { name: /log in/i });

    // First, trigger an error
    fireEvent.click(submitButton);
    await waitFor(() => {
      expect(
        screen.getByText("Email and password cannot be empty")
      ).toBeInTheDocument();
    });

    // Start typing in email field
    fireEvent.change(emailInput, { target: { value: "t" } });

    // Error should still be visible until form is submitted again
    expect(
      screen.getByText("Email and password cannot be empty")
    ).toBeInTheDocument();
  });

  it("should validate email format correctly", async () => {
    validateEmail.mockReturnValue(false);
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const submitButton = screen.getByRole("button", { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: "notanemail" } });
    fireEvent.change(passwordInput, { target: { value: "testpassword" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(validateEmail).toHaveBeenCalledWith("notanemail");
      expect(
        screen.getByText("Please enter a valid email address")
      ).toBeInTheDocument();
    });
  });

  it("should handle server error response", async () => {
    fetch.mockResolvedValueOnce({
      ok: false,
      status: 500
    });

    renderLoginPage();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const submitButton = screen.getByRole("button", { name: /log in/i });

    fireEvent.change(emailInput, { target: { value: "test@example.com" } });
    fireEvent.change(passwordInput, { target: { value: "testpassword" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText("An error occurred. Please try again.")).toBeInTheDocument();
    });
  });

  it("should call setAuth after successful login", async () => {
    renderLoginPage();

    const emailInput = screen.getByPlaceholderText("Enter your email");
    const passwordInput = screen.getByPlaceholderText("Enter your password");
    const submitButton = screen.getByRole("button", { name: /log in/i });

    fireEvent.change(emailInput, {
      target: { value: "student@sit.singaporetech.edu.sg" },
    });
    fireEvent.change(passwordInput, { target: { value: "123456" } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockSetAuth).toHaveBeenCalledWith({
        isAuthenticated: true,
        user: { email: "student@sit.singaporetech.edu.sg" }
      });
    });
  });
});
    const mockUser = { email: "student@sit.singaporetech.edu.sg" };
    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

    render(<HomePage />);

    expect(
      screen.getByText("Welcome, student@sit.singaporetech.edu.sg!")
    ).toBeInTheDocument();
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith("user");
  });

  it('should render welcome message with "Unknown" when user data does not exist in sessionStorage', () => {
    mockSessionStorage.getItem.mockReturnValue(null);

    render(<HomePage />);

    expect(screen.getByText("Welcome, Unknown!")).toBeInTheDocument();
    expect(mockSessionStorage.getItem).toHaveBeenCalledWith("user");
  });

  it('should render welcome message with "Unknown" when user data exists but has no email', () => {
    const mockUser = { name: "John Doe" }; // No email property
    mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockUser));

    render(<HomePage />);

    expect(screen.getByText("Welcome, Unknown!")).toBeInTheDocument();
  });

  it('should render welcome message with "Unknown" when sessionStorage contains invalid JSON', () => {
    mockSessionStorage.getItem.mockReturnValue("invalid-json");

    render(<HomePage />);

    expect(screen.getByText("Welcome, Unknown!")).toBeInTheDocument();
  });

  it("should have correct styling and structure", () => {
    mockSessionStorage.getItem.mockReturnValue(null);

    render(<HomePage />);

    const container = screen.getByText("Welcome, Unknown!").parentElement;
    expect(container).toHaveStyle({ padding: "2rem" });
  });
});

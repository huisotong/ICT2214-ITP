import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import LoginPage from "../pages/LoginPage";

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
  });

  afterEach(() => {
    mockSessionStorage.setItem.mockClear();
  });

  it("should render login form with all required elements", () => {
    renderLoginPage();

    expect(screen.getByText("Login Page")).toBeInTheDocument();
    expect(screen.getByLabelText(/email/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
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

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
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
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
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

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
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

    const emailInput = screen.getByLabelText(/email/i);
    fireEvent.change(emailInput, { target: { value: "test@example.com" } });

    expect(emailInput.value).toBe("test@example.com");
  });

  it("should update password input value when typed", () => {
    renderLoginPage();

    const passwordInput = screen.getByLabelText(/password/i);
    fireEvent.change(passwordInput, { target: { value: "testpassword" } });

    expect(passwordInput.value).toBe("testpassword");
  });

  it("should clear error message on successful login", async () => {
    renderLoginPage();

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);
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

    const emailInput = screen.getByLabelText(/email/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, {
      target: { value: "student@sit.singaporetech.edu.sg" },
    });
    fireEvent.change(passwordInput, { target: { value: "123456" } });
    fireEvent.submit(emailInput.closest("form"));

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith("/home");
    });
  });
});

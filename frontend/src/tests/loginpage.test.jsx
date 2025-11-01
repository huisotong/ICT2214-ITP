import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import React from "react";

// 1️⃣ Mock react-router-dom navigate
const mockNavigate = jest.fn();
jest.mock("react-router-dom", () => ({
  useNavigate: () => mockNavigate,
}));

// 2️⃣ Mock useAuth
const mockSetAuth = jest.fn();
jest.mock("../context/AuthContext", () => ({
  useAuth: () => ({
    setAuth: mockSetAuth,
  }),
}));

// 3️⃣ Mock validateEmail
jest.mock("../../utils/helper", () => ({
  validateEmail: jest.fn(),
}));
import { validateEmail } from "../../utils/helper";

// 4️⃣ Mock Input component
jest.mock("../components/login/Input", () => (props) => (
  <input
    aria-label={props.label}
    type={props.type}
    placeholder={props.placeholder}
    value={props.value}
    onChange={props.onChange}
  />
));

// 5️⃣ Import component *after mocks*
import LoginPage from "../pages/LoginPage";

describe("LoginPage", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn(); // mock fetch globally
  });

  /* ----------------------------- Rendering ----------------------------- */
  it("renders the login page with email and password fields", () => {
    render(<LoginPage />);
    expect(screen.getByText(/Login Page/i)).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Email is student@sit.singaporetech.edu.sg/i)
    ).toBeInTheDocument();
    expect(
      screen.getByLabelText(/Password is teststudent/i)
    ).toBeInTheDocument();
  });

  /* ------------------------ Validation: Empty Fields ------------------------ */
  it("shows error when fields are empty", async () => {
    render(<LoginPage />);
    fireEvent.click(screen.getByText(/Log In/i));
    expect(
      await screen.findByText(/Email and password cannot be empty/i)
    ).toBeInTheDocument();
  });

  // /* ------------------------ Validation: Invalid Email ----------------------- */
  // it("shows error when email is invalid", async () => {
  //   validateEmail.mockReturnValue(false);
  //   render(<LoginPage />);

  //   fireEvent.change(
  //     screen.getByLabelText(/Email is student@sit.singaporetech.edu.sg/i),
  //     { target: { value: "invalidemail" } }
  //   );
  //   fireEvent.change(screen.getByLabelText(/Password is teststudent/i), {
  //     target: { value: "password123" },
  //   });
  //   fireEvent.click(screen.getByText(/Log In/i));

  //   expect(
  //     await screen.findByText(/Please include/i)
  //   ).toBeInTheDocument();
  // });
  /* ------------------------ Validation: Invalid Email ----------------------- */
  it("shows error when email is invalid", async () => {
    // For this test, make the globally mocked validateEmail return false.
    validateEmail.mockReturnValue(false);
    render(<LoginPage />);

    // Case 1: Missing '@'
    fireEvent.change(
      screen.getByLabelText(/Email is student@sit.singaporetech.edu.sg/i),
      { target: { value: "invalidemail" } }
    );
    fireEvent.change(screen.getByLabelText(/Password is teststudent/i), {
      target: { value: "password123" },
    });
    fireEvent.submit(screen.getByRole("button", { name: /Log In/i }));

    expect(
      await screen.findByText(/Please enter a valid email address/i)
    ).toBeInTheDocument();

    // Case 2: Double '@'
    fireEvent.change(
      screen.getByLabelText(/Email is student@sit.singaporetech.edu.sg/i),
      { target: { value: "admin@@sit.singaporetech.edu.sg" } }
    );
    fireEvent.submit(screen.getByRole("button", { name: /Log In/i }));

    expect(
      await screen.findByText(/Please enter a valid email address/i)
    ).toBeInTheDocument();

    // Case 3: No domain part
    fireEvent.change(
      screen.getByLabelText(/Email is student@sit.singaporetech.edu.sg/i),
      { target: { value: "admin@sit" } }
    );
    fireEvent.submit(screen.getByRole("button", { name: /Log In/i }));

    expect(
      await screen.findByText(/Please enter a valid email address/i)
    ).toBeInTheDocument();

    // Ensure validateEmail was called each time
    expect(validateEmail).toHaveBeenCalledTimes(3);
  });

  /* ---------------------------- Successful Login --------------------------- */
  it("calls fetch and navigates on successful login", async () => {
    validateEmail.mockReturnValue(true);

    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({ user: { name: "Test User" } }),
    });

    render(<LoginPage />);

    fireEvent.change(
      screen.getByLabelText(/Email is student@sit.singaporetech.edu.sg/i),
      { target: { value: "student@sit.singaporetech.edu.sg" } }
    );
    fireEvent.change(screen.getByLabelText(/Password is teststudent/i), {
      target: { value: "teststudent" },
    });

    fireEvent.click(screen.getByText(/Log In/i));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/login",
        expect.objectContaining({
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: "student@sit.singaporetech.edu.sg",
            password: "teststudent",
          }),
        })
      );
      expect(mockSetAuth).toHaveBeenCalledWith({
        isAuthenticated: true,
        user: { name: "Test User" },
      });
      expect(mockNavigate).toHaveBeenCalledWith("/home");
    });
  });

  /* ------------------------------ Login Failed ----------------------------- */
  it("shows error when login fails (400/401)", async () => {
    validateEmail.mockReturnValue(true);

    global.fetch.mockResolvedValueOnce({
      ok: false,
      json: async () => ({ error: "Invalid credentials" }),
    });

    render(<LoginPage />);

    fireEvent.change(
      screen.getByLabelText(/Email is student@sit.singaporetech.edu.sg/i),
      { target: { value: "student@sit.singaporetech.edu.sg" } }
    );
    fireEvent.change(screen.getByLabelText(/Password is teststudent/i), {
      target: { value: "wrongpassword" },
    });

    fireEvent.click(screen.getByText(/Log In/i));

    expect(await screen.findByText(/Invalid credentials/i)).toBeInTheDocument();
  });

  /* -------------------------- Network / Fetch Error ------------------------ */
  it("shows error when a network error occurs", async () => {
    validateEmail.mockReturnValue(true);
    global.fetch.mockRejectedValueOnce(new Error("Network error"));

    render(<LoginPage />);

    fireEvent.change(
      screen.getByLabelText(/Email is student@sit.singaporetech.edu.sg/i),
      { target: { value: "student@sit.singaporetech.edu.sg" } }
    );
    fireEvent.change(screen.getByLabelText(/Password is teststudent/i), {
      target: { value: "teststudent" },
    });

    fireEvent.click(screen.getByText(/Log In/i));

    expect(
      await screen.findByText(/An error occurred while trying to log in/i)
    ).toBeInTheDocument();
  });
});

import React from "react";
import { render, screen, waitFor, fireEvent } from "@testing-library/react";
import ManageCreditRequests from "../pages/ManageCreditRequests";

const mockSetModal = jest.fn();

const mockRequests = [
  {
    requestID: 1,
    studentID: "S123",
    studentName: "Alice",
    moduleID: "M101",
    moduleName: "Math",
    creditsRequested: 10,
    status: "Pending",
    requestDate: "2024-06-01T00:00:00Z",
  },
  {
    requestID: 2,
    studentID: "S124",
    studentName: "Bob",
    moduleID: "M102",
    moduleName: "Science",
    creditsRequested: 5,
    status: "Approved",
    requestDate: "2024-06-02T00:00:00Z",
  },
  {
    requestID: 3,
    studentID: "S125",
    studentName: "Charlie",
    moduleID: "M103",
    moduleName: "English",
    creditsRequested: 7,
    status: "Rejected",
    requestDate: "2024-06-03T00:00:00Z",
  },
];

describe("ManageCreditRequests", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    global.fetch = jest.fn();
  });

  it("shows loading state initially", async () => {
    global.fetch.mockReturnValue(
      new Promise(() => {}) // never resolves
    );
    render(<ManageCreditRequests setModal={mockSetModal} />);
    expect(screen.getByText(/loading requests/i)).toBeInTheDocument();
  });

  it("renders requests after loading", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRequests,
    });
    render(<ManageCreditRequests setModal={mockSetModal} />);
    // On initial render, only the "Outstanding" request should be visible
    await waitFor(() => expect(screen.getByText("Alice")).toBeInTheDocument());
    expect(screen.queryByText("Bob")).not.toBeInTheDocument();
    expect(screen.queryByText("Charlie")).not.toBeInTheDocument();

    // Switch to the "Past Requests" tab
    fireEvent.click(screen.getByText(/Past Requests/i));

    // Now "Bob" and "Charlie" should be visible, and "Alice" should not
    expect(await screen.findByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    expect(screen.queryByText("Alice")).not.toBeInTheDocument();
  });

  it("shows error if fetch fails", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: false,
    });
    render(<ManageCreditRequests setModal={mockSetModal} />);
    await waitFor(() =>
      expect(
        screen.getByText(/failed to fetch credit requests/i)
      ).toBeInTheDocument()
    );
  });

  it("shows no outstanding requests if none pending", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        mockRequests.map((r) =>
          r.status === "Pending" ? { ...r, status: "Approved" } : r
        ),
    });
    render(<ManageCreditRequests setModal={mockSetModal} />);
    await waitFor(() =>
      expect(
        screen.getByText(/no outstanding requests found/i)
      ).toBeInTheDocument()
    );
  });

  it("shows no past requests if none approved/rejected", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () =>
        mockRequests.map((r) =>
          r.status !== "Pending" ? { ...r, status: "Pending" } : r
        ),
    });
    render(<ManageCreditRequests setModal={mockSetModal} />);
    await waitFor(() => screen.getByText(/Outstanding Requests/));
    fireEvent.click(screen.getByText(/Past Requests/i));
    expect(screen.getByText(/no past requests found/i)).toBeInTheDocument();
  });

  it("can switch between Outstanding and Past Requests tabs", async () => {
    global.fetch.mockResolvedValueOnce({
      ok: true,
      json: async () => mockRequests,
    });
    render(<ManageCreditRequests setModal={mockSetModal} />);
    await waitFor(() => screen.getByText("Alice"));
    fireEvent.click(screen.getByText(/Past Requests/i));
    expect(screen.getByText("Bob")).toBeInTheDocument();
    expect(screen.getByText("Charlie")).toBeInTheDocument();
    fireEvent.click(screen.getByText(/Outstanding Requests/i));
    expect(screen.getByText("Alice")).toBeInTheDocument();
  });

  it("approves a request and updates status", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRequests,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "Approved" }),
      });
    render(<ManageCreditRequests setModal={mockSetModal} />);
    await waitFor(() => screen.getByText("Alice"));
    const approveBtn = screen.getAllByText(/approve/i)[0];
    fireEvent.click(approveBtn);
    await waitFor(() =>
      expect(mockSetModal).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          message: expect.stringContaining("approved"),
        })
      )
    );
  });

  it("rejects a request and updates status", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRequests,
      })
      .mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: "Rejected" }),
      });
    render(<ManageCreditRequests setModal={mockSetModal} />);
    await waitFor(() => screen.getByText("Alice"));
    const rejectBtn = screen.getAllByText(/reject/i)[0];
    fireEvent.click(rejectBtn);
    await waitFor(() =>
      expect(mockSetModal).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "success",
          message: expect.stringContaining("rejected"),
        })
      )
    );
  });

  it("shows error modal if approve fails", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRequests,
      })
      .mockResolvedValueOnce({
        ok: false,
      });
    render(<ManageCreditRequests setModal={mockSetModal} />);
    await waitFor(() => screen.getByText("Alice"));
    const approveBtn = screen.getAllByText(/approve/i)[0];
    fireEvent.click(approveBtn);
    await waitFor(() =>
      expect(mockSetModal).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "fail",
        })
      )
    );
  });

  it("shows error modal if reject fails", async () => {
    global.fetch
      .mockResolvedValueOnce({
        ok: true,
        json: async () => mockRequests,
      })
      .mockResolvedValueOnce({
        ok: false,
      });
    render(<ManageCreditRequests setModal={mockSetModal} />);
    await waitFor(() => screen.getByText("Alice"));
    const rejectBtn = screen.getAllByText(/reject/i)[0];
    fireEvent.click(rejectBtn);
    await waitFor(() =>
      expect(mockSetModal).toHaveBeenCalledWith(
        expect.objectContaining({
          type: "fail",
        })
      )
    );
  });
});

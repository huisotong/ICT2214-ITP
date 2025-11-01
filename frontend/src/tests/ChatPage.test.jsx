/**
 * @file ChatPage.test.jsx
 * @description Frontend unit tests for ChatPage component using Jest and React Testing Library.
 */

import React from "react";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
  within,
} from "@testing-library/react";
import "@testing-library/jest-dom";
import ChatPage from "../pages/ChatPage";
import { useAuth } from "../context/AuthContext";
import { useParams } from "react-router-dom";

// Polyfill for TextEncoder and ReadableStream which are not available in JSDOM
import { TextEncoder } from "util";
import { ReadableStream } from "stream/web";
global.TextEncoder = TextEncoder;
global.ReadableStream = ReadableStream;

Element.prototype.scrollIntoView = jest.fn();

// Mock dependencies
jest.mock("../context/AuthContext", () => ({
  useAuth: jest.fn(),
}));

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useParams: jest.fn(),
}));

jest.mock(
  "../styles/chatpage.module.css",
  () => new Proxy({}, { get: (t, p) => p })
);

// Mock markdown libraries that use ESM syntax
jest.mock("react-markdown", () => (props) => <>{props.children}</>);
jest.mock("remark-gfm", () => () => {});
jest.mock("remark-breaks", () => () => {});

// Silence console.error for this test file to keep output clean from expected errors
beforeAll(() => {
  jest.spyOn(console, "error").mockImplementation(() => {});
});

afterAll(() => {
  console.error.mockRestore();
});

const mockUser = { userID: 123, name: "Test User" };

// Helper to mock a streaming fetch response
const mockStreamingFetch = (chunks) => {
  global.fetch.mockImplementation(async (url, options) => {
    // This function will now ADD to the mock implementation, not replace it.
    if (url.includes("/api/send-message")) {
      const encoder = new TextEncoder();
      const readableStream = new ReadableStream({
        start(controller) {
          chunks.forEach((chunk) => {
            controller.enqueue(
              encoder.encode(`data: ${JSON.stringify(chunk)}\n\n`)
            );
          });
          controller.close();
        },
      });
      return Promise.resolve({
        ok: true,
        body: readableStream,
        headers: new Headers({ "Content-Type": "text/event-stream" }),
      });
    }
    // Fallback to the general mock for initial data loading
    return mockInitialFetches(url, options);
  });
};

const mockInitialFetches = (url, options) => {
  if (url.includes("/api/get-module-model/")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve({ model_name: "GPT-4 Turbo" }),
    });
  }
  if (url.includes("/api/get-chat-history/")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve([
          { historyID: 1, chatlog: "Old Chat", dateStarted: "2025-01-01" },
        ]),
    });
  }
  if (url.includes("/api/get-chat-message/")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve([
          { sender: "user", content: "Hi", timestamp: "2025-01-01" },
          { sender: "ai", content: "Hello!", timestamp: "2025-01-01" },
        ]),
    });
  }
  if (url.includes("/api/students-in-module/")) {
    return Promise.resolve({
      ok: true,
      json: () => Promise.resolve([{ userID: 123, studentCredits: 10.0 }]),
    });
  }
  // Mock for agent chat
  if (url.includes("/api/marketplace/my-agents")) {
    return Promise.resolve({
      ok: true,
      json: () =>
        Promise.resolve({
          success: true,
          agents: [
            { agent: { agentID: "agent-1", name: "Test Agent" } },
            { agent: { agentID: "agent-2", name: "Another Agent" } },
          ],
        }),
    });
  }
  return Promise.resolve({
    ok: false,
    json: () => Promise.resolve({ error: "Unknown endpoint" }),
  });
};

describe("ChatPage - Module Chat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useParams.mockReturnValue({ id: "module-1" });
    useAuth.mockReturnValue({
      auth: { user: mockUser, isAuthenticated: true },
    });

    // Set up the general fetch mock for all tests in this suite
    global.fetch = jest.fn(mockInitialFetches);
  });

  test("renders initial UI, fetches model details, credits, and chat history", async () => {
    render(<ChatPage />);
    expect(screen.getByText(/Model:/i)).toBeInTheDocument();
    expect(screen.getByText(/Loading.../i)).toBeInTheDocument();

    await waitFor(() => {
      expect(screen.getByText("GPT-4 Turbo")).toBeInTheDocument();
      expect(screen.getByText(/Credits: 10.00000/i)).toBeInTheDocument();
      expect(screen.getByText("Old Chat")).toBeInTheDocument();
    });
  });

  test("loads and displays messages when a chat is selected", async () => {
    render(<ChatPage />);
    const chatItem = await screen.findByText("Old Chat");
    fireEvent.click(chatItem.parentElement);

    expect(await screen.findByText("Hi")).toBeInTheDocument();
    expect(await screen.findByText("Hello!")).toBeInTheDocument();
  });

  test("sends a message and displays the user message", async () => {
    mockStreamingFetch([
      { type: "token", data: "Thinking..." },
      {
        type: "done",
        chat_id: 200,
        chat_title: "New Chat",
        final: "AI Reply",
      },
    ]);

    render(<ChatPage />);

    await waitFor(() =>
      expect(screen.getByText("GPT-4 Turbo")).toBeInTheDocument()
    );

    const input = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: "Hello there!" } });
    fireEvent.submit(input.closest("form"));

    // User message should appear immediately
    expect(await screen.findByText("Hello there!")).toBeInTheDocument();
  });

  test("receives a streamed AI message and updates placeholder", async () => {
    mockStreamingFetch([
      { type: "token", data: "Partial " },
      { type: "token", data: "response" },
      {
        type: "done",
        chat_id: 300,
        chat_title: "Streamed Chat",
        final: "Partial response",
      },
    ]);

    render(<ChatPage />);

    await waitFor(() =>
      expect(screen.getByText("GPT-4 Turbo")).toBeInTheDocument()
    );

    const input = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: "Stream test" } });
    fireEvent.submit(input.closest("form"));

    // Wait for final AI message to appear after streaming completes
    await waitFor(() => {
      expect(screen.getByText("Partial response")).toBeInTheDocument();
    });
  });

  test("disables input and shows warning when credits are negative", async () => {
    global.fetch.mockImplementation((url) => {
      if (url.includes("/api/students-in-module/")) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve([{ userID: 123, studentCredits: -1 }]),
        });
      }
      return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
    });

    render(<ChatPage />);

    const input = await screen.findByPlaceholderText(
      /Cannot send - negative credits/i
    );
    expect(input).toBeDisabled();
    expect(screen.getByText(/cannot submit new prompts/i)).toBeInTheDocument();
  });

  test("toggles internet search and includes it in the payload", async () => {
    mockStreamingFetch([
      {
        type: "done",
        final: "Response",
        chat_id: 100,
        chat_title: "Search Chat",
      },
    ]);
    render(<ChatPage />);
    await waitFor(() =>
      expect(screen.getByText("GPT-4 Turbo")).toBeInTheDocument()
    );

    const checkbox = screen.getByLabelText(/Enable Internet Search/i);
    fireEvent.click(checkbox);
    expect(checkbox).toBeChecked();

    const input = screen.getByPlaceholderText(/Type your message/i);
    fireEvent.change(input, { target: { value: "Search for something" } });
    fireEvent.submit(input.closest("form"));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        "http://localhost:5000/api/send-message",
        expect.objectContaining({
          body: expect.stringContaining('"internet_search":true'),
        })
      );
    });
    await waitFor(() => {
      expect(screen.getByText("Response")).toBeInTheDocument();
    });
  });
});

describe("ChatPage - Agent Chat", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock URL to be an agent chat
    Object.defineProperty(window, "location", {
      value: { pathname: "/chat/agent/agent-1" },
      writable: true,
    });
    useParams.mockReturnValue({ id: "agent-1" });
    useAuth.mockReturnValue({
      auth: { user: mockUser, isAuthenticated: true },
    });

    global.fetch = jest.fn((url) => {
      if (url.includes("/api/marketplace/agents/agent-1")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              agent: {
                name: "Test Agent",
                description: "An agent for testing",
              },
            }),
        });
      }
      if (url.includes("/api/marketplace/my-agents")) {
        return Promise.resolve({
          ok: true,
          json: () =>
            Promise.resolve({
              success: true,
              agents: [
                { agent: { agentID: "agent-1", name: "Test Agent" } },
                { agent: { agentID: "agent-2", name: "Another Agent" } },
              ],
            }),
        });
      }
      return Promise.resolve({
        ok: false,
        json: () => Promise.resolve({ error: "Unknown endpoint" }),
      });
    });
  });

  test("renders agent details and agent switcher", async () => {
    render(<ChatPage />);

    // Agent details should be displayed
    expect(await screen.findByText("Test Agent")).toBeInTheDocument();
    // Credits should not be displayed for agent chats
    expect(screen.queryByText(/Credits:/i)).not.toBeInTheDocument();

    // Agent switcher should be present
    const switchButton = screen.getByText(/Switch Agent/i);
    expect(switchButton).toBeInTheDocument();

    // Open the agent selector
    fireEvent.click(switchButton);

    // Check if other agents are listed
    expect(await screen.findByText("Another Agent")).toBeInTheDocument();
  });
});

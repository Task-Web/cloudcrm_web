import { render, screen, waitFor } from "@testing-library/react";
import App from "../App";

const buildResponse = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { "Content-Type": "application/json" },
  });

describe("App", () => {
  const statePayload = {
    user_id: "test-user",
    workspace: {
      user: { userId: "user-1", firstName: "Test", lastName: "User" },
      users: [],
      leads: [],
      accounts: [],
      contacts: [],
      opportunities: [],
      cases: [],
      activities: [],
      chatterPosts: [],
      dashboards: [],
      files: [],
      following: [],
    },
  };

  beforeEach(() => {
    global.fetch = vi.fn(async () => buildResponse(statePayload));
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("renders the CRM workspace", async () => {
    render(<App />);

    expect(await screen.findByText(/Good morning, Test!/i)).toBeInTheDocument();
    await waitFor(() => expect(global.fetch).toHaveBeenCalledTimes(1));
    expect(screen.getByText(/Recent Items/i)).toBeInTheDocument();
  });

  it("renders navigation for the product resources", async () => {
    render(<App />);
    await screen.findByText(/Good morning, Test!/i);
    expect(screen.getByRole("link", { name: /CloudCRM/i })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /View all leads/i })).toBeInTheDocument();
  });
});

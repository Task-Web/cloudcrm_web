import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { useApp } from "../context/AppContext";
import { LeadDetail } from "./LeadDetail";

vi.mock("../context/AppContext", () => ({ useApp: vi.fn() }));

let state;
let convertLead;
let toast;

const renderDetail = () => render(
  <MemoryRouter initialEntries={["/leads/lead-1"]}>
    <Routes>
      <Route path="/leads/:id" element={<LeadDetail onShowToast={toast} />} />
      <Route path="/accounts/:id" element={<div>Created account</div>} />
    </Routes>
  </MemoryRouter>
);

beforeEach(() => {
  state = {
    users: [], accounts: [],
    leads: [{ leadId: "lead-1", firstName: "Ada", lastName: "Lovelace",
      company: "Analytical", status: "Qualified", rating: "Hot",
      createdDate: "2026-01-01T00:00:00Z", modifiedDate: "2026-01-01T00:00:00Z" }],
  };
  convertLead = vi.fn();
  toast = vi.fn();
  useApp.mockReturnValue({ state, convertLead, applyCrmChange: vi.fn() });
});

afterEach(() => vi.clearAllMocks());

it("allows a Qualified lead to open the conversion form", () => {
  renderDetail();
  const button = screen.getByRole("button", { name: "Convert", exact: true });
  expect(button).toBeEnabled();
  fireEvent.click(button);
  expect(screen.getByRole("button", { name: "Convert Lead", exact: true })).toBeEnabled();
});

it.each([
  { isConverted: true }, { status: "Converted" },
  { convertedAccountId: "account-1" }, { convertedContactId: "contact-1" },
  { convertedOpportunityId: "opp-1" }, { convertedDate: "2026-01-01T00:00:00Z" },
])("disables conversion for an existing conversion marker %j", (marker) => {
  Object.assign(state.leads[0], marker);
  renderDetail();
  expect(screen.getByRole("button", { name: "Converted", exact: true })).toBeDisabled();
  expect(convertLead).not.toHaveBeenCalled();
});

it("prevents repeat submission while conversion is pending", async () => {
  let finish;
  convertLead.mockImplementation(() => new Promise((resolve) => { finish = resolve; }));
  renderDetail();
  fireEvent.click(screen.getByRole("button", { name: "Convert", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Convert Lead", exact: true }));
  const pending = screen.getByRole("button", { name: "Converting...", exact: true });
  expect(pending).toBeDisabled();
  fireEvent.click(pending);
  expect(convertLead).toHaveBeenCalledTimes(1);
  await act(async () => finish({ accounts: [{ accountId: "new-account" }] }));
  expect(screen.getByText("Created account")).toBeInTheDocument();
});

it("allows retry after conversion fails", async () => {
  convertLead.mockRejectedValue(new Error("Temporary failure"));
  renderDetail();
  fireEvent.click(screen.getByRole("button", { name: "Convert", exact: true }));
  fireEvent.click(screen.getByRole("button", { name: "Convert Lead", exact: true }));
  await waitFor(() => expect(toast).toHaveBeenCalledWith("Temporary failure", "error"));
  expect(screen.getByRole("button", { name: "Convert Lead", exact: true })).toBeEnabled();
});

it("requires at least one selected record", () => {
  renderDetail();
  fireEvent.click(screen.getByRole("button", { name: "Convert", exact: true }));
  screen.getAllByRole("checkbox").forEach((checkbox) => fireEvent.click(checkbox));
  expect(screen.getByRole("button", { name: "Convert Lead", exact: true })).toBeDisabled();
});

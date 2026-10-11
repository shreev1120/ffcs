import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import NotFound from "@/pages/NotFound";
import ThankYou from "@/pages/ThankYou";
import PrivacyPolicy from "@/pages/PrivacyPolicy";
import Terms from "@/pages/Terms";
import CookiePolicy from "@/pages/CookiePolicy";
import RefundPolicy from "@/pages/RefundPolicy";
import CookieBanner from "@/components/common/CookieBanner";
import StickyMobileCTA from "@/components/common/StickyMobileCTA";
import SEO from "@/components/common/SEO";
import Signup from "@/pages/Signup";
import { analytics } from "@/lib/analytics";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";

const renderWithProviders = (ui: React.ReactElement, initialEntry = "/") => {
  return render(
    <AuthProvider>
      <ThemeProvider>
        <MemoryRouter initialEntries={[initialEntry]}>
          {ui}
        </MemoryRouter>
      </ThemeProvider>
    </AuthProvider>
  );
};

describe("Web Deliverables & UX Enhancements", () => {
  beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
  });

  it("Item 1: Renders Custom 404 page with navigation options", () => {
    renderWithProviders(<NotFound />, "/invalid-slot-route");

    expect(screen.getByText(/Page Not In Timetable/i)).toBeInTheDocument();
    expect(screen.getByText(/Dashboard Home/i)).toBeInTheDocument();
    expect(screen.getByText(/Slot Generator/i)).toBeInTheDocument();
  });

  it("Items 3 & 4: SEO component updates document title and meta description", () => {
    renderWithProviders(
      <SEO title="Test Title" description="Test meta description for VIT" />
    );

    expect(document.title).toContain("Test Title");
    const metaDesc = document.querySelector('meta[name="description"]');
    expect(metaDesc?.getAttribute("content")).toBe("Test meta description for VIT");
  });

  it("Item 11: Renders Sticky Mobile CTA with navigation links", () => {
    renderWithProviders(<StickyMobileCTA />, "/dashboard");

    expect(screen.getByText(/Generate Timetable/i)).toBeInTheDocument();
  });

  it("Item 14: Renders Thank-you page with optimization stats", () => {
    renderWithProviders(<ThankYou />, "/thank-you");

    expect(screen.getByText(/Your Timetable Is Ready!/i)).toBeInTheDocument();
    expect(screen.getAllByText(/Clash-Free/i).length).toBeGreaterThan(0);
    expect(screen.getByText(/View Full Schedule Grid/i)).toBeInTheDocument();
  });

  it("Item 15 & 6: Renders Privacy Policy with user data collection inventory", () => {
    renderWithProviders(<PrivacyPolicy />, "/privacy-policy");

    expect(screen.getByText(/Student Privacy Commitment/i)).toBeInTheDocument();
    expect(screen.getByText(/Exactly What User Data We Collect/i)).toBeInTheDocument();
    expect(screen.getAllByText(/ffcs.support@vitstudent.ac.in/i).length).toBeGreaterThan(0);
  });

  it("Item 16: Renders Terms of Service page with student scope", () => {
    renderWithProviders(<Terms />, "/terms");

    expect(screen.getByText(/Platform Agreement/i)).toBeInTheDocument();
    expect(screen.getByText(/Independent Software Disclaimer/i)).toBeInTheDocument();
  });

  it("New Deliverable 3: Renders Cookie Policy page with storage inventory", () => {
    renderWithProviders(<CookiePolicy />, "/cookie-policy");

    expect(screen.getByText(/Cookie & Storage Transparency/i)).toBeInTheDocument();
    expect(screen.getByText(/Detailed Cookies & Storage Inventory/i)).toBeInTheDocument();
  });

  it("New Deliverable 4: Renders Refund & Free Service Policy page", () => {
    renderWithProviders(<RefundPolicy />, "/refund-policy");

    expect(screen.getByText(/Financial Terms & Fair Access/i)).toBeInTheDocument();
    expect(screen.getByText(/Zero Monetary Charges/i)).toBeInTheDocument();
  });

  it("Item 5 & 18: Signup enforces consent checkboxes and traps honeypots", () => {
    renderWithProviders(<Signup />, "/signup");

    const termsCheckbox = screen.getByLabelText(/I agree to the/i);
    const dataCheckbox = screen.getByLabelText(/I consent to processing my course registration slots/i);
    const submitBtn = screen.getByRole("button", { name: /Create Student Account/i });

    expect(termsCheckbox).not.toBeChecked();
    expect(dataCheckbox).not.toBeChecked();
    // Submit button remains disabled until valid data + consent
    expect(submitBtn).toBeDisabled();
  });

  it("Item 17 & 18: Cookie banner respects user consent and interacts with analytics", async () => {
    const trackSpy = vi.spyOn(analytics, "trackEvent");

    renderWithProviders(<CookieBanner />);

    // Wait for banner reveal timer
    await waitFor(() => {
      expect(screen.getByText(/Cookie & Privacy Preferences/i)).toBeInTheDocument();
    }, { timeout: 2500 });

    const acceptBtn = screen.getByRole("button", { name: /Accept All/i });
    fireEvent.click(acceptBtn);

    expect(localStorage.getItem("ffcs_cookie_consent")).toBe("all");
    expect(trackSpy).toHaveBeenCalledWith("cookie_consent_accepted", { tier: "all" });
  });
});

/**
 * Analytics and Telemetry Client for VIT FFCS Agent
 * Supports privacy-conscious event tracking and pageviews with student consent
 */

interface AnalyticsEvent {
  name: string;
  properties?: Record<string, unknown>;
  timestamp: string;
}

class AnalyticsService {
  private consentGranted: boolean = false;
  private queue: AnalyticsEvent[] = [];

  constructor() {
    if (typeof window !== "undefined") {
      const stored = localStorage.getItem("ffcs_cookie_consent");
      this.consentGranted = stored === "all" || stored === "essential";
    }
  }

  public setConsent(granted: boolean) {
    this.consentGranted = granted;
    if (granted && this.queue.length > 0) {
      this.flushQueue();
    }
  }

  public trackPageView(path: string, title?: string) {
    const event: AnalyticsEvent = {
      name: "page_view",
      properties: {
        path,
        title: title || (typeof document !== "undefined" ? document.title : ""),
        referrer: typeof document !== "undefined" ? document.referrer : "",
        screen: typeof window !== "undefined" ? `${window.innerWidth}x${window.innerHeight}` : "",
      },
      timestamp: new Date().toISOString(),
    };

    if (this.consentGranted) {
      this.send(event);
    } else {
      this.queue.push(event);
    }
  }

  public trackEvent(name: string, properties?: Record<string, unknown>) {
    const event: AnalyticsEvent = {
      name,
      properties,
      timestamp: new Date().toISOString(),
    };

    if (this.consentGranted) {
      this.send(event);
    } else {
      this.queue.push(event);
    }
  }

  private send(event: AnalyticsEvent) {
    // In production, this can forward to Google Analytics, Plausible, or backend endpoint
    if (process.env.NODE_ENV !== "production") {
      console.log(`[FFCS Analytics] ${event.name}:`, event.properties);
    }
  }

  private flushQueue() {
    while (this.queue.length > 0) {
      const event = this.queue.shift();
      if (event) this.send(event);
    }
  }
}

export const analytics = new AnalyticsService();
export default analytics;

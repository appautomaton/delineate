// The one way this project drives a browser: the system Google Chrome, through the pinned
// playwright-core. Renders, screenshots, and performance traces all launch here.
import { chromium, type Browser } from "playwright-core";

export function launch(): Promise<Browser> {
  return chromium.launch({ channel: "chrome" });
}

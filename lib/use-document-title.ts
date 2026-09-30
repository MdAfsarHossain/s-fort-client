"use client";

import { useEffect } from "react";

// Every dashboard/auth page is a client component, so the App Router's
// server-only `metadata` export (and its title template) can't run per
// route. Setting `document.title` once in an effect isn't enough either —
// Next's own head management re-asserts the root layout's static title
// shortly after hydration, clobbering a one-time write. A MutationObserver
// re-applies our title whenever that happens, so it sticks regardless of
// exactly when Next's own update lands.
export function useDocumentTitle(title: string) {
  useEffect(() => {
    const desired = `${title} | Scrumfort CMS`;

    function apply() {
      if (document.title !== desired) {
        document.title = desired;
      }
    }

    apply();

    const observer = new MutationObserver(apply);
    observer.observe(document.head, {
      childList: true,
      subtree: true,
      characterData: true,
    });

    return () => observer.disconnect();
  }, [title]);
}

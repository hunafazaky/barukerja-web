// Opens a URL that has to be fetched first (a short-lived signed CV link) in
// a new tab WITHOUT tripping popup blockers.
//
// Browsers (iOS Safari especially) only allow window.open() during the
// click itself; calling it after an `await` is treated as an unsolicited
// popup and silently blocked. So: open a blank tab synchronously in the click
// handler, then point it at the URL once we have it. If even that is blocked,
// fall back to navigating the current tab.
export async function openUrlInNewTab(
  getUrl: () => Promise<string>,
): Promise<void> {
  const tab = window.open("", "_blank");
  try {
    const url = await getUrl();
    if (tab) {
      tab.opener = null;
      tab.location.href = url;
    } else {
      window.location.assign(url);
    }
  } catch (err) {
    tab?.close();
    throw err;
  }
}

// Return trimmed search text, or focus the field and show a message if it is empty.
function readSearchQuery(input) {
  const query = input.value.trim();
  if (!query) {
    input.focus();
    notify("Enter a domain, IP address, technology, or search query first.");
    return null;
  }
  return query;
}

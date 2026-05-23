export function readCsrfToken(): string {
  const tokenInput = document.querySelector<HTMLInputElement>("input[name='csrfmiddlewaretoken']");
  return tokenInput?.value ?? "";
}

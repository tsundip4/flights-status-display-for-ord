export async function askAi({ baseUrl, question, airport }) {
  const response = await fetch(`${baseUrl}/ai/ask`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ question, airport }),
  });

  if (!response.ok) {
    let message = "Unable to reach the AI assistant.";
    try {
      const data = await response.json();
      if (data?.detail) {
        message = data.detail;
      }
    } catch {
      // Keep default message on parse errors.
    }
    throw new Error(message);
  }

  return response.json();
}

export const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

export async function authRequest(path, options = {}) {
  let response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    });
  } catch {
    throw new Error("Something went wrong. Please try again.");
  }
  const data = await response.json().catch(() => ({}));

  if (!response.ok) {
    const validationMessage = data.errors?.[0]?.msg;
    throw new Error(data.message || validationMessage || "Something went wrong. Please try again.");
  }

  return data;
}
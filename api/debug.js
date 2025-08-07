export default function handler(req, res) {
  // Try to read the environment variables from the server process
  const projectId = process.env.GOOGLE_PROJECT_ID;
  const credentialsJson = process.env.GOOGLE_APPLICATION_CREDENTIALS_JSON;

  // Check if the variables were found and how long they are
  const hasCredentials = !!credentialsJson;
  const credentialsLength = credentialsJson ? credentialsJson.length : 0;

  // Send a report back to the browser
  res.status(200).json({
    message: "Omoide Art Debug Report",
    projectId: projectId || "--- NOT FOUND ---",
    hasCredentialsJson: hasCredentials,
    credentialsJsonLength: credentialsLength,
  });
}
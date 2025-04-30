/* eslint-disable */

// Define response type interfaces
interface ApiKeySuccessResponse {
  success: true;
  data: string;
}

interface ApiKeyErrorResponse {
  success: false;
  error: string | null;
}

type ApiKeyResponse = ApiKeySuccessResponse | ApiKeyErrorResponse;

interface RevokeKeyResponse {
  INFO?: string;
  ERROR?: string;
}

export async function generateApiKeyRequest(
  subscriptionTier: string,
  master_key: string,
  backend_url: string,
): Promise<ApiKeyResponse> {
  const url = `${backend_url}/api/key?subscriptionTier=${encodeURIComponent(subscriptionTier)}`;
  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: master_key,
      },
    });

    if (response.ok) {
      const data = await response.json();
      console.log("Generated key");
      return { success: true, data: data.KEY as string };
    } else {
      console.error("Failed to generate key. Service may not be running.");
      return { success: false, error: await response.text() };
    }
  } catch (error) {
    console.error("Error generating API key:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : null,
    };
  }
}

export async function revokeApiKeyRequest(
  subscriptionTier: string,
  oldAPIkey: string,
  master_key: string,
  backend_url: string,
): Promise<RevokeKeyResponse> {
  const url = `${backend_url}/api/key?subscriptionTier=${encodeURIComponent(subscriptionTier)}&key=${encodeURIComponent(oldAPIkey)}`;
  try {
    const response = await fetch(url, {
      method: "DELETE",
      headers: {
        Authorization: master_key,
      },
    });

    const data: RevokeKeyResponse = await response.json();
    if (response.ok) {
      console.log("Key revoked:", data.INFO);
    } else {
      console.error("Failed to revoke key:", data.ERROR);
    }
    return data;
  } catch (error) {
    console.error("Error revoking API key:", error);
    return { ERROR: error instanceof Error ? error.message : "Unknown error" };
  }
}

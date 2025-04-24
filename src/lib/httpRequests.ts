/* eslint-disable */

export async function generateApiKeyRequest(
  subscriptionTier: string,
  master_key: string,
  backend_url: string,
) {
  const url = `${backend_url}/api/key?subscriptionTier=${encodeURIComponent(subscriptionTier)}`;
  const response = await fetch(url, {
    method: "GET",
    headers: {
      Authorization: master_key,
    },
  });

  const data = await response.json();

  if (response.ok) {
    console.log("Generated key:");
    return { success: true, data: data.KEY as string };
  } else {
    console.error("Failed to generate key:", data.ERROR);
    return { success: false, error: null };
  }
}

export async function revokeApiKeyRequest(
  subscriptionTier: string,
  oldAPIkey: string,
  master_key: string,
  backend_url: string,
) {
  const url = `${backend_url}/api/key?subscriptionTier=${encodeURIComponent(subscriptionTier)}&key=${encodeURIComponent(oldAPIkey)}`;
  const response = await fetch(url, {
    method: "DELETE",
    headers: {
      Authorization: master_key,
    },
  });

  const data = await response.json();
  if (response.ok) {
    console.log("Key revoked:", data.INFO);
  } else {
    console.error("Failed to revoke key:", data.ERROR);
  }
  return data;
}

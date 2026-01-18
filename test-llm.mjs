import "dotenv/config";

async function test() {
  const url = process.env.BUILT_IN_FORGE_API_URL || "https://forge.manus.im";
  const key = process.env.BUILT_IN_FORGE_API_KEY;

  console.log("Testing LLM with URL:", url);
  console.log("Has API key:", !!key);

  try {
    const response = await fetch(url + "/v1/chat/completions", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: "Bearer " + key,
      },
      body: JSON.stringify({
        model: "gemini-2.5-flash",
        messages: [{ role: "user", content: "Say hello in one word" }],
        max_tokens: 100,
      }),
    });

    const text = await response.text();
    console.log("Status:", response.status);
    console.log("Response:", text.substring(0, 500));
  } catch (e) {
    console.error("Error:", e.message);
  }
}

test();

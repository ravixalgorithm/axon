import { NextRequest, NextResponse } from "next/server";

// Type definitions for the API response
interface ColorToken {
  name: string;
  hex: string;
}

interface TypographyToken {
  headings: string;
  body: string;
  weights: string[];
}

interface DesignTokens {
  colors: ColorToken[];
  typography: TypographyToken;
  spacing: string[];
  animations: string[];
  elevation: string[];
  radius: string[];
}

interface AnalysisResult {
  tokens: DesignTokens;
  prompt: string;
}

// System prompt for the AI vision model
const SYSTEM_PROMPT = `You are an expert UI/UX designer analyzing a design screenshot.

Extract and return ONLY valid JSON (no markdown, no extra text):

{
  "tokens": {
    "colors": [
      {"name": "Primary", "hex": "#2BA8B8"},
      {"name": "Background", "hex": "#FFFBF0"},
      {"name": "Text", "hex": "#1F2121"}
    ],
    "typography": {
      "headings": "System UI sans-serif, semi-bold (600), 24-32px",
      "body": "System UI sans-serif, regular (400), 14-16px",
      "weights": ["400", "600"]
    },
    "spacing": ["4px", "8px", "12px", "16px", "24px", "32px"],
    "animations": ["button hover: subtle color shift 150ms ease-out", "card hover: shadow increase 200ms ease-out"],
    "elevation": ["card shadow: 0 4px 12px rgba(0,0,0,0.1)"],
    "radius": ["4px for small", "8px for buttons", "12px for cards"]
  },
  "prompt": "Detailed multi-paragraph prompt for recreating this design in React + Tailwind..."
}

IMPORTANT:
- Extract 5-8 key colors with professional names
- Identify actual fonts or make educated guesses
- Use consistent spacing scale
- Describe animations that are actually visible
- Write prompt detailed enough for code generation AI
- Return ONLY JSON, nothing else`;

export async function POST(request: NextRequest) {
  try {
    // Parse the request body
    const body = await request.json();
    const { imageBase64 } = body;

    // Validate image is provided
    if (!imageBase64) {
      return NextResponse.json({ error: "No image provided. Please upload an image." }, { status: 400 });
    }

    // Validate it's a base64 data URL
    if (!imageBase64.startsWith("data:image/")) {
      return NextResponse.json({ error: "Invalid image format. Please upload a valid image file." }, { status: 400 });
    }

    // Get API key from environment
    const apiKey = process.env.PERPLEXITY_API_KEY;
    if (!apiKey) {
      console.error("PERPLEXITY_API_KEY is not configured");
      return NextResponse.json(
        { error: "API key not configured. Please set PERPLEXITY_API_KEY in your environment." },
        { status: 500 },
      );
    }

    // Validate supported image formats (PNG, JPEG, WEBP, GIF)
    const supportedFormats = ["image/png", "image/jpeg", "image/jpg", "image/webp", "image/gif"];
    const matches = imageBase64.match(/^data:(image\/[^;]+);base64,(.+)$/);
    if (!matches) {
      return NextResponse.json({ error: "Invalid image data format." }, { status: 400 });
    }

    const mimeType = matches[1];
    if (!supportedFormats.includes(mimeType)) {
      return NextResponse.json(
        { error: "Unsupported image format. Please use PNG, JPEG, WEBP, or GIF." },
        { status: 400 },
      );
    }

    // Call Perplexity API with Sonar model (supports image analysis)
    const perplexityResponse = await fetch("https://api.perplexity.ai/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "sonar-pro",
        stream: false,
        messages: [
          {
            role: "system",
            content: SYSTEM_PROMPT,
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Analyze this UI design screenshot and extract the design tokens. Return only valid JSON.",
              },
              {
                type: "image_url",
                image_url: {
                  url: imageBase64,
                },
              },
            ],
          },
        ],
        max_tokens: 4096,
        temperature: 0.2,
      }),
    });

    if (!perplexityResponse.ok) {
      const errorText = await perplexityResponse.text();
      console.error("Perplexity API error:", perplexityResponse.status, errorText);

      if (perplexityResponse.status === 401) {
        return NextResponse.json({ error: "Invalid API key. Please check your PERPLEXITY_API_KEY." }, { status: 401 });
      }

      if (perplexityResponse.status === 429) {
        return NextResponse.json({ error: "Rate limit exceeded. Please try again in a moment." }, { status: 429 });
      }

      if (perplexityResponse.status === 400) {
        return NextResponse.json(
          { error: "Invalid request. The image may be too large (max 50MB) or in an unsupported format." },
          { status: 400 },
        );
      }

      return NextResponse.json({ error: "Failed to analyze design. Please try again." }, { status: 500 });
    }

    const perplexityData = await perplexityResponse.json();

    // Extract the content from the response
    const content = perplexityData.choices?.[0]?.message?.content;
    if (!content) {
      console.error("No content in Perplexity response:", perplexityData);
      return NextResponse.json({ error: "No analysis received from AI. Please try again." }, { status: 500 });
    }

    // Parse the JSON response
    let analysisResult: AnalysisResult;
    try {
      // Clean up the response - remove any markdown code blocks if present
      let cleanContent = content.trim();

      // Remove markdown code block wrapper if present
      if (cleanContent.startsWith("```json")) {
        cleanContent = cleanContent.slice(7);
      } else if (cleanContent.startsWith("```")) {
        cleanContent = cleanContent.slice(3);
      }
      if (cleanContent.endsWith("```")) {
        cleanContent = cleanContent.slice(0, -3);
      }
      cleanContent = cleanContent.trim();

      // Try to find JSON object in the response if it's wrapped in other text
      const jsonMatch = cleanContent.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanContent = jsonMatch[0];
      }

      analysisResult = JSON.parse(cleanContent);
    } catch (parseError) {
      console.error("Failed to parse AI response:", content, parseError);
      return NextResponse.json(
        { error: "Failed to parse AI response. The model returned invalid JSON. Please try again." },
        { status: 500 },
      );
    }

    // Validate the response structure
    if (!analysisResult.tokens || !analysisResult.prompt) {
      console.error("Invalid response structure:", analysisResult);
      return NextResponse.json({ error: "AI response missing required fields. Please try again." }, { status: 500 });
    }

    // Ensure all required token fields exist with defaults
    const tokens: DesignTokens = {
      colors: analysisResult.tokens.colors || [],
      typography: analysisResult.tokens.typography || {
        headings: "Sans-serif, semi-bold",
        body: "Sans-serif, regular",
        weights: ["400", "600"],
      },
      spacing: analysisResult.tokens.spacing || ["4px", "8px", "16px", "24px", "32px"],
      animations: analysisResult.tokens.animations || [],
      elevation: analysisResult.tokens.elevation || [],
      radius: analysisResult.tokens.radius || ["4px", "8px", "12px"],
    };

    return NextResponse.json({
      tokens,
      prompt: analysisResult.prompt,
    });
  } catch (error) {
    console.error("Unexpected error in analyze-design:", error);
    return NextResponse.json({ error: "An unexpected error occurred. Please try again." }, { status: 500 });
  }
}

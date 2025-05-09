// Filepath: c:\Users\Sam\Desktop\Future Me\api\generate-page.js
const { OpenAI } = require('openai');

// Ensure OPENAI_API_KEY is set in your Vercel project settings

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    try {
        // Initialize OpenAI client with API key from environment variables
        // Moved inside the try block for better error handling during initialization
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        const formData = req.body;
        // console.log("Received form data on backend:", JSON.stringify(formData, null, 2));

        const prompt = constructPrompt(formData);
        // console.log("Constructed Prompt for OpenAI:", prompt);

        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4", // Using a specific version, you can use "gpt-3.5-turbo" or "gpt-4"
            messages: [
                {
                    role: "system",
                    content: `You are an expert web developer specializing in cutting-edge, creative, and modern landing page design. Your task is to generate HTML and CSS for a single-page landing page based on the user's specifications.
Provide the HTML and CSS separately in a VALID JSON object format: {"html": "YOUR_HTML_CODE_AS_STRING", "css": "YOUR_CSS_CODE_AS_STRING"}.
The HTML should NOT link to any external stylesheet (e.g., do not include <link rel="stylesheet" href="...">). All CSS must be included directly in the "css" field of the JSON response.
Strive for visually stunning, highly creative, and ultra-modern designs. Think about current design trends: consider elements like glassmorphism, neumorphism, brutalism (if appropriate for the tone), sophisticated minimalism, bold typography, micro-interactions (CSS-based if possible), and unique visual hierarchies. Avoid generic or "basic" templates at all costs.
If the user provides specific colors, use them. If they ask for AI-selected colors, choose a complementary and modern palette that enhances the creative direction.
If a font style is specified, use it. Otherwise, select a font that aligns with a modern and creative aesthetic. Import web fonts if necessary (e.g., from Google Fonts) directly within the CSS.
Ensure all requested sections are included and populated with relevant placeholder or user-provided content, styled creatively.
The HTML output MUST be a single string value. The CSS output MUST be a single string value.
Example of expected JSON output:
{
  "html": "<!DOCTYPE html><html><head><title>My Creative Page</title></head><body><div class=\\\"hero\\\"><h1 class=\\\"main-title\\\">Welcome</h1></div></body></html>",
  "css": "body { font-family: 'Poppins', sans-serif; background-color: #1a1a1a; color: #f0f0f0; } .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; } .main-title { font-size: 5rem; font-weight: bold; text-shadow: 2px 2px 10px rgba(0,0,0,0.5); }"
}
Your response MUST be only the JSON object, with no other text before or after it. Ensure the CSS is self-contained and does not rely on external files.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ]
        });

        // console.log("OpenAI API Raw Response:", JSON.stringify(aiResponse, null, 2));

        let generatedCodeContent = aiResponse.choices[0]?.message?.content;
        
        if (!generatedCodeContent) {
            throw new Error("AI did not return any content.");
        }

        let parsedCode;
        try {
            parsedCode = JSON.parse(generatedCodeContent);
            if (typeof parsedCode.html !== 'string' || typeof parsedCode.css !== 'string') {
                 console.error("AI response JSON does not contain html and css as strings:", parsedCode);
                throw new Error("AI response JSON did not contain html and css keys as strings.");
            }
        } catch (parseError) {
            console.error("Failed to parse AI response as JSON. Content was:", generatedCodeContent);
            throw new Error(`AI response was not in the expected JSON format. ${parseError.message}. Ensure the AI is strictly following the JSON output instruction.`);
        }

        res.status(200).json(parsedCode);

    } catch (error) {
        console.error('Error in generate-page API:', error);
        // Check if the error is an OpenAI APIError and has a status property
        // or if it's a generic error with a status that indicates a rate limit issue.
        if ((error instanceof OpenAI.APIError && error.status === 429) || error.status === 429) {
            return res.status(429).json({
                message: "Too many requests or quota exceeded with OpenAI. Please check your OpenAI plan and billing details, or wait a few minutes and try again.",
                errorType: "OPENAI_RATE_LIMIT_OR_QUOTA"
            });
        }
        // Generic error response
        res.status(500).json({ 
            message: error.message || 'Failed to generate page.',
            errorType: error.constructor.name // Send back the type of error
        });
    }
}

function constructPrompt(data) {
    let prompt = `Generate HTML and CSS for a landing page with the following details:\n`;
    prompt += `Project Name/Business Name: ${data.businessName || 'My Awesome Page'}\n`; // Ensure a default for filename
    const safeProjectName = (data.businessName || 'ai-generated-page').toLowerCase().replace(/[^a-z0-9-_]/g, '-').replace(/--+/g, '-');

    prompt += `Business Description: ${data.businessDescription || 'N/A'}\n`;
    prompt += `Primary Goal of the Page: ${data.primaryGoal || 'N/A'}\n`;
    prompt += `Target Audience: ${data.targetAudience || 'N/A'}\n`;

    if (data.aiColors === 'on') { // Frontend sends 'on' for checkbox
        prompt += `Color Scheme: AI-selected complementary color palette. Choose professional and appealing colors.\n`;
    } else {
        prompt += `Primary Color: ${data.primaryColorHex || '#4361EE'}\n`;
        prompt += `Secondary Color: ${data.secondaryColorHex || '#4CC9F0'}\n`;
    }
    prompt += `Font Style: ${data.fontStyle || 'Arial, sans-serif'}\n`;
    prompt += `Overall Tone/Style: ${data.tone || 'Modern and professional'}\n`;

    prompt += `\nRequested Page Sections (include all that are listed; if none, create a standard layout with hero, about, features, and contact/footer):
`;
    if (data.sections && data.sections.length > 0) {
        data.sections.forEach(section => {
            prompt += `- ${section.charAt(0).toUpperCase() + section.slice(1)}\n`;
        });
    } else {
        prompt += `- Hero Section\n- About Us Section\n- Features/Services Section\n- Contact/Footer Section\n`; // Default sections
    }

    if (data.sellingPoints && data.sellingPoints.length > 0) {
        prompt += `\nKey Selling Points/Features (for hero or features section):
`;
        data.sellingPoints.forEach(point => prompt += `- ${point}\n`);
    }

    if (data.aboutUsSnippet && (data.sections?.includes('about') || (data.sections && data.sections.length === 0) )) {
        prompt += `\nAbout Us Snippet: ${data.aboutUsSnippet}\n`;
    }

    if (data.ctaSectionCheckbox === 'on' && data.ctaText && data.ctaAction) {
        prompt += `\nCall to Action (CTA):
`;
        prompt += `  - Text: ${data.ctaText}\n`;
        prompt += `  - Action (URL/Link): ${data.ctaAction}\n`;
        prompt += `  - This CTA should be prominent. If a hero section is included, it can be part of the hero. If a dedicated CTA section is requested, place it there or as a standalone prominent element.\n`;
    }

    if (data.testimonials && data.testimonials.length > 0 && (data.sections?.includes('testimonials') || (data.sections && data.sections.length === 0))) {
        prompt += `\nTestimonials:
`;
        data.testimonials.forEach((t, i) => {
            if (t.text && t.author) { // Ensure testimonial has content
                prompt += `  Testimonial ${i + 1}:
`;
                prompt += `    - Text: "${t.text}"\n`;
                prompt += `    - Author: ${t.author}${t.title ? ', ' + t.title : ''}\n`;
            }
        });
    }

    if (data.pricingPlans && data.pricingPlans.length > 0 && (data.sections?.includes('pricing') || (data.sections && data.sections.length === 0))) {
        prompt += `\nPricing Plans/Products:
`;
        data.pricingPlans.forEach((p, i) => {
            if (p.name && p.price) { // Ensure plan has content
                prompt += `  Plan/Product ${i + 1}:
`;
                prompt += `    - Name: ${p.name}\n`;
                prompt += `    - Price: ${p.price}\n`;
                if (p.features) prompt += `    - Features: ${p.features}\n`;
            }
        });
    }

    if (data.faqs && data.faqs.length > 0 && (data.sections?.includes('faq') || (data.sections && data.sections.length === 0))) {
        prompt += `\nFrequently Asked Questions (FAQs):
`;
        data.faqs.forEach((f, i) => {
            if (f.question && f.answer) { // Ensure FAQ has content
                prompt += `  FAQ ${i + 1}:
`;
                prompt += `    - Question: ${f.question}\n`;
                prompt += `    - Answer: ${f.answer}\n`;
            }
        });
    }

    if (data.socials && Object.keys(data.socials).length > 0) {
        prompt += `\nSocial Media Links (include in footer or a dedicated contact section):
`;
        for (const [platform, url] of Object.entries(data.socials)) {
            if (url) prompt += `  - ${platform}: ${url}\n`;
        }
    }

    if (data.metaDescription) {
        prompt += `\nSEO Meta Description: ${data.metaDescription}\n`;
    }
    if (data.metaKeywords) {
        prompt += `\nSEO Meta Keywords: ${data.metaKeywords}\n`;
    }

    prompt += `\nImportant Instructions for AI:
`;
    prompt += `- Generate complete HTML for a single page and all necessary CSS.
`;
    prompt += `- Provide your response as a single, valid JSON object with two keys: "html" and "css". The value for "html" should be the full HTML code as a string. The value for "css" should be the full CSS code as a string. No other text or formatting outside this JSON object.
`;
    prompt += `- The CSS MUST be self-contained within the "css" string. Do NOT include any <link rel="stylesheet" href="..."> tags in the HTML.
`;
    prompt += `- Aim for a MODERN, CREATIVE, and VISUALLY APPEALING design. Incorporate contemporary design trends and avoid generic templates. Consider unique layouts, bold typography, and engaging visual elements.
`;
    prompt += `- Ensure the CSS makes the page responsive across common device sizes (desktop, tablet, mobile). Use flexbox or grid for layout where appropriate.
`;
    prompt += `- For social media links, try to use common font icon classes (like Font Awesome, e.g., <i class="fab fa-twitter"></i>) or use text links if icons are not feasible. If using font icons, ensure the CSS includes the necessary @import or font-face rules if they are not commonly available by default. However, prefer inline SVGs or simple text links if complex icon font setup is too much for a single CSS string.
`;
    prompt += `- Make the landing page visually appealing and user-friendly. Ensure good contrast for accessibility.
`;
    prompt += `- Double-check that the output is ONLY the JSON object as specified.
`;

    return prompt;
}

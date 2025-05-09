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
                    content: `You are an expert web developer. Your task is to generate HTML and CSS for a single-page landing page based on the user's specifications.
Provide the HTML and CSS separately in a VALID JSON object format: {"html": "YOUR_HTML_CODE_AS_STRING", "css": "YOUR_CSS_CODE_AS_STRING"}.
Ensure the HTML links to an external stylesheet named based on the project name (e.g., project-name.css). The CSS should be self-contained and ready to be saved as that external file.
Use modern design principles and ensure the page is responsive.
If the user provides specific colors, use them. If they ask for AI-selected colors, choose a complementary palette.
If a font style is specified, use it.
Ensure all requested sections are included and populated with relevant placeholder or user-provided content.
The HTML output MUST be a single string value. The CSS output MUST be a single string value.
Example of expected JSON output:
{
  "html": "<!DOCTYPE html><html><head><title>My Page</title><link rel=\"stylesheet\" href=\"project-name.css\"></head><body><h1>Hello</h1></body></html>",
  "css": "body { font-family: Arial; } h1 { color: blue; }"
}
Your response MUST be only the JSON object, with no other text before or after it.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            response_format: { type: "json_object" }, // Enforce JSON output
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
        res.status(500).json({ 
            message: error.message || 'Failed to generate page.'
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
                prompt += `  Testimonial ${i + 1}:\n`;
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
                prompt += `  Plan/Product ${i + 1}:\n`;
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
                prompt += `  FAQ ${i + 1}:\n`;
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
    prompt += `- The HTML should link to an external CSS file named '${safeProjectName}.css'. Make sure this exact filename is used in the <link> tag.
`;
    prompt += `- Provide your response as a single, valid JSON object with two keys: "html" and "css". The value for "html" should be the full HTML code as a string. The value for "css" should be the full CSS code as a string. No other text or formatting outside this JSON object.
`;
    prompt += `- Ensure the CSS is modern, clean, and makes the page responsive across common device sizes (desktop, tablet, mobile). Use flexbox or grid for layout where appropriate.
`;
    prompt += `- If specific colors are provided, use them. If 'AI-selected colors' is chosen, pick a professional and appealing color palette (e.g., a primary, secondary, accent, and neutral colors).
`;
    prompt += `- Use the specified font style throughout the page. If not specified, use a clean, modern sans-serif font (e.g., 'Open Sans', 'Roboto', or 'Lato'). Import web fonts if necessary (e.g., from Google Fonts).
`;
    prompt += `- Structure the HTML semantically (use header, nav, main, section, article, footer, etc., where appropriate).
`;
    prompt += `- Populate sections with the provided content. If content for a requested section is minimal or missing, use relevant, high-quality placeholder text that fits the theme and business description.
`;
    prompt += `- For social media links, try to use common font icon classes (like Font Awesome, e.g., <i class="fab fa-twitter"></i>) or use text links if icons are not feasible. Assume Font Awesome might be available or provide simple text links.
`;
    prompt += `- Make the landing page visually appealing and user-friendly. Ensure good contrast for accessibility.
`;
    prompt += `- Do not include any explanations or comments outside of the HTML and CSS code itself (e.g., no "Here is your HTML:" before the code).
`;
    prompt += `- The HTML string must be properly escaped if it contains characters that would break JSON (though usually not an issue for HTML content itself).
`;
    prompt += `- The CSS string must also be properly escaped for JSON if needed.
`;
    prompt += `- Double-check that the output is ONLY the JSON object as specified.
`;

    return prompt;
}

// Filepath: c:\Users\Sam\Desktop\Future Me\api\generate-page.js
const { OpenAI } = require('openai');

// Ensure OPENAI_API_KEY is set in your Vercel project settings

// Helper function to sanitize string inputs
function sanitizeString(str) {
    if (typeof str !== 'string') return ''; // Or handle as an error, depending on requirements
    // Basic sanitization: remove characters that could break JSON or HTML structure.
    // This is a basic example. For robust sanitization, consider a library like DOMPurify (if client-side)
    // or a server-side equivalent. For prompt engineering, we mainly want to avoid breaking the prompt structure.
    return str.replace(/[<>\"\'`&]/g, function (match) {
        // Simple replacement for prompt safety, not full XSS protection.
        // For HTML content generation, the AI should handle correct escaping.
        // This focuses on preventing prompt injection or structural breaks.
        switch (match) {
            case '<': return '&lt;';
            case '>': return '&gt;';
            case '\"': return '\\\"'; // Escape for JSON string within prompt
            case '\'': return '\\\''; // Escape for string within prompt
            case '`': return '\\\\`'; // Escape backticks
            case '&': return '&amp;';
            default: return match;
        }
    });
}

// Recursive function to sanitize form data
function sanitizeFormData(data) {
    if (typeof data === 'string') {
        return sanitizeString(data);
    } else if (Array.isArray(data)) {
        return data.map(item => sanitizeFormData(item));
    } else if (typeof data === 'object' && data !== null) {
        const sanitizedObject = {};
        for (const key in data) {
            if (Object.prototype.hasOwnProperty.call(data, key)) {
                sanitizedObject[key] = sanitizeFormData(data[key]);
            }
        }
        return sanitizedObject;
    }
    return data; // Return numbers, booleans, null as is
}

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end(`Method ${req.method} Not Allowed`);
    }

    // Suggestion 3: Validate user input server-side
    if (!req.body || typeof req.body !== 'object' || Object.keys(req.body).length === 0) {
        return res.status(400).json({ message: "Invalid or missing form data." });
    }

    try {
        // Initialize OpenAI client with API key from environment variables
        // Moved inside the try block for better error handling during initialization
        const openai = new OpenAI({
            apiKey: process.env.OPENAI_API_KEY,
        });

        // Suggestion 4: Sanitize form input (applied after validation)
        const sanitizedFormData = sanitizeFormData(req.body);
        // console.log("Sanitized form data on backend:", JSON.stringify(sanitizedFormData, null, 2));

        const prompt = constructPrompt(sanitizedFormData); // Use sanitizedFormData
        // console.log("Constructed Prompt for OpenAI:", prompt);

        const aiResponse = await openai.chat.completions.create({
            model: "gpt-4o", // Using a specific version, you can use "gpt-3.5-turbo" or "gpt-4"
            messages: [
                {
                    role: "system",
                    content: `You are an expert web developer specializing in cutting-edge, creative, and modern landing page design. Your task is to generate HTML and CSS for a single-page landing page based on the user's specifications.\r
Provide the HTML and CSS separately in a VALID JSON object format: {"html": "YOUR_HTML_CODE_AS_STRING", "css": "YOUR_CSS_CODE_AS_STRING"}.\r
The HTML should NOT link to any external stylesheet (e.g., do not include <link rel="stylesheet" href="...">). All CSS must be included directly in the "css" field of the JSON response.\r
Strive for visually stunning, highly creative, and ultra-modern designs. Think about current design trends: consider elements like glassmorphism, neumorphism, brutalism (if appropriate for the tone), sophisticated minimalism, bold typography, and unique visual hierarchies. Avoid generic or "basic" templates at all costs.\r
\r
Key Design Principles to Adhere To:\r
1.  **Visual Storytelling & Hierarchy:** Ensure a clear visual hierarchy that guides the user's eye through the page, telling a cohesive story from the hero section to the final call to action. Each section should flow logically into the next.\r
2.  **Whitespace & Readability:** Utilize ample whitespace (padding and margins) to give content breathing room and improve readability. Avoid overly cluttered or dense layouts.\r
3.  **Subtle Micro-interactions:** Where appropriate, incorporate tasteful and performant CSS-based micro-interactions or animations (e.g., on scroll, on hover for interactive elements like buttons or cards) to enhance user engagement and provide a sense of polish. These should not be distracting.\r
4.  **Compelling CTAs:** Call to Action (CTA) buttons and links must be visually distinct, compelling, and strategically placed. Use contrasting colors, clear button-like styling, and action-oriented text.\r
5.  **Typography Excellence:** Pay close attention to typographic details: ensure appropriate line height for readability, good contrast between text and background, and a consistent typographic scale (e.g., clear differentiation between H1, H2, H3, and body text).\r
6.  **Iconography as Placeholders:** If the design would benefit from illustrative visuals in sections (e.g., for features, services, or informational blurbs) and the user has not provided specific images for these, use thematic placeholder icons. Prefer a consistent icon style (e.g., line icons, filled icons). You can use Font Awesome classes (e.g., <i class="fas fa-star"></i>) or simple, inline SVGs if they are not too complex. If using Font Awesome, assume it's available or provide necessary CSS imports for it (e.g., @import url(...); within the CSS). Clearly indicate if an icon is a placeholder that the user might want to replace with a custom image.\r
7.  **Mandatory Professional Footer:** A footer section MUST always be included at the very end of the page. It should contain copyright information (dynamically using the business name and current year: © YYYY Business Name), and integrate social media links (using placeholders if none are provided by the user, as per social media link instructions). The footer should be unobtrusive but professionally styled and complement the overall design. CRITICAL: The footer's background color, text color, and link colors should be harmonious with the overall page theme and color palette (whether AI-selected or user-defined). Avoid default dark or unstyled footers; ensure it feels like an integral part of the design. It should appear after all other content sections, including the Contact Us section if present.\r
8.  **'Wow Factor':** Aim to incorporate at least one unique design element or 'wow factor' that makes the page memorable and delightful, while remaining functional and aligned with the brand's identity.\r
9.  **Support for In-Page Editing:** To facilitate client-side text editing, for all user-facing text content (headings, paragraphs, list items, button text, link text, labels, etc.), assign a unique \`data-editable-id\` attribute (e.g., \`data-editable-id="hero-title"\`, \`data-editable-id="feature-1-text"\`, \`data-editable-id="contact-submit-button"\`) to the innermost HTML element that directly wraps the text. Ensure these IDs are unique across the page and semantically named if possible (e.g., sectionName-elementType-instanceNumber).\r
10. **Real Content Generation (No Literal Placeholders):** Generate relevant, creative, and context-aware content for all sections. Avoid using literal "placeholder" text, bracketed placeholders like "[Placeholder: Feature 1]", or overly generic filler. If specific details are missing, infer and create plausible content based on the business type, target audience, and page goals. The aim is to produce a page that looks complete and engaging, even with AI-generated text.\r
11. **Hero Section Text Layout:** If the hero section contains multiple lines of text (e.g., a main headline and a sub-headline), ensure these text elements are stacked vertically (i.e., one above the other, not side-by-side or inline). Use appropriate HTML structure (e.g., separate block-level elements like <h1> and <p> or <div>s) and CSS (e.g., \`display: block\` or flexbox with \`flex-direction: column\`) to achieve this stacking.\r
\r
If the user provides specific colors, use them. If they ask for AI-selected colors, choose a complementary and modern palette that enhances the creative direction.\r
If a font style is specified, use it. Otherwise, select a font that aligns with a modern and creative aesthetic. Import web fonts if necessary (e.g., from Google Fonts) directly within the CSS.\r
Ensure all requested sections are included and populated with relevant placeholder or user-provided content, styled creatively.\r
The HTML output MUST be a single string value. The CSS output MUST be a single string value.\r
Example of expected JSON output:\r
{\r
  "html": "<!DOCTYPE html><html><head><title>My Creative Page</title></head><body><div class=\\\"hero\\\"><h1 class=\\\"main-title\\\">Welcome</h1></div></body></html>",\r
  "css": "body { font-family: 'Poppins', sans-serif; background-color: #1a1a1a; color: #f0f0f0; } .hero { min-height: 100vh; display: flex; align-items: center; justify-content: center; } .main-title { font-size: 5rem; font-weight: bold; text-shadow: 2px 2px 10px rgba(0,0,0,0.5); }"\r
}\r
Your response MUST be ONLY the JSON object itself, without any surrounding text, comments, or markdown formatting such as \`\`\`json ... \`\`\`. Ensure the CSS is self-contained and does not rely on external files.`
                },
                {
                    role: "user",
                    content: prompt
                }
            ],
            // Suggestions 1 & 2: Add max_tokens, temperature, and top_p
            max_tokens: 4000, // Adjusted for potentially larger, well-structured responses
            temperature: 0.7,
            top_p: 0.9,
        });

        // console.log("OpenAI API Raw Response:", JSON.stringify(aiResponse, null, 2));

        let generatedCodeContent = aiResponse.choices[0]?.message?.content;

        let parsedCode;
        try {
            // Suggestion 5: Catch malformed AI responses more tightly
            if (!generatedCodeContent || typeof generatedCodeContent !== 'string') {
                throw new Error("AI response content is missing or not a string.");
            }
            parsedCode = JSON.parse(generatedCodeContent);
            if (!parsedCode || typeof parsedCode !== 'object') {
                throw new Error("Parsed AI response is not a valid object.");
            }
            if (!('html' in parsedCode) || typeof parsedCode.html !== 'string') {
                console.error("AI response JSON does not contain html as a string:", parsedCode);
                throw new Error("AI response JSON must contain an 'html' key with a string value.");
            }
            if (!('css' in parsedCode) || typeof parsedCode.css !== 'string') {
                console.error("AI response JSON does not contain css as a string:", parsedCode);
                throw new Error("AI response JSON must contain a 'css' key with a string value.");
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

// Helper functions for constructPrompt

function _buildHeaderNavPromptPart(data) {
    let part = '';
    const availableSectionsForNav = [];
    if (data.sections && data.sections.includes('hero')) availableSectionsForNav.push({ name: 'Home', href: '#hero' });
    if (data.sections && data.sections.includes('about')) availableSectionsForNav.push({ name: 'About Us', href: '#about' });
    if (data.sections && data.sections.includes('features')) availableSectionsForNav.push({ name: 'Features', href: '#features' });
    if (data.pricingPlans && Array.isArray(data.pricingPlans) && data.pricingPlans.length > 0 && data.pricingPlans.some(p => p.name && p.price)) {
        availableSectionsForNav.push({ name: 'Pricing', href: '#pricing' });
    } else if (data.sections && data.sections.includes('pricing')) { // Placeholder pricing
        availableSectionsForNav.push({ name: 'Pricing', href: '#pricing' });
    }
    if (data.testimonials && Array.isArray(data.testimonials) && data.testimonials.some(t => t.text && t.text.trim() !== '')) {
        availableSectionsForNav.push({ name: 'Testimonials', href: '#testimonials' });
    }
    if (data.faqs && Array.isArray(data.faqs) && data.faqs.some(f => f.question && f.question.trim() !== '' && f.answer && f.answer.trim() !== '')) {
        availableSectionsForNav.push({ name: 'FAQs', href: '#faq' });
    }
    if (data.sections && data.sections.includes('contact')) availableSectionsForNav.push({ name: 'Contact', href: '#contact' });

    let navLinksInstructionAdded = false;
    if (availableSectionsForNav.length > 0) {
        part += `--- Header Navigation Menu ---\n`;
        part += `Include a header navigation menu. The menu should be sticky or become visible on scroll-up for easy access. It should include the following links, in this approximate order, if the corresponding section is generated:\n`;
        availableSectionsForNav.forEach(section => {
            part += `- ${section.name} (linking to ${section.href})\n`;
        });
        part += `If a logo is generated, it should typically be on the left of the navigation and link to #hero or the top of the page.\n`;
        navLinksInstructionAdded = true;
    }

    if (navLinksInstructionAdded) {
        part += `Ensure the navigation links are functional and scroll smoothly to the respective sections if they exist on the page.\n`;
    } else {
        part += `--- Header Navigation Menu ---\n`;
        part += `No specific sections for navigation were auto-detected. If you generate common sections like Hero, About, Contact, consider adding them to a navigation menu. If a logo is generated, it should typically be on the left of the navigation and link to #hero or the top of the page.\n`;
    }
    part += `--- End Header Navigation Menu ---\n\n`;
    return part;
}

function _buildCreativeBriefPromptPart(data) {
    let part = '';
    part += `Business Description: ${data.businessDescription || 'N/A'}\n`;
    part += `Primary Goal of the Page: ${data.primaryGoal || 'N/A'}\n`;
    part += `Target Audience: ${data.targetAudience || 'N/A'}\n`;

    if (data.businessType) {
        const businessTypeNormalized = data.businessType.toLowerCase().replace(/\s+/g, '_'); // Normalize for switch
        part += `\n--- Creative Brief for Industry: ${data.businessType} ---\n`;
        part += `Industry Context: You are designing a landing page for a business in the "${data.businessType}" sector. Consider the typical expectations, aesthetics, and functional needs of this industry.\n`;

        switch (businessTypeNormalized) {
            case 'saas_software_tech':
                part += `For SaaS/Software/Tech: Focus on clarity, trust-building (e.g., social proof, clear value proposition), and conversion (e.g., demo requests, sign-ups). Highlight innovation and efficiency. Modern, clean aesthetics are often preferred. Consider sections like 'How it Works', 'Integrations', or 'Case Studies' if appropriate based on other inputs.\n`;
                break;
            case 'ecommerce_retail':
                part += `For E-commerce/Retail: Emphasize product visuals, user experience (easy navigation, clear CTAs like 'Shop Now' or 'Add to Cart'), and trust signals (reviews, secure payment icons). The design should be enticing and facilitate purchases. Consider sections for 'New Arrivals', 'Best Sellers', or 'Collections'.\n`;
                break;
            case 'consulting_professional_services':
                part += `For Consulting/Professional Services: Project expertise, credibility, and a professional image. Clearly articulate services offered and the value provided. Testimonials and case studies are often crucial. A clear call to action for consultation or contact is important.\n`;
                break;
            case 'restaurant_food_beverage':
                part += `For Restaurant/Food & Beverage: Visually appealing food imagery is key. Include essential information like menu (or link to it), location, hours, and reservation options. The design should evoke the ambiance of the establishment.\n`;
                break;
            case 'event_conference':
                part += `For Event/Conference: Highlight event details (date, venue, schedule), speakers/performers, and a clear call to action for registration or ticket purchase. Create excitement and convey the event's value.\n`;
                break;
            case 'travel_tourism':
                part += `For Travel/Tourism: Use captivating imagery of destinations. Inspire wanderlust. Provide information on packages, booking details, and unique selling points of the travel services or locations. User reviews can be very effective.\n`;
                break;
            case 'education_courses':
                part += `For Education/Courses: Clearly present course offerings, benefits of learning, instructor credentials, and enrollment information. The design should be trustworthy and encourage sign-ups or information requests.\n`;
                break;
            case 'health_wellness':
                part += `For Health & Wellness: Create a calming, trustworthy, and positive atmosphere. Clearly explain services or products and their benefits. Testimonials and expert endorsements can be valuable. Ensure information is presented responsibly.\n`;
                break;
            case 'real_estate_property':
                part += `For Real Estate/Property: High-quality property photos or videos are essential. Include property details, search functionality (if applicable), and easy ways to contact agents or schedule viewings. Build trust and showcase expertise.\n`;
                break;
            case 'non_profit_charity':
                part += `For Non-Profit/Charity: Clearly communicate the mission, impact, and ways to support (donate, volunteer). Evoke empathy and inspire action. Transparency and storytelling are important.\n`;
                break;
            case 'portfolio_personal_branding':
                part += `For Portfolio/Personal Branding: Showcase work, skills, and personality. High-quality visuals of projects are key. Include an 'About Me' section and easy contact methods. The design should reflect the individual's brand.\n`;
                break;
            case 'bakery_cafe_coffee':
                part += `For Bakery/Cafe/Coffee Shop: Mouth-watering visuals of products are paramount. Include menu highlights, location, hours, and perhaps online ordering or reservation links. The design should be warm, inviting, and reflect the shop's atmosphere. Consider daily specials or loyalty program mentions if relevant from other inputs.\n`;
                break;
            default:
                part += `Industry: ${data.businessType}. Adapt general best practices for landing pages, focusing on the user's specific business description and goals.\n`;
        }
        part += `--- End Creative Brief ---\n`;
        part += `Remember, the above industry brief is a guideline. Innovate within this context. CRITICAL: Use the industry specifics AND the target audience profile to generate *highly relevant and tailored sections and content*, not just a generic template or stylistic adjustments for that industry. The combination of industry and audience should dictate the actual substance and structure of the page.\n\n`;
    }
    return part;
}

function _buildColorAndFontPromptPart(data) {
    let part = '';
    if (data.aiColors === 'on') {
        part += `Color Scheme: AI-selected complementary color palette. Choose professional and appealing colors.\n`;
    } else {
        part += `Primary Color: ${data.primaryColorHex || '#4361EE'}\n`;
        part += `Secondary Color: ${data.secondaryColorHex || '#4CC9F0'}\n`;
    }

    let fontToRequest = data.fontStyle;
    if (!fontToRequest || fontToRequest.toLowerCase() === 'let ai choose / default' || fontToRequest.toLowerCase() === 'default' || fontToRequest.trim() === '') {
        fontToRequest = 'Poppins, sans-serif'; // Default to Poppins
        part += `Font Style: ${fontToRequest}. Ensure Google Fonts is imported for Poppins if used (e.g., @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');).\n`;
    } else {
        part += `Font Style: ${fontToRequest}.\n`;
    }
    part += '\n';
    return part;
}

function _buildHeroStylePromptPart(data) {
    let part = '';
    part += `--- Hero Section Styling ---\n`;
    if (data.aiColors === 'on') {
        part += `Hero Section Background: Use the AI-selected color palette to create a beautiful and modern **gradient** background for the hero section. Ensure it complements the overall design and the chosen colors work well together in a gradient format.\n`;
    } else {
        part += `Hero Section Background: Use the primary color (${data.primaryColorHex || '#4361EE'}) and secondary color (${data.secondaryColorHex || '#4CC9F0'}) to create a beautiful and modern gradient background for the hero section. The gradient should be visually appealing and harmonious.\n`;
    }
    part += `--- End Hero Section Styling ---\n\n`;
    return part;
}

function _buildSocialMediaPromptPart(data) {
    let part = '';
    part += `--- Social Media Links ---\n`;
    if (data.socials && Object.keys(data.socials).length > 0 && Object.values(data.socials).some(url => url && url.trim() !== '')) {
        part += `Include the following social media links. Use the exact URLs provided. For each, display the platform name or a standard icon, and link it to the given URL:\n`;
        for (const [platform, url] of Object.entries(data.socials)) {
            if (url && url.trim() !== '') {
                part += `- ${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${url.trim()}\n`;
            }
        }
        part += `Ensure these are present and correctly linked, typically in the footer or a dedicated 'Stay Connected' section.\n`;
    } else {
        part += `No specific social media links provided by the user. You can omit a social media section entirely, or if a social media presence is strongly implied by the business type or goals, use placeholder links or icons for common platforms (e.g., Twitter, Facebook, Instagram, LinkedIn). If using placeholders, make it clear they are placeholders (e.g., link to # or use generic platform URLs like https://twitter.com/yourprofile) AND state that the user should update these.\n`;
    }
    part += `--- End Social Media Links ---\n\n`;
    return part;
}

function _buildTestimonialsPromptPart(data) {
    let part = '';
    part += `--- Testimonials Section ---\n`;
    if (data.testimonials && Array.isArray(data.testimonials) && data.testimonials.some(t => t.text && t.text.trim() !== '')) {
        part += `The user has provided testimonials. Include a dedicated section with a clear heading like "Testimonials" or "What Our Clients Say". The testimonial items themselves (text, author, etc.) should be presented clearly *under* this main heading, not inline with it. The entire section, or its main content container holding the testimonials, should be styled to ensure it is **centered on the page**. For each testimonial, display the testimonial text, author, and author's title/company (if provided). Style this section to be engaging and build trust. Individual testimonial items (e.g., cards or blocks) should have a subtle and clean CSS hover animation (e.g., slight lift, shadow change, or border highlight) to enhance interactivity. Include ALL provided testimonials:\n`;
        data.testimonials.forEach((testimonial, index) => {
            if (testimonial.text && testimonial.text.trim() !== '') {
                part += `  Testimonial ${index + 1}:\n`;
                part += `    - Text: "${testimonial.text.trim()}"\n`;
                if (testimonial.author && testimonial.author.trim() !== '') {
                    part += `    - Author: "${testimonial.author.trim()}"\n`;
                }
                if (testimonial.title && testimonial.title.trim() !== '') {
                    part += `    - Author's Title/Company: "${testimonial.title.trim()}"\n`;
                }
            }
        });
    } else {
        part += `No testimonials provided by the user. Do not include a testimonials section unless it's a generic placeholder clearly marked as such and suggested by the AI based on the business type (e.g., for a consulting business where testimonials are typical). If you add a placeholder, clearly state "Placeholder for testimonials - user should add actual client feedback here."\n`;
    }
    part += `--- End Testimonials Section ---\n\n`;
    return part;
}

function _buildFaqsPromptPart(data) {
    let part = '';
    part += `--- FAQs Section ---\n`;
    if (data.faqs && Array.isArray(data.faqs) && data.faqs.some(f => f.question && f.question.trim() !== '' && f.answer && f.answer.trim() !== '')) {
        part += `The user has provided FAQs. Include a dedicated "Frequently Asked Questions" (or similar) section. For each FAQ, display the question directly above its corresponding answer, making both visible by default. Style each Q&A pair as a distinct visual block (e.g., like a list item or a card). Apply a subtle and clean CSS hover animation to each FAQ item (e.g., slight lift, shadow change, or border highlight) to enhance interactivity. Include ALL provided FAQs:\n`;
        data.faqs.forEach((faq, index) => {
            if (faq.question && faq.question.trim() !== '' && faq.answer && faq.answer.trim() !== '') {
                part += `  FAQ ${index + 1}:\n`;
                part += `    - Question: "${faq.question.trim()}"\n`;
                part += `    - Answer: "${faq.answer.trim()}"\n`;
            }
        });
    } else {
        part += `No FAQs provided by the user. Do not include an FAQ section unless it's a generic placeholder clearly marked as such and suggested by the AI based on the business type. If you add a placeholder, clearly state "Placeholder for FAQs - user should add actual questions and answers here."\n`;
    }
    part += `--- End FAQs Section ---\n\n`;
    return part;
}

function _buildAboutUsPromptPart(data) {
    let part = '';
    part += `--- About Us Section ---\n`;
    if (data.aboutUsSnippet && data.aboutUsSnippet.trim() !== '') {
        part += `The user has provided an "About Us" snippet. Include a dedicated "About Us" section on the page. Use the following content:\n`;
        part += `  - Snippet: "${data.aboutUsSnippet.trim()}"\n`;
        part += `Style this section appropriately to fit the overall design and effectively introduce the business/project. The main content/text of this section should be **centered on the page** (e.g., within a container that has auto margins or uses flexbox for centering).\n`;
    } else if (data.sections && data.sections.includes('about')) {
        part += `The user selected to include an "About Us" section but did not provide a specific snippet. Generate a concise, well-written placeholder "About Us" section that is relevant to the business type: "${data.businessType || 'general business'}" and target audience: "${data.targetAudience || 'general audience'}". Clearly mark this content as placeholder text that the user should customize, for example, by starting with "[Placeholder: Tell your story here...]". The main content/text of this section should be **centered on the page**.\n`;
    } else {
        part += `No "About Us" snippet provided and the section was not explicitly requested to be generated with placeholder content. Omit the "About Us" section unless it is critically essential for the business type and AI suggests it (in which case, use a clearly marked placeholder as described above, ensuring its content is centered).\n`;
    }
    part += `--- End About Us Section ---\n\n`;
    return part;
}

function _buildPricingPromptPart(data) {
    let part = '';
    part += `--- Pricing Section ---\n`;
    if (data.pricingPlans && Array.isArray(data.pricingPlans) && data.pricingPlans.length > 0 && data.pricingPlans.some(p => p.name && p.price)) {
        part += `The user has provided pricing plan information. Include a dedicated section with a clear heading like "Pricing" or "Our Plans". The pricing plans (whether as cards, table rows, etc.) should be presented clearly *under* this main heading, not inline with it. The entire section, or its main content container holding the pricing plans, should be styled to ensure it is **centered on the page**. A table structure or a series of styled cards is often effective for comparing plans. Include ALL provided pricing plans and their details. For each plan, display its name, price, list of features, and a call to action button/link if provided.\n`;
        data.pricingPlans.forEach((plan, index) => {
            part += `  Plan ${index + 1}:\n`;
            if (plan.name && plan.name.trim() !== '') {
                part += `    - Name: "${plan.name.trim()}"\n`;
            }
            if (plan.price && plan.price.trim() !== '') {
                part += `    - Price: "${plan.price.trim()}"\n`;
            }
            if (plan.features && Array.isArray(plan.features) && plan.features.length > 0) {
                part += `    - Features: \n`;
                plan.features.forEach(feature => {
                    if (feature && feature.trim() !== '') {
                        part += `      - "${feature.trim()}"\n`;
                    }
                });
            }
            if (plan.callToAction && plan.callToAction.trim() !== '') {
                part += `    - Call to Action Text: "${plan.callToAction.trim()}" (This should be a clickable button/link for the plan)\n`;
            }
        });
        part += `Style this section to be clear, easy to compare, and visually appealing, encouraging users to choose a plan.\n`;
    } else if (data.sections && data.sections.includes('pricing')) {
        part += `The user selected to include a "Pricing" section but did not provide specific plan data. Generate a placeholder section with a clear heading like "Pricing", "Our Plans", or something more tailored to the business type (e.g., "Service Packages" for a consultancy, "Membership Tiers" for a gym). \n`;
        part += `*Under* this heading, create 2-3 sample plans. CRITICALLY, these plans must be highly relevant to the business type: "${data.businessType || 'general business'}" and target audience: "${data.targetAudience || 'general audience'}". \n`;
        part += `The plan names, sample prices (e.g., "$X/month", "Starting at $Y"), and especially the features listed within each plan should be realistically tailored to what that specific business type would offer to that audience. For example:\n`;
        part += `  - For a 'bakery_cafe_coffee' targeting 'local residents', placeholder plans might be named 'Morning Perks Club', 'Artisan Bread Box', or 'Custom Celebration Cakes', with features like 'Daily free coffee upgrade', 'Weekly sourdough loaf', 'Consultation & tasting'.\n`;
        part += `  - For a 'saas_software_tech' targeting 'small businesses', placeholder plans could be 'Starter Suite', 'Growth Engine', or 'Enterprise Connect', with features like '10 users, 100GB storage, Basic analytics', 'Unlimited users, 1TB storage, Advanced analytics, API access', 'Custom solution, Dedicated support, SLA'.\n`;
        part += `The entire section, or its main content container holding these placeholder plans, should be styled to ensure it is **centered on the page**. Each placeholder plan should have a name, a sample price, a few bullet points for features, and a call to action button. Clearly mark this content as placeholder text that the user should customize, for example, by starting plan descriptions with "[Placeholder: Customize this plan...]" or noting "Sample Plans - Update with your offerings."\n`;
    } else {
        part += `No pricing plans provided and the section was not explicitly requested to be generated with placeholder content. Omit the "Pricing" section unless it is critically essential for the business type and AI suggests it (in which case, use a clearly marked placeholder as described above).\n`;
    }
    part += `--- End Pricing Section ---\n\n`;
    return part;
}

function _buildContactSectionPromptPart(data) {
    let part = '';
    part += `--- Contact Section ---\n`;
    const includeContactSection = data.sections && data.sections.includes('contact');

    if (includeContactSection) {
        part += `The user has requested a "Contact Us" section. This section MUST feature a functional contact form.\n`;
        part += `CRITICAL PLACEMENT: This "Contact Us" section, if generated, MUST be the VERY LAST section in the HTML body, appearing after all other content sections (e.g., About Us, Features, Pricing, Testimonials, FAQs, Social Media links if they are in a footer-like area but before a final small print footer if any). It should effectively be the footer or immediately precede a minimal site-info footer.\n`;
        part += `The contact form should collect at least the sender's name, email, and a message.\n`;
        part += `  - Introductory Text: After the main heading of the 'Contact Us' section (e.g., <h2>Contact Us</h2>), and *before* the contact form itself, insert a brief, welcoming introductory sentence. For example: '<p>Want to get in touch? We\\'d love to hear from you! Simply fill out the form below and we\\'ll get back to you as soon as possible.</p>' or a similar friendly message. This text should be styled to match the section\\'s overall design and be centered if the form is centered.\n`;
        if (data.contactFormEmail && data.contactFormEmail.trim() !== '') {
            part += `Use the following email address for the 'mailto:' link: ${data.contactFormEmail.trim()}\n`;
        } else {
            part += `CRITICAL FALLBACK: The user requested a contact form but NO email was provided (this indicates a potential issue with form submission or data collection). Use a VERY OBVIOUS placeholder like 'REPLACE-WITH-YOUR-EMAIL@example.com' for the 'mailto:' link AND include a prominent, visible warning message directly above or within the contact form in the HTML stating: "IMPORTANT: Contact form is not fully configured. Please provide your email address in the questionnaire to activate this form." This warning should be styled to be highly noticeable (e.g., red text, warning icon).\n`;
        }
        part += `Styling: Style the contact form to be user-friendly, visually appealing, and modern, consistent with the overall page design. Avoid a basic or unstyled appearance. The form itself (or its main container) should be **centered on the page**.\n`;
    } else {
        part += `The user has NOT explicitly requested a "Contact Us" section with a form. Omit this section.\n`;
    }
    part += `--- End Contact Section ---\n\n`;
    return part;
}

function _buildFeaturesBenefitsPromptPart(data) {
    let part = '';
    part += `--- Features/Benefits Section ---\n`;
    if (data.sections && data.sections.includes('features')) {
        part += `The user has requested a "Features/Benefits" section. This section should highlight key advantages, services, or product features.\n`;
        part += `   - Section Heading: The main heading for this section should be contextually relevant to the business type: "${data.businessType || 'general business'}" and target audience: "${data.targetAudience || 'general audience'}". For example, for a 'bakery_cafe_coffee', it could be 'Our Daily Bakes', 'Sweet Delights', or 'What We Offer'. For 'saas_software_tech', it might be 'Core Functionality', 'Platform Advantages', or 'Why Choose Us?'. Avoid overly generic titles like 'Our Features' or 'Features' unless no more creative and fitting alternative can be derived from the context. The heading should be engaging and accurately reflect the content of this section.\n`;
        if (data.mustHaveElements && data.mustHaveElements.trim() !== '') {
            part += `   - Primary Content Source: Use the user-provided "Must-Have Elements/Keywords": "${data.mustHaveElements.trim()}". Interpret these as the core features/benefits to showcase.\n`;
            part += `   - Presentation: Present these as a list, a series of cards, or iconic blurbs. Each item should be distinct and easy to read.\n`;
            part += `   - Animation: If presented as multiple items (cards, list items), apply a subtle CSS hover animation to each item (e.g., slight lift, shadow change, border highlight) for interactivity.\n`;
        } else {
            part += `   - Content Generation: The user did not provide specific "Must-Have Elements/Keywords" for this section. \n`;
            part += `     Attempt to intelligently derive 3-5 compelling features/benefits by analyzing the following user inputs (if available):\n`;
            part += `       1. Business Description: "${data.businessDescription || 'N/A'}"\n`;
            part += `       2. Primary Goal of the Page: "${data.primaryGoal || 'N/A'}"\n`;
            if (data.pricingPlans && Array.isArray(data.pricingPlans) && data.pricingPlans.length > 0 && data.pricingPlans.some(p => p.name && p.price)) {
                part += `       3. Pricing Plan Details: Review names, prices, and features listed in the pricing plans to extract key service highlights.\n`;
            }
            part += `       4. About Us Snippet: "${data.aboutUsSnippet || 'N/A'}"\n`;
            part += `     Synthesize these details to create features that are highly relevant to the business type: "${data.businessType || 'general business'}" and target audience: "${data.targetAudience || 'general audience'}".\n`;
            part += `     If sufficient detail cannot be derived, then as a last resort, use generic placeholders like "[Placeholder: Describe a key feature/benefit here.]".\n`;
            part += `   - Animation: If presented as multiple items, apply a subtle CSS hover animation as described above.\n`;
        }
        part += `Style this section to be persuasive and visually engaging, reinforcing the value proposition of the business/product.\n`;
    } else {
        part += `The "Features/Benefits" section was not explicitly requested. Only include it if the "Must-Have Elements/Keywords" (if provided and relevant) strongly suggest a standalone features list and it aligns with the overall creative direction. If so, follow the guidelines above for content and styling.\n`;
    }
    part += `--- End Features/Benefits Section ---\n\n`;
    return part;
}

function _buildFooterPromptPart(data) {
    let part = '';
    part += `--- Footer Section ---\n`;
    part += `A footer section MUST be generated at the very end of the HTML body, after all other content including the Contact Us section (if present).\n`;
    part += `The footer must include:\n`;
    part += `  - Copyright Information: Display a copyright notice, e.g., "© ${new Date().getFullYear()} ${data.businessName || 'Your Business Name'}". Use the actual current year and the provided business name.\n`;
    part += `  - Social Media Links: Integrate social media links based on the earlier "Social Media Links" section instructions. If no specific links are provided by the user, include placeholders for common platforms or a message indicating where to add them, ensuring the footer still allocates space for them or notes their absence gracefully.\n`;
    part += `Style the footer to be professional, unobtrusive, and consistent with the overall page design. It should clearly delineate the end of the page content.\n`;
    part += `--- End Footer Section ---\n\n`;
    return part;
}

function _buildCoreSynthesisPromptPart(data) {
    let part = '';
    part += `--- Core Creative Synthesis ---\n`;
    part += `Holistically synthesize the following aspects to inform ALL design decisions. The aim is a cohesive, persuasive, and highly creative vision that deeply reflects the user's intent, not just a list of features:\n`;
    part += `- Business Description: "${data.businessDescription || 'N/A'}" (Extract keywords, implied feelings, and unique aspects to inspire the design's personality.)\n`;
    part += `- Primary Goal: "${data.primaryGoal || 'N/A'}" (The entire design should strategically guide the user towards this goal. For instance, if it's 'sales', CTAs and product showcases must be compelling and prominent. If 'brand awareness', the visual identity and storytelling should be memorable.)\n`;
    part += `- Target Audience: "${data.targetAudience || 'N/A'}" (CRITICAL: Design for THEM. This should heavily influence not only aesthetics but also the *type of content, specific sections generated, imagery choices, and overall communication style*. Consider their likely aesthetic preferences, technical savviness, and what would resonate most strongly. A site for 'young gamers' will require different sections, content, and interactivity than one for 'corporate executives'.)\n`;
    part += `- Overall Tone/Style: "${data.tone || 'Modern and professional'}" (This is paramount. Let it dictate typography, color depth, imagery style, spacing, and even the feel of any (CSS-based) micro-interactions. E.g., 'playful' might use brighter colors and rounded shapes; 'sophisticated' might use elegant fonts and a more reserved palette with impactful imagery.)\n`;
    part += `--- End Core Creative Synthesis ---\n\n`;
    return part;
}

function _buildAdvancedCustomizationPromptPart(data) {
    let part = '';
    if (data.inspirationWebsites) {
        part += `- Inspiration Websites: ${data.inspirationWebsites}\n`;
    }
    if (data.mustHaveElements && data.mustHaveElements.trim() !== '') {
        part += `- Must-Have Elements/Keywords: "${data.mustHaveElements.trim()}"\n`;
        part += `  Incorporate these elements/keywords strategically throughout the page content and design. If the "Features/Benefits" section is NOT enabled (as per the logic above), but these keywords strongly suggest a list of features that would benefit the page, you can still consider creating such a section using them. Otherwise, weave them into other relevant sections (hero, about, etc.) to reinforce key messages.\n`;
    }
    if (data.thingsToAvoid) {
        part += `- Things to Avoid: ${data.thingsToAvoid}\n`;
    }
    if (part.length > 0) {
        part = `\n--- Advanced Design Customizations ---\n` + part + `--- End Advanced Design Customizations ---\n\n`;
    }
    return part;
}

function _buildFinalInstructionsPromptPart() {
    let part = '';
    part += `Important Instructions for AI:\r\n`;
    part += `- Generate complete HTML for a single page and all necessary CSS.\r\n`;
    part += `- CRITICAL: If the user provides specific optional content (e.g., social media URLs, testimonials, FAQs, 'About Us' snippet, 'Pricing Plan' details, contact form email), YOU MUST include this content in the generated page. If a section is toggled on or has data, it should appear. This includes the 'About Us' section if a snippet is provided (see 'About Us Section' details), the 'Pricing Plan' details if provided (see 'Pricing Section' details), and the contact form email (see 'Contact Section' details). Do not omit user-provided data for these sections.\n`;
    part += `- Provide your response as a single, valid JSON object with two keys: "html" and "css". The value for "html" should be the full HTML code as a string. The value for "css" should be the full CSS code as a string. No other text or formatting outside this JSON object.\n`;
    part += `- The CSS MUST be self-contained within the "css" string. Do NOT include any <link rel="stylesheet" href="..."> tags in the HTML.\n`;
    part += `- Aim for a MODERN, CREATIVE, and VISUALLY APPEALING design. Incorporate contemporary design trends and avoid generic templates. Consider unique layouts, bold typography, and engaging visual elements.\n`;
    part += `- Ensure the CSS makes the page responsive across common device sizes (desktop, tablet, mobile). Use flexbox or grid for layout where appropriate.\n`;
    part += `- For social media links, if specific URLs are provided (see Social Media Links section above), YOU MUST USE THOSE EXACT URLs. For icons, try to use common font icon classes (like Font Awesome, e.g., <i class="fab fa-instagram"></i> for Instagram) or use text links if icons are not feasible. If using font icons, ensure the CSS includes the necessary @import or font-face rules if they are not commonly available by default. However, prefer inline SVGs or simple text links if complex icon font setup is too much for a single CSS string. The key is that the links MUST point to the user-provided URLs.\n`;
    part += `- Make the landing page visually appealing and user-friendly. Ensure good contrast for accessibility.\n`;
    return part;
}

function constructPrompt(data) {
    let prompt = '';

    prompt += _buildHeaderNavPromptPart(data);
    prompt += _buildCreativeBriefPromptPart(data);
    prompt += _buildColorAndFontPromptPart(data);
    prompt += _buildHeroStylePromptPart(data);
    prompt += _buildSocialMediaPromptPart(data);
    prompt += _buildTestimonialsPromptPart(data);
    prompt += _buildFaqsPromptPart(data);
    prompt += _buildAboutUsPromptPart(data);
    prompt += _buildPricingPromptPart(data);
    prompt += _buildContactSectionPromptPart(data);
    prompt += _buildFeaturesBenefitsPromptPart(data);
    prompt += _buildFooterPromptPart(data);
    prompt += _buildCoreSynthesisPromptPart(data);
    prompt += _buildAdvancedCustomizationPromptPart(data);
    prompt += _buildFinalInstructionsPromptPart();

    return prompt;
}

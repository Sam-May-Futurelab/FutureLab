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
            model: "gpt-4o", // Using a specific version, you can use "gpt-3.5-turbo" or "gpt-4"
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
Your response MUST be ONLY the JSON object itself, without any surrounding text, comments, or markdown formatting such as \`\`\`json ... \`\`\`. Ensure the CSS is self-contained and does not rely on external files.`
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

    // Logo and Header Instructions
    prompt += `\n--- Header Configuration ---\n`;
    if (data.logoData) {
        prompt += `Logo: An image is provided (Base64 encoded). Include this as an <img> tag in the header.
`;
        prompt += `   - Image Data (for src attribute): "${data.logoData}" (This is a Base64 string, use it directly in the src attribute like src="data:image/png;base64,...")
`;
        prompt += `   - Logo Alt Text: "${data.businessName || 'Logo'}"
`;
    } else {
        prompt += `Logo: No image provided. Display the Business Name ("${data.businessName || 'My Brand'}") as text in the header.
`;
        prompt += `   - Style the business name text appropriately as a header logo (e.g., distinct font, size).
`;
    }
    prompt += `Header/Logo Position: ${data.logoPosition || 'left'}. Position the logo image (if provided) or the business name text (if no logo) accordingly in the header (e.g., align left, center, or right).
`;
    prompt += `--- End Header Configuration ---\n`;

    prompt += `Business Description: ${data.businessDescription || 'N/A'}\n`;
    prompt += `Primary Goal of the Page: ${data.primaryGoal || 'N/A'}\n`;
    prompt += `Target Audience: ${data.targetAudience || 'N/A'}\n`;

    // Add business type specific creative prompts
    if (data.businessType) {
        const businessType = data.businessType; // No toLowerCase() here, use the direct value for switch
        prompt += `\n--- Creative Brief for Industry: ${businessType} ---\n`;

        switch (businessType) {
            case 'bakery_cafe_coffee':
                prompt += `Industry: Bakery/Cafe/Coffee Shop.
Creative Direction: Emphasize a warm, inviting, and artisanal feel. Think cozy, handcrafted, and delicious.
Visuals & Imagery: Suggest imagery of freshly baked goods (breads, pastries, cakes), steaming coffee, latte art, comfortable seating areas, rustic or charming decor.
Key Themes: Freshness, quality ingredients (local/organic if applicable), sensory experience (smell of baking, taste of coffee), community hub, a place to relax or work.
Language Style: Friendly, welcoming, descriptive (e.g., "Velvet Chocolate Croissant," "Sunrise Sourdough").
Design Elements: Consider handwritten-style fonts, warm color palettes (browns, creams, oranges, muted greens), textures like wood or brick. Maybe a chalkboard menu style element.
Example Elements: "Our Story," "Daily Specials," "Featured Brews/Bakes," "Visit Us."\n`;
                break;
            case 'saas_software_tech':
                prompt += `Industry: SaaS/Software/Tech.
Creative Direction: Focus on innovation, efficiency, and cutting-edge solutions. Think sleek, modern, and intelligent.
Visuals & Imagery: Abstract representations of data, networks, code; clean product mockups (desktop/mobile); icons representing features; user interface snippets.
Key Themes: Problem-solving, automation, productivity, data insights, security, scalability, future-forward.
Language Style: Professional, clear, concise, benefit-driven (e.g., "Streamline Your Workflow," "Unlock Potential").
Design Elements: Clean lines, sans-serif fonts, cool or vibrant tech color palettes (blues, purples, greens, often with a bright accent), subtle animations or micro-interactions, clear iconography. Glassmorphism or neumorphism could be very effective here.
Example Elements: "Features," "How it Works," "Pricing," "Request a Demo," "Integrations."\n`;
                break;
            case 'fitness_wellness_gym':
                prompt += `Industry: Fitness/Wellness/Gym.
Creative Direction: Inspire action, motivation, and transformation. Think energetic, healthy, and supportive.
Visuals & Imagery: People actively working out (diverse representation), healthy food, serene wellness scenes, fitness equipment, progress charts (abstractly).
Key Themes: Health benefits, personal growth, strength, endurance, community, achieving goals, mind-body balance.
Language Style: Empowering, motivational, positive, active verbs (e.g., "Unleash Your Strength," "Transform Your Life").
Design Elements: Dynamic layouts, bold typography, vibrant and energetic color palettes (or calming for wellness), high-quality photography/videography.
Example Elements: "Our Programs," "Class Schedule," "Trainer Profiles," "Success Stories," "Join Now."\n`;
                break;
            case 'ecommerce_retail':
                prompt += `Industry: E-commerce/Retail.
Creative Direction: Showcase products attractively and make the shopping experience seamless and enjoyable. Think stylish, user-friendly, and desirable.
Visuals & Imagery: High-quality product photos (multiple angles, lifestyle shots), collections, special offers, customer reviews with photos.
Key Themes: Product appeal, quality, exclusivity (if applicable), ease of purchase, customer satisfaction, latest trends/arrivals.
Language Style: Persuasive, descriptive, benefit-oriented, clear calls to action (e.g., "Shop Now," "Add to Cart," "Limited Stock").
Design Elements: Grid layouts for products, clear navigation, prominent search bar, trust signals (payment icons, security badges), appealing color schemes that match the brand/product type.
Example Elements: "New Arrivals," "Best Sellers," "Shop by Category," "Sale," "Customer Reviews."\n`;
                break;
            case 'consulting_agency':
                prompt += `Industry: Consulting/Agency (e.g., Marketing, Business, Design).
Creative Direction: Convey expertise, professionalism, and results-driven solutions. Think authoritative, strategic, and trustworthy.
Visuals & Imagery: Professional team photos, case study highlights (graphs, results), abstract representations of strategy or growth, client logos (if permissible).
Key Themes: Expertise, problem-solving, achieving client goals, partnership, innovation, tailored solutions.
Language Style: Confident, authoritative, clear, value-focused (e.g., "Drive Growth," "Expert Solutions," "Our Process").
Design Elements: Clean and structured layouts, professional fonts, sophisticated color palettes (blues, grays, often with a strong accent color), clear calls to action for consultation or quotes.
Example Elements: "Services," "Case Studies," "Our Team," "Client Testimonials," "Contact Us for a Quote."\n`;
                break;
            case 'restaurant_food_service':
                prompt += `Industry: Restaurant/Food Service (distinct from cafe, could be fine dining, casual, etc.).
Creative Direction: Make the food irresistible and the dining experience appealing. Think delicious, atmospheric, and memorable.
Visuals & Imagery: Mouth-watering photos of dishes, ambiance shots of the restaurant interior/exterior, happy diners, chefs in action.
Key Themes: Culinary excellence, fresh ingredients, unique flavors, dining experience, ambiance, special occasions.
Language Style: Evocative, descriptive, appetizing (e.g., "Savor the Flavor," "An Unforgettable Meal").
Design Elements: High-quality imagery is key. Font choices and colors should match the restaurant's style (e.g., elegant for fine dining, rustic for a gastropub). Online reservation or ordering CTAs should be prominent.
Example Elements: "Our Menu," "Reservations," "Gallery," "Events," "Chef's Specials."\n`;
                break;
            case 'real_estate':
                prompt += `Industry: Real Estate.
Creative Direction: Showcase properties effectively and build trust with potential buyers/sellers. Think professional, aspirational, and informative.
Visuals & Imagery: High-quality photos and videos of properties (interior, exterior, aerial), neighborhood shots, agent photos. Interactive maps can be a plus.
Key Themes: Dream homes, investment opportunities, neighborhood expertise, seamless transactions, finding the perfect place.
Language Style: Professional, inviting, descriptive, trustworthy (e.g., "Find Your Dream Home," "Expert Real Estate Services").
Design Elements: Clean layouts, easy-to-use property search filters, prominent agent contact information, map integrations.
Example Elements: "Featured Listings," "Search Properties," "Agent Profiles," "Selling Guides," "Neighborhood Info."\n`;
                break;
            case 'non_profit_charity':
                prompt += `Industry: Non-Profit/Charity.
Creative Direction: Evoke empathy, inspire action, and clearly communicate the mission and impact. Think compassionate, urgent, and hopeful.
Visuals & Imagery: Powerful images showing the cause, beneficiaries, volunteers in action. Impact statistics visualized.
Key Themes: Mission-driven, making a difference, community impact, transparency, hope, call for support.
Language Style: Emotive, sincere, urgent, hopeful (e.g., "Join Us to Make a Difference," "Your Support Matters").
Design Elements: Clear calls to donate or get involved, storytelling through visuals and text, impact numbers highlighted. Colors can vary based on the cause but often aim for trust and positivity.
Example Elements: "Our Mission," "How We Help," "Get Involved," "Donate," "Success Stories/Impact."\n`;
                break;
            case 'personal_portfolio_cv':
                prompt += `Industry: Personal Portfolio/CV/Resume.
Creative Direction: Showcase skills, experience, and personality in a professional and engaging way. Think unique, skilled, and hireable.
Visuals & Imagery: Professional headshot, examples of work (screenshots, links, embedded content), icons representing skills.
Key Themes: Personal brand, expertise, accomplishments, creativity, career journey, availability for hire/collaboration.
Language Style: Confident, professional, concise, authentic voice.
Design Elements: Can range from minimalist to highly creative depending on the profession. Clear navigation to sections like "About Me," "Portfolio/Work," "Skills," "Contact."
Example Elements: "My Work," "Skills," "Experience," "Testimonials (from clients/colleagues)," "Contact Me."\n`;
                break;
            case 'event_conference':
                prompt += `Industry: Event/Conference.
Creative Direction: Generate excitement, provide key information, and drive registrations or attendance. Think engaging, informative, and urgent.
Visuals & Imagery: Photos/videos from past events, speaker headshots, venue shots, branding elements of the event.
Key Themes: Learning, networking, excitement, key speakers/topics, schedule, location, value proposition of attending.
Language Style: Enthusiastic, informative, clear calls to action (e.g., "Register Now," "View Schedule," "Become a Speaker").
Design Elements: Countdown timers, speaker showcases, schedule layouts, sponsor logos, clear registration buttons. Branding should be prominent.
Example Elements: "About the Event," "Speakers," "Schedule," "Venue," "Sponsors," "Register/Tickets."\n`;
                break;
            case 'travel_tourism':
                prompt += `Industry: Travel/Tourism.
Creative Direction: Inspire wanderlust and make booking or planning easy. Think adventurous, beautiful, and enticing.
Visuals & Imagery: Stunning destination photos/videos, happy travelers, maps, unique experiences.
Key Themes: Adventure, relaxation, discovery, dream destinations, cultural experiences, ease of booking.
Language Style: Evocative, inspiring, descriptive (e.g., "Discover Paradise," "Your Next Adventure Awaits").
Design Elements: Visually rich, high-quality imagery is paramount. Easy search for destinations/packages, special offers, testimonials.
Example Elements: "Destinations," "Packages," "Travel Guides," "Special Offers," "Book Now."\n`;
                break;
            case 'education_courses':
                prompt += `Industry: Education/Online Courses.
Creative Direction: Highlight learning opportunities, expertise of instructors, and benefits of enrollment. Think knowledgeable, accessible, and empowering.
Visuals & Imagery: Instructors, students learning, course materials (abstractly), certificates of completion.
Key Themes: Knowledge acquisition, skill development, career advancement, expert instruction, flexible learning.
Language Style: Informative, encouraging, clear, benefit-oriented (e.g., "Master New Skills," "Learn from Experts").
Design Elements: Clear course catalogs, instructor bios, student testimonials, enrollment CTAs. Structured layout for information.
Example Elements: "Courses," "About Us," "Instructors," "How it Works," "Enroll Now."\n`;
                break;
            default: // This will apply to "other" or any type not specifically listed
                prompt += `Industry: ${businessType}.\n`;
        }
        prompt += `--- End Creative Brief ---\n`;
        prompt += `Remember, the above industry brief is a guideline. Innovate within this context, using all other user inputs (like tone, target audience, and selling points) to create something truly unique and tailored, not just a generic template for that industry.\n`;
    }

    if (data.aiColors === 'on') { // Frontend sends 'on' for checkbox
        prompt += `Color Scheme: AI-selected complementary color palette. Choose professional and appealing colors.\n`;
    } else {
        prompt += `Primary Color: ${data.primaryColorHex || '#4361EE'}\n`;
        prompt += `Secondary Color: ${data.secondaryColorHex || '#4CC9F0'}\n`;
    }
    prompt += `Font Style: ${data.fontStyle || 'Arial, sans-serif'}\n`;

    prompt += `\n--- Core Creative Synthesis ---\n`;
    prompt += `Holistically synthesize the following aspects to inform ALL design decisions. The aim is a cohesive, persuasive, and highly creative vision that deeply reflects the user's intent, not just a list of features:\n`;
    prompt += `- Business Description: "${data.businessDescription || 'N/A'}" (Extract keywords, implied feelings, and unique aspects to inspire the design's personality.)\n`;
    prompt += `- Primary Goal: "${data.primaryGoal || 'N/A'}" (The entire design should strategically guide the user towards this goal. For instance, if it's 'sales', CTAs and product showcases must be compelling and prominent. If 'brand awareness', the visual identity and storytelling should be memorable.)\n`;
    prompt += `- Target Audience: "${data.targetAudience || 'N/A'}" (Design for THEM. Consider their likely aesthetic preferences, technical savviness, and what would resonate most strongly. A site for 'young gamers' will differ vastly from one for 'corporate executives'.)\n`;
    prompt += `- Overall Tone/Style: "${data.tone || 'Modern and professional'}" (This is paramount. Let it dictate typography, color depth, imagery style, spacing, and even the feel of any (CSS-based) micro-interactions. E.g., 'playful' might use brighter colors and rounded shapes; 'sophisticated' might use elegant fonts and a more reserved palette with impactful imagery.)\n`;
    prompt += `--- End Core Creative Synthesis ---\n`;

    prompt += `\nRequested Page Sections (include all that are listed; if none, create a standard layout with hero, about, features, and contact/footer):\r\n`;
    if (data.sections && data.sections.length > 0) {
        data.sections.forEach(section => {
            prompt += `- ${section.charAt(0).toUpperCase() + section.slice(1)}\n`;
        });
    } else {
        prompt += `- Hero Section\n- About Us Section\n- Features/Services Section\n- Contact/Footer Section\n`; // Default sections
    }

    if (data.sellingPoints && data.sellingPoints.length > 0) {
        prompt += `\nKey Selling Points/Features (for hero or features section):\r\n`;
        prompt += `   - Instruction: Don't just list these. Integrate them creatively. Make them visually distinct, compelling, and a focal point of the relevant section. Use design to emphasize their importance.\n`;
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

    prompt += `\n--- Further Guidance for Maximum Creativity & Tailoring ---\n`;
    prompt += `- Creative Interpretation: You are an expert creative designer. Interpret the user's requests not as rigid constraints but as ingredients for a unique recipe. Where there's ambiguity, lean towards a more creative and modern solution.\n`;
    prompt += `- Beyond the Literal: Think about the *implied* needs. If the business is "eco-friendly handmade soaps," the design should *feel* natural, artisanal, and trustworthy, even if the user didn't explicitly list those adjectives in the 'tone'.\n`;
    prompt += `- Visual Hierarchy & Flow: Craft a clear visual journey for the user. Guide their eye intentionally through the content, leading them towards the primary goal.\n`;
    prompt += `- Uniqueness: Strive for a design that doesn't look like a common template. What can you do with layout, typography, color, or imagery to make this page memorable and stand out, while still being highly usable and professional?\n`;

    prompt += `\nImportant Instructions for AI:\r\n`;
    prompt += `- Generate complete HTML for a single page and all necessary CSS.\r\n`;
    prompt += `- Provide your response as a single, valid JSON object with two keys: "html" and "css". The value for "html" should be the full HTML code as a string. The value for "css" should be the full CSS code as a string. No other text or formatting outside this JSON object.\n`;
    prompt += `- The CSS MUST be self-contained within the "css" string. Do NOT include any <link rel="stylesheet" href="..."> tags in the HTML.\n`;
    prompt += `- Aim for a MODERN, CREATIVE, and VISUALLY APPEALING design. Incorporate contemporary design trends and avoid generic templates. Consider unique layouts, bold typography, and engaging visual elements.\n`;
    prompt += `- Ensure the CSS makes the page responsive across common device sizes (desktop, tablet, mobile). Use flexbox or grid for layout where appropriate.\n`;
    prompt += `- For social media links, try to use common font icon classes (like Font Awesome, e.g., <i class="fab fa-twitter"></i>) or use text links if icons are not feasible. If using font icons, ensure the CSS includes the necessary @import or font-face rules if they are not commonly available by default. However, prefer inline SVGs or simple text links if complex icon font setup is too much for a single CSS string.\n`;
    prompt += `- Make the landing page visually appealing and user-friendly. Ensure good contrast for accessibility.\n`;
    prompt += `- Double-check that the output is ONLY the JSON object as specified.\n`;

    return prompt;
}

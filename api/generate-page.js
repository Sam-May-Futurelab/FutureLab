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
        prompt += `Logo: An image is provided (Base64 encoded). Include this as an <img> tag in the header. The logo image MUST be clickable and link to the homepage (e.g., wrap the <img> tag with <a href="#top"> or <a href="index.html">). Apply a subtle and clean CSS hover animation to the logo image (e.g., slight scale up, subtle shadow, or opacity change) for a polished feel.\n`;
    } else {
        prompt += `Logo: No image provided. Display the Business Name ("${data.businessName || 'My Brand'}") as text in the header. This business name text MUST be clickable and link to the homepage (e.g., wrap the text with <a href="#top"> or <a href="index.html">). Style the business name text appropriately as a header logo (e.g., distinct font, size). Apply a subtle and clean CSS hover animation to this text-based logo (e.g., slight text shadow change, underline effect, or color brightness change) for a polished feel.\n`;
    }
    prompt += `Header/Logo Position: ${data.logoPosition || 'left'}. Position the logo image (if provided) or the business name text (if no logo) accordingly in the header. \
If 'center' is specified, ensure the logo (or its container) is truly centered using appropriate CSS (e.g., for a block element, use 'margin: 0 auto; text-align: center;' on the container, or if the header is a flex container, use 'justify-content: center;' on the header and ensure the logo is the primary centered item or within a centered flex item). \
If 'left' or 'right', ensure it is aligned to that side, typically with navigation links (if any) on the opposite side or appropriately spaced.\n`;

    prompt += `--- End Header Configuration ---\n`;

    // NEW: Header Navigation Menu Instructions
    prompt += `\n--- Header Navigation Menu ---\n`;
    prompt += `In addition to the logo/business name, the header should include a navigation menu if relevant sections are present on the page. This menu should contain links to the main sections of the page that are being generated.\n`;

    const availableSectionsForNav = [
        { key: 'about', name: 'About Us', id: 'about-us' },
        { key: 'features', name: 'Features', id: 'features' },
        { key: 'pricing', name: 'Pricing', id: 'pricing' },
        { key: 'testimonials', name: 'Testimonials', id: 'testimonials' },
        { key: 'faqs', name: 'FAQs', id: 'faqs' },
        { key: 'contact', name: 'Contact', id: 'contact' }
    ];

    let navLinksInstructionAdded = false;
    availableSectionsForNav.forEach(section => {
        // Check if data.sections exists and includes the section key
        if (data.sections && data.sections.includes(section.key)) {
            prompt += `  - A link to the "${section.name}" section. The link text should be "${section.name}". CRITICAL: The href attribute for this link MUST be an anchor link relative to the current page, formatted ONLY as "#${section.id}" (e.g., <a href="#${section.id}">${section.name}</a>). Do NOT use absolute URLs or any other path. Ensure the corresponding generated section on the page has the exact id="${section.id}" for the link to work.\n`;
            navLinksInstructionAdded = true;
        }
    });

    if (navLinksInstructionAdded) {
        prompt += `Style these navigation links clearly. They should be easily distinguishable from the logo/business name and typically appear alongside or opposite the logo, depending on the chosen header layout (e.g., logo left, nav links right). The navigation links should be arranged horizontally on larger screens.\n`;
        prompt += `The navigation menu MUST be responsive. For smaller screens (e.g., mobile, tablets), it should collapse into a hamburger menu icon that, when clicked, reveals the navigation links vertically or in an overlay. Ensure the JavaScript/CSS for this toggle functionality is included if you implement a hamburger menu. CRITICAL FOR MOBILE: Ensure there is adequate spacing between the logo and the hamburger menu icon to prevent them from appearing too close or overlapping. Use CSS (e.g., margin, padding, or justify-content: space-between on a flex container) to enforce this separation in the mobile view of the header.\n`;
    } else {
        prompt += `No specific page sections were selected that typically appear in a primary navigation menu, or no such sections were selected at all. In this case, the header can consist of just the logo/business name. Ensure the header still looks balanced.\n`;
    }
    prompt += `--- End Header Navigation Menu ---\n`;

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
        prompt += `Remember, the above industry brief is a guideline. Innovate within this context. CRITICAL: Use the industry specifics AND the target audience profile to generate *highly relevant and tailored sections and content*, not just a generic template or stylistic adjustments for that industry. The combination of industry and audience should dictate the actual substance and structure of the page.\n`;
    }

    if (data.aiColors === 'on') { // Frontend sends 'on' for checkbox
        prompt += `Color Scheme: AI-selected complementary color palette. Choose professional and appealing colors.\n`;
    } else {
        prompt += `Primary Color: ${data.primaryColorHex || '#4361EE'}\n`;
        prompt += `Secondary Color: ${data.secondaryColorHex || '#4CC9F0'}\n`;
    }
    // Font Style Handling
    let fontToRequest = data.fontStyle;
    if (!fontToRequest || fontToRequest.toLowerCase() === 'let ai choose / default' || fontToRequest.toLowerCase() === 'default' || fontToRequest.trim() === '') {
        fontToRequest = 'Poppins, sans-serif'; // Default to Poppins
        prompt += `Font Style: ${fontToRequest}. Ensure Google Fonts is imported for Poppins if used (e.g., @import url('https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700&display=swap');).\n`;
    } else {
        prompt += `Font Style: ${data.fontStyle}\n`; // Use user-specified font
    }

    prompt += `\n--- Hero Section Styling ---\n`;
    if (data.aiColors === 'on') {
        prompt += `Hero Section Background: Use the AI-selected color palette to create a beautiful and modern **gradient** background for the hero section. Ensure it complements the overall design and the chosen colors work well together in a gradient format.\n`;
    } else {
        prompt += `Hero Section Background: Use the primary color (${data.primaryColorHex || '#4361EE'}) and secondary color (${data.secondaryColorHex || '#4CC9F0'}) to create a beautiful and modern gradient background for the hero section. The gradient should be visually appealing and harmonious.\n`;
    }
    prompt += `--- End Hero Section Styling ---\n`;

    // Social Media Links
    prompt += `\n--- Social Media Links ---\n`;
    if (data.socials && Object.keys(data.socials).length > 0) {
        prompt += `Include the following social media links. Use the exact URLs provided. For each, display the platform name or a standard icon, and link it to the given URL:\n`;
        for (const [platform, url] of Object.entries(data.socials)) {
            if (url && url.trim() !== '') { // Ensure URL is not empty or just whitespace
                prompt += `- ${platform.charAt(0).toUpperCase() + platform.slice(1)}: ${url.trim()}\n`;
            }
        }
        prompt += `Ensure these are present and correctly linked in a 'Stay Connected' or similar footer/contact section.\n`;
    } else {
        prompt += `No specific social media links provided by the user. You can omit a social media section entirely, or if a social media presence is strongly implied by the business type or goals, use placeholder links or icons for common platforms (e.g., Twitter, Facebook, Instagram, LinkedIn). If using placeholders, make it clear they are placeholders (e.g., link to # or use generic platform URLs like https://twitter.com/yourprofile) AND state that the user should update these.\n`;
    }
    prompt += `--- End Social Media Links ---\n`;

    // Testimonials
    prompt += `\n--- Testimonials Section ---\n`;
    if (data.testimonials && Array.isArray(data.testimonials) && data.testimonials.some(t => t.text && t.text.trim() !== '')) {
        prompt += `The user has provided testimonials. Include a dedicated section with a clear heading like "Testimonials" or "What Our Clients Say". The testimonial items themselves (text, author, etc.) should be presented clearly *under* this main heading, not inline with it. The entire section, or its main content container holding the testimonials, should be styled to ensure it is **centered on the page**. For each testimonial, display the testimonial text, author, and author's title/company (if provided). Style this section to be engaging and build trust. Individual testimonial items (e.g., cards or blocks) should have a subtle and clean CSS hover animation (e.g., slight lift, shadow change, or border highlight) to enhance interactivity. Include ALL provided testimonials:\n`;
        data.testimonials.forEach((testimonial, index) => {
            if (testimonial.text && testimonial.text.trim() !== '') {
                prompt += `  Testimonial ${index + 1}:\n`;
                prompt += `    - Text: "${testimonial.text.trim()}"\n`;
                if (testimonial.author && testimonial.author.trim() !== '') {
                    prompt += `    - Author: "${testimonial.author.trim()}"\n`;
                }
                if (testimonial.title && testimonial.title.trim() !== '') {
                    prompt += `    - Author's Title/Company: "${testimonial.title.trim()}"\n`;
                }
            }
        });
    } else {
        prompt += `No testimonials provided by the user. Do not include a testimonials section unless it's a generic placeholder clearly marked as such and suggested by the AI based on the business type (e.g., for a consulting business where testimonials are typical). If you add a placeholder, clearly state "Placeholder for testimonials - user should add actual client feedback here."\n`;
    }
    prompt += `--- End Testimonials Section ---\n`;

    // FAQs Section
    prompt += `\n--- FAQs Section ---\n`;
    if (data.faqs && Array.isArray(data.faqs) && data.faqs.some(f => f.question && f.question.trim() !== '' && f.answer && f.answer.trim() !== '')) {
        prompt += `The user has provided FAQs. Include a dedicated "Frequently Asked Questions" (or similar) section. For each FAQ, display the question directly above its corresponding answer, making both visible by default. Style each Q&A pair as a distinct visual block (e.g., like a list item or a card). Apply a subtle and clean CSS hover animation to each FAQ item (e.g., slight lift, shadow change, or border highlight) to enhance interactivity. Include ALL provided FAQs:\n`;
        data.faqs.forEach((faq, index) => {
            if (faq.question && faq.question.trim() !== '' && faq.answer && faq.answer.trim() !== '') {
                prompt += `  FAQ ${index + 1}:\n`;
                prompt += `    - Question: "${faq.question.trim()}"\n`;
                prompt += `    - Answer: "${faq.answer.trim()}"\n`;
            }
        });
    } else {
        prompt += `No FAQs provided by the user. Do not include an FAQ section unless it's a generic placeholder clearly marked as such and suggested by the AI based on the business type. If you add a placeholder, clearly state "Placeholder for FAQs - user should add actual questions and answers here."\n`;
    }
    prompt += `--- End FAQs Section ---\n`;

    // About Us Section
    prompt += `\n--- About Us Section ---\n`;
    if (data.aboutUsSnippet && data.aboutUsSnippet.trim() !== '') {
        prompt += `The user has provided an "About Us" snippet. Include a dedicated "About Us" section on the page. Use the following content:\n`;
        prompt += `  - Snippet: "${data.aboutUsSnippet.trim()}"\n`;
        prompt += `Style this section appropriately to fit the overall design and effectively introduce the business/project. The main content/text of this section should be **centered on the page** (e.g., within a container that has auto margins or uses flexbox for centering).\n`;
    } else if (data.sections && data.sections.includes('about')) { // If "About Us" was checked but no snippet provided
        prompt += `The user selected to include an "About Us" section but did not provide a specific snippet. Generate a concise, well-written placeholder "About Us" section that is relevant to the business type: "${data.businessType || 'general business'}" and target audience: "${data.targetAudience || 'general audience'}". Clearly mark this content as placeholder text that the user should customize, for example, by starting with "[Placeholder: Tell your story here...]". The main content/text of this section should be **centered on the page**.\n`;
    } else {
        prompt += `No "About Us" snippet provided and the section was not explicitly requested to be generated with placeholder content. Omit the "About Us" section unless it is critically essential for the business type and AI suggests it (in which case, use a clearly marked placeholder as described above, ensuring its content is centered).\n`;
    }
    prompt += `--- End About Us Section ---\n`;
    
    // Pricing Section - NEW
    prompt += `\n--- Pricing Section ---\n`;
    if (data.pricingPlans && Array.isArray(data.pricingPlans) && data.pricingPlans.length > 0 && data.pricingPlans.some(p => p.name && p.price)) {
        prompt += `The user has provided pricing plan information. Include a dedicated section with a clear heading like "Pricing" or "Our Plans". The pricing plans (whether as cards, table rows, etc.) should be presented clearly *under* this main heading, not inline with it. The entire section, or its main content container holding the pricing plans, should be styled to ensure it is **centered on the page**. A table structure or a series of styled cards is often effective for comparing plans. Include ALL provided pricing plans and their details. For each plan, display its name, price, list of features, and a call to action button/link if provided.\n`;
        data.pricingPlans.forEach((plan, index) => {
            prompt += `  Plan ${index + 1}:\n`;
            if (plan.name && plan.name.trim() !== '') {
                prompt += `    - Name: "${plan.name.trim()}"\n`;
            }
            if (plan.price && plan.price.trim() !== '') {
                prompt += `    - Price: "${plan.price.trim()}"\n`;
            }
            if (plan.features && Array.isArray(plan.features) && plan.features.length > 0) {
                prompt += `    - Features: \n`;
                plan.features.forEach(feature => {
                    if (feature && feature.trim() !== '') {
                        prompt += `      - "${feature.trim()}"\n`;
                    }
                });
            }
            if (plan.callToAction && plan.callToAction.trim() !== '') {
                prompt += `    - Call to Action Text: "${plan.callToAction.trim()}" (This should be a clickable button/link for the plan)\n`;
            }
        });
        prompt += `Style this section to be clear, easy to compare, and visually appealing, encouraging users to choose a plan.\n`;
    } else if (data.sections && data.sections.includes('pricing')) { // If "Pricing" was checked but no data provided
        prompt += `The user selected to include a "Pricing" section but did not provide specific plan data. Generate a placeholder section with a clear heading like "Pricing", "Our Plans", or something more tailored to the business type (e.g., "Service Packages" for a consultancy, "Membership Tiers" for a gym). \n`;
        prompt += `*Under* this heading, create 2-3 sample plans. CRITICALLY, these plans must be highly relevant to the business type: "${data.businessType || 'general business'}" and target audience: "${data.targetAudience || 'general audience'}". \n`;
        prompt += `The plan names, sample prices (e.g., "$X/month", "Starting at $Y"), and especially the features listed within each plan should be realistically tailored to what that specific business type would offer to that audience. For example:\n`;
        prompt += `  - For a 'bakery_cafe_coffee' targeting 'local residents', placeholder plans might be named 'Morning Perks Club', 'Artisan Bread Box', or 'Custom Celebration Cakes', with features like 'Daily free coffee upgrade', 'Weekly sourdough loaf', 'Consultation & tasting'.\n`;
        prompt += `  - For a 'saas_software_tech' targeting 'small businesses', placeholder plans could be 'Starter Suite', 'Growth Engine', or 'Enterprise Connect', with features like '10 users, 100GB storage, Basic analytics', 'Unlimited users, 1TB storage, Advanced analytics, API access', 'Custom solution, Dedicated support, SLA'.\n`;
        prompt += `The entire section, or its main content container holding these placeholder plans, should be styled to ensure it is **centered on the page**. Each placeholder plan should have a name, a sample price, a few bullet points for features, and a call to action button. Clearly mark this content as placeholder text that the user should customize, for example, by starting plan descriptions with "[Placeholder: Customize this plan...]" or noting "Sample Plans - Update with your offerings."\n`;
    } else {
        prompt += `No pricing plans provided and the section was not explicitly requested to be generated with placeholder content. Omit the "Pricing" section unless it is critically essential for the business type and AI suggests it (in which case, use a clearly marked placeholder as described above).\n`;
    }
    prompt += `--- End Pricing Section ---\n`;

    prompt += `\n--- Contact Section ---\n`;
    const includeContactSection = data.sections && data.sections.includes('contact'); // NEW LOGIC - section checkbox is the source of truth

    if (includeContactSection) {
        prompt += `The user has requested a "Contact Us" section. This section MUST feature a functional contact form.\n`;
        prompt += `CRITICAL PLACEMENT: This "Contact Us" section, if generated, MUST be the VERY LAST section in the HTML body, appearing after all other content sections (e.g., About Us, Features, Pricing, Testimonials, FAQs, Social Media links if they are in a footer-like area but before a final small print footer if any). It should effectively be the footer or immediately precede a minimal site-info footer.\n`;
        prompt += `The contact form should collect at least the sender's name, email, and a message.\n`;
        prompt += `  - Introductory Text: After the main heading of the 'Contact Us' section (e.g., <h2>Contact Us</h2>), and *before* the contact form itself, insert a brief, welcoming introductory sentence. For example: '<p>Want to get in touch? We\'d love to hear from you! Simply fill out the form below and we\'ll get back to you as soon as possible.</p>' or a similar friendly message. This text should be styled to match the section's overall design and be centered if the form is centered.\n`;
        if (data.contactFormEmail && data.contactFormEmail.trim() !== '') {
            prompt += `Use the following email address for the 'mailto:' link: ${data.contactFormEmail.trim()}\n`;
        } else {
            // This 'else' block should ideally not be reached if the client-side validation (making email required) works correctly.
            // However, as a fallback, instruct AI to use a clear placeholder and a very visible warning for the user to replace it.
            prompt += `CRITICAL FALLBACK: The user requested a contact form but NO email was provided (this indicates a potential issue with form submission or data collection). Use a VERY OBVIOUS placeholder like 'REPLACE-WITH-YOUR-EMAIL@example.com' for the 'mailto:' link AND include a prominent, visible warning message directly above or within the contact form in the HTML stating: "IMPORTANT: Contact form is not fully configured. Please provide your email address in the questionnaire to activate this form." This warning should be styled to be highly noticeable (e.g., red text, warning icon).\n`;
        }
        prompt += `Styling: Style the contact form to be user-friendly, visually appealing, and modern, consistent with the overall page design. Avoid a basic or unstyled appearance. The form itself (or its main container) should be **centered on the page**.\n`;
    } else {
        prompt += `The user has NOT explicitly requested a "Contact Us" section with a form. Omit this section.\n`;
    }
    prompt += `--- End Contact Section ---\n`;

    prompt += `\n--- Features/Benefits Section ---\n`;
    if (data.sections && data.sections.includes('features')) {
        prompt += `The user has requested a "Features/Benefits" section. This section should highlight key advantages, services, or product features.\n`;
        prompt += `   - Section Heading: The main heading for this section should be contextually relevant to the business type: "${data.businessType || 'general business'}" and target audience: "${data.targetAudience || 'general audience'}". For example, for a 'bakery_cafe_coffee', it could be 'Our Daily Bakes', 'Sweet Delights', or 'What We Offer'. For 'saas_software_tech', it might be 'Core Functionality', 'Platform Advantages', or 'Why Choose Us?'. Avoid overly generic titles like 'Our Features' or 'Features' unless no more creative and fitting alternative can be derived from the context. The heading should be engaging and accurately reflect the content of this section.\n`;
        if (data.mustHaveElements && data.mustHaveElements.trim() !== '') {
            prompt += `   - Primary Content Source: Use the user-provided "Must-Have Elements/Keywords": "${data.mustHaveElements.trim()}". Interpret these as the core features/benefits to showcase.\n`;
            prompt += `   - Presentation: Present these as a list, a series of cards, or iconic blurbs. Each item should be distinct and easy to read.\n`;
            prompt += `   - Animation: If presented as multiple items (cards, list items), apply a subtle CSS hover animation to each item (e.g., slight lift, shadow change, border highlight) for interactivity.\n`;
        } else {
            prompt += `   - Content Generation: The user did not provide specific "Must-Have Elements/Keywords" for this section. \n`;
            prompt += `     Attempt to intelligently derive 3-5 compelling features/benefits by analyzing the following user inputs (if available):\n`;
            prompt += `       1. Business Description: "${data.businessDescription || 'N/A'}"\n`;
            prompt += `       2. Primary Goal of the Page: "${data.primaryGoal || 'N/A'}"\n`;
            if (data.pricingPlans && Array.isArray(data.pricingPlans) && data.pricingPlans.length > 0 && data.pricingPlans.some(p => p.name && p.price)) {
                prompt += `       3. Pricing Plan Details: Review names, prices, and features listed in the pricing plans to extract key service highlights.\n`;
            }
            prompt += `       4. About Us Snippet: "${data.aboutUsSnippet || 'N/A'}"\n`;
            prompt += `     Synthesize these details to create features that are highly relevant to the business type: "${data.businessType || 'general business'}" and target audience: "${data.targetAudience || 'general audience'}".\n`;
            prompt += `     If sufficient detail cannot be derived, then as a last resort, use generic placeholders like "[Placeholder: Describe a key feature/benefit here.]".\n`;
            prompt += `   - Animation: If presented as multiple items, apply a subtle CSS hover animation as described above.\n`;
        }
        prompt += `Style this section to be persuasive and visually engaging, reinforcing the value proposition of the business/product.\n`;
    } else {
        prompt += `The "Features/Benefits" section was not explicitly requested. Only include it if the "Must-Have Elements/Keywords" (if provided and relevant) strongly suggest a standalone features list and it aligns with the overall creative direction. If so, follow the guidelines above for content and styling.\n`;
    }
    prompt += `--- End Features/Benefits Section ---\n`;

    prompt += `\n--- Footer Section ---\n`;
    prompt += `A footer section MUST be generated at the very end of the HTML body, after all other content including the Contact Us section (if present).\n`;
    prompt += `The footer must include:\n`;
    prompt += `  - Copyright Information: Display a copyright notice, e.g., "© ${new Date().getFullYear()} ${data.businessName || 'Your Business Name'}". Use the actual current year and the provided business name.\n`;
    prompt += `  - Social Media Links: Integrate social media links based on the earlier "Social Media Links" section instructions. If no specific links are provided by the user, include placeholders for common platforms or a message indicating where to add them, ensuring the footer still allocates space for them or notes their absence gracefully.\n`;
    prompt += `Style the footer to be professional, unobtrusive, and consistent with the overall page design. It should clearly delineate the end of the page content.\n`;
    prompt += `--- End Footer Section ---\n`;

    prompt += `\n--- Core Creative Synthesis ---\n`;
    prompt += `Holistically synthesize the following aspects to inform ALL design decisions. The aim is a cohesive, persuasive, and highly creative vision that deeply reflects the user's intent, not just a list of features:\n`;
    prompt += `- Business Description: "${data.businessDescription || 'N/A'}" (Extract keywords, implied feelings, and unique aspects to inspire the design's personality.)\n`;
    prompt += `- Primary Goal: "${data.primaryGoal || 'N/A'}" (The entire design should strategically guide the user towards this goal. For instance, if it's 'sales', CTAs and product showcases must be compelling and prominent. If 'brand awareness', the visual identity and storytelling should be memorable.)\n`;
    prompt += `- Target Audience: "${data.targetAudience || 'N/A'}" (CRITICAL: Design for THEM. This should heavily influence not only aesthetics but also the *type of content, specific sections generated, imagery choices, and overall communication style*. Consider their likely aesthetic preferences, technical savviness, and what would resonate most strongly. A site for 'young gamers' will require different sections, content, and interactivity than one for 'corporate executives'.)\n`;
    prompt += `- Overall Tone/Style: "${data.tone || 'Modern and professional'}" (This is paramount. Let it dictate typography, color depth, imagery style, spacing, and even the feel of any (CSS-based) micro-interactions. E.g., 'playful' might use brighter colors and rounded shapes; 'sophisticated' might use elegant fonts and a more reserved palette with impactful imagery.)\n`;
    prompt += `--- End Core Creative Synthesis ---\n`;

    // Add Advanced Design Customizations if provided
    if (data.inspirationWebsites) {
        prompt += `- Inspiration Websites: ${data.inspirationWebsites}\n`;
    }
    if (data.mustHaveElements && data.mustHaveElements.trim() !== '') {
        prompt += `- Must-Have Elements/Keywords: "${data.mustHaveElements.trim()}"\n`;
        prompt += `  Incorporate these elements/keywords strategically throughout the page content and design. If the "Features/Benefits" section is NOT enabled (as per the logic above), but these keywords strongly suggest a list of features that would benefit the page, you can still consider creating such a section using them. Otherwise, weave them into other relevant sections (hero, about, etc.) to reinforce key messages.\n`;
    }
    if (data.thingsToAvoid) {
        prompt += `- Things to Avoid: ${data.thingsToAvoid}\n`;
    }

    prompt += `\nImportant Instructions for AI:\r\n`;
    prompt += `- Generate complete HTML for a single page and all necessary CSS.\r\n`;
    prompt += `- CRITICAL: If the user provides specific optional content (e.g., social media URLs, testimonials, FAQs, 'About Us' snippet, 'Pricing Plan' details, contact form email), YOU MUST include this content in the generated page. If a section is toggled on or has data, it should appear. This includes the 'About Us' section if a snippet is provided (see 'About Us Section' details), the 'Pricing Plan' details if provided (see 'Pricing Section' details), and the contact form email (see 'Contact Section' details). Do not omit user-provided data for these sections.\n`;
    prompt += `- Provide your response as a single, valid JSON object with two keys: "html" and "css". The value for "html" should be the full HTML code as a string. The value for "css" should be the full CSS code as a string. No other text or formatting outside this JSON object.\n`;
    prompt += `- The CSS MUST be self-contained within the "css" string. Do NOT include any <link rel="stylesheet" href="..."> tags in the HTML.\n`;
    prompt += `- Aim for a MODERN, CREATIVE, and VISUALLY APPEALING design. Incorporate contemporary design trends and avoid generic templates. Consider unique layouts, bold typography, and engaging visual elements.\n`;
    prompt += `- Ensure the CSS makes the page responsive across common device sizes (desktop, tablet, mobile). Use flexbox or grid for layout where appropriate.\n`;
    prompt += `- For social media links, if specific URLs are provided (see Social Media Links section above), YOU MUST USE THOSE EXACT URLs. For icons, try to use common font icon classes (like Font Awesome, e.g., <i class="fab fa-instagram"></i> for Instagram) or use text links if icons are not feasible. If using font icons, ensure the CSS includes the necessary @import or font-face rules if they are not commonly available by default. However, prefer inline SVGs or simple text links if complex icon font setup is too much for a single CSS string. The key is that the links MUST point to the user-provided URLs.\n`;
    prompt += `- Make the landing page visually appealing and user-friendly. Ensure good contrast for accessibility.\n`;

    return prompt;
}

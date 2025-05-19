const OpenAI = require('openai');

// Ensure you have your OpenAI API key set as an environment variable: OPENAI_API_KEY
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

// Helper function to construct a prompt for OpenAI
function constructPrompt(fieldType, context) {
    const { businessDescription, targetAudience, primaryGoal } = context;
    let prompt = "";

    switch (fieldType) {
        case 'heroHeadline':
            prompt = `Generate 3-5 compelling and concise hero headline suggestions for a landing page.
            The business is described as: "${businessDescription || 'Not specified'}".
            The target audience is: "${targetAudience || 'Not specified'}".
            The primary goal of the landing page is: "${primaryGoal || 'Not specified'}".
            
            Focus on creating headlines that are:
            - Engaging and attention-grabbing.
            - Clearly communicate value or a key benefit.
            - Relevant to the provided business description, audience, and goal.
            - Relatively short and impactful (ideally under 10-15 words).

            Return ONLY a JSON array of strings, with each string being a unique headline suggestion. For example:
            ["Headline 1", "Headline 2", "Headline 3"]
            Do not include any other text, explanations, or markdown formatting.`;
            break;
        // Add cases for other field types here in the future
        default:
            prompt = `Generate suggestions for the field type: ${fieldType} with context: ${JSON.stringify(context)}`;
            break;
    }
    return prompt;
}

module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        res.setHeader('Allow', ['POST']);
        return res.status(405).end('Method Not Allowed');
    }

    const { fieldType, context } = req.body;

    if (!fieldType || !context) {
        return res.status(400).json({ message: 'Missing fieldType or context in request body' });
    }

    try {
        const prompt = constructPrompt(fieldType, context);

        const completion = await openai.chat.completions.create({
            model: "gpt-3.5-turbo", // Or your preferred model
            messages: [{ role: "user", content: prompt }],
            temperature: 0.7, // Adjust for creativity vs. predictability
            max_tokens: 150, // Adjust based on expected length of suggestions
            n: 1, // We are asking for an array in the prompt, so one completion is fine.
        });

        let suggestionsResponse = completion.choices[0].message.content.trim();
        
        // Attempt to parse the JSON array from the response
        let suggestions = [];
        try {
            // The model might sometimes return a string that looks like a JSON array but isn't perfectly formatted.
            // We'll try to clean it up a bit.
            // Remove potential markdown code block fences
            suggestionsResponse = suggestionsResponse.replace(/^```json\n/, '').replace(/\n```$/, '');
            suggestions = JSON.parse(suggestionsResponse);
            if (!Array.isArray(suggestions) || !suggestions.every(s => typeof s === 'string')) {
                throw new Error("Response was not a valid JSON array of strings.");
            }
        } catch (parseError) {
            console.error("Error parsing OpenAI response:", parseError);
            console.error("Raw OpenAI response:", suggestionsResponse);
            // Fallback: if parsing fails, try to split by newline if it looks like a list
            if (suggestionsResponse.includes('\n') && !suggestionsResponse.startsWith('[')) {
                suggestions = suggestionsResponse.split('\n').map(s => s.trim().replace(/^- /, '')).filter(s => s);
            } else {
                 // If still no good, return an error or an empty array with a log
                console.error("Could not parse suggestions from response:", suggestionsResponse);
                return res.status(500).json({ message: 'Failed to parse suggestions from AI. The AI returned an unexpected format.' });
            }
        }
        
        // Ensure we always return an array, even if the fallback above resulted in a single string somehow
        if (!Array.isArray(suggestions)) {
            suggestions = [suggestions.toString()];
        }


        res.status(200).json(suggestions);

    } catch (error) {
        console.error('Error calling OpenAI API:', error);
        let errorMessage = 'Failed to generate suggestions due to an internal server error.';
        if (error.response && error.response.data && error.response.data.error && error.response.data.error.message) {
            errorMessage = `OpenAI API Error: ${error.response.data.error.message}`;
        } else if (error.message) {
            errorMessage = error.message;
        }
        res.status(500).json({ message: errorMessage });
    }
};

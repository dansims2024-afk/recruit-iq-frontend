// NOTE: This code runs on Vercel as a Serverless Function (your "Security Guard")
// The GEMINI_API_KEY must be set securely in Vercel's Environment Variables.

// 1. Load the secret API Key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';


// Mock function representing the actual Generative AI SDK call
async function callGeminiAPI(prompt) {
    // This function is secure because it uses the GEMINI_API_KEY which only Vercel knows
    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        })
    });
    
    if (!response.ok) {
        throw new Error(`Gemini API call failed with status: ${response.status} - ${await response.text()}`);
    }
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

// 2. Main handler for the proxy endpoint: /api/analyze
export default async function analyzeCandidate(req, res) {
    
    // --- Phase 1: Security and Data Validation ---
    
    const { jobDescription, resume } = req.body;

    if (!jobDescription || !resume) {
        return res.status(400).send({ error: 'Missing Job Description or Resume data.' });
    }

    // --- Phase 2: Build the Prompt ---
    const prompt = `
      Analyze the Candidate Resume against the Job Description. Act as an expert Technical Recruiter.
      Return a valid JSON object (and ONLY the JSON object) with the following structure:
      { 
        "matchScore": number (0-100), 
        "fitSummary": "string (brief assessment for hiring manager)", 
        "strengths": ["str (top 3 matches)"], 
        "gaps": ["str (top 3 missing requirements/red flags)"], 
        "interviewQuestions": ["str"] 
      }
      
      CRITICAL INSTRUCTION: Ensure all "interviewQuestions" are designed to elicit a quantifiable answer.

      Job Description: ${jobDescription}
      Candidate Resume: ${resume}
    `;
    
    try {
        // --- Phase 3: Call the Secure AI ---
        const jsonResultText = await callGeminiAPI(prompt);
        
        // Clean up common JSON errors before parsing
        let cleanJson = jsonResultText.replace(/,(\s*[}\]])/g, '$1');
        const parsedResult = JSON.parse(cleanJson);
        
        // 4. Return the analysis result to the frontend
        res.status(200).json({ 
            analysis: parsedResult,
            // We are not tracking usage now, but this placeholder is here for future monetization
            newUsageCount: 0 
        });

    } catch (error) {
        console.error('Proxy Error during analysis:', error);
        res.status(500).json({ error: 'Failed to process analysis request due to a server or AI error.' });
    }
}

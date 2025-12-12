// Vercel Serverless Function (Security Guard)
// The GEMINI_API_KEY MUST be set securely in Vercel's Environment Variables.

// 1. Load the secret API Key from environment variables
const GEMINI_API_KEY = process.env.GEMINI_API_KEY; 
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-09-2025:generateContent';

// Function to generate content securely
async function callGeminiAPI(prompt) {
    
    // Safety check: If the key isn't loaded, throw a clear error before calling fetch.
    if (!GEMINI_API_KEY) {
        throw new Error("CRITICAL_ERROR: AI Key missing or scope mismatch on serverless function. Check Vercel Environment Variables.");
    }

    const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { responseMimeType: "application/json" }
        })
    });
    
    // Check for Google API errors (400, 403, 500)
    if (!response.ok) {
        const errorDetails = await response.text();
        // Return detailed error response including status code
        throw new Error(`Gemini API Failed. Status: ${response.status}. Details: ${errorDetails.substring(0, 100)}...`);
    }
    
    const data = await response.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text;
}

// Main Vercel handler function
export default async function analyzeCandidate(req, res) {
    
    try {
        // --- 1. Key Check (Will return 401 if missing) ---
        if (!GEMINI_API_KEY) {
            // This error is caught by the frontend and displayed clearly
            return res.status(401).json({ error: 'AI Service Authentication Failed. Check GEMINI_API_KEY environment variable.' });
        }
        
        // --- 2. Data Validation ---
        const body = req.body || {};
        const { jobDescription, resume } = body;

        if (!jobDescription || !resume) {
            return res.status(400).json({ error: 'Missing Job Description or Resume data.' });
        }

        const prompt = `
          Analyze the Candidate Resume against the Job Description. Act as an expert Recruiter.
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
        
        // --- 3. Call External AI ---
        const jsonResultText = await callGeminiAPI(prompt);
        
        // --- 4. Process and Return ---
        let cleanJson = jsonResultText.replace(/,(\s*[}\]])/g, '$1');
        const parsedResult = JSON.parse(cleanJson);
        
        res.status(200).json({ 
            analysis: parsedResult,
            newUsageCount: 0 
        });

    } catch (error) {
        // Log the specific error and return 500 status with details
        console.error('Proxy Fatal Error:', error.message || error);
        res.status(500).json({ error: `Server Crash: ${error.message || 'Unknown internal function error.'}` });
    }
}

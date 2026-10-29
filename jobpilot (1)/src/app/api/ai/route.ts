import OpenAI from "openai";
import { NextResponse } from "next/server";
import { z } from "zod";

const schema = z.object({
  task: z.enum(["cover-letter", "resume-feedback", "interview-feedback"]),
  resume: z.string().max(16000).optional().default(""),
  jobDescription: z.string().max(12000).optional().default(""),
  prompt: z.string().max(8000).optional().default(""),
  answer: z.string().max(8000).optional().default("")
});

export async function POST(req: Request) {
  const parsed = schema.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Please check your input and try again." }, { status: 400 });
  if (!process.env.OPENAI_API_KEY) {
    return NextResponse.json({
      error: "AI is not configured yet. Add OPENAI_API_KEY to .env.local and restart the app. Your other JobPilot tools still work."
    }, { status: 503 });
  }
  const { task, resume, jobDescription, prompt, answer } = parsed.data;
  const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const instructions: Record<typeof task, string> = {
    "cover-letter": "Write a specific, concise, professional cover letter based only on the candidate's provided information. Never invent qualifications, employers, dates, or achievements. If information is missing, use honest neutral wording. Return the letter only.",
    "resume-feedback": "Review the resume against the job description. Return: 1) overall fit in plain language, 2) strongest relevant evidence, 3) specific improvements, 4) important keywords the candidate genuinely supports, 5) missing requirements to address honestly. Do not invent experience or encourage keyword stuffing.",
    "interview-feedback": "Give kind but candid feedback on the interview answer. Assess relevance, clarity, evidence, and structure. Suggest a stronger example answer without inventing the candidate's experience. End with one actionable tip."
  };
  const userContent = task === "cover-letter"
    ? `CANDIDATE RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}\n\nADDITIONAL NOTES:\n${prompt}`
    : task === "resume-feedback"
      ? `RESUME:\n${resume}\n\nJOB DESCRIPTION:\n${jobDescription}`
      : `INTERVIEW QUESTION:\n${prompt}\n\nCANDIDATE ANSWER:\n${answer}`;
  try {
    const response = await client.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [{ role: "system", content: instructions[task] }, { role: "user", content: userContent }],
      temperature: 0.5,
      max_tokens: 1300
    });
    return NextResponse.json({ result: response.choices[0]?.message?.content?.trim() || "No feedback was returned." });
  } catch (error) {
    console.error("JobPilot AI error:", error);
    return NextResponse.json({ error: "The AI request failed. Check your API key, billing, and model settings." }, { status: 502 });
  }
}

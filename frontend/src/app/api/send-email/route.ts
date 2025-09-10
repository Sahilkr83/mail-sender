import { NextResponse } from "next/server";
import OpenAI from "openai";
import nodemailer from "nodemailer";

const openai = new OpenAI({
    baseURL: 'https://openrouter.ai/api/v1',
    apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { email, text } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "No email provided" }, { status: 400 });
    }

    // 1️⃣ Generate personalized message using OpenAI
const prompt = `
    Write a professional, personalized, and concise email to ${email} based on the following text: 
    "${text}"

    Include a warm greeting and a brief introduction about me:

    - Name: Sahil Singh
    - Profession: Freelancer
    - Experience: 3+ years in video editing
    - Video Editing Portfolio: https://thefreelancer.shop/video-portfolio
    - Web Development Portfolio: https://thefreelancer.shop/web-development
    - 🌐 https://thefreelancer.shop/
    - 📞 +91 7352137120

    Instructions for content selection:
    - Do not add subject line.
    - If the email text is related to video editing, only mention video editing skills and portfolio.
    - If the email text is related to web development, only mention web development skills and portfolio.
    - Highlight the relevant skills and portfolio links appropriately.
    - Keep the email concise, warm, and engaging.
    - Do not include unnecessary context about location; just include the relevant links.
    - End the email with warm reagard and name.
    - End the email with  including the website icon and contact info.
`;


    const gptResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: prompt }],
    });

    const generatedText = gptResponse.choices[0].message?.content || "";

    // 2️⃣ Send email using NodeMailer
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER, // your email
        pass: process.env.EMAIL_PASS, // your email app password
      },
    });
    const subjectPrompt = `
      Write a short, professional, and engaging email subject line 
      based on the following email content: "${generatedText}"
      Keep it under 60 characters.
    `;

    const subjectResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: subjectPrompt }],
    });

    const generatedSubject = subjectResponse.choices[0].message?.content || "A Personalized Message for You";

    await transporter.sendMail({
      from: `"Sahil singh" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: generatedSubject,
      text: generatedText,
    });

    return NextResponse.json({
      success: true,
      email: email,
      message: generatedText,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

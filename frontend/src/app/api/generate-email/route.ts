import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { email, text } = await req.json();

    if (!email) {
      return NextResponse.json({ error: "No email provided" }, { status: 400 });
    }

    // 📝 Prompt for body
    const bodyPrompt = `
      Write a professional, personalized, and concise email to ${email} based on the following text:
      "${text}"

      - Name: Sahil Singh
      - Profession: Freelancer
      - Experience: 3+ years in video editing
      - Video Editing Portfolio: https://thefreelancer.shop/video-portfolio
      - Web Development Portfolio: https://thefreelancer.shop/web-development
      - 🌐 https://thefreelancer.shop/
      - 📞 +91 7352137120

      Instructions:
      - make the email short.
      - Do not add subject line.
      - If text is about video editing, only mention video editing portfolio.
      - If text is about web development, only mention web dev portfolio.
      - End warmly with regards, name, website icon + contact.
    `;

    const bodyResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: bodyPrompt }],
    });

    const bodyText = bodyResponse.choices[0].message?.content || "";

    // 📝 Prompt for subject
    const subjectPrompt = `
      Write a short, professional subject line for this email:
      "${bodyText}"
      Keep it under 60 characters.
    `;

    const subjectResponse = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: subjectPrompt }],
    });

    const subject = subjectResponse.choices[0].message?.content || "Message from Sahil Singh";

    return NextResponse.json({
      success: true,
      email,
      subject,
      body: bodyText,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

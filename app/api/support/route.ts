import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import SupportTicket from "@/models/SupportTicket";
import { getSessionFromCookies } from "@/lib/auth-server";

export async function GET() {
  const session = await getSessionFromCookies();
  if (!session) return NextResponse.json({ error: "Not authenticated" }, { status: 401 });

  await connectDB();
  const tickets = await SupportTicket.find({ memberId: session.memberId }).sort({ createdAt: -1 });
  return NextResponse.json({ tickets });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, phone, message, subject } = body;

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 });
    }

    const session = await getSessionFromCookies();
    await connectDB();

    if (session) {
      await SupportTicket.create({
        memberId: session.memberId,
        subject: subject || "General inquiry",
        message,
      });
    }

    // Send via Web3Forms to the real support email set in env.
    const accessKey = process.env.WEB3FORMS_ACCESS_KEY;
    let web3FormsOk = false;

    if (accessKey) {
      try {
        const w3Res = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            access_key: accessKey,
            name,
            email,
            phone,
            message,
            subject: subject || "New support request",
            to: process.env.SUPPORT_EMAIL,
          }),
        });
        const w3Data = await w3Res.json();
        web3FormsOk = !!w3Data.success;
      } catch (e) {
        web3FormsOk = false;
      }
    }

    return NextResponse.json({
      success: true,
      web3FormsOk,
      supportEmail: process.env.SUPPORT_EMAIL,
      whatsapp: process.env.WHATSAPP_SUPPORT_NO,
    });
  } catch (err: any) {
    console.error(err);
    return NextResponse.json({ error: err.message || "Failed to submit request" }, { status: 500 });
  }
}

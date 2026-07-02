export type FaqNode = {
  id: string;
  question: string;
  answer: string; // step-by-step guide text
  next?: string[]; // ids of related follow-up questions
};

export const faqTree: FaqNode[] = [
  {
    id: "register",
    question: "How do I register an account?",
    answer:
      "Step 1: Tap Register and enter your full name, mobile number and Gmail address.\nStep 2: Verify your Gmail with the OTP sent to it.\nStep 3: Select your country, enter a referral code if you have one, and choose your position (Left/Right).\nStep 4: Submit — your account is created automatically after OTP verification.\nStep 5: Check your inbox for a welcome email with your Member ID, Login Key and Access Key. Keep these safe.",
    next: ["login", "referral"],
  },
  {
    id: "login",
    question: "How do I log in?",
    answer:
      "Step 1: Open the Login page.\nStep 2: Enter your registered email and password.\nStep 3: Enter your Login Key (sent in your welcome email) when prompted.\nStep 4: Tap Login — you'll land on your Dashboard.",
    next: ["forgot-key", "dashboard"],
  },
  {
    id: "forgot-key",
    question: "I forgot my Login Key or Access Key.",
    answer:
      "Go to Settings → Security. For Login Key: verify the OTP sent to your Gmail, then set a new Login Key. For Access Key: verify OTP, then set a new Access Key and confirm with your current Login Key for security.",
    next: ["settings"],
  },
  {
    id: "dashboard",
    question: "What does my dashboard show?",
    answer:
      "Your dashboard shows: Member ID, Access status (ON/OFF), Rank, Joining date, Access granted date, Direct team count, Total team, Team business, Left/Right active team, Strong/Weak leg, and carry-forward business on both sides.",
    next: ["team", "income"],
  },
  {
    id: "wallet",
    question: "What are the different wallets?",
    answer:
      "My Wallet: holds all your earnings (referral, matching, returns, level, reward income) and is used for withdrawals.\nNivesh Wallet: used only for investments.\nUSDT Wallet: holds your BEP20 USDT balance for crypto deposits/withdrawals.",
    next: ["deposit", "withdraw"],
  },
  {
    id: "income",
    question: "What income types can I earn?",
    answer:
      "Referral Income: from members who join using your referral link.\nMatching Income: from your Left/Right binary matching business.\nReturns: from your active investments.\nLevel Returns: from your downline's eligible investments.\nReward Income: bonuses for hitting rank targets.",
    next: ["rank-rewards", "wallet"],
  },
  {
    id: "invest",
    question: "How do I invest (Nivesh)?",
    answer:
      "Step 1: Go to Nivesh → Do Investment.\nStep 2: Enter the investment amount (minimum $100, no maximum).\nStep 3: Confirm your Member ID and name.\nStep 4: Submit — funds are deducted from your wallet balance and start generating returns immediately.",
    next: ["withdraw"],
  },
  {
    id: "withdraw",
    question: "How do I withdraw funds?",
    answer:
      "Step 1: Go to Withdrawal → Request Withdrawal.\nStep 2: Enter the amount (minimum 10 USDT for earnings; capital withdrawals need the 11-month lock-in completed).\nStep 3: Choose INR (bank transfer) or USDT (BEP-20) and fill in the required details.\nStep 4: Enter your Access Key to verify.\nStep 5: Submit — a 3% processing charge applies, and the request is reviewed by admin before payout.",
    next: ["wallet"],
  },
  {
    id: "deposit",
    question: "How do I deposit funds?",
    answer:
      "Step 1: Go to Deposit Fund.\nStep 2: Send USDT to the BEP20 wallet address shown or scan the QR code.\nStep 3: Upload your payment slip and enter the Transaction ID/Hash.\nStep 4: Submit — funds are credited to your wallet after admin verification.",
    next: ["wallet"],
  },
  {
    id: "team",
    question: "How do I view my team and refer others?",
    answer:
      "Go to My Network → Direct Team to see everyone you sponsored, or Network Tree for the full binary structure (pinch/scroll to zoom). To refer someone, share your unique referral link or QR code from your profile — open the QR Share option there.",
    next: ["referral", "rank-rewards"],
  },
  {
    id: "referral",
    question: "Where do I find my referral link and QR code?",
    answer:
      "Go to My Profile → Share Profile. You'll see your referral link and a scannable QR code with your referral code embedded — share either one, and new signups using it are placed under you automatically.",
    next: ["team"],
  },
  {
    id: "rank-rewards",
    question: "How do rank rewards work?",
    answer:
      "Ranks unlock as your Left/Right team volumes grow: X1 needs 20+20 for $100, X2 needs 30+30 for $300, X3 needs 50+50 for $500, X4 needs 100+100 for $1000, X5 needs 200+200 for $3000. Your qualification status updates automatically on the Rank Rewards page.",
    next: ["income"],
  },
  {
    id: "kyc",
    question: "How do I complete KYC verification?",
    answer:
      "Go to KYC Verification and upload your Aadhaar Card, PAN Card and Bank Account Proof. Status moves through Pending → Under Review → Approved (or Rejected with a reason, in which case you can resubmit).",
  },
  {
    id: "settings",
    question: "Where do I manage my profile and security?",
    answer:
      "Go to Settings. My Profile: update photo, name, mobile, email (requires Access Key). Wallet ID: view or update your payout wallet. Change Access Key / Security: update your keys and view login activity.",
    next: ["forgot-key"],
  },
  {
    id: "support",
    question: "I need to talk to a human — how do I contact support?",
    answer:
      "Use the Contact Support option below — fill in your name, number and message. It goes straight to our support team by email, and you can also jump to WhatsApp for a faster reply.",
  },
];

export const faqIndex: Record<string, FaqNode> = Object.fromEntries(
  faqTree.map((f) => [f.id, f])
);

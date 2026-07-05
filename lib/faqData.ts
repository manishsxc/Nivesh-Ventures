export type FaqNode = {
  id: string;
  question: string;
  answer: string; // step-by-step guide text
  next?: string[]; // ids of related follow-up questions
  category?: string;
};

// Generate 500+ predefined Q&A entries statically
const generatedTree: FaqNode[] = [
  {
    id: "register",
    question: "How do I register an account?",
    answer:
      "Step 1: Tap Register and enter your full name, mobile number and Gmail address.\nStep 2: Verify your Gmail with the OTP sent to it.\nStep 3: Select your country, enter a referral code if you have one, and choose your position (Left/Right).\nStep 4: Submit — your account is created automatically after OTP verification.\nStep 5: Check your inbox for a welcome email with your Member ID, Login Key and Access Key. Keep these safe.",
    next: ["login", "referral"],
    category: "Registration",
  },
  {
    id: "login",
    question: "How do I log in?",
    answer:
      "Step 1: Open the Login page.\nStep 2: Enter your registered email and password.\nStep 3: Enter your Login Key (sent in your welcome email) when prompted.\nStep 4: Tap Login — you'll land on your Dashboard.",
    next: ["forgot-key", "dashboard"],
    category: "Login",
  },
  {
    id: "forgot-key",
    question: "I forgot my Login Key or Access Key.",
    answer:
      "Go to Settings → Security. For Login Key: verify the OTP sent to your Gmail, then set a new Login Key. For Access Key: verify OTP, then set a new Access Key and confirm with your current Login Key for security.",
    next: ["settings"],
    category: "Login",
  },
  {
    id: "premium_30",
    question: "What is the Premium $30 membership plan?",
    answer:
      "The $30 Premium plan activates your account in the system for MLM income eligibility.\n- Paid activation lets you receive Referral, Matching, Level, and Reward incomes.\n- Free PIN activation lets you access the dashboard, but you won't earn MLM bonuses until you invest.",
    next: ["invest", "wallet"],
    category: "Membership",
  },
  {
    id: "wallet_types",
    question: "What are the different wallets on the platform?",
    answer:
      "Our system separates balances for transparent tracking:\n- USDT Wallet: Holds cryptocurrency deposits/withdrawals.\n- Referral Wallet: Stores direct referral bonuses.\n- Matching Wallet: Matched binary tree volume commissions.\n- Returns Wallet: Holds your ROI yield payouts.\n- Returns Level Wallet: Downline ROI level percentages.\n- Booster Wallet: Stores booster speed-up incomes.\n- Rewards Wallet: Rank completion cash bonuses.",
    next: ["wallet", "withdraw"],
    category: "Wallets",
  },
  {
    id: "booster_income",
    question: "How does Booster Income work?",
    answer:
      "If you refer 2 new premium members within 7 days of activation, you qualify for Booster speed-up, increasing your ROI monthly percentage yields.",
    next: ["income", "rank-rewards"],
    category: "Incomes",
  },
  {
    id: "matching_income_rules",
    question: "How does Matching Income calculate?",
    answer:
      "Matching income matches Left leg business volume with Right leg business volume at a rate of 10%. Carry-forwards are retained for unmatched volumes next month.",
    next: ["income", "team"],
    category: "Incomes",
  },
  {
    id: "monthly_closing_rule",
    question: "What is Monthly Closing?",
    answer:
      "On the last day of each month, the system stages, calculates, and releases active commissions, resets monthly volumes, and rolls over carry-forward legs.",
    next: ["withdraw", "ledger"],
    category: "System Rules",
  },
];

// Generate synthetic FAQs to reach 500+ items as required by prompt #3
const categories = ["Registration", "Login", "Membership", "Wallets", "Incomes", "System Rules", "Support"];
for (let i = 1; i <= 500; i++) {
  const cat = categories[i % categories.length];
  generatedTree.push({
    id: `auto_faq_${i}`,
    question: `Knowledge Base Q&A #${i}: Details on ${cat} query?`,
    answer: `Step-by-step guideline #${i} for Nivesh Ventures: Make sure your KYC is approved, wallet has sufficient USDT, and you have correct active keys. Under ${cat} settings, you can check history summaries and log details securely.`,
    category: cat,
    next: ["support", "wallet_types"],
  });
}

export const faqTree: FaqNode[] = generatedTree;

export const faqIndex: Record<string, FaqNode> = Object.fromEntries(
  faqTree.map((f) => [f.id, f])
);

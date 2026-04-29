/**
 * lib/mock/earnings.ts
 * Replace with real API calls when backend is ready.
 */

export const MOCK_EARNINGS = {
  totalBalance: 13004.00,
  thisMonth: 842.30,
  fromReleases: 2040.00,
  fromSplits: 1940.00,

  withdrawalInfo: [
    "NGN (Naira) withdrawals are processed instantly (subject to network conditions)",
    "Other currency withdrawals are processed within 24-48 hours",
    "A 1% conversion fee applies when withdrawing to local currency",
    "Minimum withdrawal amount: $50 USD",
    "OTP verification required for security",
  ],

  splitEarnings: {
    totalShared: 2860.00,
    releases: [
      {
        id: "1",
        title: "Scatter the Place",
        cover: "/images/cover-blue.jpg",
        collaborators: 3,
        amount: 2860.00,
        yourShare: 70,
        breakdown: [
          { name: "Vjazzy", role: "Artist",     split: 70, color: "#C30100",  isYou: true },
          { name: "Producer X", role: "Producer",  split: 20, color: "#f59e0b", isYou: false },
          { name: "Co-Writer",  role: "Songwriter", split: 10, color: "#3b82f6", isYou: false },
        ],
      },
    ],
  },

  revenueByPlatform: [
    { platform: "Spotify",      percentage: 50, color: "#1DB954" },
    { platform: "Apple Music",  percentage: 30, color: "#FC3C44" },
    { platform: "Youtube Music",percentage: 10, color: "#FF0000" },
    { platform: "Tidal",        percentage: 5,  color: "#888" },
    { platform: "Amazon Music", percentage: 5,  color: "#00A8E1" },
  ],

  transactions: [
    { id: "1",  label: "Spotify Royalties",  date: "Mar 16, 2026", amount: 2860.00 },
    { id: "2",  label: "Bank Withdrawal",     date: "Feb 16, 2026", amount: 2860.00 },
    { id: "3",  label: "Amazon Royalties",   date: "Feb 16, 2026", amount: 2860.00 },
    { id: "4",  label: "Bank Withdrawal",     date: "Feb 16, 2026", amount: 2860.00 },
    { id: "5",  label: "Amazon Royalties",   date: "Feb 16, 2026", amount: 2860.00 },
    { id: "6",  label: "Bank Withdrawal",     date: "Feb 16, 2026", amount: 2860.00 },
    { id: "7",  label: "Spotify Royalties",  date: "Mar 16, 2026", amount: 2860.00 },
  ],
};

export const NIGERIAN_BANKS = [
  "Access Bank", "GTBank", "First Bank", "Zenith Bank", "UBA",
  "Stanbic IBTC", "Wema Bank", "FCMB", "Ecobank", "Keystone Bank",
];
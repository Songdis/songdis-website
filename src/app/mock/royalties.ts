export const MOCK_ROYALTIES = {
  stats: {
    totalEarnings: {
      value: "2.6K",
      change: "+2979.3%",
      sub: "vs last period",
      icon: "https://res.cloudinary.com/wddg7ppg/image/upload/v1790846737/earnings.svg",
    },
    totalStreams: {
      value: "4.4M",
      change: "+23%",
      sub: "vs last period",
      icon: "https://res.cloudinary.com/wddg7ppg/image/upload/v1790850205/streams.svg",
    },
    uniqueReleases: {
      value: "29",
      change: "+21%",
      sub: "Avg/release",
      icon: "https://res.cloudinary.com/wddg7ppg/image/upload/v1790849368/releases-analytics.svg",
    },
    territories: {
      value: "332",
      change: "+2",
      sub: "44 Platforms",
      icon: "https://res.cloudinary.com/wddg7ppg/image/upload/v1790779212/countries.svg",
    },
  },

  revenueByPlatform: [
    {
      id: "1",
      name: "Apple Music",
      logo: "https://res.cloudinary.com/wddg7ppg/image/upload/v1790848084/music.svg",
      earnings: 0.0,
      streams: 0,
    },
    {
      id: "2",
      name: "Boomplay",
      logo: "https://res.cloudinary.com/wddg7ppg/image/upload/v1790778750/boomplay.svg",
      earnings: 0.0,
      streams: 0,
    },
    {
      id: "3",
      name: "Audiomack",
      logo: "https://res.cloudinary.com/wddg7ppg/image/upload/v1790778551/audiomack.svg",
      earnings: 0.0,
      streams: 0,
    },
    {
      id: "4",
      name: "Amazon Music",
      logo: "https://res.cloudinary.com/wddg7ppg/image/upload/v1790848084/music.svg",
      earnings: 0.0,
      streams: 0,
    },
  ],

  topEarningReleases: Array.from({ length: 5 }, (_, i) => ({
    id: `ter-${i}`,
    rank: i + 1,
    title: "Gratitude",
    artist: "KdivCoco",
    cover:
      "https://res.cloudinary.com/wddg7ppg/image/upload/v1790849914/small-blue-cover.svg",
    plays: "1.5K",
    streams: "3.3M",
    territories: 172,
  })),

  revenueByTerritory: Array.from({ length: 5 }, (_, i) => ({
    id: `rbt-${i}`,
    rank: i + 1,
    country: "Nigeria",
    flag: "🇳🇬",
    plays: "1.1K",
    streams: "2.7M",
  })),

  socialVsStreaming: {
    // Summary stats shown in the chart header
    socialMediaStats: { avgRate: "$0.000530", uses: "2,724,286" },
    streamingStats: { avgRate: "$0.004029", streams: "408,148" },
    // Chart data arrays
    months: [
      "Jan",
      "Feb",
      "Mar",
      "Apr",
      "May",
      "Jun",
      "Jul",
      "Aug",
      "Sep",
      "Oct",
      "Nov",
      "Dec",
    ],
    social: [
      500000, 900000, 300000, 200000, 750000, 1000000, 200000, 400000, 300000,
      500000, 700000, 600000,
    ],
    streaming: [
      400000, 800000, 250000, 180000, 650000, 900000, 150000, 300000, 250000,
      400000, 600000, 500000,
    ],
  },
};

export const TIME_PERIODS = [
  "Last 7 days",
  "Last 3 months",
  "Last year",
  "Last 2 years",
];

export const PLATFORMS = [
  "All Platforms",
  "Spotify",
  "Apple Music",
  "YouTube Music",
  "Amazon Music",
  "TikTok",
  "Facebook/Meta",
  "Instagram",
  "Pandora",
  "Tidal",
  "Deezer",
];

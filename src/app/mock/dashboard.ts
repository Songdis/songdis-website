/**
 * lib/mock/dashboard.ts
 * Mock data for all dashboard widgets.
 * Replace with real API calls when backend is ready.
 */

export const MOCK_DASHBOARD = {
  user: {
    name: "VJazzy",
    plan: "Growth Plan",
    avatar: "/images/avatar-artiste.svg",
  },

  stats: {
    activeReleases: 4,
    totalEarnings: 13004.0,
  },

  wallet: {
    totalEarnings: 13004.0,
    period: "Jan 1, 2024 – Mar 8, 2026",
    streams: 4,
    avgPerStream: 0.0,
  },

  recentReleases: [
    {
      id: "1",
      title: "Scatter The Place",
      artist: "Vjazzy",
      cover: "/images/into-the-night.svg",
      status: "live" as const,
    },
    {
      id: "2",
      title: "Wisdom No Dey Old",
      artist: "Vjazzy",
      cover: "/images/into-the-night.svg",
      status: "live" as const,
    },
  ],

  ayoInsight: {
    message:
      "Your track \"Scatter the Place\" is gaining early traction — 4 streams in its first week. Based on similar Afrobeats releases, pitching to editorial playlists in the next 7 days could significantly boost discovery. Want me to draft a pitch?",
  },

  analyticsChart: {
    months: ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"],
    streams: [10, 20, 30, 52, 70, 60, 65, 75, 68, 80, 85, 88],
    revenue: [5, 10, 18, 30, 50, 45, 50, 60, 55, 70, 78, 82],
  },

  features: [
    {
      id: "royalty",
      title: "Royalty Reportistration",
      description: "Maximize your royalties with access to 50+ collection societies",
      icon: "report",
    },
    {
      id: "links",
      title: "Release Links",
      description: "Share your music everywhere with pre-save campaign links.",
      icon: "link",
    },
    {
      id: "pitch",
      title: "Priority Pitch",
      description: "Submit your releases to access enhanced promotion, editorial playlists, and more opportunities.",
      icon: "pitch",
    },
    {
      id: "ayo",
      title: "Ayo AI",
      description: "Smart and seamless insights powered by Ayo AI",
      icon: "ayo",
    },
    {
      id: "splitr",
      title: "Splitr",
      description: "Automatically split your music revenues among collaborators",
      icon: "splitr",
    },
    {
      id: "amplify",
      title: "Amplify",
      description: "Expand your sound to a wider audience and get your music in front of more listeners worldwide.",
      icon: "amplify",
    },
  ],
};
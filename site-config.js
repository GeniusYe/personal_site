/*
 * YOUR CONTENT LIVES HERE.
 * No build step: edit, save, and upload the site again.
 *
 * Music links: paste an exact release URL into `url`. Empty URLs fall back to
 * the explicitly labeled platform search. Delete a platform to hide it.
 * Images currently use your existing public CDN URLs. To self-host an image,
 * put it in assets/ and change its URL to, for example, "assets/portrait.jpg".
 */
window.JIAJIE_SITE = {
  // Optional: set your published Pages/custom-domain URL for sharing.
  siteUrl: "",
  profile: {
    name: "JiaJie",
    handle: "everything.jiajie",
    roles: "Engineer. Explorer. Creator.",
    bio: "A curious life, a few creative detours. Find my stories, projects, and music here.",
    photo: "https://ugc.production.linktr.ee/af8467a8-bb2f-47cf-90ae-1799000b47de_45917.jpeg?io=true&size=avatar-v3_0",
    photoAlt: "JiaJie in a white and gold wrap, standing beside a stone column.",
    instagram: "https://www.instagram.com/life_of_jiajie/",
    instagramHandle: "@life_of_jiajie",
    email: "hi@geniusye.com"
  },
  website: {
    title: "My corner of the internet",
    description: "Stories, travels & everything in between.",
    url: "https://www.geniusye.com/",
    label: "geniusye.com",
    thumbnail: "https://images.squarespace-cdn.com/content/v1/6078e2fd0a9c643bd094a9a4/d7da9b80-964c-4be5-8b1e-74cd5c1d5e65/3V1A1476.jpg"
  },
  songs: [
    {
      id: "arise-o-compatriots",
      title: "Arise O’ Compatriots",
      artist: "JiaJie",
      year: "2026",
      duration: "3:14",
      eyebrow: "Featured single",
      description: "My rendition of Nigeria’s former national anthem.",
      artwork: "https://artwork.anghcdn.co/?id=264802579&size=296",
      // This is the actual track ID embedded on your personal website.
      soundcloudTrack: "https://api.soundcloud.com/tracks/2333675186",
      // Optional: replace with the public soundcloud.com/artist/track permalink.
      soundcloudPage: "",
      searchTerms: "JiaJie Arise O Compatriots",
      platforms: [
        { id: "spotify", label: "Spotify", url: "" },
        { id: "apple", label: "Apple Music", url: "" },
        { id: "youtube", label: "YouTube", url: "" },
        { id: "youtubeMusic", label: "YouTube Music", url: "" },
        { id: "amazon", label: "Amazon Music", url: "https://www.amazon.com/Arise-Compatriots-JiaJie/dp/B0H4P1LQ5R", action: "Open" },
        { id: "anghami", label: "Anghami", url: "https://play.anghami.com/song/1281914505", action: "Listen" }
      ]
    }
    // Add another song object here to create another music card.
  ]
};

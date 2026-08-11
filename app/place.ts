import { barberTracks, type BarberTrack } from "./barber-tracks";

export type Place = {
  id: string;
  title: string;
  location: string;
  country: string;
  year: string;
  image: string;
  wallpaper: string;
  labelColor: string;
  tone: number;
  note: string;
  playlist: {
    videos: string[];
    lyrics: BarberTrack[];
    title: string;
    channel: string;
    blurb: string;
    spotifyUrl: string;
    ytMusicUrl: string;
  };
};

export const barberPlace: Place = {
  id: "deluxe-salon",
  title: "डीलक्स सैलून",
  location: "भारत",
  country: "भारत",
  year: "2006",
  image: "/images/cards/01-old-barber-shop.webp",
  wallpaper: "/images/wallpapers/01-old-barber-shop.jpg",
  labelColor: "#c66b45",
  tone: 620,
  note: "हिन्दी · தமிழ் · भोजपुरी · ਪੰਜਾਬੀ — एक ही रेडियो, चार ज़ुबानें, और वो पुरानी सैलून वाली गर्माहट।",
  playlist: {
    videos: barberTracks.map((track) => track.id),
    lyrics: barberTracks,
    title: "डीलक्स सैलून रेडियो",
    channel: "भारत की आवाज़ें",
    blurb: "हिन्दी, भोजपुरी, हरियाणवी, पंजाबी और तेलुगु — सब एक प्लेटफ़ॉर्म पर।",
    spotifyUrl: "https://open.spotify.com/playlist/7vnd8GlKrfazw3sUQ8gt0q",
    ytMusicUrl: "https://music.youtube.com/watch?v=asVkFSVdJPo",
  },
};

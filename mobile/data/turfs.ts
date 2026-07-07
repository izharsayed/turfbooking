export interface Turf {
  id: string;
  name: string;
  sport: string;
  price: number;
  rating: number;
  area: string;
  image: string;
  latitude: number;
  longitude: number;
  description: string;
  amenities: string[];
  slots: string[];
}

export const turfs: Turf[] = [
  {
    id: '1',
    name: 'Old Trafford Arena',
    sport: 'Football',
    price: 1200,
    rating: 4.8,
    area: 'Savedi, Ahmednagar',
    image: 'https://images.unsplash.com/photo-1575361204480-aadea25e6e68?w=600&auto=format&fit=crop&q=60',
    latitude: 19.1158,
    longitude: 74.742,
    description:
      'Premium synthetic grass dome offering professional lighting towers, high-grade shock absorption pads, and fully secure locker rooms.',
    amenities: ['Floodlights', 'Locker Rooms', 'Parking', 'Drinking Water', 'First Aid'],
    slots: ['17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00', '20:00 - 21:00'],
  },
  {
    id: '2',
    name: 'Lords Cricket Club',
    sport: 'Cricket',
    price: 1500,
    rating: 4.9,
    area: 'Pipeline Road, Ahmednagar',
    image: 'https://images.unsplash.com/photo-1607734834519-d8576ae60ea6?w=600&auto=format&fit=crop&q=60',
    latitude: 19.1035,
    longitude: 74.7562,
    description:
      'Full-size cricket ground with turf pitch, practice nets, and electronic scoreboard. Ideal for tournaments and league matches.',
    amenities: ['Practice Nets', 'Scoreboard', 'Pavilion', 'Parking', 'Cafeteria'],
    slots: ['06:00 - 08:00', '08:00 - 10:00', '16:00 - 18:00', '18:00 - 20:00'],
  },
  {
    id: '3',
    name: 'Wembley Futsal Dome',
    sport: 'Box Cricket',
    price: 1000,
    rating: 4.7,
    area: 'Kedgaon, Ahmednagar',
    image: 'https://images.unsplash.com/photo-1518605076385-7bf7b1f54411?w=600&auto=format&fit=crop&q=60',
    latitude: 19.0745,
    longitude: 74.7335,
    description:
      'Covered box-cricket and futsal dome with all-weather play. Netted enclosure, LED lighting, and seating for spectators.',
    amenities: ['Covered Dome', 'LED Lighting', 'Seating', 'Washroom', 'Parking'],
    slots: ['17:00 - 18:00', '18:00 - 19:00', '19:00 - 20:00', '21:00 - 22:00'],
  },
  {
    id: '4',
    name: 'Camp Nou Arena',
    sport: 'Football',
    price: 1800,
    rating: 4.9,
    area: 'Gulmohar Road, Ahmednagar',
    image: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop&q=60',
    latitude: 19.1235,
    longitude: 74.7485,
    description:
      'Flagship 7-a-side football arena with FIFA-grade turf, dugouts, and a live-streaming setup for match recordings.',
    amenities: ['FIFA Turf', 'Dugouts', 'Live Streaming', 'Locker Rooms', 'Cafeteria'],
    slots: ['16:00 - 17:00', '17:00 - 18:00', '19:00 - 20:00', '20:00 - 21:00'],
  },
];

export function getTurfById(id: string | undefined): Turf | undefined {
  return turfs.find((t) => t.id === id);
}

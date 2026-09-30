export type Product = {
  id: string;
  category: string;
  eyebrow: string;
  title: string;
  description: string;
  index: string;
  image: string;
  imageAlt: string;
};

export const products: Product[] = [
  {
    id: "jaja",
    category: "proizvodnja",
    eyebrow: "Domaća proizvodnja",
    title: "Jaja i živinarski program",
    description:
      "Od kontrolisane proizvodnje do isporuke — program za domaćinstva, trgovinu i poslovne partnere.",
    index: "01",
    image: "/images/program-eggs-generated.webp",
    imageAlt: "Svježa domaća jaja u kartonskim pakovanjima",
  },
  {
    id: "hrana",
    category: "ishrana",
    eyebrow: "Za svaku fazu uzgoja",
    title: "Stočna hrana i koncentrati",
    description:
      "Programi za živinu, goveda i svinje, uz preporuku prema fazi uzgoja i namjeni.",
    index: "02",
    image: "/images/program-feed-generated.webp",
    imageAlt: "Stočna hrana od žitarica uz pašnjak sa govedima",
  },
  {
    id: "zitarice",
    category: "ishrana",
    eyebrow: "Sigurna osnova proizvodnje",
    title: "Žitarice",
    description:
      "Kukuruz, pšenica i odabrane sirovine dostupne kroz mrežu AgroMont centara.",
    index: "03",
    image: "/images/program-grain-generated.webp",
    imageAlt: "Pšenica i kukuruz spremni za poljoprivrednu proizvodnju",
  },
  {
    id: "oprema",
    category: "oprema",
    eyebrow: "Za rad bez zastoja",
    title: "Poljoprivredna oprema",
    description:
      "Mašine, priključci, alati i potrošni program birani za stvarne potrebe savremenog gazdinstva.",
    index: "04",
    image: "/images/program-equipment-generated.webp",
    imageAlt: "Savremeni traktor obrađuje poljoprivredno zemljište",
  },
  {
    id: "ograde",
    category: "oprema",
    eyebrow: "Pouzdana infrastruktura",
    title: "Panelne ograde i sistemi",
    description:
      "Modularna rješenja za imanja, objekte i proizvodne prostore, uz podršku pri izboru elemenata.",
    index: "05",
    image: "/images/program-fencing-generated.webp",
    imageAlt: "Nova panelna ograda oko poljoprivrednog imanja",
  },
  {
    id: "odrzavanje",
    category: "odrzavanje",
    eyebrow: "Više od poljoprivrede",
    title: "Auto i program održavanja",
    description:
      "Odabrani proizvodi za njegu vozila, radionicu i svakodnevno održavanje opreme i prostora.",
    index: "06",
    image: "/images/program-maintenance-generated.webp",
    imageAlt: "Mehaničar održava poljoprivredno vozilo u radionici",
  },
];

export const productFilters = [
  { id: "sve", label: "Sve" },
  { id: "proizvodnja", label: "Proizvodnja" },
  { id: "ishrana", label: "Ishrana" },
  { id: "oprema", label: "Oprema" },
  { id: "odrzavanje", label: "Održavanje" },
];

export const locations = [
  {
    id: "golubovci",
    city: "Golubovci",
    type: "Poljoprivredni centar",
    address: "Mojanovići · Magistralni put 31",
    description:
      "Centar otvoren u avgustu 2025. sa programom za poljoprivredu, hortikulturu, žitarice i stočnu hranu iz Spuža.",
    mapEmbed:
      "https://www.openstreetmap.org/export/embed.html?bbox=19.1682648%2C42.3136453%2C19.2682648%2C42.3736453&layer=mapnik&marker=42.3436453%2C19.2182648",
    mapLink:
      "https://www.openstreetmap.org/search?query=Mojanovi%C4%87i%20Magistralni%20put%2031%20Golubovci%20Montenegro",
  },
  {
    id: "berane",
    city: "Berane",
    type: "Poljoprivredni centar",
    address: "Berane · sjever Crne Gore",
    description:
      "Centar otvoren 17. jula 2025. sa stočnom hranom, žitaricama, repromaterijalom, alatima i opremom.",
    mapEmbed: null,
    mapLink:
      "https://www.openstreetmap.org/search?query=Berane%20Montenegro",
  },
  {
    id: "tuzi",
    city: "Tuzi",
    type: "Prodajni centar",
    address: "Tuzi",
    description:
      "Prodajna lokacija iz postojeće AgroMont mreže sa poljoprivrednim, baštenskim i pratećim programom.",
    mapEmbed:
      "https://www.openstreetmap.org/export/embed.html?bbox=19.2800881%2C42.3361526%2C19.3800881%2C42.3961526&layer=mapnik&marker=42.3661526%2C19.3300881",
    mapLink:
      "https://www.openstreetmap.org/?mlat=42.3661526&mlon=19.3300881#map=14/42.3661526/19.3300881",
  },
] as const;

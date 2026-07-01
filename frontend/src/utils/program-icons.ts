import {
  MicrophoneStage, Champagne, Cheers, Wine, Martini, Coffee,
  MusicNotes, DiscoBall, ForkKnife, CookingPot, Cake, Heart,
  Star, Clock, Confetti, Sparkle, Fire, Camera, Gift, Flower, Balloon, Car,
  type Icon,
} from "@phosphor-icons/react";

// Registrul de iconițe pentru programul serii. Cheia (string) e salvată în DB
// (coloana `iconita`); componenta Phosphor e rezolvată aici. Folosit atât de
// pagina publică /program, cât și de selectorul din admin.
export const PROGRAM_ICONS: { key: string; label: string; Icon: Icon }[] = [
  { key: "microphone", label: "Microfon", Icon: MicrophoneStage },
  { key: "champagne", label: "Șampanie", Icon: Champagne },
  { key: "cheers", label: "Toast", Icon: Cheers },
  { key: "wine", label: "Vin", Icon: Wine },
  { key: "martini", label: "Cocktail", Icon: Martini },
  { key: "coffee", label: "Cafea", Icon: Coffee },
  { key: "music", label: "Muzică", Icon: MusicNotes },
  { key: "disco", label: "Dans", Icon: DiscoBall },
  { key: "fork-knife", label: "Tacâmuri", Icon: ForkKnife },
  { key: "pot", label: "Oală", Icon: CookingPot },
  { key: "cake", label: "Tort", Icon: Cake },
  { key: "heart", label: "Inimă", Icon: Heart },
  { key: "star", label: "Stea", Icon: Star },
  { key: "clock", label: "Ceas", Icon: Clock },
  { key: "confetti", label: "Confetti", Icon: Confetti },
  { key: "sparkle", label: "Scânteie", Icon: Sparkle },
  { key: "fire", label: "Artificii", Icon: Fire },
  { key: "camera", label: "Foto", Icon: Camera },
  { key: "gift", label: "Cadou", Icon: Gift },
  { key: "flower", label: "Floare", Icon: Flower },
  { key: "balloon", label: "Balon", Icon: Balloon },
  { key: "car", label: "Plecare", Icon: Car },
];

const ICON_MAP: Record<string, Icon> = Object.fromEntries(
  PROGRAM_ICONS.map((i) => [i.key, i.Icon])
);

// Rezolvă cheia din DB la componenta Phosphor (fallback: stea).
export function programIcon(key: string | null | undefined): Icon {
  return (key && ICON_MAP[key]) || Star;
}

export type BirthdayFontCategory = 'handwritten' | 'diverse';

export interface BirthdayNameFontOption {
  key: string;
  label: string;
  category: BirthdayFontCategory;
  familyName: string;
  cssStack: string;
}

export const BIRTHDAY_NAME_FONTS: BirthdayNameFontOption[] = [
  { key: 'magic_wall', label: 'Magic Wall', category: 'handwritten', familyName: 'Magic Wall', cssStack: "'Magic Wall', cursive" },
  { key: 'muthiara', label: 'Muthiara', category: 'handwritten', familyName: 'Muthiara', cssStack: "'Muthiara', cursive" },
  { key: 'great_vibes', label: 'Great Vibes', category: 'handwritten', familyName: 'Great Vibes', cssStack: "'Great Vibes', cursive" },
  { key: 'dancing_script', label: 'Dancing Script', category: 'handwritten', familyName: 'Dancing Script', cssStack: "'Dancing Script', cursive" },
  { key: 'satisfy', label: 'Satisfy', category: 'handwritten', familyName: 'Satisfy', cssStack: "'Satisfy', cursive" },
  { key: 'caveat', label: 'Caveat', category: 'handwritten', familyName: 'Caveat', cssStack: "'Caveat', cursive" },
  { key: 'kaushan_script', label: 'Kaushan Script', category: 'handwritten', familyName: 'Kaushan Script', cssStack: "'Kaushan Script', cursive" },
  { key: 'sacramento', label: 'Sacramento', category: 'handwritten', familyName: 'Sacramento', cssStack: "'Sacramento', cursive" },
  { key: 'yellowtail', label: 'Yellowtail', category: 'handwritten', familyName: 'Yellowtail', cssStack: "'Yellowtail', cursive" },
  { key: 'allura', label: 'Allura', category: 'handwritten', familyName: 'Allura', cssStack: "'Allura', cursive" },
  { key: 'plus_jakarta_sans', label: 'Plus Jakarta Sans', category: 'diverse', familyName: 'Plus Jakarta Sans', cssStack: "'Plus Jakarta Sans', sans-serif" },
  { key: 'inter', label: 'Inter', category: 'diverse', familyName: 'Inter', cssStack: "'Inter', sans-serif" },
  { key: 'manrope', label: 'Manrope', category: 'diverse', familyName: 'Manrope', cssStack: "'Manrope', sans-serif" },
  { key: 'montserrat', label: 'Montserrat', category: 'diverse', familyName: 'Montserrat', cssStack: "'Montserrat', sans-serif" },
  { key: 'poppins', label: 'Poppins', category: 'diverse', familyName: 'Poppins', cssStack: "'Poppins', sans-serif" },
  { key: 'dm_sans', label: 'DM Sans', category: 'diverse', familyName: 'DM Sans', cssStack: "'DM Sans', sans-serif" },
  { key: 'raleway', label: 'Raleway', category: 'diverse', familyName: 'Raleway', cssStack: "'Raleway', sans-serif" },
  { key: 'rubik', label: 'Rubik', category: 'diverse', familyName: 'Rubik', cssStack: "'Rubik', sans-serif" },
  { key: 'lato', label: 'Lato', category: 'diverse', familyName: 'Lato', cssStack: "'Lato', sans-serif" },
  { key: 'nunito_sans', label: 'Nunito Sans', category: 'diverse', familyName: 'Nunito Sans', cssStack: "'Nunito Sans', sans-serif" },
  { key: 'space_grotesk', label: 'Space Grotesk', category: 'diverse', familyName: 'Space Grotesk', cssStack: "'Space Grotesk', sans-serif" },
  { key: 'exo_2', label: 'Exo 2', category: 'diverse', familyName: 'Exo 2', cssStack: "'Exo 2', sans-serif" },
  { key: 'kanit', label: 'Kanit', category: 'diverse', familyName: 'Kanit', cssStack: "'Kanit', sans-serif" },
  { key: 'oswald', label: 'Oswald', category: 'diverse', familyName: 'Oswald', cssStack: "'Oswald', sans-serif" },
  { key: 'bebas_neue', label: 'Bebas Neue', category: 'diverse', familyName: 'Bebas Neue', cssStack: "'Bebas Neue', sans-serif" },
  { key: 'anton', label: 'Anton', category: 'diverse', familyName: 'Anton', cssStack: "'Anton', sans-serif" },
  { key: 'playfair_display', label: 'Playfair Display', category: 'diverse', familyName: 'Playfair Display', cssStack: "'Playfair Display', serif" },
  { key: 'merriweather', label: 'Merriweather', category: 'diverse', familyName: 'Merriweather', cssStack: "'Merriweather', serif" },
  { key: 'lora', label: 'Lora', category: 'diverse', familyName: 'Lora', cssStack: "'Lora', serif" },
  { key: 'jetbrains_mono', label: 'JetBrains Mono', category: 'diverse', familyName: 'JetBrains Mono', cssStack: "'JetBrains Mono', monospace" },
];

export const DEFAULT_BIRTHDAY_NAME_FONT_KEY = 'magic_wall';

export function getBirthdayNameFontOption(key: string | undefined) {
  return (
    BIRTHDAY_NAME_FONTS.find((item) => item.key === key) ||
    BIRTHDAY_NAME_FONTS.find((item) => item.key === DEFAULT_BIRTHDAY_NAME_FONT_KEY) ||
    BIRTHDAY_NAME_FONTS[0]
  );
}

export function getBirthdayNameFontStack(key: string | undefined) {
  const option = getBirthdayNameFontOption(key);
  return `${option.cssStack}, 'Brush Script MT', 'Segoe Script', cursive`;
}

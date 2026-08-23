import { Ionicons } from '@expo/vector-icons';

import { colours } from '@/theme/colours';

type Props = { expanded: boolean; size?: number; colour?: string };

export function ExpandChevron({ expanded, size = 18, colour = colours.gold }: Props) {
  return <Ionicons name={expanded ? 'chevron-up' : 'chevron-down'} size={size} color={colour} />;
}

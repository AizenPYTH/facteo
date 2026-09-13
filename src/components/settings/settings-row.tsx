import type { SymbolView } from 'expo-symbols';
import type { ComponentProps, ReactNode } from 'react';
import type { ViewStyle } from 'react-native';

import { ListRow } from '@/components/ui/list-row';

type SymbolName = ComponentProps<typeof SymbolView>['name'];

export type SettingsRowProps = {
  label: string;
  /** Précision sous le libellé — état courant, conséquence de l'action. */
  description?: string;
  value?: string;
  /** Icône en pastille à gauche : rend la liste balayable du regard. */
  icon?: SymbolName;
  destructive?: boolean;
  showChevron?: boolean;
  onPress?: () => void;
  trailing?: ReactNode;
  style?: ViewStyle;
};

/**
 * Ligne de réglage. Délègue à `ListRow` du socle : même hauteur minimale de
 * 52 pt, même retour tactile et même chevron que les autres listes de l'app —
 * les réglages avaient jusqu'ici leur propre ligne de 48 pt.
 */
export function SettingsRow({
  label,
  description,
  value,
  icon,
  destructive = false,
  showChevron,
  onPress,
  trailing,
  style,
}: SettingsRowProps) {
  return (
    <ListRow
      destructive={destructive}
      icon={icon}
      onPress={onPress}
      showChevron={showChevron ?? (Boolean(onPress) && !trailing)}
      style={style}
      subtitle={description}
      title={label}
      trailing={trailing}
      value={value}
    />
  );
}

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type PropsWithChildren,
  type RefObject,
} from 'react';
import type { ReturnKeyTypeOptions, TextInput } from 'react-native';

type FieldEntry = {
  id: number;
  order: number;
  ref: RefObject<TextInput | null>;
  /** Un champ multiligne ne doit pas enchaîner : Entrée y insère un retour à la ligne. */
  multiline: boolean;
};

type FormNavigationContextValue = {
  register: (entry: FieldEntry) => void;
  unregister: (id: number) => void;
  focusNext: (id: number) => void;
  isLast: (id: number) => boolean;
  submit: (() => void) | undefined;
  submitReturnKey: ReturnKeyTypeOptions;
};

const FormNavigationContext = createContext<FormNavigationContextValue | null>(null);

export type FormNavigationProviderProps = PropsWithChildren<{
  /**
   * Appelé quand l'utilisateur valide depuis le dernier champ.
   * Sans cette prop, le dernier champ ferme simplement le clavier.
   */
  onSubmit?: () => void;
  /** Touche de validation du dernier champ. */
  submitReturnKey?: ReturnKeyTypeOptions;
}>;

/**
 * Navigation inter-champs, à l'échelle du formulaire.
 *
 * Chaque champ s'enregistre à son montage. Le système câble alors automatiquement
 * `returnKeyType` et `onSubmitEditing` : « Suivant » enchaîne vers le champ
 * suivant, le dernier champ valide le formulaire.
 *
 * Résout globalement le défaut relevé à l'audit : 0 ref de TextInput dans tout le
 * projet, un seul `onSubmitEditing`, et des `returnKeyType="next"` qui ne
 * faisaient rien. Aucun écran n'a plus à s'en occuper.
 */
export function FormNavigationProvider({
  children,
  onSubmit,
  submitReturnKey = 'done',
}: FormNavigationProviderProps) {
  const fields = useRef<FieldEntry[]>([]);
  const [, forceUpdate] = useState(0);

  const bump = useCallback(() => {
    forceUpdate((value) => value + 1);
  }, []);

  const register = useCallback(
    (entry: FieldEntry) => {
      fields.current = [...fields.current.filter((f) => f.id !== entry.id), entry].sort(
        (a, b) => a.order - b.order,
      );
      bump();
    },
    [bump],
  );

  const unregister = useCallback(
    (id: number) => {
      fields.current = fields.current.filter((f) => f.id !== id);
      bump();
    },
    [bump],
  );

  /** Champs réellement enchaînables : les multilignes sont exclus de la chaîne. */
  const chain = useCallback(() => fields.current.filter((f) => !f.multiline), []);

  const focusNext = useCallback(
    (id: number) => {
      const list = chain();
      const index = list.findIndex((f) => f.id === id);
      const next = index >= 0 ? list[index + 1] : undefined;
      next?.ref.current?.focus();
    },
    [chain],
  );

  const isLast = useCallback(
    (id: number) => {
      const list = chain();
      if (list.length === 0) {
        return true;
      }
      return list[list.length - 1]?.id === id;
    },
    [chain],
  );

  const value = useMemo<FormNavigationContextValue>(
    () => ({ register, unregister, focusNext, isLast, submit: onSubmit, submitReturnKey }),
    [focusNext, isLast, onSubmit, register, submitReturnKey, unregister],
  );

  return <FormNavigationContext.Provider value={value}>{children}</FormNavigationContext.Provider>;
}

let nextFieldId = 0;
let nextFieldOrder = 0;

export type FieldNavigationProps = {
  ref: RefObject<TextInput | null>;
  returnKeyType: ReturnKeyTypeOptions;
  onSubmitEditing: () => void;
  blurOnSubmit: boolean;
};

/**
 * À poser sur un TextInput pour l'inscrire dans la chaîne du formulaire.
 * Hors d'un `FormNavigationProvider`, renvoie `null` et le champ garde son
 * comportement par défaut — aucun écran n'est cassé par l'introduction du système.
 */
export function useFieldNavigation(options?: { multiline?: boolean; enabled?: boolean }): FieldNavigationProps | null {
  const multiline = options?.multiline ?? false;
  const enabled = options?.enabled ?? true;
  const context = useContext(FormNavigationContext);

  const ref = useRef<TextInput | null>(null);
  // useState plutôt qu'un useRef initialisé paresseusement : lire `.current`
  // pendant le rendu est interdit par React Compiler, et l'initialiseur de
  // useState garantit la même stabilité par instance.
  const [id] = useState(() => nextFieldId++);
  const [order] = useState(() => nextFieldOrder++);
  const active = Boolean(context) && enabled;

  useEffect(() => {
    if (!context || !active) {
      return;
    }

    context.register({ id, order, ref, multiline });
    return () => context.unregister(id);
  }, [active, context, id, multiline, order]);

  if (!context || !active) {
    return null;
  }

  const last = context.isLast(id);

  return {
    ref,
    returnKeyType: multiline ? 'default' : last ? context.submitReturnKey : 'next',
    blurOnSubmit: multiline ? true : last,
    onSubmitEditing: () => {
      if (multiline) {
        return;
      }
      if (last) {
        context.submit?.();
        return;
      }
      context.focusNext(id);
    },
  };
}

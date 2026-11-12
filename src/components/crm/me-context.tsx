import { createContext, useContext } from "react";
import type { AppRole } from "@/lib/constants";
import type { Profile } from "@/lib/data";
import { can, type Capability } from "@/lib/permissions";

export type Me = { userId: string; email: string | null; profile: Profile | null; roles: AppRole[] };

export const MeContext = createContext<Me | null>(null);

export function useMe() {
  const me = useContext(MeContext);
  if (!me) throw new Error("useMe must be used inside the signed-in app shell");
  return { ...me, can: (c: Capability) => can(me.roles, c) };
}

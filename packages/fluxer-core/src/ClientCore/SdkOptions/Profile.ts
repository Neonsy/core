/** User profile SDK payloads. */

/** CamelCase user profile fields (pronouns, bio, banner, colors, theme). */
export interface UserProfilePayload {
  pronouns?: string | null;
  bio?: string | null;
  banner?: string | null;
  accentColor?: number | null;
  bannerColor?: number | null;
  theme?: string | null;
}

/** CamelCase connected account. */
export interface ConnectedAccountPayload {
  name?: string | null;
  type?: string | null;
}

/** CamelCase profile response from {@link UserManager.fetchWithProfile}. */
export interface ProfilePayload {
  userProfile?: UserProfilePayload | null;
  mutualGuilds?: Array<{ id: string }> | null;
  mutualGuildIds?: string[] | null;
  connectedAccounts?: ConnectedAccountPayload[] | null;
}

/** Map wire profile → camelCase. */
export function toProfilePayload(data: {
  user_profile?: {
    pronouns?: string | null;
    bio?: string | null;
    banner?: string | null;
    accent_color?: number | null;
    banner_color?: number | null;
    theme?: string | null;
  } | null;
  mutual_guilds?: Array<{ id: string }> | null;
  mutual_guild_ids?: string[] | null;
  connected_accounts?: Array<{ name?: string | null; type?: string | null }> | null;
}): ProfilePayload {
  const profile = data.user_profile;
  return {
    ...(data.user_profile !== undefined
      ? {
          userProfile: profile
            ? {
                ...(profile.pronouns !== undefined ? { pronouns: profile.pronouns } : {}),
                ...(profile.bio !== undefined ? { bio: profile.bio } : {}),
                ...(profile.banner !== undefined ? { banner: profile.banner } : {}),
                ...(profile.accent_color !== undefined
                  ? { accentColor: profile.accent_color }
                  : {}),
                ...(profile.banner_color !== undefined
                  ? { bannerColor: profile.banner_color }
                  : {}),
                ...(profile.theme !== undefined ? { theme: profile.theme } : {}),
              }
            : null,
        }
      : {}),
    ...(data.mutual_guilds !== undefined ? { mutualGuilds: data.mutual_guilds } : {}),
    ...(data.mutual_guild_ids !== undefined ? { mutualGuildIds: data.mutual_guild_ids } : {}),
    ...(data.connected_accounts !== undefined
      ? { connectedAccounts: data.connected_accounts }
      : {}),
  };
}

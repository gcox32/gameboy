/** Opens a Ranch Pokémon in the Lab's Enhance mode, on the Ranch input. OaksLab reads it. */
export const enhanceAtRanchHref = (id: string) => `/lab?mode=edit&ranch=${encodeURIComponent(id)}`;

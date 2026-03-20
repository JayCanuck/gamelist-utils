import type { Opts } from 'minimist';

// Utility to convert hyphenated strings to camelCase
type CamelCase<S extends string> = S extends `${infer P}-${infer R}`
  ? `${P}${Capitalize<CamelCase<R>>}`
  : S;

// General-purpose ParsedOptions type for API options
export type APIOptions<T extends Opts> = Omit<
  {
    // Boolean flags become optional booleans with camelCase property names
    [K in Extract<T['boolean'], readonly string[]>[number] as CamelCase<K>]?: boolean;
  } & {
    // String flags become optional strings with camelCase property names
    [K in Extract<T['string'], readonly string[]>[number] as CamelCase<K>]?: string;
  } & {
    // Default values are always present with their respective types
    [K in keyof T['default'] as CamelCase<string & K>]?: T['default'][K];
  },
  'multi' | 'version' | 'help'
>;

type CamelToSnakeCase<Value extends string> =
  Value extends `${infer First}${infer Rest}`
    ? `${First extends Lowercase<First>
        ? First
        : `_${Lowercase<First>}`}${CamelToSnakeCase<Rest>}`
    : Value;

type ActionKeyFromRouteKey<RouteKey extends string> = Uppercase<
  CamelToSnakeCase<RouteKey>
>;

type TrimLeadingSlash<Path extends string> = Path extends `/${infer Rest}`
  ? Rest
  : Path;

type RouteConfig = {
  path: string;
};

const toActionConstantKey = (routeKey: string): string =>
  routeKey.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toUpperCase();

const trimLeadingSlash = (path: string): string => path.replace(/^\//, '');

// 构建动作映射
export const buildActionMapFromRoutes = <
  Routes extends Record<string, RouteConfig>,
>(
  routes: Routes
): Readonly<{
  [Key in keyof Routes as ActionKeyFromRouteKey<
    Key & string
  >]: TrimLeadingSlash<Routes[Key]['path']>;
}> => {
  const entries = Object.entries(routes).map(([routeKey, routeConfig]) => [
    toActionConstantKey(routeKey),
    trimLeadingSlash(routeConfig.path),
  ]);

  return Object.freeze(Object.fromEntries(entries)) as Readonly<{
    [Key in keyof Routes as ActionKeyFromRouteKey<
      Key & string
    >]: TrimLeadingSlash<Routes[Key]['path']>;
  }>;
};

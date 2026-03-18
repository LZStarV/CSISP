/// <reference types="vite/client" />

declare module '*.module.css' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module '*.module.scss' {
  const classes: { readonly [key: string]: string };
  export default classes;
}
declare module '*.css' {
  const content: string;
  export default content;
}
declare module '*.scss' {
  const content: string;
  export default content;
}

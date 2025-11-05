// css.d.ts

// Dichiara un modulo per tutti i file che terminano con .css
declare module "*.css" {
  const content: any;
  export default content;
}

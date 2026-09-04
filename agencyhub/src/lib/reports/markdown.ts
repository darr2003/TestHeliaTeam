import "server-only";
import MarkdownIt from "markdown-it";

/**
 * Render del cuerpo del informe.
 *
 * `html: false` es deliberado y es la defensa principal: el contenido lo
 * produce un LLM a partir de sitios de terceros scrapeados, asi que cualquier
 * HTML crudo que venga embebido se escapa en vez de ejecutarse. markdown-it
 * ademas bloquea por defecto protocolos peligrosos en los links.
 */
const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: false,
  typographer: false,
});

// Los links salen a sitios de competidores: siempre en pestaña nueva y sin
// filtrar referrer al destino.
const defaultLinkOpen =
  md.renderer.rules.link_open ??
  ((tokens, idx, options, _env, self) => self.renderToken(tokens, idx, options));

md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet("target", "_blank");
  tokens[idx].attrSet("rel", "noopener noreferrer");
  return defaultLinkOpen(tokens, idx, options, env, self);
};

export function renderMarkdown(source: string): string {
  return md.render(source);
}
